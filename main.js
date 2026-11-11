'use strict';

// Registers the require() hook for .jsc, so packaged builds can load
// src/signing.jsc (signing code + key, shipped as V8 bytecode). Must run
// before src/client.js requires it. Harmless if bytenode is unavailable.
try { require('bytenode'); } catch (e) {}

const { app } = require('electron');
const { logError } = require('./src/logger');
const launchGuard = require('./src/launch-guard');
const settings = require('./src/settings');
const chromium = require('./src/chromium');
const Client = require('./src/client');

process.on('uncaughtException', logError);
process.on('unhandledRejection', logError);

if(launchGuard.enforce()) {
  settings.load();
  chromium.configure();

  if (!app.requestSingleInstanceLock()) app.quit();
  else new Client().start();
}
else
    app.quit();