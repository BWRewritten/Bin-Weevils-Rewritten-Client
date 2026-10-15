module.exports = [
  { type: 'icon', src: '../../assets/app/icon.png', size: 96 },
  { type: 'label', style: 'title', text: (s) => `Version ${s.version}` },
  { type: 'label', style: 'small', text: 'Created with ♥ by Khora & Alioth' },
  { type: 'divider' },

  { type: 'section', text: 'Cache' },
  { type: 'button', id: 'clearCache', label: 'Clear cache' },
  { type: 'toggle', id: 'autoClearEnabled', label: 'Automatically clear cache', value: (s) => s.autoClear.enabled },
  {
    type: 'select', id: 'autoClearMode', label: 'Interval', value: (s) => s.autoClear.mode,
    options: [['hourly', 'Hourly'], ['daily', 'Daily'], ['custom', 'Custom']],
    showIf: (s) => s.autoClear.enabled
  },
  {
    type: 'text', id: 'autoClearCustom', label: 'Custom interval', placeholder: '+90 minutes',
    value: (s) => s.autoClear.custom, hint: 'e.g. +30 seconds, +2 hours, +1 day, +1 week',
    showIf: (s) => s.autoClear.enabled && s.autoClear.mode === 'custom'
  },
  { type: 'divider' },

  { type: 'section', text: 'Updates' },
  { type: 'button', id: 'checkUpdates', label: 'Check for updates', status: (s) => s.updateStatus },
  { type: 'divider' },

  { type: 'section', text: 'Display' },
  {
    type: 'stepper', label: 'Zoom', value: (s) => Math.round(s.zoom * 100) + '%',
    decId: 'zoomOut', incId: 'zoomIn', resetId: 'zoomReset'
  },
  { type: 'keybind', key: 'zoomIn', label: 'Zoom in key' },
  { type: 'keybind', key: 'zoomOut', label: 'Zoom out key' },
  { type: 'toggle', id: 'toggleFullscreen', label: 'Full screen', value: (s) => s.fullscreen },
  { type: 'keybind', key: 'fullscreen', label: 'Full screen key' },
  { type: 'keybind', key: 'menu', label: 'Open menu key' },
  { type: 'divider' },

  { type: 'section', text: 'Discord' },
  { type: 'toggle', id: 'discordEnabled', label: 'Discord Rich Presence', value: (s) => s.discordEnabled },
  {
    type: 'toggle', id: 'discordShowName', label: 'Show my weevil name in presence',
    value: (s) => s.discordShowName,
    hint: (s) => (s.username ? 'Detected: ' + s.username : 'No login detected yet'),
    showIf: (s) => s.discordEnabled
  }
];