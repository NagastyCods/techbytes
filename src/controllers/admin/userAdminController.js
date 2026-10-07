const { User } = require('../../models');
const { uniqueSlug } = require('../../utils/slug');
const { ROLES } = require('../../models/User');

async function index(req, res, next) {
  try {
    const users = await User.find().sort({ createdAt: -1 }).lean();
    res.render('admin/users', {
      pageTitle: 'Users',
      users,
      roles: ROLES,
      notice: req.query.notice || '',
      editing: null
    });
  } catch (err) {
    next(err);
  }
}

async function editForm(req, res, next) {
  try {
    const [users, editing] = await Promise.all([
      User.find().sort({ createdAt: -1 }).lean(),
      User.findById(req.params.id).lean()
    ]);
    if (!editing) {
      const err = new Error('User not found');
      err.status = 404;
      throw err;
    }
    res.render('admin/users', {
      pageTitle: `Edit ${editing.name}`,
      users,
      roles: ROLES,
      notice: '',
      editing
    });
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const name = String(req.body.name || '').trim();
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');
    if (!name || !email || password.length < 8) {
      return res.redirect('/admin/users?notice=Name, email, and an 8+ character password are required');
    }
    await User.create({
      name,
      email,
      password,
      slug: await uniqueSlug(User, name, { fallback: 'author' }),
      role: ROLES.includes(req.body.role) ? req.body.role : 'author',
      bio: String(req.body.bio || '').trim(),
      avatar: String(req.body.avatar || '').trim()
    });
    res.redirect('/admin/users?notice=Created');
  } catch (err) {
    if (err.code === 11000) {
      return res.redirect('/admin/users?notice=That email is already in use');
    }
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const user = await User.findById(req.params.id).select('+passwordHash');
    if (!user) {
      const err = new Error('User not found');
      err.status = 404;
      throw err;
    }
    user.name = String(req.body.name || '').trim();
    user.email = String(req.body.email || '').trim().toLowerCase();
    user.role = ROLES.includes(req.body.role) ? req.body.role : user.role;
    user.bio = String(req.body.bio || '').trim();
    user.avatar = String(req.body.avatar || '').trim();
    user.isActive = req.body.isActive === 'on';
    user.slug = await uniqueSlug(User, req.body.slug || user.name, {
      fallback: 'author',
      excludeId: user._id
    });
    if (req.body.password) {
      if (String(req.body.password).length < 8) {
        return res.redirect(`/admin/users/${user._id}/edit?notice=Password must be at least 8 characters`);
      }
      user.password = req.body.password;
    }
    await user.save();
    res.redirect('/admin/users?notice=Saved');
  } catch (err) {
    next(err);
  }
}

async function destroy(req, res, next) {
  try {
    if (String(req.params.id) === String(req.user._id)) {
      return res.redirect('/admin/users?notice=You cannot delete your own account');
    }
    const target = await User.findById(req.params.id);
    if (!target) {
      const err = new Error('User not found');
      err.status = 404;
      throw err;
    }
    if (target.role === 'admin') {
      const admins = await User.countDocuments({ role: 'admin', isActive: true });
      if (admins <= 1) {
        return res.redirect('/admin/users?notice=Keep at least one admin');
      }
    }
    await User.deleteOne({ _id: target._id });
    res.redirect('/admin/users?notice=Deleted');
  } catch (err) {
    next(err);
  }
}

module.exports = { index, editForm, create, update, destroy };
