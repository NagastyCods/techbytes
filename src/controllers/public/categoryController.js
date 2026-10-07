const { Post, Category } = require('../../models');
const env = require('../../config/env');
const { publishedQuery } = require('../../utils/queries');
const { getPagination, buildPager } = require('../../utils/pagination');

async function show(req, res, next) {
  try {
    const category = await Category.findOne({ slug: req.params.slug }).lean();
    if (!category) {
      const err = new Error('Category not found');
      err.status = 404;
      throw err;
    }

    const { page, limit, skip } = getPagination(req.query, { limit: 9 });
    const filter = { ...publishedQuery(), category: category._id };
    const [posts, total] = await Promise.all([
      Post.find(filter)
        .sort({ publishedAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('author category')
        .lean(),
      Post.countDocuments(filter)
    ]);

    res.render('public/listing', {
      pageTitle: `${category.name} · ${env.siteName}`,
      metaDescription: category.description || `Latest ${category.name} news on ${env.siteName}.`,
      heading: category.name,
      kicker: 'Category',
      intro: category.description,
      posts,
      pager: buildPager({ page, limit, total, path: `/category/${category.slug}` }),
      emptyMessage: 'No published stories in this category yet.'
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { show };
