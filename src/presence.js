const DiscordRPC = require('discord-rpc');

const CLIENT_ID = '904829685064663090';
const RETRY_MS = 30000;
const startTimestamp = new Date();

let client = null;
let ready = false;
let retryTimer = null;
let registered = false;
let shuttingDown = false;
let options = { enabled: false, showName: false, name: null };

function buildActivity() {
  const activity = {
    details: 'Fall In, Flip Out!',
    startTimestamp,
    largeImageKey: 'logo2',
    largeImageText: 'Created with ♥ by Khora & Alioth',
    buttons: [{ label: 'Join Our Discord Server!', url: 'https://discord.com/binweevils' }]
  };
  if (options.showName && options.name) activity.state = 'Playing as ' + options.name;
  return activity;
}

function push() {
  if (client && ready) Promise.resolve(client.setActivity(buildActivity())).catch(() => {});
}

function destroy(rpc) {
  Promise.resolve().then(() => rpc.destroy()).catch(() => {});
}

function scheduleRetry() {
  if (options.enabled && !shuttingDown) retryTimer = setTimeout(connect, RETRY_MS);
}

function connect() {
  retryTimer = null;
  if (client || shuttingDown) return;

  if (!registered) {
    try { DiscordRPC.register(CLIENT_ID); } catch (e) {}
    registered = true;
  }

  const rpc = new DiscordRPC.Client({ transport: 'ipc' });
  client = rpc;
  rpc.on('error', () => {});
  rpc.on('ready', () => { ready = true; push(); });
  rpc.on('disconnected', () => {
    if (client !== rpc) return;
    client = null;
    ready = false;
    scheduleRetry();
  });
  rpc.login({ clientId: CLIENT_ID }).catch(() => {
    if (client !== rpc) return;
    client = null;
    ready = false;
    destroy(rpc);
    scheduleRetry();
  });
}

function disconnect() {
  clearTimeout(retryTimer);
  retryTimer = null;
  const rpc = client;
  client = null;
  ready = false;
  if (!rpc) return;
  Promise.resolve().then(() => rpc.clearActivity()).catch(() => {}).then(() => destroy(rpc));
}

function configure(next) {
  if (shuttingDown) return;
  options = next;
  if (!next.enabled) return disconnect();
  if (!client && !retryTimer) connect();
  else push();
}

function shutdown() {
  shuttingDown = true;
  disconnect();
}

module.exports = { configure, shutdown };