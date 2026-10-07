const { Post, Tag } = require('../../models');
const env = require('../../config/env');
const { publishedQuery } = require('../../utils/queries');
const { getPagination, buildPager } = require('../../utils/pagination');

async function show(req, res, next) {
  try {
    const tag = await Tag.findOne({ slug: req.params.slug }).lean();
    if (!tag) {
      const err = new Error('Tag not found');
      err.status = 404;
      throw err;
    }

    const { page, limit, skip } = getPagination(req.query, { limit: 9 });
    const filter = { ...publishedQuery(), tags: tag._id };
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
      pageTitle: `#${tag.name} · ${env.siteName}`,
      metaDescription: `Stories tagged ${tag.name} on ${env.siteName}.`,
      heading: tag.name,
      kicker: 'Tag',
      intro: `Every published story tagged “${tag.name}”.`,
      posts,
      pager: buildPager({ page, limit, total, path: `/tag/${tag.slug}` }),
      emptyMessage: 'No published stories with this tag yet.'
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { show };
