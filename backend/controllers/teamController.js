const { supabase } = require('../config/supabase');
const { notifyWaitlist } = require('./waitlistController');
const { createNotificationHelper } = require('./notificationController');

// Get all teams with creator info
exports.getAllTeams = async (req, res) => {
  try {
    const { member } = req.query;

    // Ako je tražen member filter, vrati timove tog člana
    if (member) {
      const { data: memberTeams } = await supabase
        .from('team_members')
        .select('team_id')
        .eq('user_id', member);

      const { data: createdTeams } = await supabase
        .from('teams')
        .select('id')
        .eq('creator_id', member);

      const teamIds = [
        ...(memberTeams || []).map(t => t.team_id),
        ...(createdTeams || []).map(t => t.id)
      ];

      if (teamIds.length === 0) return res.json([]);

      const { data, error } = await supabase
        .from('teams')
        .select('id, name, sport')
        .in('id', teamIds);

      if (error) return res.status(500).json({ message: 'Server error' });
      return res.json(data || []);
    }

    const { data, error } = await supabase
  .from('teams')
  .select(`
    *,
    creator:users!teams_creator_id_fkey (
      id, username, email, avatar, sport, location
    ),
    team_members (
      user_id
    )
  `)
  .order('created_at', { ascending: false });
    if (error) {
      console.error('❌ Get all teams error:', error);
      return res.status(500).json({ message: 'Server error' });
    }

    res.json(data || []);
  } catch (error) {
    console.error('❌ Get all teams error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get team by ID with creator info
exports.getTeamById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const { data, error } = await supabase
      .from('teams')
      .select(`
        *,
        creator:users!teams_creator_id_fkey (
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
        return res.status(404).json({ message: 'Team not found' });
      }
      console.error('❌ Get team by ID error:', error);
      return res.status(500).json({ message: 'Server error' });
    }

    res.json(data);
  } catch (error) {
    console.error('❌ Get team by ID error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get my teams with creator info
exports.getMyTeams = async (req, res) => {
  try {
    const userId = req.user.id;

    const { data: createdTeams, error: createdError } = await supabase
  .from('teams')
  .select(`
    *,
    creator:users!teams_creator_id_fkey (
      id, username, email, avatar, sport, location
    ),
    team_members (
      user_id
    )
  `)
  .eq('creator_id', userId);

    if (createdError) {
      console.error('❌ Get created teams error:', createdError);
      return res.status(500).json({ message: 'Server error' });
    }

    const { data: memberTeams, error: memberError } = await supabase
  .from('team_members')
  .select(`
    teams:teams!team_members_team_id_fkey (
      *,
      creator:users!teams_creator_id_fkey (
        id, username, email, avatar, sport, location
      ),
      team_members (
        user_id
      )
    )
  `)
  .eq('user_id', userId);

    if (memberError) {
      console.error('❌ Get member teams error:', memberError);
      return res.status(500).json({ message: 'Server error' });
    }

    const memberTeamsData = memberTeams.map(mt => mt.teams).filter(Boolean);
    const allTeams = [...createdTeams, ...memberTeamsData];
    const uniqueTeams = allTeams.filter((team, index, self) =>
      index === self.findIndex((t) => t.id === team.id)
    );

    res.json(uniqueTeams);
  } catch (error) {
    console.error('❌ Get my teams error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const calculateSkillLevel = (rating) => {
  if (rating === null || rating === undefined) return null;
  if (rating <= 20) return 1;
  if (rating <= 40) return 2;
  if (rating <= 60) return 3;
  if (rating <= 80) return 4;
  return 5;
};

const isUserAmateur = (overallRating) => {
  if (overallRating === null || overallRating === undefined) return true;
  const percentage = (overallRating / 3000) * 100;
  return percentage < 60;
};

// Create team
exports.createTeam = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      name, sport, location, city, country, date, time,
      max_players, description, gender_preference,
      min_skill_level, max_skill_level, amateur_only,
      join_as_player, position
    } = req.body;

    const initialPlayerCount = join_as_player ? 1 : 0;

    const { data: team, error: teamError } = await supabase
      .from('teams')
      .insert({
        name, sport, location,
        city: city || 'Zagreb',
        country: country || 'Hrvatska',
        date, time,
        max_players: max_players || 10,
        description: description || '',
        creator_id: userId,
        current_players: initialPlayerCount,
        gender_preference: gender_preference || 'mix',
        min_skill_level: min_skill_level || null,
        max_skill_level: max_skill_level || null,
        amateur_only: amateur_only || false
      })
      .select(`
        *,
        creator:users!teams_creator_id_fkey (
          id, username, email, avatar, sport, location
        )
      `)
      .single();

    if (teamError) {
      console.error('❌ Create team error:', teamError);
      return res.status(500).json({ message: 'Failed to create team', error: teamError.message });
    }

    if (join_as_player) {
      const { error: memberError } = await supabase
        .from('team_members')
        .insert({ team_id: team.id, user_id: userId, position: position || null });

      if (memberError) {
        console.error('❌ Add team member error:', memberError);
      }
    }

    res.status(201).json(team);
  } catch (error) {
    console.error('❌ Create team error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Join team
exports.joinTeam = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { position } = req.body;

    const { data: team, error: teamError } = await supabase
      .from('teams')
      .select('*')
      .eq('id', id)
      .single();

    if (teamError || !team) {
      return res.status(404).json({ message: 'Tim nije pronađen' });
    }

    const { data: user, error: userError } = await supabase
      .from('users')
      .select('gender, rating_overall, skill_level_numeric, is_amateur, has_self_rated, self_rating_attack, self_rating_defense, self_rating_teamwork, self_rating_consistency, username')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return res.status(404).json({ message: 'Korisnik nije pronađen' });
    }

    const { data: sportRating } = await supabase
      .from('sport_ratings')
      .select('skill_level, overall_rating')
      .eq('user_id', userId)
      .eq('sport', team.sport)
      .single();

    let userSkillLevel = sportRating?.skill_level || user.skill_level_numeric;
    if (!userSkillLevel && user.has_self_rated) {
      const avgSelfRating = (user.self_rating_attack + user.self_rating_defense + user.self_rating_teamwork + user.self_rating_consistency) / 4;
      userSkillLevel = calculateSkillLevel(avgSelfRating);
    }

    if (team.gender_preference && team.gender_preference !== 'mix') {
      if (user.gender !== team.gender_preference) {
        const genderMessage = team.gender_preference === 'male'
          ? 'Ovaj tim je samo za muške igrače'
          : 'Ovaj tim je samo za ženske igračice';
        return res.status(400).json({ message: genderMessage });
      }
    }

    if (team.min_skill_level || team.max_skill_level) {
      if (!userSkillLevel && !sportRating && !user.has_self_rated) {
        return res.status(400).json({
          message: `Molimo ocijeni svoje vještine za ${team.sport} prije pridruživanja timu`,
          requiresRating: true,
          sport: team.sport
        });
      }

      if (team.min_skill_level && userSkillLevel < team.min_skill_level) {
        return res.status(400).json({
          message: `Minimalna razina vještine je ${team.min_skill_level} (tvoja razina: ${userSkillLevel})`
        });
      }

      if (team.max_skill_level && userSkillLevel > team.max_skill_level) {
        return res.status(400).json({
          message: `Maksimalna razina vještine je ${team.max_skill_level} (tvoja razina: ${userSkillLevel})`
        });
      }
    }

    if (team.amateur_only) {
      const userIsAmateur = isUserAmateur(user.rating_overall);
      if (!userIsAmateur) {
        return res.status(400).json({ message: 'Ovaj tim je samo za amatere' });
      }
    }

    const { data: existingMember } = await supabase
      .from('team_members')
      .select('*')
      .eq('team_id', id)
      .eq('user_id', userId)
      .single();

    if (existingMember) {
      return res.status(400).json({ message: 'Već ste član ovog tima' });
    }

    if (team.current_players >= team.max_players) {
      return res.status(400).json({ message: 'Tim je popunjen' });
    }

    const { error: addError } = await supabase
      .from('team_members')
      .insert({ team_id: id, user_id: userId, position: position || null });

    if (addError) {
      console.error('❌ Add team member error:', addError);
      return res.status(500).json({ message: 'Pridruživanje timu nije uspjelo' });
    }

    const { data: updatedTeam, error: updateError } = await supabase
      .from('teams')
      .update({ current_players: team.current_players + 1 })
      .eq('id', id)
      .select(`
        *,
        creator:users!teams_creator_id_fkey (
          id, username, email, avatar, sport, location
        )
      `)
      .single();

    if (updateError) {
      console.error('❌ Update team error:', updateError);
      return res.status(500).json({ message: 'Failed to update team' });
    }

    // 🔔 Pošalji notifikaciju kreatoru tima
    try {
      if (team.creator_id !== userId) {
        await createNotificationHelper(
          team.creator_id,
          'team_joined',
          'Novi član tima!',
          `${user.username} se pridružio/la tvom timu "${team.name}"`,
          `/my-teams`,
          { teamId: id },
          userId
        );
      }
    } catch (notifError) {
      console.error('❌ Notification error:', notifError);
    }

    res.json(updatedTeam);
  } catch (error) {
    console.error('❌ Join team error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Leave team
exports.leaveTeam = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const { data: team, error: teamError } = await supabase
      .from('teams')
      .select('*')
      .eq('id', id)
      .single();

    if (teamError || !team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    // Dohvati korisničko ime za notifikaciju
    const { data: user } = await supabase
      .from('users')
      .select('username')
      .eq('id', userId)
      .single();

    const { error: removeError } = await supabase
      .from('team_members')
      .delete()
      .eq('team_id', id)
      .eq('user_id', userId);

    if (removeError) {
      console.error('❌ Leave team error:', removeError);
      return res.status(500).json({ message: 'Failed to leave team' });
    }

    const { data: updatedTeam, error: updateError } = await supabase
      .from('teams')
      .update({ current_players: Math.max(0, team.current_players - 1) })
      .eq('id', id)
      .select(`
        *,
        creator:users!teams_creator_id_fkey (
          id, username, email, avatar, sport, location
        )
      `)
      .single();

    if (updateError) {
      console.error('❌ Update team error:', updateError);
      return res.status(500).json({ message: 'Failed to update team' });
    }

    // 🔔 Pošalji notifikaciju kreatoru tima
    try {
      if (team.creator_id !== userId) {
        await createNotificationHelper(
          team.creator_id,
          'team_joined',
          'Član napustio tim',
          `${user?.username} je napustio/la tvoj tim "${team.name}"`,
          `/my-teams`,
          { teamId: id },
          userId
        );
      }
    } catch (notifError) {
      console.error('❌ Notification error:', notifError);
    }

    try {
      await notifyWaitlist(id);
    } catch (notifyError) {
      console.error('⚠️ Failed to notify waitlist:', notifyError);
    }

    res.json(updatedTeam);
  } catch (error) {
    console.error('❌ Leave team error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update team
exports.updateTeam = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const {
      name, sport, location, city, country, date, time,
      max_players, description, gender_preference,
      min_skill_level, max_skill_level, amateur_only
    } = req.body;

    const { data: team, error: teamError } = await supabase
      .from('teams')
      .select('*')
      .eq('id', id)
      .single();

    if (teamError || !team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    if (team.creator_id !== userId) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const { data: updatedTeam, error: updateError } = await supabase
      .from('teams')
      .update({
        name: name || team.name,
        sport: sport || team.sport,
        location: location || team.location,
        city: city || team.city,
        country: country || team.country,
        date: date || team.date,
        time: time || team.time,
        max_players: max_players || team.max_players,
        description: description || team.description,
        gender_preference: gender_preference !== undefined ? gender_preference : team.gender_preference,
        min_skill_level: min_skill_level !== undefined ? min_skill_level : team.min_skill_level,
        max_skill_level: max_skill_level !== undefined ? max_skill_level : team.max_skill_level,
        amateur_only: amateur_only !== undefined ? amateur_only : team.amateur_only
      })
      .eq('id', id)
      .select(`
        *,
        creator:users!teams_creator_id_fkey (
          id, username, email, avatar, sport, location
        )
      `)
      .single();

    if (updateError) {
      console.error('❌ Update team error:', updateError);
      return res.status(500).json({ message: 'Failed to update team' });
    }

    res.json(updatedTeam);
  } catch (error) {
    console.error('❌ Update team error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete team
exports.deleteTeam = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const { data: team, error: teamError } = await supabase
      .from('teams')
      .select('*')
      .eq('id', id)
      .single();

    if (teamError || !team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    if (team.creator_id !== userId) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const { error: deleteError } = await supabase
      .from('teams')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('❌ Delete team error:', deleteError);
      return res.status(500).json({ message: 'Failed to delete team' });
    }

    res.json({ message: 'Team deleted successfully' });
  } catch (error) {
    console.error('❌ Delete team error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get team messages
exports.getTeamMessages = async (req, res) => {
  try {
    const { id } = req.params;
    
    const { data, error } = await supabase
      .from('team_messages')
      .select('*')
      .eq('team_id', id)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('❌ Get team messages error:', error);
      return res.status(500).json({ message: 'Server error' });
    }

    res.json(data || []);
  } catch (error) {
    console.error('❌ Get team messages error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Send team message
exports.sendTeamMessage = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { text, type, location, imageUrl } = req.body;

    const { data, error } = await supabase
      .from('team_messages')
      .insert({
        team_id: id,
        user_id: userId,
        text,
        type: type || 'text',
        location,
        image_url: imageUrl
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Send team message error:', error);
      return res.status(500).json({ message: 'Failed to send message' });
    }

    res.json(data);
  } catch (error) {
    console.error('❌ Send team message error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get team members
exports.getTeamMembers = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const { data: team, error: teamError } = await supabase
      .from('teams')
      .select('creator_id')
      .eq('id', id)
      .single();

    if (teamError || !team) {
      return res.status(404).json({ message: 'Tim nije pronađen' });
    }

    if (team.creator_id !== userId) {
      return res.status(403).json({ message: 'Samo kreator tima može vidjeti popis članova' });
    }

    const { data: members, error } = await supabase
      .from('team_members')
      .select(`
        id,
        joined_at,
        position,
        user:users!team_members_user_id_fkey (
          id, username, email, avatar, sport, location, gender, rating_overall
        )
      `)
      .eq('team_id', id)
      .order('joined_at', { ascending: true });

    if (error) {
      console.error('❌ Get team members error:', error);
      return res.status(500).json({ message: 'Greška servera' });
    }

    res.json(members || []);
  } catch (error) {
    console.error('❌ Get team members error:', error);
    res.status(500).json({ message: 'Greška servera' });
  }
};

// Get team stats
exports.getTeamStats = async (req, res) => {
  try {
    const { id } = req.params;
    
    const { data: team, error: teamError } = await supabase
      .from('teams')
      .select(`
        *,
        creator:users!teams_creator_id_fkey (
          id, username, email, avatar, sport, location
        )
      `)
      .eq('id', id)
      .single();

    if (teamError || !team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    const { count: memberCount } = await supabase
      .from('team_members')
      .select('*', { count: 'exact', head: true })
      .eq('team_id', id);

    const { count: messageCount } = await supabase
      .from('team_messages')
      .select('*', { count: 'exact', head: true })
      .eq('team_id', id);

    res.json({
      team,
      memberCount: memberCount || 0,
      messageCount: messageCount || 0,
      createdAt: team.created_at
    });
  } catch (error) {
    console.error('❌ Get team stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};