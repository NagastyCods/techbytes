const { Post, Comment, Subscriber } = require('../../models');
const { publishDuePosts } = require('../../utils/scheduling');

async function dashboard(req, res, next) {
  try {
    await publishDuePosts();
    const authorFilter = req.user.role === 'author' ? { author: req.user._id } : {};

    const [
      publishedCount,
      draftCount,
      scheduledCount,
      subscriberCount,
      pendingComments,
      topPosts,
      recentPosts
    ] = await Promise.all([
      Post.countDocuments({ ...authorFilter, status: 'published' }),
      Post.countDocuments({ ...authorFilter, status: 'draft' }),
      Post.countDocuments({ ...authorFilter, status: 'scheduled' }),
      Subscriber.countDocuments({ isActive: true }),
      Comment.countDocuments({ status: 'pending' }),
      Post.find(authorFilter).sort({ views: -1 }).limit(8).populate('author category').lean(),
      Post.find(authorFilter).sort({ updatedAt: -1 }).limit(6).populate('author').lean()
    ]);

    res.render('admin/dashboard', {
      pageTitle: 'Dashboard',
      stats: { publishedCount, draftCount, scheduledCount, subscriberCount, pendingComments },
      topPosts,
      recentPosts
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { dashboard };
