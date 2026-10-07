const { Post, Category } = require('../../models');
const env = require('../../config/env');
const { publishedQuery } = require('../../utils/queries');
const { websiteLd } = require('../../utils/seo');

async function home(req, res, next) {
  try {
    const filter = publishedQuery();

    const [featured, latest, trending, categoryDocs] = await Promise.all([
      Post.findOne({ ...filter, featured: true })
        .sort({ publishedAt: -1 })
        .populate('author category tags')
        .lean(),
      Post.find(filter)
        .sort({ publishedAt: -1 })
        .limit(9)
        .populate('author category')
        .lean(),
      Post.find(filter)
        .sort({ views: -1, publishedAt: -1 })
        .limit(5)
        .populate('category')
        .lean(),
      Category.find().sort({ name: 1 }).lean()
    ]);

    const hero = featured || latest[0] || null;
    const latestWithoutHero = hero
      ? latest.filter((post) => String(post._id) !== String(hero._id))
      : latest;

    const categorySections = await Promise.all(
      categoryDocs.map(async (category) => {
        const posts = await Post.find({ ...filter, category: category._id })
          .sort({ publishedAt: -1 })
          .limit(4)
          .populate('author')
          .lean();
        return { category, posts };
      })
    );

    res.render('public/home', {
      pageTitle: `${env.siteName} · ${env.siteTagline}`,
      metaDescription: 'AI, gadgets, software, startups, and cybersecurity news — written for people who actually use this stuff.',
      hero,
      latest: latestWithoutHero.slice(0, 8),
      trending,
      categorySections: categorySections.filter((section) => section.posts.length),
      jsonLd: websiteLd()
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { home };
