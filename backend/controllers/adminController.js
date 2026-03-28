const { supabase } = require('../config/supabase');
const bcrypt = require('bcryptjs');

// Admin email
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;

// Check if user is admin
exports.isAdmin = (email) => {
  return email === ADMIN_EMAIL;
};

// Get admin dashboard stats
exports.getDashboardStats = async (req, res) => {
  try {
    // Get counts
    const [usersResult, teamsResult, tournamentsResult, fieldsResult] = await Promise.all([
      supabase.from('users').select('id', { count: 'exact', head: true }),
      supabase.from('teams').select('id', { count: 'exact', head: true }),
      supabase.from('tournaments').select('id', { count: 'exact', head: true }),
      supabase.from('fields').select('id', { count: 'exact', head: true })
    ]);

    // Get recent registrations (last 7 days)
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const { data: recentUsers } = await supabase
      .from('users')
      .select('id')
      .gte('created_at', weekAgo.toISOString());

    res.json({
      totalUsers: usersResult.count || 0,
      totalTeams: teamsResult.count || 0,
      totalTournaments: tournamentsResult.count || 0,
      totalFields: fieldsResult.count || 0,
      recentRegistrations: recentUsers?.length || 0
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ message: 'Greška pri dohvaćanju statistike' });
  }
};

// Get all users
exports.getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '' } = req.query;
    const offset = (page - 1) * limit;

    let query = supabase
      .from('users')
      .select('id, username, email, first_name, last_name, avatar, sport, city, country, is_verified, created_at, last_active', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (search) {
      query = query.or(`username.ilike.%${search}%,email.ilike.%${search}%,first_name.ilike.%${search}%,last_name.ilike.%${search}%`);
    }

    const { data: users, error, count } = await query;

    if (error) {
      console.error('Get users error:', error);
      return res.status(500).json({ message: 'Greška pri dohvaćanju korisnika' });
    }

    res.json({
      users: users || [],
      total: count || 0,
      page: parseInt(page),
      totalPages: Math.ceil((count || 0) / limit)
    });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ message: 'Greška servera' });
  }
};

// Get single user details
exports.getUserDetails = async (req, res) => {
  try {
    const { userId } = req.params;

    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error || !user) {
      return res.status(404).json({ message: 'Korisnik nije pronađen' });
    }

    // Remove password from response
    delete user.password;
    delete user.refresh_token;

    res.json(user);
  } catch (error) {
    console.error('Get user details error:', error);
    res.status(500).json({ message: 'Greška servera' });
  }
};

// Update user
exports.updateUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const updates = req.body;

    // Prevent updating sensitive fields
    delete updates.password;
    delete updates.refresh_token;
    delete updates.refresh_token_expiry;

    const { data: user, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select('id, username, email, is_verified')
      .single();

    if (error) {
      console.error('Update user error:', error);
      return res.status(500).json({ message: 'Greška pri ažuriranju korisnika' });
    }

    res.json({ message: 'Korisnik ažuriran', user });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ message: 'Greška servera' });
  }
};

// Delete user
exports.deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;

    // Don't allow deleting admin
    const { data: user } = await supabase
      .from('users')
      .select('email')
      .eq('id', userId)
      .single();

    if (user?.email === ADMIN_EMAIL) {
      return res.status(403).json({ message: 'Ne možete obrisati admin račun' });
    }

    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', userId);

    if (error) {
      console.error('Delete user error:', error);
      return res.status(500).json({ message: 'Greška pri brisanju korisnika' });
    }

    res.json({ message: 'Korisnik uspješno obrisan' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Greška servera' });
  }
};

// Verify user manually
exports.verifyUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const { data: user, error } = await supabase
      .from('users')
      .update({ is_verified: true, verification_code: null })
      .eq('id', userId)
      .select('id, email, username')
      .single();

    if (error) {
      console.error('Verify user error:', error);
      return res.status(500).json({ message: 'Greška pri verifikaciji' });
    }

    res.json({ message: 'Korisnik verificiran', user });
  } catch (error) {
    console.error('Verify user error:', error);
    res.status(500).json({ message: 'Greška servera' });
  }
};

// Reset user password
exports.resetUserPassword = async (req, res) => {
  try {
    const { userId } = req.params;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ message: 'Lozinka mora imati najmanje 6 znakova' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const { error } = await supabase
      .from('users')
      .update({ password: hashedPassword })
      .eq('id', userId);

    if (error) {
      console.error('Reset password error:', error);
      return res.status(500).json({ message: 'Greška pri resetiranju lozinke' });
    }

    res.json({ message: 'Lozinka uspješno resetirana' });
  } catch (error) {
    console.error('Reset user password error:', error);
    res.status(500).json({ message: 'Greška servera' });
  }
};

// Get all teams
exports.getAllTeams = async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '' } = req.query;
    const offset = (page - 1) * limit;

    let query = supabase
      .from('teams')
      .select(`
        id, name, sport, location, city, country, date, time,
        max_players, current_players, description, created_at,
        creator:users!teams_creator_id_fkey(id, username, email)
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (search) {
      query = query.or(`name.ilike.%${search}%,sport.ilike.%${search}%,city.ilike.%${search}%`);
    }

    const { data: teams, error, count } = await query;

    if (error) {
      console.error('Get teams error:', error);
      return res.status(500).json({ message: 'Greška pri dohvaćanju timova' });
    }

    res.json({
      teams: teams || [],
      total: count || 0,
      page: parseInt(page),
      totalPages: Math.ceil((count || 0) / limit)
    });
  } catch (error) {
    console.error('Get all teams error:', error);
    res.status(500).json({ message: 'Greška servera' });
  }
};

// Delete team
exports.deleteTeam = async (req, res) => {
  try {
    const { teamId } = req.params;

    const { error } = await supabase
      .from('teams')
      .delete()
      .eq('id', teamId);

    if (error) {
      console.error('Delete team error:', error);
      return res.status(500).json({ message: 'Greška pri brisanju tima' });
    }

    res.json({ message: 'Tim uspješno obrisan' });
  } catch (error) {
    console.error('Delete team error:', error);
    res.status(500).json({ message: 'Greška servera' });
  }
};

// Get all tournaments
exports.getAllTournaments = async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '' } = req.query;
    const offset = (page - 1) * limit;

    let query = supabase
      .from('tournaments')
      .select(`
        id, name, sport, location, city, country, start_date, end_date,
        max_teams, status, entry_fee, prize, created_at,
        creator:users!tournaments_creator_id_fkey(id, username, email)
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (search) {
      query = query.or(`name.ilike.%${search}%,sport.ilike.%${search}%,city.ilike.%${search}%`);
    }

    const { data: tournaments, error, count } = await query;

    if (error) {
      console.error('Get tournaments error:', error);
      return res.status(500).json({ message: 'Greška pri dohvaćanju turnira' });
    }

    res.json({
      tournaments: tournaments || [],
      total: count || 0,
      page: parseInt(page),
      totalPages: Math.ceil((count || 0) / limit)
    });
  } catch (error) {
    console.error('Get all tournaments error:', error);
    res.status(500).json({ message: 'Greška servera' });
  }
};

// Delete tournament
exports.deleteTournament = async (req, res) => {
  try {
    const { tournamentId } = req.params;

    const { error } = await supabase
      .from('tournaments')
      .delete()
      .eq('id', tournamentId);

    if (error) {
      console.error('Delete tournament error:', error);
      return res.status(500).json({ message: 'Greška pri brisanju turnira' });
    }

    res.json({ message: 'Turnir uspješno obrisan' });
  } catch (error) {
    console.error('Delete tournament error:', error);
    res.status(500).json({ message: 'Greška servera' });
  }
};

// Update tournament status
exports.updateTournamentStatus = async (req, res) => {
  try {
    const { tournamentId } = req.params;
    const { status } = req.body;

    const validStatuses = ['upcoming', 'active', 'finished'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Neispravan status' });
    }

    const { data: tournament, error } = await supabase
      .from('tournaments')
      .update({ status })
      .eq('id', tournamentId)
      .select('id, name, status')
      .single();

    if (error) {
      console.error('Update tournament error:', error);
      return res.status(500).json({ message: 'Greška pri ažuriranju turnira' });
    }

    res.json({ message: 'Status turnira ažuriran', tournament });
  } catch (error) {
    console.error('Update tournament status error:', error);
    res.status(500).json({ message: 'Greška servera' });
  }
};

// ── Dodaj ovo na kraj adminController.js (prije module.exports) ───────────────

// Get all fields
exports.getAllFields = async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '' } = req.query;
    const offset = (page - 1) * limit;

    let query = supabase
      .from('fields')
      .select(`
        id, name, sport, city, country, address, price, availability, created_at,
        users!fields_added_by_fkey (id, username)
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (search) {
      query = query.or(`name.ilike.%${search}%,sport.ilike.%${search}%,city.ilike.%${search}%`);
    }

    const { data: fields, error, count } = await query;
    if (error) return res.status(500).json({ message: 'Greška pri dohvaćanju terena' });

    res.json({ fields: fields || [], total: count || 0, page: parseInt(page), totalPages: Math.ceil((count || 0) / limit) });
  } catch (error) {
    res.status(500).json({ message: 'Greška servera' });
  }
};

// Delete field (admin)
exports.adminDeleteField = async (req, res) => {
  try {
    const { fieldId } = req.params;
    const { error } = await supabase.from('fields').delete().eq('id', fieldId);
    if (error) return res.status(500).json({ message: 'Greška pri brisanju terena' });
    res.json({ message: 'Teren uspješno obrisan' });
  } catch (error) {
    res.status(500).json({ message: 'Greška servera' });
  }
};

// Get all studios
// Get all studios
exports.getAllStudios = async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '' } = req.query;
    const offset = (page - 1) * limit;

    let query = supabase
      .from('studios')
      .select(`
        id, name, description, created_at,
        trainer:users!studios_trainer_id_fkey (id, username)
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
    }

    const { data: studios, error, count } = await query;
    if (error) {
      console.error('Get studios error:', error);
      return res.status(500).json({ message: 'Greška pri dohvaćanju studija' });
    }

    res.json({ studios: studios || [], total: count || 0, page: parseInt(page), totalPages: Math.ceil((count || 0) / limit) });
  } catch (error) {
    res.status(500).json({ message: 'Greška servera' });
  }
};

// Delete studio (admin)
exports.adminDeleteStudio = async (req, res) => {
  try {
    const { studioId } = req.params;
    const { error } = await supabase.from('studios').delete().eq('id', studioId);
    if (error) return res.status(500).json({ message: 'Greška pri brisanju studija' });
    res.json({ message: 'Studio uspješno obrisan' });
  } catch (error) {
    res.status(500).json({ message: 'Greška servera' });
  }
};

// Get all groups
exports.getAllGroups = async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '' } = req.query;
    const offset = (page - 1) * limit;

    let query = supabase
      .from('groups')
      .select(`
        id, name, sport, created_at,
        creator:users!groups_creator_id_fkey (id, username)
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (search) {
      query = query.or(`name.ilike.%${search}%,sport.ilike.%${search}%`);
    }

    const { data: groups, error, count } = await query;
    if (error) {
      console.error('Get groups error:', error);
      return res.status(500).json({ message: 'Greška pri dohvaćanju grupa' });
    }

    res.json({ groups: groups || [], total: count || 0, page: parseInt(page), totalPages: Math.ceil((count || 0) / limit) });
  } catch (error) {
    res.status(500).json({ message: 'Greška servera' });
  }
};

// Delete group (admin)
exports.adminDeleteGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { error } = await supabase.from('groups').delete().eq('id', groupId);
    if (error) return res.status(500).json({ message: 'Greška pri brisanju grupe' });
    res.json({ message: 'Grupa uspješno obrisana' });
  } catch (error) {
    res.status(500).json({ message: 'Greška servera' });
  }
};
module.exports = exports;