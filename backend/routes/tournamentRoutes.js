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
  unregisterTeam,
  generateBracket,
  updateMatchScore
} = require('../controllers/tournamentController');

// Public routes
router.get('/', getTournaments);
router.get('/:id', getTournament);
router.get('/:id/teams', getRegisteredTeams);

// Protected routes
router.post('/', auth, createTournament);
router.post('/:id/register', auth, registerForTournament);
router.post('/:id/unregister', auth, unregisterTeam);
router.put('/:id', auth, updateTournament);
router.delete('/:id', auth, deleteTournament);
router.delete('/:id/teams/:registrationId', auth, removeTeamFromTournament);

// Bracket routes
router.post('/:id/bracket/generate', auth, generateBracket);
// Dodaj ovu rutu u tournamentRoutes.js (odmah ispod generate rute)

router.post('/:id/bracket/reset', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Provjeri je li korisnik organizator
    const tournament = await supabase
      .from('tournaments')
      .select('*')
      .eq('id', id)
      .single();

    if (!tournament.data) return res.status(404).json({ message: 'Turnir ne postoji' });
    if (tournament.data.created_by !== userId) {
      return res.status(403).json({ message: 'Samo organizator može resetirati bracket' });
    }

    // Reset bracket
    const { error } = await supabase
      .from('tournaments')
      .update({
        bracket: null,
        bracket_generated: false
      })
      .eq('id', id);

    if (error) throw error;

    res.json({ message: 'Bracket uspješno resetiran' });
  } catch (error) {
    console.error('Reset bracket error:', error);
    res.status(500).json({ message: 'Greška pri resetiranju bracketa' });
  }
});
router.put('/:id/bracket/score', auth, updateMatchScore);

// Admin/maintenance routes
router.post('/maintenance/cleanup', auth, cleanupExpired);
router.post('/maintenance/update-statuses', auth, updateTournamentStatuses);

module.exports = router;