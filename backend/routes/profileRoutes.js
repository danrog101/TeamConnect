const express = require('express');
const router = express.Router();
const {
  getProfile,
  updateProfile,
  changePassword,
  uploadAvatar,
  getUserActivity
} = require('../controllers/profileController');
const auth = require('../middleware/auth');
const { updateProfileValidator, userIdValidator } = require('../middleware/validators');

// Get user profile
router.get('/:userId', userIdValidator, getProfile);

// Get user activity
router.get('/:userId/activity', userIdValidator, auth, getUserActivity);

// Update profile
router.put('/', auth, updateProfileValidator, updateProfile);

// Change password
router.post('/password', auth, changePassword);

// Upload avatar
router.post('/avatar', auth, uploadAvatar);

module.exports = router;