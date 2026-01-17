const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  getTournaments,
  getTournament,
  createTournament,
  registerForTournament,
  updateTournament,
  deleteTournament
} = require('../controllers/tournamentController');

// Public routes
router.get('/', getTournaments);
router.get('/:id', getTournament);

// Protected routes
router.post('/', auth, createTournament);
router.post('/:id/register', auth, registerForTournament);
router.put('/:id', auth, updateTournament);
router.delete('/:id', auth, deleteTournament);

module.exports = router;