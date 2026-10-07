const { Category } = require('../models');
const env = require('../config/env');
const { formatDate, isoDate } = require('../utils/dates');
const { publishDuePosts } = require('../utils/scheduling');
const {
  canManageTaxonomy,
  canManageComments,
  canManageUsers
} = require('./auth');

/**
 * Runs on every request and fills res.locals — variables every EJS template can use
 * without each controller passing them again (site name, nav categories, helpers).
 */
async function exposeLocals(req, res, next) {
  try {
    await publishDuePosts();
    const categories = await Category.find().sort({ name: 1 }).lean();
    res.locals.siteName = env.siteName;
    res.locals.siteTagline = env.siteTagline;
    res.locals.siteUrl = env.siteUrl;
    res.locals.categories = categories;
    res.locals.currentPath = req.path;
    res.locals.formatDate = formatDate;
    res.locals.isoDate = isoDate;
    res.locals.pageTitle = env.siteName;
    res.locals.metaDescription = env.siteTagline;
    res.locals.ogImage = '';
    res.locals.canonicalUrl = '';
    res.locals.canonicalPath = req.originalUrl.split('?')[0];
    res.locals.robots = 'index,follow';
    res.locals.rssUrl = `${env.siteUrl}/rss.xml`;
    res.locals.newsletterStatus = req.query.newsletter || '';
    res.locals.canManageTaxonomy = canManageTaxonomy(req.user);
    res.locals.canManageComments = canManageComments(req.user);
    res.locals.canManageUsers = canManageUsers(req.user);
    next();
  } catch (err) {
    next(err);
  }
}

module.exports = { exposeLocals };
