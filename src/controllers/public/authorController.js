const { User, Post } = require('../../models');
const env = require('../../config/env');
const { publishedQuery } = require('../../utils/queries');
const { getPagination, buildPager } = require('../../utils/pagination');

async function show(req, res, next) {
  try {
    const author = await User.findOne({ slug: req.params.slug, isActive: true }).lean();
    if (!author) {
      const err = new Error('Author not found');
      err.status = 404;
      throw err;
    }

    const { page, limit, skip } = getPagination(req.query, { limit: 9 });
    const filter = { ...publishedQuery(), author: author._id };
    const [posts, total] = await Promise.all([
      Post.find(filter)
        .sort({ publishedAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('author category')
        .lean(),
      Post.countDocuments(filter)
    ]);

    res.render('public/author', {
      pageTitle: `${author.name} · ${env.siteName}`,
      metaDescription: author.bio || `Stories by ${author.name} on ${env.siteName}.`,
      author,
      posts,
      pager: buildPager({ page, limit, total, path: `/authors/${author.slug}` })
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { show };
