function wantsJson(req) {
  const accept = String(req.get('accept') || '');
  return Boolean(req.xhr)
    || req.get('x-requested-with') === 'XMLHttpRequest'
    || (accept.includes('application/json') && !accept.includes('text/html'));
}

module.exports = { wantsJson };
