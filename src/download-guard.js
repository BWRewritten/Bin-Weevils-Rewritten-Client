const { dialog, session } = require('electron');
const { MAIN_URL, isDownloadPage } = require('./urls');

class DownloadGuard {
  constructor(main) {
    this.main = main;
    this.noticeOpen = false;
  }

  install() {
    const filter = { urls: ['*://*.binweevils.app/*'] };
    session.defaultSession.webRequest.onBeforeRequest(filter, (details, callback) => {
      if (details.resourceType === 'mainFrame' && isDownloadPage(details.url)) {
        this.showNotice();
        return callback({ redirectURL: MAIN_URL });
      }
      callback({});
    });
  }

  showNotice() {
    if (this.noticeOpen || !this.main.alive()) return;
    this.noticeOpen = true;
    const done = () => { this.noticeOpen = false; };
    setImmediate(() => {
      const parent = this.main.get();
      if (!parent) return done();
      dialog.showMessageBox(parent, {
        type: 'info',
        title: 'Already Installed',
        message: 'You have already downloaded the application. You are free to start playing anytime you wish :D'
      }).then(done, done);
    });
  }
}

module.exports = DownloadGuard;