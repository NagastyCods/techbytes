const { Post, Comment } = require('../../models');
const env = require('../../config/env');
const { publishedQuery } = require('../../utils/queries');
const { renderArticleHtml, extractToc } = require('../../utils/markdown');
const { articleLd } = require('../../utils/seo');
const { absoluteUrl } = require('../../utils/urls');

async function show(req, res, next) {
  try {
    const post = await Post.findOne({ slug: req.params.slug, ...publishedQuery() })
      .populate('author category tags')
      .lean();

    if (!post) {
      const err = new Error('Article not found');
      err.status = 404;
      throw err;
    }

    // Views are a simple counter — we don't wait for the write before rendering.
    Post.updateOne({ _id: post._id }, { $inc: { views: 1 } }).exec();

    const html = await renderArticleHtml(post.content);
    const toc = extractToc(html);

    const [related, comments] = await Promise.all([
      Post.find({
        ...publishedQuery(),
        category: post.category._id,
        _id: { $ne: post._id }
      })
        .sort({ publishedAt: -1 })
        .limit(3)
        .populate('author category')
        .lean(),
      Comment.find({ post: post._id, status: 'approved' })
        .sort({ createdAt: -1 })
        .lean()
    ]);

    const shareUrl = encodeURIComponent(`${env.siteUrl}/article/${post.slug}`);
    const shareText = encodeURIComponent(post.title);

    res.render('public/article', {
      pageTitle: post.seo?.metaTitle || `${post.title} · ${env.siteName}`,
      metaDescription: post.seo?.metaDescription || post.excerpt,
      ogImage: absoluteUrl(post.seo?.ogImage || post.coverImage),
      canonicalUrl: post.seo?.canonicalUrl || '',
      post,
      html,
      toc,
      related,
      comments,
      commentStatus: req.query.comment || '',
      shareUrl,
      shareText,
      jsonLd: articleLd(post)
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { show };
