const { app } = require("electron");
const fs = require("fs");
const path = require("path");
const { FLASH_FILES, FLASH_VERSION } = require("./config");

const OS_TOKENS = {
    win32: process.arch === "x64" ? "Windows NT 10.0; Win64; x64" : "Windows NT 10.0; WOW64",
    darwin: "Macintosh; Intel Mac OS X 10_15_7",
    linux: "X11; Linux x86_64"
};

let agent = null;
let icon;

function configure() {
    app.userAgentFallback = userAgent();
    app.commandLine.appendSwitch("no-proxy-server");
    app.commandLine.appendSwitch("disable-renderer-backgrounding");
    app.commandLine.appendSwitch("disable-background-timer-throttling");
    app.commandLine.appendSwitch("disable-backgrounding-occluded-windows");
    app.commandLine.appendSwitch("disable-features", "CalculateNativeWinOcclusion");

    if (process.platform === "linux")
        app.commandLine.appendSwitch("no-sandbox");

    const file = FLASH_FILES[process.platform];

    if (!file)
        return;

    const dir = app.isPackaged ? path.join(process.resourcesPath, "flash") : path.join(__dirname, "..", "assets", "flash");
    app.commandLine.appendSwitch("ppapi-flash-path", path.join(dir, file));
    app.commandLine.appendSwitch("ppapi-flash-version", FLASH_VERSION);
}

function windowIcon() {
    if (icon !== undefined || process.platform === "darwin")
        return icon;

    const isWin = process.platform === "win32";

    const file = app.isPackaged
        ? path.join(process.resourcesPath, isWin ? "icon.ico" : "icon.png")
        : path.join(__dirname, "..", isWin ? path.join("assets", "favicon.ico") : "icon.png");

    icon = fs.existsSync(file) ? file : undefined;

    return icon;
}

function userAgent() {
    if (agent)
        return agent;

    const os = OS_TOKENS[process.platform] || OS_TOKENS.linux;
    agent = `Mozilla/5.0 (${os}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${process.versions.chrome} Safari/537.36 Electron/${process.versions.electron} BWR/${app.getVersion()}`;

    return agent;
}

module.exports = { configure, windowIcon, userAgent };
