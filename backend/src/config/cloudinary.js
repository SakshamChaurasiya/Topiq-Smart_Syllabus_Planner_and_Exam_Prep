const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Test connection on startup (non-blocking)
if (
  process.env.NODE_ENV !== 'test' &&
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
) {
  cloudinary.api.ping()
    .then(() => console.log('✅ Cloudinary connected'))
    .catch((err) => console.warn('⚠️  Cloudinary ping failed:', err.message));
} else if (process.env.NODE_ENV !== 'test') {
  console.warn('⚠️  Cloudinary credentials not configured — feed uploads will fail');
}

module.exports = cloudinary;
