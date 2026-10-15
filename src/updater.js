const { app } = require('electron');
const https = require('https');
const { autoUpdater } = require('electron-updater');
const { delay, timeout } = require('./utils');

const REPO = 'BWRewritten/Bin-Weevils-Rewritten-Client';
const RELEASES_URL = `https://github.com/${REPO}/releases`;
const LATEST_API_URL = `https://api.github.com/repos/${REPO}/releases/latest`;

autoUpdater.autoDownload = false;
autoUpdater.autoInstallOnAppQuit = false;
autoUpdater.logger = null;
if (process.platform === 'win32') autoUpdater.channel = 'win-' + process.arch;

let onProgress = null;
autoUpdater.on('download-progress', (progress) => { if (onProgress) onProgress(progress.percent); });

function canSelfUpdate() {
  return app.isPackaged && process.platform !== 'darwin' && (process.platform !== 'linux' || !!process.env.APPIMAGE);
}

function parseVersion(version) {
  return String(version).replace(/^v/, '').split('-')[0].split('.').map((n) => parseInt(n, 10) || 0);
}

function isNewer(candidate, current) {
  const a = parseVersion(candidate);
  const b = parseVersion(current);
  for (let i = 0; i < 3; i++) {
    if ((a[i] || 0) !== (b[i] || 0)) return (a[i] || 0) > (b[i] || 0);
  }
  return false;
}

function checkGitHub() {
  return new Promise((resolve) => {
    const options = {
      headers: { 'User-Agent': 'BWR-Client', Accept: 'application/vnd.github+json' },
      timeout: 10000
    };
    const req = https.get(LATEST_API_URL, options, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        try {
          const version = String(JSON.parse(body).tag_name || '').replace(/^v/, '');
          if (!version) return resolve({ error: true });
          resolve({ available: isNewer(version, app.getVersion()), version, manual: true });
        } catch (e) {
          resolve({ error: true });
        }
      });
    });
    req.on('error', () => resolve({ error: true }));
    req.on('timeout', () => req.abort());
  });
}

async function check() {
  if (!canSelfUpdate()) return checkGitHub();
  try {
    const result = await autoUpdater.checkForUpdates();
    const version = result && result.updateInfo && result.updateInfo.version;
    return version && isNewer(version, app.getVersion()) ? { available: true, version } : { available: false };
  } catch (e) {
    return checkGitHub();
  }
}

function download(progressCallback) {
  onProgress = progressCallback;
  return autoUpdater.downloadUpdate();
}

function install() {
  autoUpdater.quitAndInstall(true, true);
}

async function runLaunchUpdate(splash) {
  splash.status('Checking for updates...', null);
  const result = await timeout(check(), 15000).catch(() => null);
  if (!result || !result.available) return null;
  if (result.manual) return result;

  try {
    splash.status(`Downloading v${result.version}...`, 0);
    await download((percent) => {
      splash.status(`Downloading v${result.version}... ${Math.round(percent)}%`, percent);
    });
    splash.status(`Installing v${result.version}...`, 100);
    await delay(800);
    install();
    return { installing: true };
  } catch (e) {
    splash.status('Update failed, starting anyway...', null);
    await delay(1500);
    return result;
  }
}

module.exports = { check, download, install, runLaunchUpdate, RELEASES_URL };