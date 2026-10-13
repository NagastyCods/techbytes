const path = require('path');
const fs = require('fs');
const multer = require('multer');

/**
 * Local disk in development. On Vercel the function filesystem is read-only
 * (except /tmp, which is not public), so uploads go to Vercel Blob.
 * Connect a Blob store on the project and Vercel injects BLOB_READ_WRITE_TOKEN.
 */
const onVercel = process.env.VERCEL === '1';
const uploadRoot = path.join(__dirname, '..', '..', 'public', 'uploads');

const diskStorage = multer.diskStorage({
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
  storage: onVercel ? multer.memoryStorage() : diskStorage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }
});

function localPublicPath(file) {
  const year = path.basename(path.dirname(file.path));
  return `/uploads/${year}/${file.filename}`;
}

async function storedImageUrl(file) {
  if (!onVercel) return localPublicPath(file);

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    const err = new Error(
      'Image uploads on Vercel need a Blob store. In the Vercel project open Storage, create a Blob store, and redeploy. You can also paste an image URL.'
    );
    err.status = 503;
    throw err;
  }

  const { put } = require('@vercel/blob');
  const ext = path.extname(file.originalname || '').toLowerCase();
  const safeExt = ['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(ext) ? ext : '';
  const pathname = `uploads/${new Date().getFullYear()}/${Date.now()}-${Math.round(Math.random() * 1e9)}${safeExt}`;
  const blob = await put(pathname, file.buffer, {
    access: 'public',
    contentType: file.mimetype
  });
  return blob.url;
}

module.exports = { upload, storedImageUrl, uploadRoot };
