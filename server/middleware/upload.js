const multer = require('multer');
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
  params: async (req, file) => {
    // Separate folders for license vs aadhar
    const folder = file.fieldname === 'license' ? 'travio/licenses' : 'travio/aadhars';
    return {
      folder,
      resource_type: 'auto',
      public_id: `${Date.now()}_${file.fieldname}`,
    };
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