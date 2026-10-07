const path = require('path');
const fs = require('fs');
const multer = require('multer');

/**
 * Local disk uploads (simple for development).
 * Later: swap this storage engine for Cloudinary (multer-storage-cloudinary)
 * and store the returned HTTPS URL on Post.coverImage / User.avatar instead
 * of a /uploads/... path. Render's filesystem is ephemeral, so Cloudinary
 * (or S3) is required in production if you care about images surviving deploys.
 */
const uploadRoot = path.join(__dirname, '..', '..', 'public', 'uploads');

const storage = multer.diskStorage({
  destination(req, file, cb) {
    const folder = path.join(uploadRoot, String(new Date().getFullYear()));
    fs.mkdirSync(folder, { recursive: true });
    cb(null, folder);
  },
  filename(req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    const safe = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, safe);
  }
});

function fileFilter(req, file, cb) {
  const ok = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.mimetype);
  if (!ok) {
    cb(new Error('Only JPEG, PNG, WebP, or GIF images are allowed.'));
    return;
  }
  cb(null, true);
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }
});

function publicUploadPath(file) {
  const year = path.basename(path.dirname(file.path));
  return `/uploads/${year}/${file.filename}`;
}

module.exports = { upload, publicUploadPath, uploadRoot };
