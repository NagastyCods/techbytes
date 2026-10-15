const env = require('../config/env');
const { wantsJson } = require('../utils/http');

function visitorMessage(err) {
  const detail = err && err.message ? err.message : 'Request failed.';
  if (!env.isProd) return detail;
  const blob = `${err && err.name ? err.name : ''} ${err && err.code ? err.code : ''} ${detail}`;
  if (/MongoParseError|Invalid scheme|URI malformed/i.test(blob)) {
    return 'The database connection string is invalid. Remove any line break or quotes around MONGODB_URI, and URL-encode a password that contains @ or :.';
  }
  if (/authentication failed|bad auth/i.test(blob)) {
    return 'The database rejected the username or password in MONGODB_URI.';
  }
  if (/querySrv|ENOTFOUND|ECONNREFUSED|ServerSelection|MongoNetwork/i.test(blob)) {
    return 'The site cannot reach MongoDB. In Atlas, allow 0.0.0.0/0, or use the standard mongodb:// connection string instead of mongodb+srv://.';
  }
  return 'Please try again in a moment.';
}

function notFound(req, res) {
  res.status(404).render('public/not-found', {
    pageTitle: `Page not found · ${env.siteName}`,
    metaDescription: 'This page does not exist.',
    robots: 'noindex,follow'
  });
}

function errorHandler(err, req, res, next) {
  // If headers were already sent, let Express's default handler take over.
  if (res.headersSent) {
    next(err);
    return;
  }

  let status = err.status || 500;
  if (err.name === 'ValidationError' || err.name === 'MulterError') {
    status = 400;
  }

  const jsonApi = String(req.originalUrl || '').startsWith('/admin/preview')
    || String(req.originalUrl || '').startsWith('/admin/uploads')
    || String(req.originalUrl || '').startsWith('/api/')
    || wantsJson(req);

  if (jsonApi) {
    return res.status(status >= 400 ? status : 400).json({ ok: false, error: err.message || 'Request failed.' });
  }

  if (status === 404) {
    notFound(req, res);
    return;
  }

  console.error(err);
  const message = visitorMessage(err);
  // Database failures happen before nav categories are loaded. The layout
  // must still render, or Express replaces this page with "Internal Server Error".
  res.locals.siteName = res.locals.siteName || env.siteName;
  res.locals.siteTagline = res.locals.siteTagline || env.siteTagline;
  res.locals.siteUrl = res.locals.siteUrl || env.siteUrl;
  res.locals.categories = res.locals.categories || [];
  res.locals.currentPath = res.locals.currentPath || req.path;
  res.locals.currentUser = res.locals.currentUser || null;
  res.locals.isStaff = res.locals.isStaff || false;
  res.locals.rssUrl = res.locals.rssUrl || `${env.siteUrl}/rss.xml`;
  res.locals.canonicalPath = res.locals.canonicalPath || req.path || '/';
  res.locals.canonicalUrl = res.locals.canonicalUrl || '';
  res.locals.ogImage = res.locals.ogImage || '';

  res.status(status).render(
    'public/error',
    {
      pageTitle: `Something went wrong · ${env.siteName}`,
      metaDescription: 'An error occurred.',
      message,
      robots: 'noindex,follow',
      status
    },
    (renderErr, html) => {
      if (renderErr) {
        console.error(renderErr);
        res.status(status).type('text/plain').send(message);
        return;
      }
      res.send(html);
    }
  );
}

module.exports = { notFound, errorHandler };
