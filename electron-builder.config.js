const fs = require("fs");
const path = require("path");

const signingSrc = path.join(__dirname, "src", "signing.js");
const signingJsc = path.join(__dirname, "src", "signing.jsc");

if (!fs.existsSync(signingJsc) || fs.statSync(signingJsc).mtimeMs < fs.statSync(signingSrc).mtimeMs)
    throw new Error("src/signing.jsc is missing or older than src/signing.js. Run: node scripts/write-build-secret.js");

const arch = process.env.BUILD_ARCH || process.arch;
const signingArchFile = path.join(__dirname, "src", "signing.arch.gen.js");
const signingArch = fs.existsSync(signingArchFile) ? fs.readFileSync(signingArchFile, "utf8").trim() : "unknown";

if (signingArch !== arch)
    throw new Error(
        `src/signing.jsc was compiled for ${signingArch} but this build is ${arch}; it would not load. Run: node scripts/write-build-secret.js with BUILD_ARCH=${arch}`
    );

const winDll = `pepflashplayer${arch === "ia32" ? "32" : "64"}_32_0_0_303.dll`;

const publish = {
    provider: "github",
    owner: "BWRewritten",
    repo: "Bin-Weevils-Rewritten-Client",
    releaseType: "release"
};

const installerName = "BWR_Installer_${version}-${os}-${arch}.${ext}";
const manualName = "BWR_Installer_${version}-Manual-${os}-${arch}.${ext}";
const installer = { artifactName: installerName };
const flash = (file) => ({ from: `assets/flash/${file}`, to: `flash/${file}` });

module.exports = {
    appId: "app.binweevils.rewritten",
    productName: "Bin Weevils Rewritten",
    artifactName: manualName,
    directories: { output: "dist" },
    asar: true,
    npmRebuild: false,
    compression: "maximum",
    files: ["main.js", "preload.js", "package.json", "src/**/*", "!src/signing.js", "!src/*.gen.js", "!src/build-secret*", "assets/app/**/*"],
    publish: [publish],

    win: {
        icon: "assets/favicon.ico",
        target: ["nsis", "zip"].map((target) => ({ target, arch: [arch] })),
        extraResources: [flash(winDll), { from: "assets/favicon.ico", to: "icon.ico" }],
        publish: [Object.assign({}, publish, { channel: `win-${arch}` })]
    },
    nsis: { oneClick: true, perMachine: false, runAfterFinish: true, artifactName: installerName },
    dmg: installer,
    appImage: installer,
    deb: installer,
    rpm: installer,

    mac: {
        icon: "icon.icns",
        category: "public.app-category.games",
        identity: null,
        target: [
            { target: "dmg", arch: ["x64"] },
            { target: "zip", arch: ["x64"] }
        ],
        extraResources: [flash("PepperFlashPlayer.plugin")]
    },

    linux: {
        icon: "icon.png",
        category: "Game",
        target: ["AppImage", "deb", "rpm", "zip", "tar.xz"].map((target) => ({ target, arch: ["x64"] })),
        extraResources: [flash("libpepflashplayer.so"), { from: "icon.png", to: "icon.png" }]
    }
};
