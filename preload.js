(function () {
  var MAIN_URL = 'https://play.binweevils.app/';
  try {
    var onSite = /(^|\.)binweevils\.app$/.test(location.hostname);
    if (onSite && /^\/download/i.test(location.pathname)) location.replace(MAIN_URL);
  } catch (e) {}
})();