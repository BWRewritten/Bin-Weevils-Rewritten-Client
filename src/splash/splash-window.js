const { BrowserWindow } = require('electron');
const path = require('path');

function show(icon) {
  const win = new BrowserWindow({
    width: 480,
    height: 340,
    frame: false,
    resizable: false,
    center: true,
    show: false,
    alwaysOnTop: true,
    backgroundColor: '#6BC414',
    icon,
    webPreferences: { nodeIntegration: true, devTools: false }
  });
  win.setMenu(null);

  const ready = new Promise((resolve) => {
    win.webContents.once('did-finish-load', resolve);
    win.once('closed', resolve);
  });
  win.once('ready-to-show', () => { if (!win.isDestroyed()) win.show(); });
  Promise.resolve(win.loadFile(path.join(__dirname, 'index.html'))).catch(() => {});

  return {
    ready,
    isClosed: () => win.isDestroyed(),
    status(text, progress) {
      if (win.isDestroyed() || win.webContents.isDestroyed()) return;
      win.webContents.send('status', { text, progress });
    },
    close() {
      if (!win.isDestroyed()) win.close();
    }
  };
}

module.exports = { show };