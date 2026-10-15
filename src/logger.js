const { app } = require('electron');
const fs = require('fs');
const path = require('path');

function logError(err) {
  try {
    const file = path.join(app.getPath('userData'), 'bwr-error.log');
    fs.appendFileSync(file, `${new Date().toISOString()} ${(err && err.stack) || err}\n`);
  } catch (e) {}
}

module.exports = { logError };