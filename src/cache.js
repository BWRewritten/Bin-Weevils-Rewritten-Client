const { dialog, session } = require('electron');
const duration = require('./duration');
const { MAIN_URL, LOGOUT_URL } = require('./urls');

const INTERVALS = { hourly: 3600000, daily: 86400000 };

class CacheManager {
  constructor(options) {
    Object.assign(this, options);
    this.timer = null;
  }

  async clearNow() {
    const ses = session.defaultSession;
    await ses.clearCache();
    await ses.clearStorageData({ storages: ['appcache', 'shadercache', 'cachestorage', 'serviceworkers'] });
  }

  async clearWithLogout() {
    const { response } = await dialog.showMessageBox(this.dialogParent(), {
      type: 'warning',
      buttons: ['Continue', 'Cancel'],
      defaultId: 1,
      cancelId: 1,
      title: 'Clear Cache',
      message: 'Clearing the cache will log you out.',
      detail: 'You will be logged out and returned to the main page, are you sure you would like to continue?'
    });

    if (response !== 0 || !this.main.alive()) return;

    this.closeMenu();
    await this.main.loadAndWait(LOGOUT_URL);
    await this.clearNow().catch(() => {});
    this.main.redirect(MAIN_URL);
  }

  schedule() {
    this.stop();
    const { enabled, mode, custom } = this.settings.data.autoClear;
    if (!enabled) return;
    const ms = INTERVALS[mode] || duration.parse(custom);
    if (!ms) return;
    this.timer = setInterval(() => {
      if (!this.isQuitting()) this.clearNow().catch(() => {});
    }, ms);
  }

  stop() {
    clearInterval(this.timer);
    this.timer = null;
  }
}

module.exports = CacheManager;