const express = require('express');
const homeController = require('../controllers/public/homeController');
const postController = require('../controllers/public/postController');
const categoryController = require('../controllers/public/categoryController');
const tagController = require('../controllers/public/tagController');
const authorController = require('../controllers/public/authorController');
const searchController = require('../controllers/public/searchController');
const newsletterController = require('../controllers/public/newsletterController');
const commentController = require('../controllers/public/commentController');
const feedController = require('../controllers/public/feedController');
const { commentLimiter, newsletterLimiter, searchLimiter } = require('../middleware/rateLimits');
const { publicFeedHeaders } = require('../middleware/cacheHeaders');

const router = express.Router();

router.get('/rss.xml', publicFeedHeaders(600), feedController.rss);
router.get('/sitemap.xml', publicFeedHeaders(3600), feedController.sitemap);
router.get('/robots.txt', publicFeedHeaders(86400), feedController.robots);
router.get('/', homeController.home);
router.post(
  '/newsletter',
  newsletterLimiter,
  newsletterController.subscribeValidators,
  newsletterController.subscribe
);
router.get('/search', searchLimiter, searchController.search);
router.get('/api/search', searchLimiter, searchController.searchApi);
router.get('/article/:slug', postController.show);
router.post(
  '/article/:slug/comments',
  commentLimiter,
  commentController.commentValidators,
  commentController.create
);
router.get('/category/:slug', categoryController.show);
router.get('/tag/:slug', tagController.show);
router.get('/authors/:slug', authorController.show);

module.exports = router;
