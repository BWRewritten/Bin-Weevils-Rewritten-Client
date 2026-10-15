const arch = process.env.BUILD_ARCH || process.arch;
const winDll = `pepflashplayer${arch === 'ia32' ? '32' : '64'}_32_0_0_303.dll`;

const publish = {
  provider: 'github',
  owner: 'BWRewritten',
  repo: 'Bin-Weevils-Rewritten-Client',
  releaseType: 'release'
};
const flash = (file) => ({ from: `assets/flash/${file}`, to: `flash/${file}` });

module.exports = {
  appId: 'app.binweevils.rewritten',
  productName: 'Bin Weevils Rewritten',
  artifactName: 'BWR-${version}-${os}-${arch}.${ext}',
  directories: { output: 'dist' },
  asar: true,
  npmRebuild: false,
  compression: 'maximum',
  files: ['main.js', 'preload.js', 'package.json', 'src/**/*', 'assets/app/**/*'],
  publish: [publish],

  win: {
    icon: 'assets/favicon.ico',
    target: [{ target: 'nsis', arch: [arch] }],
    extraResources: [flash(winDll), { from: 'assets/favicon.ico', to: 'icon.ico' }],
    publish: [Object.assign({}, publish, { channel: `win-${arch}` })]
  },
  nsis: { oneClick: true, perMachine: false, runAfterFinish: true },

  mac: {
    icon: 'icon.icns',
    category: 'public.app-category.games',
    identity: null,
    target: [{ target: 'dmg', arch: ['x64'] }, { target: 'zip', arch: ['x64'] }],
    extraResources: [flash('PepperFlashPlayer.plugin')]
  },

  linux: {
    icon: 'icon.png',
    category: 'Game',
    target: ['AppImage', 'deb', 'rpm', 'tar.xz'].map((target) => ({ target, arch: ['x64'] })),
    extraResources: [flash('libpepflashplayer.so'), { from: 'icon.png', to: 'icon.png' }]
  }
};