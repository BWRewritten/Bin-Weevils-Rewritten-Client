const { app } = require('electron');
const fs = require('fs');
const path = require('path');

const IS_MAC = process.platform === 'darwin';
const LEGACY_MENU_KEY = 'mod+shift+m';

const DEFAULTS = {
  discordEnabled: true,
  discordShowName: false,
  zoom: 1,
  keybinds: {
    menu: IS_MAC ? 'ctrl+m' : 'mod+m',
    zoomIn: 'mod+plus',
    zoomOut: 'mod+minus',
    fullscreen: 'f11'
  },
  autoClear: { enabled: false, mode: 'daily', custom: '+1 hour' }
};

function merge(base, saved) {
  return Object.keys(base).reduce((result, key) => {
    const fallback = base[key];
    const value = saved ? saved[key] : undefined;
    if (fallback && typeof fallback === 'object') result[key] = merge(fallback, value);
    else result[key] = typeof value === typeof fallback ? value : fallback;
    return result;
  }, {});
}

const settings = {
  data: merge(DEFAULTS, null),

  file() {
    return path.join(app.getPath('userData'), 'bwr-settings.json');
  },

  load() {
    let saved = null;
    try { saved = JSON.parse(fs.readFileSync(this.file(), 'utf8')); } catch (e) {}
    this.data = merge(DEFAULTS, saved);
    if (this.data.keybinds.menu === LEGACY_MENU_KEY) this.data.keybinds.menu = DEFAULTS.keybinds.menu;
  },

  save() {
    try { fs.writeFileSync(this.file(), JSON.stringify(this.data, null, 2)); } catch (e) {}
  }
};

module.exports = settings;