const IS_MAC = process.platform === 'darwin';
const MODIFIER_KEYS = ['control', 'shift', 'alt', 'meta', 'altgraph', 'escape'];
const ALIASES = { '=': 'plus', '+': 'plus', '-': 'minus', '_': 'minus', ' ': 'space' };
const DISPLAY_NAMES = {
  mod: IS_MAC ? 'Cmd' : 'Ctrl',
  ctrl: 'Ctrl',
  meta: 'Win',
  alt: IS_MAC ? 'Option' : 'Alt',
  shift: 'Shift',
  plus: '+',
  minus: '-',
  space: 'Space'
};
const ACCELERATOR_NAMES = {
  mod: 'CommandOrControl', ctrl: 'Control', meta: 'Super', alt: 'Alt', shift: 'Shift',
  plus: 'Plus', minus: '-', space: 'Space', arrowup: 'Up', arrowdown: 'Down',
  arrowleft: 'Left', arrowright: 'Right', enter: 'Enter', tab: 'Tab', backspace: 'Backspace',
  delete: 'Delete', home: 'Home', end: 'End', pageup: 'PageUp', pagedown: 'PageDown'
};

const normalize = (key) => {
  const text = String(key || '');
  return ALIASES[text] || text.toLowerCase();
};
const flag = (event, name, domName) => !!(event[name] || event[domName]);

function build(event) {
  const key = normalize(event.key);
  if (!key || MODIFIER_KEYS.indexOf(key) !== -1) return '';

  const ctrl = flag(event, 'control', 'ctrlKey');
  const meta = flag(event, 'meta', 'metaKey');
  const parts = [];
  if (IS_MAC ? meta : ctrl) parts.push('mod');
  if (IS_MAC && ctrl) parts.push('ctrl');
  if (!IS_MAC && meta) parts.push('meta');
  if (flag(event, 'alt', 'altKey')) parts.push('alt');
  if (flag(event, 'shift', 'shiftKey') && key !== 'plus') parts.push('shift');
  parts.push(key);
  return parts.join('+');
}

function pretty(combo) {
  if (!combo) return 'Unset';
  return combo.split('+').map((part) => {
    if (DISPLAY_NAMES[part]) return DISPLAY_NAMES[part];
    return part.length === 1 ? part.toUpperCase() : part.charAt(0).toUpperCase() + part.slice(1);
  }).join(' + ');
}

function toAccelerator(combo) {
  if (!combo) return null;
  return combo.split('+').map((part) => ACCELERATOR_NAMES[part] || part.toUpperCase()).join('+');
}

module.exports = { build, pretty, toAccelerator };