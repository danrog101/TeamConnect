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
  updateTournamentStatus,
  // ✅ Novo:
  getAllFields,
  adminDeleteField,
  getAllStudios,
  adminDeleteStudio,
  getAllGroups,
  adminDeleteGroup
} = require('../controllers/adminController');

router.use(auth);
router.use(adminAuth);

// Dashboard
router.get('/stats', getDashboardStats);

// Users
router.get('/users', getAllUsers);
router.get('/users/:userId', getUserDetails);
router.put('/users/:userId', updateUser);
router.delete('/users/:userId', deleteUser);
router.post('/users/:userId/verify', verifyUser);
router.post('/users/:userId/reset-password', resetUserPassword);

// Teams
router.get('/teams', getAllTeams);
router.delete('/teams/:teamId', deleteTeam);

// Tournaments
router.get('/tournaments', getAllTournaments);
router.delete('/tournaments/:tournamentId', deleteTournament);
router.put('/tournaments/:tournamentId/status', updateTournamentStatus);

// ✅ Fields
router.get('/fields', getAllFields);
router.delete('/fields/:fieldId', adminDeleteField);

// ✅ Studios
router.get('/studios', getAllStudios);
router.delete('/studios/:studioId', adminDeleteStudio);

// ✅ Groups
router.get('/groups', getAllGroups);
router.delete('/groups/:groupId', adminDeleteGroup);

module.exports = router;