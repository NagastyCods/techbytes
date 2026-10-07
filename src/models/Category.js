const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Category name is required'],
      trim: true,
      maxlength: 60
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    description: {
      type: String,
      default: '',
      maxlength: 300
    },
    // Used for editorial color chips on the homepage (hex, e.g. #0ea5e9)
    accentColor: {
      type: String,
      default: '#2563eb'
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Category', categorySchema);
