const path = require('path');
const fs = require('fs');
const multer = require('multer');

const uploadsRoot = path.resolve(__dirname, '..', 'uploads');
const cropImageDir = path.join(uploadsRoot, 'crops');
const voiceDir = path.join(uploadsRoot, 'voice');

[cropImageDir, voiceDir].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

const createStorage = (folder) =>
  multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, folder);
    },
    filename: (req, file, cb) => {
      const extension = path.extname(file.originalname || '');
      cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${extension}`);
    },
  });

const createUploader = (folder, fileFilter) =>
  multer({
    storage: createStorage(folder),
    limits: {
      fileSize: 8 * 1024 * 1024,
    },
    fileFilter,
  });

const imageFileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) return cb(null, true);
  return cb(new Error('Only image files are allowed.'));
};

const audioFileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('audio/')) return cb(null, true);
  return cb(new Error('Only audio files are allowed.'));
};

const cropImageUpload = createUploader(cropImageDir, imageFileFilter);
const voiceUpload = createUploader(voiceDir, audioFileFilter);

module.exports = {
  cropImageUpload,
  voiceUpload,
};
