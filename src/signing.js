const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const { app, net, session } = require("electron");
const { MAIN_URL, isInternalHost } = require("./urls");

const DRIFT_MS = 2000;
const SOCKET_TARGET = "websocket";

// @key-start
let key = null;

try {
    const hex = fs.readFileSync(path.join(__dirname, "..", ".build-secret"), "utf8").trim();

    if (!app.isPackaged && /^[0-9a-f]{64}$/i.test(hex))
        key = Buffer.from(hex, "hex");
} catch (e) {}
// @key-end

let clockOffsetMs = 0;
let debugSeen = null;

function enabled() {
    return !!key;
}

function signature(ts, method, pathAndQuery, version) {
    const payload = ["v1", ts, method.toUpperCase(), pathAndQuery, version].join("\n");

    return crypto.createHmac("sha256", key).update(payload).digest("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function offsetFromDate(header) {
    const serverMs = Date.parse(Array.isArray(header) ? header[0] : header);

    return isNaN(serverMs) ? null : serverMs - Date.now();
}

function syncClock() {
    return new Promise((resolve) => {
        let done = false;

        const finish = (ok) => {
            if (!done) {
                done = true;
                resolve(ok);
            }
        };

        try {
            const request = net.request({ method: "HEAD", url: MAIN_URL });

            request.on("response", (response) => {
                const offset = offsetFromDate(response.headers.date);

                if (offset !== null)
                    clockOffsetMs = offset;

                response.on("data", () => {});
                response.on("error", () => {});
                finish(offset !== null);
            });

            request.on("error", () => finish(false));
            request.end();
        } catch (e) {
            finish(false);
        }
    });
}

function trackClock() {
    session.defaultSession.webRequest.onCompleted((details) => {
        try {
            if (details.fromCache || !details.responseHeaders)
                return;

            if (!isInternalHost(new URL(details.url).hostname))
                return;

            const name = Object.keys(details.responseHeaders).find((k) => k.toLowerCase() === "date");
            const offset = name ? offsetFromDate(details.responseHeaders[name]) : null;

            if (offset === null || Math.abs(offset - clockOffsetMs) <= DRIFT_MS)
                return;

            if (debugSeen)
                console.log(`sign: clock offset ${clockOffsetMs}ms -> ${offset}ms`);

            clockOffsetMs = offset;
        } catch (e) {}
    });
}

function install() {
    if (process.env.BWR_DEBUG) {
        debugSeen = new Set();
        console.log(`sign: ${enabled() ? "enabled" : "DISABLED (no build secret)"}`);
    }

    if (!enabled())
        return;

    const version = app.getVersion();

    session.defaultSession.webRequest.onBeforeSendHeaders((details, callback) => {
        const headers = details.requestHeaders;

        try {
            const url = new URL(details.url);

            if (isInternalHost(url.hostname)) {
                const ts = String(Math.floor((Date.now() + clockOffsetMs) / 1000));
                headers["X-BWR-Client"] = version;
                headers["X-BWR-Ts"] = ts;
                const target = /^wss?:$/.test(url.protocol) ? SOCKET_TARGET : url.pathname + url.search;
                headers["X-BWR-Sig"] = signature(ts, details.method, target, version);

                if (debugSeen && /^wss?:$/.test(url.protocol)) {
                    console.log(
                        `sign: socket ${details.method} ${url.protocol}//${url.host} path=[${url.pathname}] query=[${url.search ? url.search.length + " chars" : "none"}] ts=${ts}`
                    );
                } else if (debugSeen && !debugSeen.has(url.protocol + url.host)) {
                    debugSeen.add(url.protocol + url.host);
                    console.log(`sign: ${url.protocol}//${url.host} (clock offset ${clockOffsetMs}ms)`);
                }
            }
        } catch (e) {}

        callback({ requestHeaders: headers });
    });

    trackClock();
}

module.exports = { install, syncClock, enabled };
