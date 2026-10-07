const { renderArticleHtml } = require('../../utils/markdown');
const { upload, publicUploadPath } = require('../../middleware/upload');

async function preview(req, res, next) {
  try {
    const html = await renderArticleHtml(String(req.body.markdown || ''));
    res.json({ html });
  } catch (err) {
    next(err);
  }
}

function uploadImage(req, res) {
  if (!req.file) {
    return res.status(400).json({ error: 'Choose an image first.' });
  }
  res.json({ url: publicUploadPath(req.file) });
}

module.exports = {
  preview,
  uploadImage,
  imageUploadMiddleware: upload.single('image')
};
