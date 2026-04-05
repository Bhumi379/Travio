const multer = require('multer');
require('../config/cloudinary');

const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;

const fs = require('fs');
const path = require('path');

const allowedMimeTypes = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'application/pdf',
]);

// Check if Cloudinary config exists
const hasCloudinaryConfig = Boolean(
  process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
);

// Local upload folder (fallback)
const localUploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(localUploadDir)) {
  fs.mkdirSync(localUploadDir, { recursive: true });
}

// ✅ Cloudinary storage (FIXED)
const cloudinaryStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: (req, file) =>
      file.fieldname === 'license'
        ? 'travio/licenses'
        : 'travio/aadhars',

    allowed_formats: ['jpg', 'jpeg', 'png', 'pdf'],

    public_id: (req, file) =>
      `${Date.now()}_${file.fieldname}`,
  },
});

// Local storage fallback
const localDiskStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, localUploadDir),
  filename: (_req, file, cb) => {
    const safeExt =
      path.extname(file.originalname || '').toLowerCase() || '.bin';
    cb(null, `${Date.now()}_${file.fieldname}${safeExt}`);
  },
});

// Multer setup
const upload = multer({
  storage: hasCloudinaryConfig ? cloudinaryStorage : localDiskStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (!allowedMimeTypes.has(file.mimetype)) {
      return cb(
        new Error('Invalid file type. Only JPG, PNG, and PDF are allowed.')
      );
    }
    cb(null, true);
  },
});

module.exports = upload;