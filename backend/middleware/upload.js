const multer = require('multer');
const path = require('path');

// ✅ Memory storage — fajlovi idu direktno u Supabase Storage, ne na disk
const memoryStorage = multer.memoryStorage();

// File type filters
const videoFilter = (req, file, cb) => {
  const allowedTypes = /mp4|mov|avi|mkv|webm/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = file.mimetype.startsWith('video/');
  if (mimetype && extname) return cb(null, true);
  cb(new Error('Samo video formati su dozvoljeni (mp4, mov, avi, mkv, webm)!'));
};

const imageFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = file.mimetype.startsWith('image/');
  if (mimetype && extname) return cb(null, true);
  cb(new Error('Samo image formati su dozvoljeni (jpeg, jpg, png, gif, webp)!'));
};

// Upload middlewares
const uploadVideo = multer({
  storage: memoryStorage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB
  fileFilter: videoFilter
});

const uploadImage = multer({
  storage: memoryStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: imageFilter
});

const uploadFieldImages = multer({
  storage: memoryStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB per image
  fileFilter: imageFilter
});

// ✅ compressImage je sada no-op jer slike idu direktno na Supabase Storage
// Sharp kompresija nije potrebna — Supabase Storage to može riješiti
const compressImage = (req, res, next) => next();

module.exports = {
  uploadVideo,
  uploadImage,
  uploadFieldImages,
  compressImage
};