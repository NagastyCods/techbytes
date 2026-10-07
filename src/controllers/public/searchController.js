const env = require('../../config/env');
const { searchPosts } = require('../../utils/searchPosts');

async function search(req, res, next) {
  try {
    const result = await searchPosts(req.query, { limit: 9 });
    res.render('public/search', {
      pageTitle: result.q ? `Search: ${result.q} · ${env.siteName}` : `Search · ${env.siteName}`,
      metaDescription: 'Search TechBytes stories by keyword, category, and date.',
      q: result.q,
      selectedCategory: result.category,
      from: result.from,
      to: result.to,
      posts: result.posts,
      total: result.total,
      pager: result.pager,
      ran: result.ran,
      robots: 'noindex,follow'
    });
  } catch (err) {
    next(err);
  }
}

async function searchApi(req, res, next) {
  try {
    const limit = Math.min(20, Math.max(1, Number(req.query.limit) || 8));
    const result = await searchPosts(req.query, { limit });
    res.json({
      ok: true,
      q: result.q,
      total: result.total,
      page: result.page,
      ran: result.ran,
      posts: result.cards
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { search, searchApi };
