const { Post } = require('../models');

let lastSweep = 0;

/** Promote scheduled posts whose time has arrived. Runs at most once a minute. */
async function publishDuePosts() {
  const now = Date.now();
  if (now - lastSweep < 60 * 1000) return;
  lastSweep = now;
  const when = new Date();
  await Post.updateMany(
    { status: 'scheduled', scheduledAt: { $lte: when } },
    { $set: { status: 'published', publishedAt: when } }
  );
}

function applyPostStatus(post, status, scheduledAtRaw) {
  post.status = status;
  if (status === 'published') {
    post.publishedAt = post.publishedAt || new Date();
    post.scheduledAt = null;
    return;
  }
  if (status === 'scheduled') {
    const when = scheduledAtRaw ? new Date(scheduledAtRaw) : null;
    if (!when || Number.isNaN(when.getTime())) {
      const err = new Error('Scheduled posts need a date and time.');
      err.status = 400;
      throw err;
    }
    if (when.getTime() <= Date.now()) {
      post.status = 'published';
      post.publishedAt = when;
      post.scheduledAt = null;
      return;
    }
    post.scheduledAt = when;
    post.publishedAt = null;
    return;
  }
  if (status === 'draft' || status === 'archived') {
    post.scheduledAt = null;
  }
}

module.exports = { publishDuePosts, applyPostStatus };
