const env = require('../config/env');

function absoluteUrl(pathOrUrl) {
  if (!pathOrUrl) return '';
  const value = String(pathOrUrl);
  if (/^https?:\/\//i.test(value)) return value;
  const path = value.startsWith('/') ? value : `/${value}`;
  return `${env.siteUrl}${path}`;
}

module.exports = { absoluteUrl };
