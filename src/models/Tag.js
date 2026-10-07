const mongoose = require('mongoose');

const tagSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Tag name is required'],
      trim: true,
      maxlength: 40
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Tag', tagSchema);
