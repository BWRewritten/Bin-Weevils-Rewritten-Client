"use strict";

try {
    require("bytenode");
} catch (e) {}

const { app } = require("electron");
const { logError } = require("./src/logger");
const launchGuard = require("./src/launch-guard");
const settings = require("./src/settings");
const chromium = require("./src/chromium");
const Client = require("./src/client");

process.on("uncaughtException", logError);
process.on("unhandledRejection", logError);

if (launchGuard.enforce()) {
    settings.load();
    chromium.configure();

    if (!app.requestSingleInstanceLock())
        app.quit();
    else
        new Client().start();
}
else
    app.quit();
