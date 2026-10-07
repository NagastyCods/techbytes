/** Posts the public site is allowed to show. */
function publishedQuery() {
  return {
    status: 'published',
    publishedAt: { $lte: new Date() }
  };
}

module.exports = { publishedQuery };
