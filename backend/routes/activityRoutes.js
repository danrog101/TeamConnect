const express = require('express');
const router = express.Router();
const {
  getActivityFeed,
  getUserActivities,
  createActivity,
  deleteActivity
} = require('../controllers/activityController');
const auth = require('../middleware/auth');

// Optional auth middleware - allows both authenticated and unauthenticated requests
const optionalAuth = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return next();
  }
  // If token exists, use regular auth
  return auth(req, res, next);
};

router.get('/feed', auth, getActivityFeed);
router.get('/user/:userId', optionalAuth, getUserActivities);
router.post('/', auth, createActivity);
router.delete('/:activityId', auth, deleteActivity);

module.exports = router;