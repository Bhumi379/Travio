const multer = require('multer');
// v1.x exports a factory: (opts) => new CloudinaryStorage(opts), not a named class export.
require('../config/cloudinary');
const cloudinaryPkg = require('cloudinary');
const createCloudinaryStorage = require('multer-storage-cloudinary');
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

const cloudinaryStorage = createCloudinaryStorage({
  cloudinary: cloudinaryPkg,
  folder: (req, file, cb) => {
    cb(
      null,
      file.fieldname === 'license' ? 'travio/licenses' : 'travio/aadhars'
    );
  },
  allowedFormats: ['jpg', 'jpeg', 'png', 'pdf'],
  filename: (req, file, cb) => {
    cb(
      null,
      `${Date.now()}_${file.fieldname}${path.extname(file.originalname || '')}`
    );
  },
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
