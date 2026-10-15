const { ipcRenderer } = require('electron');
const items = require('./items');
const keys = require('../keys');

const root = document.getElementById('root');
const toastEl = document.getElementById('toast');
let state = null;
let capturing = false;
let toastTimer = null;

const send = (id, payload) => ipcRenderer.send('menu:action', id, payload);
const read = (value) => (typeof value === 'function' ? value(state) : value);

function el(tag, props, ...children) {
  const node = document.createElement(tag);
  Object.keys(props || {}).forEach((name) => {
    const value = props[name];
    if (name === 'class') node.className = value;
    else if (name.slice(0, 2) === 'on') node.addEventListener(name.slice(2), value);
    else if (name === 'value' || name === 'checked') node[name] = value;
    else node.setAttribute(name, value);
  });
  children.forEach((child) => {
    if (child != null) node.append(child.nodeType ? child : document.createTextNode(child));
  });
  return node;
}

const row = (...children) => el('div', { class: 'row' }, ...children);
const hint = (text, extraClass) => el('div', { class: ['hint', extraClass].filter(Boolean).join(' ') }, text);

const builders = {
  icon: (it) => el('img', { class: 'icon', src: it.src, width: it.size || 96, height: it.size || 96 }),
  label: (it) => el('div', { class: it.style || '' }, read(it.text)),
  section: (it) => el('div', { class: 'section' }, read(it.text)),
  divider: () => el('hr'),

  button(it) {
    const wrap = el('div', {}, el('button', { class: 'wide', onclick: () => send(it.id) }, read(it.label)));
    const status = it.status && read(it.status);
    if (status) wrap.append(hint(status, 'under-button'));
    return wrap;
  },

  toggle(it) {
    const checkbox = el('input', {
      type: 'checkbox',
      checked: !!read(it.value),
      onchange: (event) => send(it.id, event.target.checked)
    });
    const wrap = el('div', {}, row(el('span', {}, read(it.label)), checkbox));
    const text = it.hint && read(it.hint);
    if (text) wrap.append(hint(text));
    return wrap;
  },

  select(it) {
    const current = read(it.value);
    const options = it.options.map(([value, label]) => {
      const option = el('option', { value }, label);
      option.selected = value === current;
      return option;
    });
    const select = el('select', { onchange: (event) => send(it.id, event.target.value) }, ...options);
    return row(el('span', {}, read(it.label)), select);
  },

  text(it) {
    const input = el('input', {
      type: 'text',
      size: 16,
      value: read(it.value) || '',
      placeholder: it.placeholder || '',
      onchange: (event) => send(it.id, event.target.value),
      onkeydown: (event) => { if (event.key === 'Enter') send(it.id, event.target.value); }
    });
    const wrap = el('div', {}, row(el('span', {}, read(it.label)), input));
    if (it.hint) wrap.append(hint(read(it.hint)));
    return wrap;
  },

  stepper(it) {
    return row(
      el('span', {}, read(it.label)),
      el('span', {},
        el('button', { onclick: () => send(it.decId) }, '−'), ' ',
        el('b', {}, read(it.value)), ' ',
        el('button', { onclick: () => send(it.incId) }, '+'), ' ',
        it.resetId ? el('button', { onclick: () => send(it.resetId) }, 'Reset') : null)
    );
  },

  keybind(it) {
    const button = el('button', { class: 'kbd' }, keys.pretty(state.keybinds[it.key]));
    button.addEventListener('click', () => startCapture(it, button));
    return row(el('span', {}, read(it.label)), button);
  }
};

function build(item) {
  const builder = builders[item.type];
  return builder ? builder(item) : el('div');
}

function render() {
  if (!state) return;
  root.textContent = '';
  items.forEach((item) => {
    if (!item.showIf || item.showIf(state)) root.append(build(item));
  });
}

function startCapture(item, button) {
  if (capturing) return;
  capturing = true;
  button.textContent = 'Press keys… (Esc cancels)';

  function finish() {
    window.removeEventListener('keydown', onKeyDown, true);
    capturing = false;
    render();
  }

  function onKeyDown(event) {
    event.preventDefault();
    event.stopPropagation();
    if (event.key === 'Escape') return finish();
    const combo = keys.build(event);
    if (!combo) return;
    finish();
    send('setKeybind', { key: item.key, combo });
  }

  window.addEventListener('keydown', onKeyDown, true);
}

function toast(message) {
  toastEl.textContent = message;
  toastEl.style.display = 'block';
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { toastEl.style.display = 'none'; }, 5000);
}

ipcRenderer.on('menu:state', (event, next) => {
  state = next;
  if (!capturing) render();
});
ipcRenderer.on('menu:error', (event, message) => toast(message));
window.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && !capturing) ipcRenderer.send('menu:close');
});
ipcRenderer.send('menu:ready');