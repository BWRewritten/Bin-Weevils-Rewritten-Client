'use strict';

const { app } = require('electron');
const { logError } = require('./src/logger');
const settings = require('./src/settings');
const chromium = require('./src/chromium');
const Client = require('./src/client');

process.on('uncaughtException', logError);
process.on('unhandledRejection', logError);

settings.load();
chromium.configure();

if (!app.requestSingleInstanceLock()) app.quit();
else new Client().start();