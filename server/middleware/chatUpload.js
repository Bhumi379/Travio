const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');

const allowedMimeTypes = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'video/mp4',
  'video/webm',
]);

// Check if Cloudinary is configured
const hasCloudinaryConfig = Boolean(
  process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
);

let storage;

if (hasCloudinaryConfig) {
  // Use Cloudinary storage for production/when configured
  storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
      folder: 'travio/chats',
      resource_type: 'auto',
    },
  });
} else {
  // Fallback to local storage if Cloudinary is not configured
  const fs = require('fs');
  const path = require('path');
  const chatDir = path.join(__dirname, '..', 'uploads', 'chat');
  if (!fs.existsSync(chatDir)) {
    fs.mkdirSync(chatDir, { recursive: true });
  }
  storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, chatDir),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname || '').toLowerCase() || '.bin';
      cb(null, `chat_${Date.now()}_${Math.random().toString(36).slice(2, 9)}${ext}`);
    },
  });
}

const chatUpload = multer({
  storage,
  limits: { fileSize: 12 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (allowedMimeTypes.has(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Unsupported file type for chat'));
    }
  },
});

module.exports = chatUpload;
