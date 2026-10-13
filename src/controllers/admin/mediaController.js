const { renderArticleHtml } = require('../../utils/markdown');
const { upload, storedImageUrl } = require('../../middleware/upload');

async function preview(req, res, next) {
  try {
    const html = await renderArticleHtml(String(req.body.markdown || ''));
    res.json({ html });
  } catch (err) {
    next(err);
  }
}

async function uploadImage(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Choose an image first.' });
    }
    const url = await storedImageUrl(req.file);
    res.json({ url });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  preview,
  uploadImage,
  imageUploadMiddleware: upload.single('image')
};
