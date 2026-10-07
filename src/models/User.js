const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const ROLES = ['admin', 'editor', 'author'];

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: 80
    },
    // Used in /authors/:slug public profile URLs
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true
    },
    // Never store the raw password — only the bcrypt hash
    passwordHash: {
      type: String,
      required: [true, 'Password is required'],
      select: false // excluded from queries unless you .select('+passwordHash')
    },
    role: {
      type: String,
      enum: ROLES,
      default: 'author'
    },
    bio: {
      type: String,
      default: '',
      maxlength: 500
    },
    avatar: {
      type: String, // filename or URL under /uploads
      default: ''
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

userSchema.index({ role: 1 });

// Virtual: set password via user.password = 'plain'; it hashes into passwordHash
userSchema.virtual('password')
  .set(function setPassword(plain) {
    this._plainPassword = plain;
  });

userSchema.pre('validate', async function hashPassword() {
  if (!this._plainPassword) return;
  const saltRounds = 12;
  this.passwordHash = await bcrypt.hash(this._plainPassword, saltRounds);
});

userSchema.methods.comparePassword = async function comparePassword(plain) {
  return bcrypt.compare(plain, this.passwordHash);
};

userSchema.methods.toPublicJSON = function toPublicJSON() {
  return {
    id: this._id,
    name: this.name,
    slug: this.slug,
    bio: this.bio,
    avatar: this.avatar,
    role: this.role
  };
};

module.exports = mongoose.model('User', userSchema);
module.exports.ROLES = ROLES;
