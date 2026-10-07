const env = require('../config/env');
const { wantsJson } = require('../utils/http');

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
  res.status(status).render('public/error', {
    pageTitle: `Something went wrong · ${env.siteName}`,
    metaDescription: 'An error occurred.',
    message: env.isProd ? 'Please try again in a moment.' : err.message,
    robots: 'noindex,follow',
    status
  });
}

module.exports = { notFound, errorHandler };
