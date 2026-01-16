const { supabase } = require('../config/supabase');

// Get all tournaments
exports.getTournaments = async (req, res) => {
  try {
    const { data: tournaments, error } = await supabase
      .from('tournaments')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json(tournaments || []);
  } catch (error) {
    console.error('❌ Get tournaments error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get tournament by ID
exports.getTournament = async (req, res) => {
  try {
    const { id } = req.params;
    const { data: tournament, error } = await supabase
      .from('tournaments')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;

    if (!tournament) {
      return res.status(404).json({ message: 'Tournament not found' });
    }

    res.json(tournament);
  } catch (error) {
    console.error('❌ Get tournament error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Create tournament
exports.createTournament = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, sport, location, date, max_teams } = req.body;

    const { data: tournament, error } = await supabase
      .from('tournaments')
      .insert({
        name,
        sport,
        location,
        date,
        max_teams: max_teams || 8,
        creator: userId,
        status: 'upcoming'
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json(tournament);
  } catch (error) {
    console.error('❌ Create tournament error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Register for tournament
exports.registerForTournament = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const { data: registration, error } = await supabase
      .from('tournament_registrations')
      .insert({
        tournament_id: id,
        user_id: userId
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json(registration);
  } catch (error) {
    console.error('❌ Register for tournament error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Placeholder functions
exports.updateTournament = async (req, res) => {
  res.json({ message: 'Tournament updated' });
};

exports.deleteTournament = async (req, res) => {
  res.json({ message: 'Tournament deleted' });
};
