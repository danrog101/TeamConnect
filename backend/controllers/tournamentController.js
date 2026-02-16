const { supabase } = require('../config/supabase');
const nodemailer = require('nodemailer');

// Email transporter setup
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Helper function to calculate skill level from rating
const calculateSkillLevel = (rating) => {
  if (rating === null || rating === undefined) return null;
  if (rating <= 20) return 1;
  if (rating <= 40) return 2;
  if (rating <= 60) return 3;
  if (rating <= 80) return 4;
  return 5;
};

// Helper function to determine if user is amateur
const isUserAmateur = (overallRating) => {
  if (overallRating === null || overallRating === undefined) return true;
  const percentage = (overallRating / 3000) * 100;
  return percentage < 60;
};

// Helper function to determine tournament status based on dates
const calculateTournamentStatus = (tournament) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const startDate = new Date(tournament.start_date);
  startDate.setHours(0, 0, 0, 0);

  const endDate = new Date(tournament.end_date);
  endDate.setHours(23, 59, 59, 999);

  if (today > endDate) {
    return 'finished';
  } else if (today >= startDate && today <= endDate) {
    return 'active';
  } else {
    return 'upcoming';
  }
};

// Helper function to send email notification to organizer
const sendOrganizerNotification = async (organizer, tournament, teamName, players) => {
  if (!organizer.email || !process.env.EMAIL_USER) return;

  try {
    const playerList = players.map((p, i) => `${i + 1}. ${p.name}${p.position ? ` (${p.position})` : ''}`).join('\n');

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: organizer.email,
      subject: `🏆 New Team Registered: ${teamName} - ${tournament.name}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2e7d32;">🏆 New Team Registration!</h2>
          <p>A new team has registered for your tournament.</p>

          <div style="background: #f5f5f5; padding: 20px; border-radius: 10px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Tournament: ${tournament.name}</h3>
            <p><strong>Team Name:</strong> ${teamName}</p>
            <p><strong>Players:</strong></p>
            <pre style="background: white; padding: 10px; border-radius: 5px;">${playerList}</pre>
          </div>

          <p style="color: #666;">Log in to TeamConnect to view all registered teams.</p>
        </div>
      `
    });
    console.log('✅ Organizer notification sent');
  } catch (error) {
    console.error('❌ Failed to send organizer notification:', error);
  }
};

// Get all tournaments with creator info, team count, and correct status
exports.getTournaments = async (req, res) => {
  try {
    const { data: tournaments, error } = await supabase
      .from('tournaments')
      .select(`
        *,
        creator:users!tournaments_creator_id_fkey (
          id,
          username,
          email,
          avatar,
          sport,
          location
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Get tournaments error:', error);
      return res.status(500).json({ message: 'Server error' });
    }

    const tournamentsWithDetails = await Promise.all(
      (tournaments || []).map(async (tournament) => {
        // Get registered teams count and details
        const { data: registrations, count } = await supabase
          .from('tournament_registrations')
          .select('id, team_name, players, status, is_waitlist, registered_at', { count: 'exact' })
          .eq('tournament_id', tournament.id)
          .eq('is_waitlist', false);

        // Get waitlist count
        const { count: waitlistCount } = await supabase
          .from('tournament_registrations')
          .select('*', { count: 'exact', head: true })
          .eq('tournament_id', tournament.id)
          .eq('is_waitlist', true);

        // Calculate correct status based on dates
        const calculatedStatus = calculateTournamentStatus(tournament);

        // Update status in DB if it changed
        if (calculatedStatus !== tournament.status) {
          await supabase
            .from('tournaments')
            .update({ status: calculatedStatus })
            .eq('id', tournament.id);
        }

        return {
          ...tournament,
          status: calculatedStatus,
          registered_teams: count || 0,
          registered_teams_list: registrations || [],
          waitlist_count: waitlistCount || 0
        };
      })
    );

    res.json(tournamentsWithDetails);
  } catch (error) {
    console.error('❌ Get tournaments error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get tournament by ID with full details
exports.getTournament = async (req, res) => {
  try {
    const { id } = req.params;

    const { data: tournament, error } = await supabase
      .from('tournaments')
      .select(`
        *,
        creator:users!tournaments_creator_id_fkey (
          id,
          username,
          email,
          avatar,
          sport,
          location
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ message: 'Tournament not found' });
      }
      console.error('❌ Get tournament error:', error);
      return res.status(500).json({ message: 'Server error' });
    }

    // Get registered teams
  // ✅ NOVO:
const { data: registrations } = await supabase
  .from('tournament_registrations')
  .select('id, team_name, players, status, is_waitlist, registered_at')
  .eq('tournament_id', tournament.id)
  .eq('is_waitlist', false);

const count = registrations?.length || 0;
    const registeredTeams = registrations?.filter(r => !r.is_waitlist) || [];
    const waitlist = registrations?.filter(r => r.is_waitlist) || [];

    // Calculate correct status
    const calculatedStatus = calculateTournamentStatus(tournament);

    res.json({
      ...tournament,
      status: calculatedStatus,
      registered_teams: registeredTeams.length,
      registered_teams_list: registeredTeams,
      waitlist,
      waitlist_count: waitlist.length
    });
  } catch (error) {
    console.error('❌ Get tournament error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Create tournament
exports.createTournament = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      name,
      sport,
      location,
      city,
      country,
      startDate,
      endDate,
      maxTeams,
      customMaxTeams,
      minPlayersPerTeam,
      maxPlayersPerTeam,
      teamSize,
      format,
      entryFee,
      prize,
      description,
      gender_category,
      gender_preference,
      min_skill_level,
      max_skill_level,
      amateur_only
    } = req.body;

    console.log('📝 Creating tournament for user:', userId);

    const finalMaxTeams = customMaxTeams || maxTeams || 8;

    const { data: tournament, error } = await supabase
      .from('tournaments')
      .insert({
        name,
        sport,
        location,
        city: city || 'Zagreb',
        country: country || 'Hrvatska',
        start_date: startDate,
        end_date: endDate,
        max_teams: parseInt(finalMaxTeams),
        min_players_per_team: parseInt(minPlayersPerTeam) || 5,
        max_players_per_team: parseInt(maxPlayersPerTeam) || 7,
        team_size: parseInt(teamSize) || parseInt(minPlayersPerTeam) || 5,
        format: format || 'knockout',
        entry_fee: parseFloat(entryFee) || 0,
        prize: prize || null,
        description: description || '',
        creator_id: userId,
        status: 'upcoming',
        gender_category: gender_category || 'mix',
        gender_preference: gender_preference || 'mix',
        min_skill_level: min_skill_level || null,
        max_skill_level: max_skill_level || null,
        amateur_only: amateur_only || false
      })
      .select(`
        *,
        creator:users!tournaments_creator_id_fkey (
          id,
          username,
          email,
          avatar,
          sport,
          location
        )
      `)
      .single();

    if (error) {
      console.error('❌ Create tournament error:', error);
      return res.status(500).json({
        message: 'Failed to create tournament',
        error: error.message
      });
    }

    console.log('✅ Tournament created:', tournament.id);

    res.status(201).json({
      ...tournament,
      registered_teams: 0,
      registered_teams_list: [],
      waitlist_count: 0
    });
  } catch (error) {
    console.error('❌ Create tournament error:', error);
    res.status(500).json({
      message: 'Server error',
      error: error.message
    });
  }
};

// Register for tournament (allows multiple teams from same user)
// Register for tournament (allows multiple teams from same user)
exports.registerForTournament = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { teamName, players } = req.body;

    console.log('📝 Registering team for tournament:', {
      tournamentId: id,
      teamName,
      userId,
      playersCount: players?.length
    });

    // Check if tournament exists
    const { data: tournament, error: tournamentError } = await supabase
      .from('tournaments')
      .select(`
        *,
        creator:users!tournaments_creator_id_fkey (
          id,
          username,
          email
        )
      `)
      .eq('id', id)
      .single();

    if (tournamentError || !tournament) {
      return res.status(404).json({ message: 'Tournament not found' });
    }

    // Check tournament status
    const currentStatus = calculateTournamentStatus(tournament);
    if (currentStatus === 'finished') {
      return res.status(400).json({ message: 'Tournament has already finished' });
    }

    // Check if team name already exists in this tournament
    const { data: existingTeam } = await supabase
      .from('tournament_registrations')
      .select('id')
      .eq('tournament_id', id)
      .eq('team_name', teamName)
      .single();

    if (existingTeam) {
      return res.status(400).json({ message: 'A team with this name is already registered' });
    }

    // ✅ FIXED: Properly count registered teams
    const { data: registeredTeams, error: countError } = await supabase
      .from('tournament_registrations')
      .select('id')
      .eq('tournament_id', id)
      .eq('is_waitlist', false);

    if (countError) {
      console.error('❌ Count error:', countError);
      return res.status(500).json({ message: 'Failed to count registered teams' });
    }

    const registeredCount = registeredTeams?.length || 0;
    const isFull = registeredCount >= tournament.max_teams;

    console.log('📊 Tournament capacity:', {
      registered: registeredCount,
      max: tournament.max_teams,
      isFull
    });

    // Validate players count
    const minPlayers = tournament.min_players_per_team || 5;
    const maxPlayers = tournament.max_players_per_team || 7;

    if (!players || players.length < minPlayers) {
      return res.status(400).json({
        message: `Minimum ${minPlayers} players required`
      });
    }

    if (players.length > maxPlayers) {
      return res.status(400).json({
        message: `Maximum ${maxPlayers} players allowed`
      });
    }

    // Format players with positions
    const formattedPlayers = players.map(p => ({
      name: typeof p === 'string' ? p : p.name,
      position: typeof p === 'string' ? '' : (p.position || '')
    }));

    // Register team (on waitlist if tournament is full)
    const { data: registration, error: regError } = await supabase
      .from('tournament_registrations')
      .insert({
        tournament_id: id,
        user_id: userId,
        team_name: teamName,
        players: formattedPlayers,
        status: isFull ? 'waitlist' : 'registered',
        is_waitlist: isFull
      })
      .select()
      .single();

    if (regError) {
      console.error('❌ Registration error:', regError);
      return res.status(500).json({
        message: 'Failed to register team',
        error: regError.message
      });
    }

    // Send email notification to organizer
    if (tournament.creator && !isFull) {
      await sendOrganizerNotification(
        tournament.creator,
        tournament,
        teamName,
        formattedPlayers
      );
    }

    console.log('✅ Team registered successfully', isFull ? '(on waitlist)' : '');
    res.status(201).json({
      ...registration,
      message: isFull
        ? 'Tournament is full. You have been added to the waiting list.'
        : 'Team registered successfully!'
    });
  } catch (error) {
    console.error('❌ Register for tournament error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get registered teams for a tournament
exports.getRegisteredTeams = async (req, res) => {
  try {
    const { id } = req.params;

    const { data: registrations, error } = await supabase
      .from('tournament_registrations')
      .select(`
        *,
        user:users!tournament_registrations_user_id_fkey (
          id,
          username,
          avatar,
          email
        )
      `)
      .eq('tournament_id', id)
      .order('registered_at', { ascending: true });

    if (error) {
      console.error('❌ Get registered teams error:', error);
      return res.status(500).json({ message: 'Server error' });
    }

    const teams = registrations?.filter(r => !r.is_waitlist) || [];
    const waitlist = registrations?.filter(r => r.is_waitlist) || [];

    res.json({
      teams,
      waitlist,
      total_registered: teams.length,
      total_waitlist: waitlist.length
    });
  } catch (error) {
    console.error('❌ Get registered teams error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Remove team from tournament (by team owner or tournament organizer)
exports.removeTeamFromTournament = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id, registrationId } = req.params;

    // Get registration
    const { data: registration, error: regError } = await supabase
      .from('tournament_registrations')
      .select('*')
      .eq('id', registrationId)
      .single();

    if (regError || !registration) {
      return res.status(404).json({ message: 'Registration not found' });
    }

    // Get tournament
    const { data: tournament } = await supabase
      .from('tournaments')
      .select('creator_id')
      .eq('id', id)
      .single();

    // Check authorization (team owner or tournament organizer)
    if (registration.user_id !== userId && tournament?.creator_id !== userId) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const wasRegistered = !registration.is_waitlist;

    // Delete registration
    const { error: deleteError } = await supabase
      .from('tournament_registrations')
      .delete()
      .eq('id', registrationId);

    if (deleteError) {
      return res.status(500).json({ message: 'Failed to remove team' });
    }

    // If removed team was registered (not waitlist), promote first waitlist team
    if (wasRegistered) {
      const { data: firstWaitlist } = await supabase
        .from('tournament_registrations')
        .select('id')
        .eq('tournament_id', id)
        .eq('is_waitlist', true)
        .order('registered_at', { ascending: true })
        .limit(1)
        .single();

      if (firstWaitlist) {
        await supabase
          .from('tournament_registrations')
          .update({ is_waitlist: false, status: 'registered' })
          .eq('id', firstWaitlist.id);
      }
    }

    res.json({ message: 'Team removed successfully' });
  } catch (error) {
    console.error('❌ Remove team error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update tournament
exports.updateTournament = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const updates = req.body;

    const { data: tournament } = await supabase
      .from('tournaments')
      .select('*')
      .eq('id', id)
      .single();

    if (!tournament) {
      return res.status(404).json({ message: 'Tournament not found' });
    }

    if (tournament.creator_id !== userId) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const { data: updated, error } = await supabase
      .from('tournaments')
      .update({
        name: updates.name || tournament.name,
        sport: updates.sport || tournament.sport,
        location: updates.location || tournament.location,
        city: updates.city || tournament.city,
        country: updates.country || tournament.country,
        start_date: updates.startDate || tournament.start_date,
        end_date: updates.endDate || tournament.end_date,
        max_teams: updates.maxTeams || tournament.max_teams,
        min_players_per_team: updates.minPlayersPerTeam || tournament.min_players_per_team,
        max_players_per_team: updates.maxPlayersPerTeam || tournament.max_players_per_team,
        format: updates.format || tournament.format,
        entry_fee: updates.entryFee !== undefined ? updates.entryFee : tournament.entry_fee,
        prize: updates.prize || tournament.prize,
        description: updates.description || tournament.description,
        status: updates.status || tournament.status,
        gender_category: updates.gender_category || tournament.gender_category,
        gender_preference: updates.gender_preference || tournament.gender_preference,
        min_skill_level: updates.min_skill_level !== undefined ? updates.min_skill_level : tournament.min_skill_level,
        max_skill_level: updates.max_skill_level !== undefined ? updates.max_skill_level : tournament.max_skill_level,
        amateur_only: updates.amateur_only !== undefined ? updates.amateur_only : tournament.amateur_only,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select(`
        *,
        creator:users!tournaments_creator_id_fkey (
          id,
          username,
          email,
          avatar
        )
      `)
      .single();

    if (error) {
      return res.status(500).json({ message: 'Failed to update tournament' });
    }

    // Get registration counts
    const { count } = await supabase
      .from('tournament_registrations')
      .select('*', { count: 'exact', head: true })
      .eq('tournament_id', id)
      .eq('is_waitlist', false);

    res.json({
      ...updated,
      registered_teams: count || 0
    });
  } catch (error) {
    console.error('❌ Update tournament error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete tournament
exports.deleteTournament = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const { data: tournament } = await supabase
      .from('tournaments')
      .select('creator_id')
      .eq('id', id)
      .single();

    if (!tournament) {
      return res.status(404).json({ message: 'Tournament not found' });
    }

    if (tournament.creator_id !== userId) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Delete tournament (cascade will delete registrations)
    const { error } = await supabase
      .from('tournaments')
      .delete()
      .eq('id', id);

    if (error) {
      return res.status(500).json({ message: 'Failed to delete tournament' });
    }

    res.json({ message: 'Tournament deleted successfully' });
  } catch (error) {
    console.error('❌ Delete tournament error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Cleanup expired tournaments and fields (call this periodically)
exports.cleanupExpired = async (req, res) => {
  try {
    const daysAfterExpiry = 30; // Keep finished tournaments for 30 days
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysAfterExpiry);

    // Delete old finished tournaments
    const { data: deletedTournaments, error: tournamentError } = await supabase
      .from('tournaments')
      .delete()
      .lt('end_date', cutoffDate.toISOString().split('T')[0])
      .eq('status', 'finished')
      .select('id, name');

    if (tournamentError) {
      console.error('❌ Cleanup tournaments error:', tournamentError);
    }

    // Delete old teams (past their date)
    const { data: deletedTeams, error: teamsError } = await supabase
      .from('teams')
      .delete()
      .lt('date', cutoffDate.toISOString().split('T')[0])
      .select('id, name');

    if (teamsError) {
      console.error('❌ Cleanup teams error:', teamsError);
    }

    // Delete old field reservations
    const { data: deletedFields, error: fieldsError } = await supabase
      .from('fields')
      .delete()
      .lt('reservation_date', cutoffDate.toISOString().split('T')[0])
      .select('id, name');

    if (fieldsError) {
      console.error('❌ Cleanup fields error:', fieldsError);
    }

    console.log('✅ Cleanup completed:', {
      tournaments: deletedTournaments?.length || 0,
      teams: deletedTeams?.length || 0,
      fields: deletedFields?.length || 0
    });

    res.json({
      message: 'Cleanup completed',
      deleted: {
        tournaments: deletedTournaments?.length || 0,
        teams: deletedTeams?.length || 0,
        fields: deletedFields?.length || 0
      }
    });
  } catch (error) {
    console.error('❌ Cleanup error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update tournament statuses (call this periodically or on each request)
exports.updateTournamentStatuses = async (req, res) => {
  try {
    const { data: tournaments, error } = await supabase
      .from('tournaments')
      .select('id, start_date, end_date, status');

    if (error) {
      return res.status(500).json({ message: 'Server error' });
    }

    let updated = 0;
    for (const tournament of tournaments || []) {
      const newStatus = calculateTournamentStatus(tournament);
      if (newStatus !== tournament.status) {
        await supabase
          .from('tournaments')
          .update({ status: newStatus })
          .eq('id', tournament.id);
        updated++;
      }
    }

    res.json({ message: `Updated ${updated} tournament statuses` });
  } catch (error) {
    console.error('❌ Update statuses error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
