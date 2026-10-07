const { Tag, Post } = require('../../models');
const { uniqueSlug } = require('../../utils/slug');

async function index(req, res, next) {
  try {
    const tags = await Tag.find().sort({ name: 1 }).lean();
    res.render('admin/taxonomy', {
      pageTitle: 'Tags',
      kind: 'tags',
      heading: 'Tags',
      items: tags,
      notice: req.query.notice || ''
    });
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const name = String(req.body.name || '').trim();
    if (!name) return res.redirect('/admin/tags?notice=Name is required');
    await Tag.create({
      name,
      slug: await uniqueSlug(Tag, name, { fallback: 'tag' })
    });
    res.redirect('/admin/tags?notice=Created');
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const tag = await Tag.findById(req.params.id);
    if (!tag) {
      const err = new Error('Tag not found');
      err.status = 404;
      throw err;
    }
    tag.name = String(req.body.name || '').trim();
    tag.slug = await uniqueSlug(Tag, req.body.slug || tag.name, {
      fallback: 'tag',
      excludeId: tag._id
    });
    await tag.save();
    res.redirect('/admin/tags?notice=Saved');
  } catch (err) {
    next(err);
  }
}

async function destroy(req, res, next) {
  try {
    await Post.updateMany({ tags: req.params.id }, { $pull: { tags: req.params.id } });
    await Tag.deleteOne({ _id: req.params.id });
    res.redirect('/admin/tags?notice=Deleted');
  } catch (err) {
    next(err);
  }
}

module.exports = { index, create, update, destroy };
