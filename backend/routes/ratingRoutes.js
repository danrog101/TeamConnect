const express = require('express');
const router = express.Router();
const {
  getLeaderboard,
  getUserRating,
  recalculateRating,
  getAchievements,
  submitSelfRating,
  getSelfRatingStatus,
  ratePlayer,
  getSportRating,
  submitSportRating,
  getAllSportRatings
} = require('../controllers/ratingController');
const auth = require('../middleware/auth');

router.get('/leaderboard', getLeaderboard);
router.get('/user/:userId', getUserRating);
router.post('/recalculate', auth, recalculateRating);
router.get('/achievements', auth, getAchievements);

// Self-rating routes (generic)
router.get('/self-rating/status', auth, getSelfRatingStatus);
router.post('/self-rating', auth, submitSelfRating);

// Sport-specific rating routes
router.get('/sport/:sport', auth, getSportRating);
router.post('/sport', auth, submitSportRating);
router.get('/sports/all', auth, getAllSportRatings);

// Rate another player
router.post('/rate-player', auth, ratePlayer);

module.exports = router;