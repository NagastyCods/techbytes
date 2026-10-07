const mongoose = require('mongoose');

const COMMENT_STATUSES = ['pending', 'approved', 'spam'];

const commentSchema = new mongoose.Schema(
  {
    post: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Post',
      required: true,
      index: true
    },
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: 80
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      lowercase: true,
      trim: true
    },
    body: {
      type: String,
      required: [true, 'Comment body is required'],
      maxlength: 2000
    },
    // New comments start as pending; admins approve, mark spam, or delete.
    status: {
      type: String,
      enum: COMMENT_STATUSES,
      default: 'pending',
      index: true
    }
  },
  { timestamps: true }
);

commentSchema.index({ post: 1, status: 1, createdAt: -1 });

module.exports = mongoose.model('Comment', commentSchema);
module.exports.COMMENT_STATUSES = COMMENT_STATUSES;
