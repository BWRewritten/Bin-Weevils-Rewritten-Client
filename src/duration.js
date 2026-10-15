const SECONDS_PER_UNIT = {
  s: 1, sec: 1, secs: 1, second: 1, seconds: 1,
  m: 60, min: 60, mins: 60, minute: 60, minutes: 60,
  h: 3600, hr: 3600, hrs: 3600, hour: 3600, hours: 3600,
  d: 86400, day: 86400, days: 86400,
  w: 604800, week: 604800, weeks: 604800
};
const MIN_MS = 30000;
const MAX_MS = 2147483647;
const PATTERN = /^\s*\+?\s*(\d+(?:\.\d+)?)\s*([a-z]+)\s*$/i;

function parse(text) {
  const match = PATTERN.exec(text || '');
  if (!match) return null;
  const seconds = SECONDS_PER_UNIT[match[2].toLowerCase()];
  if (!seconds) return null;
  const ms = Math.round(parseFloat(match[1]) * seconds * 1000);
  return ms >= MIN_MS && ms <= MAX_MS ? ms : null;
}

module.exports = { parse };