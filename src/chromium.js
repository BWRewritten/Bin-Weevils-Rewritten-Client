const { app } = require('electron');
const fs = require('fs');
const path = require('path');
const { FLASH_FILES, FLASH_VERSION, ELECTRON_TOKENS } = require('./config');

function configure() {
  if (process.platform === 'linux') app.commandLine.appendSwitch('no-sandbox');
  const file = FLASH_FILES[process.platform];
  if (!file) return;
  const dir = app.isPackaged
    ? path.join(process.resourcesPath, 'flash')
    : path.join(__dirname, '..', 'assets', 'flash');
  app.commandLine.appendSwitch('ppapi-flash-path', path.join(dir, file));
  app.commandLine.appendSwitch('ppapi-flash-version', FLASH_VERSION);
}

function windowIcon() {
  if (process.platform === 'darwin') return undefined;
  const isWin = process.platform === 'win32';
  const file = app.isPackaged
    ? path.join(process.resourcesPath, isWin ? 'icon.ico' : 'icon.png')
    : path.join(__dirname, '..', isWin ? path.join('assets', 'favicon.ico') : 'icon.png');
  return fs.existsSync(file) ? file : undefined;
}

function userAgent() {
  const os = {
    win32: process.arch === 'x64' ? 'Windows NT 10.0; Win64; x64' : 'Windows NT 10.0; WOW64',
    darwin: 'Macintosh; Intel Mac OS X 10_15_7',
    linux: 'X11; Linux x86_64'
  }[process.platform] || 'X11; Linux x86_64';
  const token = ELECTRON_TOKENS[Math.floor(Math.random() * ELECTRON_TOKENS.length)];
  return `Mozilla/5.0 (${os}) AppleWebKit/537.36 (KHTML, like Gecko) ` +
    `Chrome/${process.versions.chrome} Safari/537.36 Electron/v${token}`;
}

module.exports = { configure, windowIcon, userAgent };