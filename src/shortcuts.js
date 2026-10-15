const { globalShortcut } = require('electron');
const keys = require('./keys');

class Shortcuts {
  constructor(options) {
    this.binds = options.binds;
    this.actions = options.actions;
    this.canRegister = options.canRegister;
    this.lastFired = {};
  }

  trigger(name) {
    const action = this.actions[name];
    const now = Date.now();
    if (!action || now - (this.lastFired[name] || 0) < action.gap) return;
    this.lastFired[name] = now;
    action.run();
  }

  unregister() {
    try { globalShortcut.unregisterAll(); } catch (e) {}
  }

  register() {
    this.unregister();
    if (!this.canRegister()) return;

    const binds = this.binds();
    Object.keys(binds).forEach((name) => {
      const accelerator = keys.toAccelerator(binds[name]);
      if (!accelerator) return;
      const variants = [accelerator];
      if (binds[name].indexOf('plus') !== -1) variants.push(`${accelerator}+Shift`);
      variants.forEach((variant) => {
        try { globalShortcut.register(variant, () => this.trigger(name)); } catch (e) {}
      });
    });
  }

  handleInput(event, input) {
    if (input.type !== 'keyDown') return;
    const combo = keys.build(input);
    if (process.env.BWR_DEBUG) console.log('key:', combo);

    const binds = this.binds();
    const name = combo && Object.keys(binds).find((key) => binds[key] === combo);
    if (!name) return;
    event.preventDefault();
    this.trigger(name);
  }
}

module.exports = Shortcuts;