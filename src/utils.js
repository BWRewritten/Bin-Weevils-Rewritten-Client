const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const timeout = (promise, ms) =>
  Promise.race([promise, new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), ms))]);

module.exports = { delay, timeout };