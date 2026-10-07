const express = require('express');
const rateLimit = require('express-rate-limit');
const authController = require('../controllers/admin/authController');
const dashboardController = require('../controllers/admin/dashboardController');
const postAdminController = require('../controllers/admin/postAdminController');
const categoryAdminController = require('../controllers/admin/categoryAdminController');
const tagAdminController = require('../controllers/admin/tagAdminController');
const userAdminController = require('../controllers/admin/userAdminController');
const commentAdminController = require('../controllers/admin/commentAdminController');
const mediaController = require('../controllers/admin/mediaController');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many login attempts. Try again in 15 minutes.'
});

router.get('/login', authController.loginForm);
router.post('/login', loginLimiter, authController.loginValidators, authController.login);
router.post('/logout', requireAuth, authController.logout);

router.use(requireAuth);

router.get('/', dashboardController.dashboard);

router.get('/posts', postAdminController.index);
router.get('/posts/new', postAdminController.newForm);
router.post('/posts', postAdminController.create);
router.get('/posts/:id/edit', postAdminController.editForm);
router.post('/posts/:id', postAdminController.update);
router.post('/posts/:id/delete', postAdminController.destroy);

router.post('/preview', mediaController.preview);
router.post('/uploads', mediaController.imageUploadMiddleware, mediaController.uploadImage);

router.get('/categories', requireRole('admin', 'editor'), categoryAdminController.index);
router.post('/categories', requireRole('admin', 'editor'), categoryAdminController.create);
router.post('/categories/:id', requireRole('admin', 'editor'), categoryAdminController.update);
router.post('/categories/:id/delete', requireRole('admin', 'editor'), categoryAdminController.destroy);

router.get('/tags', requireRole('admin', 'editor'), tagAdminController.index);
router.post('/tags', requireRole('admin', 'editor'), tagAdminController.create);
router.post('/tags/:id', requireRole('admin', 'editor'), tagAdminController.update);
router.post('/tags/:id/delete', requireRole('admin', 'editor'), tagAdminController.destroy);

router.get('/comments', requireRole('admin', 'editor'), commentAdminController.index);
router.post('/comments/:id/status', requireRole('admin', 'editor'), commentAdminController.setStatus);
router.post('/comments/:id/delete', requireRole('admin', 'editor'), commentAdminController.destroy);

router.get('/users', requireRole('admin'), userAdminController.index);
router.post('/users', requireRole('admin'), userAdminController.create);
router.get('/users/:id/edit', requireRole('admin'), userAdminController.editForm);
router.post('/users/:id', requireRole('admin'), userAdminController.update);
router.post('/users/:id/delete', requireRole('admin'), userAdminController.destroy);

module.exports = router;
