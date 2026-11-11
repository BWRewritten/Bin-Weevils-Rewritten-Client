const { app } = require("electron");
const { logError } = require("./logger");

const BLOCKED_SWITCHES = [
    "remote-debugging-port",
    "remote-debugging-pipe",
    "inspect",
    "inspect-brk",
    "inspect-port",
    "js-flags",
    "disable-web-security",
    "ignore-certificate-errors",
    "ignore-certificate-errors-spki-list",
    "proxy-server",
    "proxy-pac-url",
    "proxy-bypass-list",
    "host-rules",
    "host-resolver-rules",
    "load-extension",
    "disable-extensions-except",
    "ppapi-flash-path",
    "register-pepper-plugins",
    "ssl-key-log-file",
    "log-net-log",
    "ignore-urlfetcher-cert-requests",
    "allow-insecure-localhost"
];

const NODE_OPTIONS_PATTERN = /--inspect|--require|(^|\s)-r\s|--loader/;

function violations() {
    const args = process.argv.slice(1).concat(process.execArgv || []);

    const found = args
        .filter((arg) => /^--?[a-z]/i.test(arg))
        .map((arg) => arg.replace(/^--?/, "").split("=")[0].toLowerCase())
        .filter((name) => BLOCKED_SWITCHES.indexOf(name) !== -1);

    if (NODE_OPTIONS_PATTERN.test(process.env.NODE_OPTIONS || ""))
        found.push("NODE_OPTIONS");

    if (process.env.SSLKEYLOGFILE)
        found.push("SSLKEYLOGFILE");

    return found;
}

function enforce() {
    if (!app.isPackaged)
        return true;

    const found = violations();

    if (!found.length)
        return true;

    logError(new Error("launch-guard blocked: " + found.join(", ")));
    //dialog.showErrorBox('BWR cannot start', 'The game was started with unsupported options (' + found.join(', ') + ').');
    app.exit(1);

    return false;
}

module.exports = { enforce, violations };
