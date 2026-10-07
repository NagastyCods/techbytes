const mongoose = require('mongoose');

const STATUSES = ['draft', 'scheduled', 'published', 'archived'];

const postSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: 180
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    // Markdown source. Controllers convert this to HTML with `marked` + sanitize-html.
    content: {
      type: String,
      required: [true, 'Content is required']
    },
    excerpt: {
      type: String,
      default: '',
      maxlength: 400
    },
    coverImage: {
      type: String,
      default: ''
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: true
    },
    tags: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tag'
      }
    ],
    status: {
      type: String,
      enum: STATUSES,
      default: 'draft',
      index: true
    },
    // Set when status becomes "published". Used for sorting latest news.
    publishedAt: {
      type: Date,
      default: null,
      index: true
    },
    // When status is "scheduled", a job (or request middleware) publishes at this time.
    scheduledAt: {
      type: Date,
      default: null
    },
    views: {
      type: Number,
      default: 0,
      min: 0
    },
    featured: {
      type: Boolean,
      default: false
    },
    // Cached estimate: ~200 words per minute. Recalculated on save.
    readTimeMinutes: {
      type: Number,
      default: 1,
      min: 1
    },
    allowComments: {
      type: Boolean,
      default: true
    },
    seo: {
      metaTitle: { type: String, default: '', maxlength: 70 },
      metaDescription: { type: String, default: '', maxlength: 160 },
      ogImage: { type: String, default: '' },
      canonicalUrl: { type: String, default: '' }
    }
  },
  { timestamps: true }
);

// Text index powers /search (MongoDB $text). Weight title highest so headlines rank first.
postSchema.index(
  { title: 'text', excerpt: 'text', content: 'text' },
  { weights: { title: 10, excerpt: 5, content: 1 }, name: 'PostTextIndex' }
);

postSchema.index({ category: 1, status: 1, publishedAt: -1 });
postSchema.index({ author: 1, status: 1, publishedAt: -1 });
postSchema.index({ featured: 1, status: 1, publishedAt: -1 });
postSchema.index({ tags: 1, status: 1, publishedAt: -1 });

postSchema.pre('save', function estimateReadTime() {
  const words = (this.content || '').trim().split(/\s+/).filter(Boolean).length;
  this.readTimeMinutes = Math.max(1, Math.ceil(words / 200));
});

module.exports = mongoose.model('Post', postSchema);
module.exports.STATUSES = STATUSES;
