const fs = require('fs');
const path = require('path');
const multer = require('multer');

const diseaseImageDir = path.resolve(__dirname, '..', 'uploads', 'disease');
fs.mkdirSync(diseaseImageDir, { recursive: true });

const extensionsByMimeType = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};

const diseaseImageUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, callback) => callback(null, diseaseImageDir),
    filename: (req, file, callback) => {
      const extension = extensionsByMimeType[file.mimetype];
      callback(null, `disease-${Date.now()}-${Math.round(Math.random() * 1e9)}${extension}`);
    },
  }),
  limits: {
    fileSize: 8 * 1024 * 1024,
  },
  fileFilter: (req, file, callback) => {
    if (extensionsByMimeType[file.mimetype]) return callback(null, true);
    return callback(new Error('Only JPEG, PNG, and WEBP image files are allowed.'));
  },
});

module.exports = {
  diseaseImageUpload,
};
