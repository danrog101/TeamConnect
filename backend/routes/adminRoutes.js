const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');
const {
  getDashboardStats,
  getAllUsers,
  getUserDetails,
  updateUser,
  deleteUser,
  verifyUser,
  resetUserPassword,
  getAllTeams,
  deleteTeam,
  getAllTournaments,
  deleteTournament,
  updateTournamentStatus
} = require('../controllers/adminController');

// All admin routes require auth + admin check
router.use(auth);
router.use(adminAuth);

// Dashboard
router.get('/stats', getDashboardStats);

// Users management
router.get('/users', getAllUsers);
router.get('/users/:userId', getUserDetails);
router.put('/users/:userId', updateUser);
router.delete('/users/:userId', deleteUser);
router.post('/users/:userId/verify', verifyUser);
router.post('/users/:userId/reset-password', resetUserPassword);

// Teams management
router.get('/teams', getAllTeams);
router.delete('/teams/:teamId', deleteTeam);

// Tournaments management
router.get('/tournaments', getAllTournaments);
router.delete('/tournaments/:tournamentId', deleteTournament);
router.put('/tournaments/:tournamentId/status', updateTournamentStatus);

module.exports = router;
