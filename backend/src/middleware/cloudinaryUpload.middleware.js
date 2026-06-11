const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');

// Allowed MIME types for feed attachments
const ALLOWED_TYPES = [
  'image/jpeg', 'image/jpg', 'image/png', 'image/webp',
  'application/pdf',
];

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    const isPdf = file.mimetype === 'application/pdf';
    return {
      folder: 'topiq/feed',
      resource_type: isPdf ? 'raw' : 'image',
      // Keep original filename without extension — Cloudinary adds it
      public_id: `${Date.now()}-${file.originalname.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9-_]/g, '_')}`,
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'pdf'],
    };
  },
});

const fileFilter = (req, file, cb) => {
  if (ALLOWED_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPG, PNG, WEBP, and PDF allowed.'), false);
  }
};

const cloudinaryUpload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB — matches existing limit
});

module.exports = cloudinaryUpload;
