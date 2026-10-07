const { Comment } = require('../../models');
const { getPagination, buildPager } = require('../../utils/pagination');
const { COMMENT_STATUSES } = require('../../models/Comment');

async function index(req, res, next) {
  try {
    const status = String(req.query.status || 'pending');
    const filter = COMMENT_STATUSES.includes(status) ? { status } : {};
    const { page, limit, skip } = getPagination(req.query, { limit: 20 });
    const [comments, total] = await Promise.all([
      Comment.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).populate('post', 'title slug').lean(),
      Comment.countDocuments(filter)
    ]);

    res.render('admin/comments', {
      pageTitle: 'Comments',
      comments,
      status: COMMENT_STATUSES.includes(status) ? status : 'all',
      statuses: COMMENT_STATUSES,
      notice: req.query.notice || '',
      pager: buildPager({
        page,
        limit,
        total,
        path: `/admin/comments${filter.status ? `?status=${filter.status}` : ''}`
      })
    });
  } catch (err) {
    next(err);
  }
}

async function setStatus(req, res, next) {
  try {
    const status = String(req.body.status || '');
    if (!COMMENT_STATUSES.includes(status)) {
      return res.redirect('/admin/comments?notice=Invalid status');
    }
    await Comment.updateOne({ _id: req.params.id }, { $set: { status } });
    res.redirect(`/admin/comments?status=${status}&notice=Updated`);
  } catch (err) {
    next(err);
  }
}

async function destroy(req, res, next) {
  try {
    await Comment.deleteOne({ _id: req.params.id });
    res.redirect('/admin/comments?notice=Deleted');
  } catch (err) {
    next(err);
  }
}

module.exports = { index, setStatus, destroy };
