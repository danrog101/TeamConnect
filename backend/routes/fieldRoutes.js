const express = require('express');
const router = express.Router();
const {
  getFields,
  getField,
  createField,
  addReview,
  deleteField
} = require('../controllers/fieldController');
const auth = require('../middleware/auth');
const { uploadFieldImages, compressImage } = require('../middleware/upload');

// Public routes
router.get('/', getFields);
router.get('/:fieldId', getField);

// Protected routes
router.post('/',
  auth,
  uploadFieldImages.array('images', 5),
  compressImage,
  createField
);
router.post('/:fieldId/review', auth, addReview);
router.delete('/:fieldId', auth, deleteField);

module.exports = router;