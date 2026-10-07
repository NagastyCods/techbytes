const { body, validationResult } = require('express-validator');
const sanitizeHtml = require('sanitize-html');
const { Post, Comment } = require('../../models');
const { publishedQuery } = require('../../utils/queries');

const commentValidators = [
  body('name').trim().isLength({ min: 2, max: 80 }).withMessage('Name must be 2–80 characters.'),
  body('email').trim().isEmail().withMessage('Enter a valid email.').normalizeEmail(),
  body('body').trim().isLength({ min: 8, max: 2000 }).withMessage('Comment must be 8–2000 characters.'),
  body('website').optional({ values: 'falsy' }).isEmpty()
];

function articlePath(slug, status) {
  return `/article/${slug}?comment=${status}#comments`;
}

async function create(req, res, next) {
  try {
    const post = await Post.findOne({ slug: req.params.slug, ...publishedQuery() });
    if (!post) {
      const err = new Error('Article not found');
      err.status = 404;
      throw err;
    }

    // Honeypot: bots fill hidden "website". Pretend success so they learn nothing.
    if (String(req.body.website || '').trim()) {
      return res.redirect(articlePath(post.slug, 'pending'));
    }

    if (!post.allowComments) {
      return res.redirect(articlePath(post.slug, 'closed'));
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.redirect(articlePath(post.slug, 'invalid'));
    }

    const bodyText = sanitizeHtml(String(req.body.body), { allowedTags: [], allowedAttributes: {} }).trim();
    if (bodyText.length < 8) {
      return res.redirect(articlePath(post.slug, 'invalid'));
    }

    await Comment.create({
      post: post._id,
      name: String(req.body.name).trim(),
      email: String(req.body.email).trim().toLowerCase(),
      body: bodyText,
      status: 'pending'
    });

    res.redirect(articlePath(post.slug, 'pending'));
  } catch (err) {
    next(err);
  }
}

module.exports = { create, commentValidators };
