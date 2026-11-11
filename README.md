# Bin Weevils Rewritten Client
The desktop client for [Bin Weevils Rewritten](https://binweevils.app/). The game runs on Flash, which browsers dropped in 2020, so this client ships with its own Flash Player and opens the game in its own window.

## Features
- Built-in (Pepper) Flash Player, so there is nothing to install separately.
- Automatic updates for the Windows installer and the Linux AppImage. Other copies (macOS, deb, rpm and the manual zips) tell you when a new version is out.
- Discord Rich Presence, with the option to show or hide your weevil name.
- In-app menu (`Ctrl+M`) for zoom, fullscreen, key binds, Discord settings and cache clearing.
- Cache clearing on demand or on a schedule, so game updates show up without a reinstall.
- Windows (64-bit and 32-bit), macOS (Intel) and Linux (x64) builds.

## Official Builds & Game Access
Official builds are made by the BWR team and are the only supported way to play. Each one carries a signing key that is not in this repository, and the game servers check for it.

You are welcome to build the client yourself or change it, but a locally built or modified copy should not be expected to get into the game. There is no setting in this repository that changes that, and we cannot help with getting a custom build to connect.

## Building A Local Version
The code is here for anyone who wants to see how the client works or use it as a starting point for their own Electron project.

You need [Node.js](https://nodejs.org/) v18 (the version the official builds use; newer versions can fail to unpack Electron 11). If you have newer versions installed and don't feel like necessarily downgrading, consider trying NVM (Node Version Manager). You can find it for [Windows](https://nvm-windows.com) & [Linux](https://github.com/nvm-sh/nvm) machines if you're technical. It will help you easily switch between your Node versions and by extension help with this.

```
npm install
npm start
```

`npm start` runs the client straight from the source, without a signing key.

To package an installer for the system you are on:

```
npm run secret:new
npm run dist -- --publish never
```

- `npm run secret:new` creates your own random key in `.build-secret` and compiles `src/signing.jsc` from it. The packaging step refuses to run without that file. Your key is yours alone; it is not the official one. You only need this once, and `npm run dist` recompiles it on each build.
- The output lands in `dist`.
- The compiled signing file only loads in the Electron architecture that built it. To build for another architecture (for example 32-bit Windows), install Electron for that architecture first and set `BUILD_ARCH` to match, as `.github/workflows/build.yml` does.
- Never commit `.build-secret` or `src/signing.jsc`. Both are in `.gitignore`.

This client stays on Electron 11 because it is the last version that can load Flash. That version is long out of support and no longer receives security fixes, which is acceptable here only because the client opens one known site.

## License
Released under [CC0 1.0](LICENSE.md). The original client was made by AltoDev; please keep that credit in place.
