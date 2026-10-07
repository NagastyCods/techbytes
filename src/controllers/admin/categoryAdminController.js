const { Category, Post } = require('../../models');
const { uniqueSlug } = require('../../utils/slug');

async function index(req, res, next) {
  try {
    const categories = await Category.find().sort({ name: 1 }).lean();
    res.render('admin/taxonomy', {
      pageTitle: 'Categories',
      kind: 'categories',
      heading: 'Categories',
      items: categories,
      notice: req.query.notice || ''
    });
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const name = String(req.body.name || '').trim();
    if (!name) return res.redirect('/admin/categories?notice=Name is required');
    await Category.create({
      name,
      slug: await uniqueSlug(Category, name, { fallback: 'category' }),
      description: String(req.body.description || '').trim(),
      accentColor: String(req.body.accentColor || '#2563eb')
    });
    res.redirect('/admin/categories?notice=Created');
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      const err = new Error('Category not found');
      err.status = 404;
      throw err;
    }
    category.name = String(req.body.name || '').trim();
    category.description = String(req.body.description || '').trim();
    category.accentColor = String(req.body.accentColor || category.accentColor);
    category.slug = await uniqueSlug(Category, req.body.slug || category.name, {
      fallback: 'category',
      excludeId: category._id
    });
    await category.save();
    res.redirect('/admin/categories?notice=Saved');
  } catch (err) {
    next(err);
  }
}

async function destroy(req, res, next) {
  try {
    const inUse = await Post.exists({ category: req.params.id });
    if (inUse) {
      return res.redirect('/admin/categories?notice=Cannot delete a category that still has posts');
    }
    await Category.deleteOne({ _id: req.params.id });
    res.redirect('/admin/categories?notice=Deleted');
  } catch (err) {
    next(err);
  }
}

module.exports = { index, create, update, destroy };
