const MAIN_URL = 'https://play.binweevils.app/';
const LOGOUT_URL = `${MAIN_URL}php2/login/logoutClient.php`;

function parse(url) {
  try { return new URL(url); } catch (e) { return null; }
}

function isInternal(url) {
  const parsed = parse(url);
  return !!parsed && (parsed.hostname === 'binweevils.app' || parsed.hostname.endsWith('.binweevils.app'));
}

function isDownloadPage(url) {
  return isInternal(url) && parse(url).pathname.toLowerCase().indexOf('/download') === 0;
}

function isDiscord(url) {
  const parsed = parse(url);
  if (!parsed) return false;
  const host = parsed.hostname;
  return host === 'discord.gg' || host === 'discord.com' || host.endsWith('.discord.com');
}

module.exports = { MAIN_URL, LOGOUT_URL, isInternal, isDownloadPage, isDiscord };