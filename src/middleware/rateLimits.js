const rateLimit = require('express-rate-limit');
const { wantsJson } = require('../utils/http');

function jsonOrRedirectMessage(message) {
  return (req, res) => {
    if (wantsJson(req)) {
      return res.status(429).json({ ok: false, error: message });
    }
    res.status(429).render('public/error', {
      pageTitle: 'Slow down',
      metaDescription: message,
      message,
      status: 429
    });
  };
}

const commentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler: jsonOrRedirectMessage('Too many comments. Please wait 15 minutes.')
});

const newsletterLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 8,
  standardHeaders: true,
  legacyHeaders: false,
  handler: jsonOrRedirectMessage('Too many subscription attempts. Please wait 15 minutes.')
});

const searchLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 120,
  standardHeaders: true,
  legacyHeaders: false,
  handler: jsonOrRedirectMessage('Search is being rate limited. Try again in a moment.')
});

module.exports = { commentLimiter, newsletterLimiter, searchLimiter };
