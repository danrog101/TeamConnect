const { supabase } = require('../config/supabase');

// Get all teams with creator info
exports.getAllTeams = async (req, res) => {
  try {
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

    // Get teams where user is creator
    const { data: createdTeams, error: createdError } = await supabase
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
      .eq('creator_id', userId);

    if (createdError) {
      console.error('❌ Get created teams error:', createdError);
      return res.status(500).json({ message: 'Server error' });
    }

    // Get teams where user is member
    const { data: memberTeams, error: memberError } = await supabase
      .from('team_members')
      .select(`
        teams:teams!team_members_team_id_fkey (
          *,
          creator:users!teams_creator_id_fkey (
            id,
            username,
            email,
            avatar,
            sport,
            location
          )
        )
      `)
      .eq('user_id', userId);

    if (memberError) {
      console.error('❌ Get member teams error:', memberError);
      return res.status(500).json({ message: 'Server error' });
    }

    // Extract team objects from member teams
    const memberTeamsData = memberTeams.map(mt => mt.teams).filter(Boolean);

    // Combine and remove duplicates
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

// Helper function to calculate skill level from rating
const calculateSkillLevel = (rating) => {
  if (rating === null || rating === undefined) return null;
  if (rating <= 20) return 1; // Beginner
  if (rating <= 40) return 2; // Intermediate
  if (rating <= 60) return 3; // Advanced
  if (rating <= 80) return 4; // Expert
  return 5; // Pro
};

// Helper function to determine if user is amateur
const isUserAmateur = (overallRating) => {
  // Amateur if no rating or overall rating equivalent to less than 60%
  if (overallRating === null || overallRating === undefined) return true;
  // Convert overall rating (0-3000) to percentage
  const percentage = (overallRating / 3000) * 100;
  return percentage < 60;
};

// Create team
exports.createTeam = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      name,
      sport,
      location,
      city,
      country,
      date,
      time,
      max_players,
      description,
      gender_preference,
      min_skill_level,
      max_skill_level,
      amateur_only
    } = req.body;

    console.log('📝 Creating team for user:', userId);

    // Insert team
    const { data: team, error: teamError } = await supabase
      .from('teams')
      .insert({
        name,
        sport,
        location,
        city: city || 'Zagreb',
        country: country || 'Hrvatska',
        date,
        time,
        max_players: max_players || 10,
        description: description || '',
        creator_id: userId,
        current_players: 1,
        gender_preference: gender_preference || 'mix',
        min_skill_level: min_skill_level || null,
        max_skill_level: max_skill_level || null,
        amateur_only: amateur_only || false
      })
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
      .single();

    if (teamError) {
      console.error('❌ Create team error:', teamError);
      return res.status(500).json({ message: 'Failed to create team', error: teamError.message });
    }

    // Add creator as team member
    const { error: memberError } = await supabase
      .from('team_members')
      .insert({
        team_id: team.id,
        user_id: userId
      });

    if (memberError) {
      console.error('❌ Add team member error:', memberError);
      // Don't fail the request, just log it
    }

    console.log('✅ Team created:', team.id);
    res.status(201).json(team);
  } catch (error) {
    console.error('❌ Create team error:', error);
    console.error('Error details:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Join team
exports.joinTeam = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    console.log('🔵 Join team request:', { userId, teamId: id });

    // Check if team exists
    const { data: team, error: teamError } = await supabase
      .from('teams')
      .select('*')
      .eq('id', id)
      .single();

    if (teamError || !team) {
      console.error('❌ Team not found:', id);
      return res.status(404).json({ message: 'Team not found' });
    }

    // Get user info for validation
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('gender, rating_overall, skill_level_numeric, is_amateur, has_self_rated, self_rating_attack, self_rating_defense, self_rating_teamwork, self_rating_consistency')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Calculate user's skill level if not set
    let userSkillLevel = user.skill_level_numeric;
    if (!userSkillLevel && user.has_self_rated) {
      const avgSelfRating = (user.self_rating_attack + user.self_rating_defense + user.self_rating_teamwork + user.self_rating_consistency) / 4;
      userSkillLevel = calculateSkillLevel(avgSelfRating);
    }

    // Validate gender preference
    if (team.gender_preference && team.gender_preference !== 'mix') {
      if (user.gender !== team.gender_preference) {
        console.log('⚠️ Gender mismatch');
        return res.status(400).json({
          message: `This team is for ${team.gender_preference} players only`
        });
      }
    }

    // Validate skill level
    if (team.min_skill_level || team.max_skill_level) {
      if (!userSkillLevel && !user.has_self_rated) {
        return res.status(400).json({
          message: 'Please complete your self-rating first to join skill-restricted teams'
        });
      }

      if (team.min_skill_level && userSkillLevel < team.min_skill_level) {
        return res.status(400).json({
          message: `Minimum skill level ${team.min_skill_level} required (you have level ${userSkillLevel})`
        });
      }

      if (team.max_skill_level && userSkillLevel > team.max_skill_level) {
        return res.status(400).json({
          message: `Maximum skill level ${team.max_skill_level} allowed (you have level ${userSkillLevel})`
        });
      }
    }

    // Validate amateur only
    if (team.amateur_only) {
      const userIsAmateur = isUserAmateur(user.rating_overall);
      if (!userIsAmateur) {
        return res.status(400).json({
          message: 'This team is for amateur players only'
        });
      }
    }

    // Check if user is already in team
    const { data: existingMember } = await supabase
      .from('team_members')
      .select('*')
      .eq('team_id', id)
      .eq('user_id', userId)
      .single();

    if (existingMember) {
      console.log('⚠️ User already in team');
      return res.status(400).json({ message: 'Already in team' });
    }

    // Check if team is full
    if (team.current_players >= team.max_players) {
      console.log('⚠️ Team is full');
      return res.status(400).json({ message: 'Team is full' });
    }

    // Add user to team
    const { error: addError } = await supabase
      .from('team_members')
      .insert({
        team_id: id,
        user_id: userId
      });

    if (addError) {
      console.error('❌ Add team member error:', addError);
      return res.status(500).json({ message: 'Failed to join team' });
    }

    // Update current_players count
    const { data: updatedTeam, error: updateError } = await supabase
      .from('teams')
      .update({ current_players: team.current_players + 1 })
      .eq('id', id)
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
      .single();

    if (updateError) {
      console.error('❌ Update team error:', updateError);
      return res.status(500).json({ message: 'Failed to update team' });
    }

    console.log('✅ User joined team successfully');
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

    // Check if team exists
    const { data: team, error: teamError } = await supabase
      .from('teams')
      .select('*')
      .eq('id', id)
      .single();

    if (teamError || !team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    // Remove user from team
    const { error: removeError } = await supabase
      .from('team_members')
      .delete()
      .eq('team_id', id)
      .eq('user_id', userId);

    if (removeError) {
      console.error('❌ Leave team error:', removeError);
      return res.status(500).json({ message: 'Failed to leave team' });
    }

    // Update current_players count
    const { data: updatedTeam, error: updateError } = await supabase
      .from('teams')
      .update({ current_players: Math.max(0, team.current_players - 1) })
      .eq('id', id)
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
      .single();

    if (updateError) {
      console.error('❌ Update team error:', updateError);
      return res.status(500).json({ message: 'Failed to update team' });
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
      name,
      sport,
      location,
      city,
      country,
      date,
      time,
      max_players,
      description,
      gender_preference,
      min_skill_level,
      max_skill_level,
      amateur_only
    } = req.body;

    // Check if user is creator
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

    // Update team
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
          id,
          username,
          email,
          avatar,
          sport,
          location
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

    // Check if user is creator
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

    // Delete team (CASCADE will delete team_members)
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

// Get team stats
exports.getTeamStats = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get team info
    const { data: team, error: teamError } = await supabase
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

    if (teamError || !team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    // Get team members count
    const { count: memberCount } = await supabase
      .from('team_members')
      .select('*', { count: 'exact', head: true })
      .eq('team_id', id);

    // Get recent messages count
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