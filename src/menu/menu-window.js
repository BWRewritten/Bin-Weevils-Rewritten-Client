const { BrowserWindow, ipcMain } = require('electron');
const path = require('path');

function createMenuWindow(ctx, logic) {
  let win = null;
  const isOpen = () => !!win && !win.isDestroyed();

  function pushState() {
    if (isOpen() && !win.webContents.isDestroyed()) win.webContents.send('menu:state', logic.getState());
  }

  function open() {
    if (isOpen()) return win.focus();

    const menuWindow = new BrowserWindow({
      width: 420,
      height: 700,
      parent: ctx.win() || undefined,
      resizable: false,
      minimizable: false,
      maximizable: false,
      fullscreenable: false,
      title: 'BWR Menu',
      backgroundColor: '#ffffff',
      icon: ctx.icon(),
      webPreferences: { nodeIntegration: true, devTools: false }
    });
    win = menuWindow;
    menuWindow.setMenu(null);
    menuWindow.webContents.on('will-navigate', (event) => event.preventDefault());
    menuWindow.on('closed', () => { if (win === menuWindow) win = null; });
    Promise.resolve(menuWindow.loadFile(path.join(__dirname, 'index.html'))).catch(() => {});
  }

  function close() {
    if (isOpen()) win.close();
  }

  ipcMain.on('menu:ready', pushState);
  ipcMain.on('menu:close', close);
  ipcMain.on('menu:toggle', () => (isOpen() ? close() : open()));
  ipcMain.on('menu:action', async (event, id, payload) => {
    const handler = logic.actions[id];
    let result;
    try {
      result = handler ? await handler(payload) : { error: 'Unknown action: ' + id };
    } catch (err) {
      result = { error: String(err && err.message ? err.message : err) };
    }
    pushState();
    if (result && result.error && !event.sender.isDestroyed()) event.sender.send('menu:error', result.error);
  });

  return {
    open,
    close,
    toggle: () => (isOpen() ? close() : open()),
    pushState,
    getWindow: () => (isOpen() ? win : null)
  };
}

module.exports = { createMenuWindow };