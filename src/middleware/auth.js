const { User } = require('../models');
const { COOKIE_NAME, verifyUserToken } = require('../utils/jwt');

function redirectToLogin(req, res) {
  const next = encodeURIComponent(req.originalUrl);
  res.redirect(`/admin/login?next=${next}`);
}

/** If a valid cookie exists, attach req.user (does not block guests). */
async function attachUser(req, res, next) {
  try {
    const token = req.cookies?.[COOKIE_NAME];
    if (!token) {
      req.user = null;
      res.locals.currentUser = null;
      return next();
    }
    const payload = verifyUserToken(token);
    const user = await User.findOne({ _id: payload.sub, isActive: true });
    req.user = user || null;
    res.locals.currentUser = user;
    next();
  } catch (err) {
    req.user = null;
    res.locals.currentUser = null;
    next();
  }
}

function requireAuth(req, res, next) {
  if (!req.user) {
    return redirectToLogin(req, res);
  }
  next();
}

/** Example: requireRole('admin', 'editor') */
function requireRole(...roles) {
  return function roleGuard(req, res, next) {
    if (!req.user) {
      return redirectToLogin(req, res);
    }
    if (!roles.includes(req.user.role)) {
      const err = new Error('You do not have permission to do that.');
      err.status = 403;
      return next(err);
    }
    next();
  };
}

function canManageTaxonomy(user) {
  return user && (user.role === 'admin' || user.role === 'editor');
}

function canManageComments(user) {
  return canManageTaxonomy(user);
}

function canManageUsers(user) {
  return user && user.role === 'admin';
}

function canEditPost(user, post) {
  if (!user || !post) return false;
  if (user.role === 'admin' || user.role === 'editor') return true;
  return String(post.author._id || post.author) === String(user._id);
}

module.exports = {
  attachUser,
  requireAuth,
  requireRole,
  canManageTaxonomy,
  canManageComments,
  canManageUsers,
  canEditPost
};
