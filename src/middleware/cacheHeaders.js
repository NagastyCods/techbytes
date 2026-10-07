const env = require('../config/env');

/** HTML is personalized (Staff vs Dashboard), so do not put it on a shared CDN cache. */
function htmlHeaders(req, res, next) {
  res.set('Cache-Control', env.isProd ? 'private, no-cache, must-revalidate' : 'no-store');
  next();
}

function publicFeedHeaders(maxAgeSeconds) {
  return function setFeedCache(req, res, next) {
    res.set('Cache-Control', `public, max-age=${maxAgeSeconds}`);
    next();
  };
}

function noIndexAdmin(req, res, next) {
  res.set('X-Robots-Tag', 'noindex, nofollow');
  next();
}

module.exports = { htmlHeaders, publicFeedHeaders, noIndexAdmin };
