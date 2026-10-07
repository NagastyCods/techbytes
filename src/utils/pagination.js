/**
 * Turn ?page=2 into skip/limit for Mongo and a simple pager for EJS.
 * Beginner note: skip = how many documents to jump over before reading.
 */
function getPagination(query, { limit = 9 } = {}) {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

function buildPager({ page, limit, total, path }) {
  const pageCount = Math.max(1, Math.ceil(total / limit));
  const pages = [];
  for (let i = 1; i <= pageCount; i += 1) {
    pages.push({ number: i, href: `${path}${path.includes('?') ? '&' : '?'}page=${i}`, current: i === page });
  }
  return {
    page,
    pageCount,
    total,
    hasPrev: page > 1,
    hasNext: page < pageCount,
    prevHref: page > 1 ? `${path}${path.includes('?') ? '&' : '?'}page=${page - 1}` : null,
    nextHref: page < pageCount ? `${path}${path.includes('?') ? '&' : '?'}page=${page + 1}` : null,
    pages
  };
}

module.exports = { getPagination, buildPager };
