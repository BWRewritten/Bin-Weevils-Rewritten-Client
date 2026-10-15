const { session } = require('electron');
const { USERNAME_COOKIE } = require('./config');

// Keeping a reminder here to change around in future update to JWT
class UsernameTracker {
  constructor(onChange) {
    this.name = null;
    this.onChange = onChange;
  }

  get() {
    return this.name;
  }

  set(name) {
    this.name = name;
    this.onChange(name);
  }

  static parse(value) {
    try { return decodeURIComponent(value).replace(/^"|"$/g, '') || null; }
    catch (e) { return value || null; }
  }

  async read() {
    try {
      const cookies = await session.defaultSession.cookies.get({ name: USERNAME_COOKIE });
      if (cookies.length) this.set(UsernameTracker.parse(cookies[0].value));
    } catch (e) {}
  }

  watch() {
    session.defaultSession.cookies.on('changed', (event, cookie, cause, removed) => {
      if (cookie.name !== USERNAME_COOKIE) return;
      if (!removed) this.set(UsernameTracker.parse(cookie.value));
      else if (cause !== 'overwrite') this.set(null);
    });
  }
}

module.exports = UsernameTracker;