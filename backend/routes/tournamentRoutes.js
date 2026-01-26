const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  getTournaments,
  getTournament,
  createTournament,
  registerForTournament,
  updateTournament,
  deleteTournament,
  getRegisteredTeams,
  removeTeamFromTournament,
  cleanupExpired,
  updateTournamentStatuses
} = require('../controllers/tournamentController');

// Public routes
router.get('/', getTournaments);
router.get('/:id', getTournament);
router.get('/:id/teams', getRegisteredTeams);

// Protected routes
router.post('/', auth, createTournament);
router.post('/:id/register', auth, registerForTournament);
router.put('/:id', auth, updateTournament);
router.delete('/:id', auth, deleteTournament);
router.delete('/:id/teams/:registrationId', auth, removeTeamFromTournament);

// Admin/maintenance routes
router.post('/maintenance/cleanup', auth, cleanupExpired);
router.post('/maintenance/update-statuses', auth, updateTournamentStatuses);

module.exports = router;
