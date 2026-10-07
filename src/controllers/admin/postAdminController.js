const { Post, Category, Tag, User } = require('../../models');
const { uniqueSlug } = require('../../utils/slug');
const { applyPostStatus } = require('../../utils/scheduling');
const { canEditPost } = require('../../middleware/auth');
const { getPagination, buildPager } = require('../../utils/pagination');
const { STATUSES } = require('../../models/Post');

function asIdList(value) {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function datetimeLocal(value) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

async function formOptions(user) {
  const [categories, tags, authors] = await Promise.all([
    Category.find().sort({ name: 1 }).lean(),
    Tag.find().sort({ name: 1 }).lean(),
    user.role === 'author' ? User.find({ _id: user._id }).lean() : User.find({ isActive: true }).sort({ name: 1 }).lean()
  ]);
  return { categories, tags, authors, statuses: STATUSES };
}

function scopedFind(user) {
  return user.role === 'author' ? { author: user._id } : {};
}

async function index(req, res, next) {
  try {
    const { page, limit, skip } = getPagination(req.query, { limit: 20 });
    const status = String(req.query.status || '').trim();
    const filter = { ...scopedFind(req.user) };
    if (status) filter.status = status;

    const [posts, total] = await Promise.all([
      Post.find(filter).sort({ updatedAt: -1 }).skip(skip).limit(limit).populate('author category').lean(),
      Post.countDocuments(filter)
    ]);

    res.render('admin/posts/index', {
      pageTitle: 'Posts',
      posts,
      status,
      statuses: STATUSES,
      pager: buildPager({
        page,
        limit,
        total,
        path: `/admin/posts${status ? `?status=${encodeURIComponent(status)}` : ''}`
      }),
      notice: req.query.notice || ''
    });
  } catch (err) {
    next(err);
  }
}

async function newForm(req, res, next) {
  try {
    const options = await formOptions(req.user);
    res.render('admin/posts/form', {
      pageTitle: 'New post',
      post: {
        title: '',
        slug: '',
        excerpt: '',
        content: '',
        coverImage: '',
        status: 'draft',
        featured: false,
        allowComments: true,
        tags: [],
        seo: {}
      },
      scheduledLocal: '',
      notice: '',
      selectedTagIds: [],
      ...options
    });
  } catch (err) {
    next(err);
  }
}

async function editForm(req, res, next) {
  try {
    const post = await Post.findById(req.params.id).populate('tags');
    if (!post || !canEditPost(req.user, post)) {
      const err = new Error('Post not found');
      err.status = 404;
      throw err;
    }
    const options = await formOptions(req.user);
    res.render('admin/posts/form', {
      pageTitle: `Edit: ${post.title}`,
      post,
      scheduledLocal: datetimeLocal(post.scheduledAt),
      notice: req.query.saved ? 'Saved.' : '',
      selectedTagIds: (post.tags || []).map((t) => String(t._id || t)),
      ...options
    });
  } catch (err) {
    next(err);
  }
}

async function fillPost(post, body, user, isNew) {
  post.title = String(body.title || '').trim();
  post.excerpt = String(body.excerpt || '').trim();
  post.content = String(body.content || '').trim();
  post.coverImage = String(body.coverImage || '').trim();
  post.category = body.category;
  post.tags = asIdList(body.tags);
  post.featured = body.featured === 'on';
  post.allowComments = body.allowComments === 'on';
  post.seo = {
    metaTitle: String(body.metaTitle || '').trim(),
    metaDescription: String(body.metaDescription || '').trim(),
    ogImage: String(body.ogImage || '').trim(),
    canonicalUrl: String(body.canonicalUrl || '').trim()
  };

  if (user.role === 'author') {
    post.author = user._id;
  } else {
    post.author = body.author || user._id;
  }

  const slugSource = body.slug || body.title;
  post.slug = await uniqueSlug(Post, slugSource, {
    fallback: 'post',
    excludeId: isNew ? null : post._id
  });

  applyPostStatus(post, body.status || 'draft', body.scheduledAt);
}

async function create(req, res, next) {
  try {
    const post = new Post();
    await fillPost(post, req.body, req.user, true);
    await post.save();
    res.redirect(`/admin/posts/${post._id}/edit?saved=1`);
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const post = await Post.findById(req.params.id);
    if (!post || !canEditPost(req.user, post)) {
      const err = new Error('Post not found');
      err.status = 404;
      throw err;
    }
    await fillPost(post, req.body, req.user, false);
    await post.save();
    res.redirect(`/admin/posts/${post._id}/edit?saved=1`);
  } catch (err) {
    next(err);
  }
}

async function destroy(req, res, next) {
  try {
    const post = await Post.findById(req.params.id);
    if (!post || !canEditPost(req.user, post)) {
      const err = new Error('Post not found');
      err.status = 404;
      throw err;
    }
    await post.deleteOne();
    res.redirect('/admin/posts?notice=deleted');
  } catch (err) {
    next(err);
  }
}

module.exports = { index, newForm, editForm, create, update, destroy };
