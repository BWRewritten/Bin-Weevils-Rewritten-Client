const { BrowserWindow, BrowserView, shell } = require('electron');
const path = require('path');
const chromium = require('./chromium');
const { GAME_URL_FRAGMENT } = require('./config');
const { MAIN_URL, isInternal, isDownloadPage, isDiscord } = require('./urls');
const { timeout } = require('./utils');

const COG_SIZE = 40;
const VIEW_W = 120;
const VIEW_H = 72;
const MARGIN = 16;

class MainWindow {
  constructor(handlers) {
    this.win = null;
    this.cogView = null;
    this.handlers = handlers;
  }

  alive() {
    return !!this.win && !this.win.isDestroyed();
  }

  get() {
    return this.alive() ? this.win : null;
  }

  isFullscreen() {
    return this.alive() && this.win.isFullScreen();
  }

  setFullscreen(on) {
    if (this.alive()) this.win.setFullScreen(!!on);
  }

  applyZoom(zoom) {
    if (this.alive()) this.win.webContents.setZoomFactor(zoom);
  }

  restoreAndFocus() {
    if (!this.alive()) return;
    if (this.win.isMinimized()) this.win.restore();
    this.win.focus();
  }

  redirect(url, wc = null) {
    const target = wc || (this.alive() ? this.win.webContents : null);
    if (target && !target.isDestroyed()) target.loadURL(url).catch(() => {});
  }

  layoutCog() {
    if (!this.alive() || !this.cogView) return;
    const [w] = this.win.getContentSize();
    this.cogView.setBounds({ x: w - VIEW_W - MARGIN, y: 8, width: VIEW_W, height: VIEW_H });
  }

  loadAndWait(url) {
    if (!this.alive()) return Promise.resolve();
    const wc = this.win.webContents;
    const loaded = new Promise((resolve) => {
      wc.once('did-stop-loading', resolve);
      wc.loadURL(url).catch(resolve);
    });
    return timeout(loaded, 15000).catch(() => {});
  }

  openChild(url) {
    const child = new BrowserWindow({
      width: 1280,
      height: 720,
      backgroundColor: '#6BC414',
      title: 'Loading ...',
      icon: chromium.windowIcon(),
      webPreferences: {
        preload: path.join(__dirname, '..', 'preload.js'),
        plugins: true,
        devTools: false,
        nodeIntegration: false,
        contextIsolation: true
      }
    });
    child.setMenuBarVisibility(false);
    child.webContents.setUserAgent(chromium.userAgent());
    child.webContents.on('before-input-event', (event, input) => this.handlers.onInput(event, input));
    child.webContents.on('dom-ready', () => {
      if (!child.webContents.isDestroyed()) child.webContents.setZoomFactor(this.handlers.getZoom());
    });
    this.bindNavigationRules(child.webContents);
    this.redirect(url, child.webContents);
    return child;
  }

  create() {
    if (this.alive()) return;

    const win = new BrowserWindow({
      width: 1280,
      height: 720,
      backgroundColor: '#6BC414',
      title: 'Loading ...',
      icon: chromium.windowIcon(),
      webPreferences: {
        preload: path.join(__dirname, '..', 'preload.js'),
        plugins: true,
        devTools: false,
        nodeIntegration: false,
        contextIsolation: true
      }
    });
    const cogView = new BrowserView({
      webPreferences: { nodeIntegration: true }
    });
    cogView.setBackgroundColor('#00000000');

    this.win = win;
    this.cogView = cogView;

    win.maximize();
    win.webContents.setVisualZoomLevelLimits(1, 5);
    win.webContents.setUserAgent(chromium.userAgent());
    win.addBrowserView(cogView);

    this.bindWindowEvents(win);
    this.bindNavigationRules(win.webContents);
    win.webContents.on('before-input-event', (event, input) => this.handlers.onInput(event, input));

    if (win.isFocused())
      this.handlers.onFocus();

    this.redirect(MAIN_URL);
    cogView.webContents.loadFile(path.join(__dirname, 'cog.html')).catch(() => {});

    this.layoutCog();
    ['resize', 'maximize', 'unmaximize', 'enter-full-screen', 'leave-full-screen']
      .forEach((e) => win.on(e, () => this.layoutCog()));
  }

  bindWindowEvents(win) {
    const wc = win.webContents;
    const h = this.handlers;

    win.on('enter-full-screen', h.onFullscreenChange);
    win.on('leave-full-screen', h.onFullscreenChange);
    win.on('focus', h.onFocus);
    win.on('blur', h.onBlur);
    win.on('closed', () => {
      if (this.win === win) this.win = null;
      h.onClosed();
    });

    wc.on('dom-ready', () => { if (!wc.isDestroyed()) wc.setZoomFactor(h.getZoom()); });
    wc.on('did-finish-load', () => { if (this.alive() && win.isFocused()) h.onFocus(); });
    wc.on('did-navigate', (event, url) => {
      if (url.indexOf(GAME_URL_FRAGMENT) !== -1) h.onGamePage();
    });
  }

  bindNavigationRules(wc) {
    wc.on('will-navigate', (event, url) => {
      if (isDownloadPage(url)) {
        event.preventDefault();
        this.redirect(MAIN_URL, wc);
      } else if (!isInternal(url)) {
        event.preventDefault();
        if (isDiscord(url)) shell.openExternal(url);
      }
    });
    wc.on('new-window', (event, url) => {
      event.preventDefault();
      if (isDiscord(url)) shell.openExternal(url);
      else if (isInternal(url) && !isDownloadPage(url)) this.openChild(url);
    });
    wc.on('did-navigate-in-page', (event, url, isMainFrame) => {
      if (isMainFrame && isDownloadPage(url)) this.redirect(MAIN_URL, wc);
    });
  }
}

module.exports = MainWindow;