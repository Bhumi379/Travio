const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');

const allowedMimeTypes = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'application/pdf',
]);

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    // Separate folders for license vs aadhar
    const folder = file.fieldname === 'license' ? 'travio/licenses' : 'travio/aadhars';
    return {
      folder,
      resource_type: 'auto',
      // Name file as rideId_fieldname
      public_id: `${Date.now()}_${file.fieldname}`,
    };
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (!allowedMimeTypes.has(file.mimetype)) {
      return cb(new Error('Invalid file type. Only JPG, PNG, and PDF are allowed.'));
    }
    cb(null, true);
  },
});

module.exports = upload;