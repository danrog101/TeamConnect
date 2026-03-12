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
  updateTournamentStatuses,
  unregisterTeam  // ✅ DODAJ OVO
} = require('../controllers/tournamentController');

// Public routes
router.get('/', getTournaments);
router.get('/:id', getTournament);
router.get('/:id/teams', getRegisteredTeams);

// Protected routes
router.post('/', auth, createTournament);
router.post('/:id/register', auth, registerForTournament);
router.post('/:id/unregister', auth, unregisterTeam);  // ✅ DODAJ OVO
router.put('/:id', auth, updateTournament);
router.delete('/:id', auth, deleteTournament);
router.delete('/:id/teams/:registrationId', auth, removeTeamFromTournament);

// Admin/maintenance routes
router.post('/maintenance/cleanup', auth, cleanupExpired);
router.post('/maintenance/update-statuses', auth, updateTournamentStatuses);
router.post('/:id/bracket/generate', auth, tournamentController.generateBracket);
router.put('/:id/bracket/score', auth, tournamentController.updateMatchScore); 
module.exports = router;