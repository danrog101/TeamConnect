const { supabase } = require('../config/supabase');

// Get all matches
exports.getMatches = async (req, res) => {
  try {
    const { status, sport, upcoming } = req.query;
    
    let query = supabase
      .from('matches')
      .select(`
        *,
        users!matches_created_by_fkey (username, avatar)
      `);
    
    if (status) query = query.eq('status', status);
    if (sport) query = query.eq('sport', sport);
    
    // Filter only upcoming matches
    if (upcoming === 'true') {
      query = query
        .gte('scheduled_date', new Date().toISOString())
        .in('status', ['scheduled', 'live']);
    }

    const { data: matches, error } = await query.order('scheduled_date', { ascending: true });

    if (error) {
      console.error('Get matches error:', error);
      return res.status(500).json({ message: 'Server error' });
    }

    res.json(matches || []);
  } catch (error) {
    console.error('Get matches error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get single match
exports.getMatch = async (req, res) => {
  try {
    const { matchId } = req.params;

    const { data: match, error } = await supabase
      .from('matches')
      .select(`
        *,
        users!matches_created_by_fkey (username, avatar),
        match_participants (
          user_id,
          team_side,
          users (id, username, avatar)
        ),
        match_events (
          id,
          type,
          team_side,
          player_name,
          minute,
          description,
          created_at
        ),
        match_commentary (
          id,
          minute,
          text,
          created_at
        ),
        match_statistics (
          id,
          team_side,
          possession,
          shots,
          shots_on_target,
          corners,
          fouls,
          yellow_cards,
          red_cards
        )
      `)
      .eq('id', matchId)
      .single();

    if (error || !match) {
      console.error('Get match error:', error);
      return res.status(404).json({ message: 'Match not found' });
    }

    res.json(match);
  } catch (error) {
    console.error('Get match error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Create match
exports.createMatch = async (req, res) => {
  try {
    const userId = req.user.id;
    const matchData = req.body;

    // Validation
    if (!matchData.team1_name || !matchData.team2_name || !matchData.scheduled_date) {
      return res.status(400).json({ message: 'Fill all required fields!' });
    }

    const { data: match, error } = await supabase
      .from('matches')
      .insert({
        team1_name: matchData.team1_name,
        team1_logo: matchData.team1_logo,
        team2_name: matchData.team2_name,
        team2_logo: matchData.team2_logo,
        sport: matchData.sport || 'Football',
        venue: matchData.venue || 'TBA',
        city: matchData.city,
        country: matchData.country,
        scheduled_date: matchData.scheduled_date,
        status: 'scheduled',
        score_team1: 0,
        score_team2: 0,
        tournament_id: matchData.tournament_id,
        created_by: userId
      })
      .select(`
        *,
        users!matches_created_by_fkey (username, avatar)
      `)
      .single();

    if (error) {
      console.error('Create match error:', error);
      return res.status(500).json({ message: 'Failed to create match' });
    }

    // Add creator as moderator
    const { error: modError } = await supabase
      .from('match_moderators')
      .insert({
        match_id: match.id,
        user_id: userId
      });

    if (modError) {
      console.error('Add moderator error:', modError);
      // Don't fail the request
    }

    res.status(201).json({ 
      message: 'Match created!', 
      match 
    });
  } catch (error) {
    console.error('Create match error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update score
exports.updateScore = async (req, res) => {
  try {
    const { matchId } = req.params;
    const { team1Score, team2Score } = req.body;
    const userId = req.user.id;

    // Check if user is moderator or creator
    const { data: match } = await supabase
      .from('matches')
      .select('created_by')
      .eq('id', matchId)
      .single();

    if (!match) {
      return res.status(404).json({ message: 'Match not found' });
    }

    const { data: moderator } = await supabase
      .from('match_moderators')
      .select('user_id')
      .eq('match_id', matchId)
      .eq('user_id', userId)
      .single();

    if (!moderator && match.created_by !== userId) {
      return res.status(403).json({ message: 'Not authorized to update score!' });
    }

    // Update score
    const { data: updatedMatch, error } = await supabase
      .from('matches')
      .update({
        score_team1: team1Score,
        score_team2: team2Score,
        updated_at: new Date().toISOString()
      })
      .eq('id', matchId)
      .select()
      .single();

    if (error) {
      console.error('Update score error:', error);
      return res.status(500).json({ message: 'Failed to update score' });
    }

    res.json({ 
      message: 'Score updated!', 
      match: updatedMatch 
    });
  } catch (error) {
    console.error('Update score error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Add event (goal, card, etc.)
exports.addEvent = async (req, res) => {
  try {
    const { matchId } = req.params;
    const { type, team_side, player_name, minute, description } = req.body;
    const userId = req.user.id;

    if (!type || !team_side || !minute) {
      return res.status(400).json({ message: 'Fill required fields!' });
    }

    if (!['team1', 'team2'].includes(team_side)) {
      return res.status(400).json({ message: 'Team side must be team1 or team2' });
    }

    // Check authorization
    const { data: match } = await supabase
      .from('matches')
      .select('created_by, score_team1, score_team2')
      .eq('id', matchId)
      .single();

    if (!match) {
      return res.status(404).json({ message: 'Match not found' });
    }

    const { data: moderator } = await supabase
      .from('match_moderators')
      .select('user_id')
      .eq('match_id', matchId)
      .eq('user_id', userId)
      .single();

    if (!moderator && match.created_by !== userId) {
      return res.status(403).json({ message: 'Not authorized to add events!' });
    }

    // Add event
    const { data: event, error } = await supabase
      .from('match_events')
      .insert({
        match_id: matchId,
        type,
        team_side,
        player_name,
        minute,
        description
      })
      .select()
      .single();

    if (error) {
      console.error('Add event error:', error);
      return res.status(500).json({ message: 'Failed to add event' });
    }

    // If it's a goal, update score
    if (type === 'goal') {
      const updates = {};
      if (team_side === 'team1') {
        updates.score_team1 = match.score_team1 + 1;
      } else {
        updates.score_team2 = match.score_team2 + 1;
      }

      await supabase
        .from('matches')
        .update(updates)
        .eq('id', matchId);
    }

    res.json({ 
      message: 'Event added!', 
      event 
    });
  } catch (error) {
    console.error('Add event error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update statistics
exports.updateStats = async (req, res) => {
  try {
    const { matchId } = req.params;
    const { stats } = req.body;
    const userId = req.user.id;

    if (!stats || !stats.team_side) {
      return res.status(400).json({ message: 'Stats and team_side are required' });
    }

    // Check authorization
    const { data: match } = await supabase
      .from('matches')
      .select('created_by')
      .eq('id', matchId)
      .single();

    if (!match) {
      return res.status(404).json({ message: 'Match not found' });
    }

    const { data: moderator } = await supabase
      .from('match_moderators')
      .select('user_id')
      .eq('match_id', matchId)
      .eq('user_id', userId)
      .single();

    if (!moderator && match.created_by !== userId) {
      return res.status(403).json({ message: 'Not authorized to update stats!' });
    }

    // Check if stats exist for this team
    const { data: existingStats } = await supabase
      .from('match_statistics')
      .select('id')
      .eq('match_id', matchId)
      .eq('team_side', stats.team_side)
      .single();

    if (existingStats) {
      // Update existing
      const { data: updatedStats, error } = await supabase
        .from('match_statistics')
        .update(stats)
        .eq('id', existingStats.id)
        .select()
        .single();

      if (error) {
        console.error('Update stats error:', error);
        return res.status(500).json({ message: 'Failed to update stats' });
      }

      return res.json({ message: 'Stats updated!', stats: updatedStats });
    } else {
      // Create new
      const { data: newStats, error } = await supabase
        .from('match_statistics')
        .insert({
          match_id: matchId,
          ...stats
        })
        .select()
        .single();

      if (error) {
        console.error('Create stats error:', error);
        return res.status(500).json({ message: 'Failed to create stats' });
      }

      return res.json({ message: 'Stats created!', stats: newStats });
    }
  } catch (error) {
    console.error('Update stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update status
exports.updateStatus = async (req, res) => {
  try {
    const { matchId } = req.params;
    const { status } = req.body;
    const userId = req.user.id;

    if (!['scheduled', 'live', 'finished', 'cancelled'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status!' });
    }

    // Check authorization
    const { data: match } = await supabase
      .from('matches')
      .select('created_by, start_time, end_time')
      .eq('id', matchId)
      .single();

    if (!match) {
      return res.status(404).json({ message: 'Match not found' });
    }

    const { data: moderator } = await supabase
      .from('match_moderators')
      .select('user_id')
      .eq('match_id', matchId)
      .eq('user_id', userId)
      .single();

    if (!moderator && match.created_by !== userId) {
      return res.status(403).json({ message: 'Not authorized to change status!' });
    }

    // Prepare updates
    const updates = { 
      status,
      updated_at: new Date().toISOString()
    };

    if (status === 'live' && !match.start_time) {
      updates.start_time = new Date().toISOString();
    }

    if (status === 'finished' && !match.end_time) {
      updates.end_time = new Date().toISOString();
    }

    // Update match
    const { data: updatedMatch, error } = await supabase
      .from('matches')
      .update(updates)
      .eq('id', matchId)
      .select()
      .single();

    if (error) {
      console.error('Update status error:', error);
      return res.status(500).json({ message: 'Failed to update status' });
    }

    res.json({ 
      message: 'Status updated!', 
      match: updatedMatch 
    });
  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Add live commentary
exports.addCommentary = async (req, res) => {
  try {
    const { matchId } = req.params;
    const { minute, text } = req.body;
    const userId = req.user.id;

    if (!minute || !text) {
      return res.status(400).json({ message: 'Fill required fields!' });
    }

    // Check authorization
    const { data: match } = await supabase
      .from('matches')
      .select('created_by')
      .eq('id', matchId)
      .single();

    if (!match) {
      return res.status(404).json({ message: 'Match not found' });
    }

    const { data: moderator } = await supabase
      .from('match_moderators')
      .select('user_id')
      .eq('match_id', matchId)
      .eq('user_id', userId)
      .single();

    if (!moderator && match.created_by !== userId) {
      return res.status(403).json({ message: 'Not authorized to add commentary!' });
    }

    // Add commentary
    const { data: commentary, error } = await supabase
      .from('match_commentary')
      .insert({
        match_id: matchId,
        minute,
        text
      })
      .select()
      .single();

    if (error) {
      console.error('Add commentary error:', error);
      return res.status(500).json({ message: 'Failed to add commentary' });
    }

    res.json({ 
      message: 'Commentary added!', 
      commentary 
    });
  } catch (error) {
    console.error('Add commentary error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete match
exports.deleteMatch = async (req, res) => {
  try {
    const { matchId } = req.params;
    const userId = req.user.id;

    const { data: match } = await supabase
      .from('matches')
      .select('created_by')
      .eq('id', matchId)
      .single();

    if (!match) {
      return res.status(404).json({ message: 'Match not found' });
    }

    // Only creator can delete
    if (match.created_by !== userId) {
      return res.status(403).json({ message: 'Not authorized to delete this match!' });
    }

    // Delete match (CASCADE will delete related data)
    const { error } = await supabase
      .from('matches')
      .delete()
      .eq('id', matchId);

    if (error) {
      console.error('Delete match error:', error);
      return res.status(500).json({ message: 'Failed to delete match' });
    }

    res.json({ message: 'Match deleted!' });
  } catch (error) {
    console.error('Delete match error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = exports;