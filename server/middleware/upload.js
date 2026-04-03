const multer = require('multer');
// `multer-storage-cloudinary` exports CloudinaryStorage as a named export.
// Importing the module directly breaks because CloudinaryStorage is not the module itself.
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');
const fs = require('fs');
const path = require('path');

const allowedMimeTypes = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'application/pdf',
]);

const hasCloudinaryConfig = Boolean(
  process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
);

const localUploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(localUploadDir)) {
  fs.mkdirSync(localUploadDir, { recursive: true });
}

const cloudinaryStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: (req, file) => file.fieldname === 'license' ? 'travio/licenses' : 'travio/aadhars',
    allowed_formats: ['jpg', 'jpeg', 'png', 'pdf'],
    resource_type: 'auto',
    filename: (req, file) => `${Date.now()}_${file.fieldname}${path.extname(file.originalname || '')}`
  }
});

const localDiskStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, localUploadDir),
  filename: (_req, file, cb) => {
    const safeExt = path.extname(file.originalname || '').toLowerCase() || '.bin';
    cb(null, `${Date.now()}_${file.fieldname}${safeExt}`);
  },
});

const upload = multer({
  storage: hasCloudinaryConfig ? cloudinaryStorage : localDiskStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (!allowedMimeTypes.has(file.mimetype)) {
      return cb(new Error('Invalid file type. Only JPG, PNG, and PDF are allowed.'));
    }
    cb(null, true);
  },
});

module.exports = upload;
