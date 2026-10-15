const { app, dialog, shell } = require('electron');

module.exports = function createMenuLogic(ctx) {
  const { settings, updater, duration } = ctx;

  function getState() {
    const data = settings.data;
    return {
      version: app.getVersion(),
      zoom: ctx.getZoom(),
      fullscreen: ctx.isFullscreen(),
      discordEnabled: data.discordEnabled,
      discordShowName: data.discordShowName,
      username: ctx.getUsername(),
      autoClear: data.autoClear,
      keybinds: data.keybinds,
      updateStatus: ctx.updateStatus
    };
  }

  function updateAutoClear(changes) {
    Object.assign(settings.data.autoClear, changes);
    settings.save();
    ctx.scheduleAutoClear();
  }

  function updateDiscord(name, value) {
    settings.data[name] = !!value;
    settings.save();
    ctx.refreshPresence();
  }

  async function confirmUpdate(result) {
    const { response } = await dialog.showMessageBox(ctx.dialogParent(), {
      type: 'question',
      buttons: [result.manual ? 'Open Download Page' : 'Download & Restart', 'Later'],
      defaultId: 0,
      cancelId: 1,
      title: 'Update Available',
      message: `Version ${result.version} is available (you have ${app.getVersion()}).`,
      detail: result.manual
        ? 'This install cannot update itself, so you will be taken to our github page to manually download & install.'
        : 'The update will be downloaded, then the app will restart to install it.'
    });
    return response === 0;
  }

  async function downloadAndInstall() {
    let lastReported = -10;
    try {
      await updater.download((percent) => {
        if (percent - lastReported < 5) return;
        lastReported = percent;
        ctx.setUpdateStatus(`Downloading... ${Math.round(percent)}%`);
      });
      ctx.setUpdateStatus('Installing...');
      updater.install();
    } catch (e) {
      ctx.setUpdateStatus('Download failed, opening download page');
      shell.openExternal(updater.RELEASES_URL);
    }
  }

  async function checkUpdates() {
    ctx.setUpdateStatus('Checking...');
    const result = await updater.check();
    if (result.error) return ctx.setUpdateStatus('Could not check for updates');
    if (!result.available) return ctx.setUpdateStatus(`You are up to date (v${app.getVersion()})`);

    ctx.setUpdateStatus(`Update v${result.version} available`);
    if (!(await confirmUpdate(result))) return;
    if (result.manual) return shell.openExternal(updater.RELEASES_URL);
    await downloadAndInstall();
  }

  const actions = {
    clearCache: () => ctx.clearCacheWithLogout(),

    autoClearEnabled: (on) => updateAutoClear({ enabled: !!on }),
    autoClearMode: (mode) => updateAutoClear({ mode }),
    autoClearCustom(text) {
      if (!duration.parse(text)) {
        return { error: 'Use a format like "+90 minutes", "2 hours", "1 day" or "1 week" (30 seconds to about 24 days).' };
      }
      updateAutoClear({ custom: text.trim() });
    },

    checkUpdates,

    zoomIn: () => ctx.zoomBy(0.1),
    zoomOut: () => ctx.zoomBy(-0.1),
    zoomReset: () => ctx.setZoom(1),
    toggleFullscreen: (on) => ctx.setFullscreen(on),

    setKeybind({ key, combo }) {
      const binds = settings.data.keybinds;
      if (!(key in binds) || !combo) return { error: 'Invalid key combination.' };
      const taken = Object.keys(binds).some((other) => other !== key && binds[other] === combo);
      if (taken) return { error: 'That combination is already used by another action.' };
      binds[key] = combo;
      settings.save();
    },

    discordEnabled: (on) => updateDiscord('discordEnabled', on),
    discordShowName: (on) => updateDiscord('discordShowName', on)
  };

  return { getState, actions };
};