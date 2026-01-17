const { supabase } = require('../config/supabase');
const { calculateUserRating } = require('../utils/ratingCalculator');

// Get stats
exports.getStats = async (req, res) => {
  try {
    const userId = req.user.id;
    const { sport } = req.query;

    let query = supabase
      .from('player_stats')
      .select('*')
      .eq('user_id', userId);

    if (sport) {
      query = query.eq('sport', sport);
    }

    const { data: stats, error } = await query;

    if (error) {
      console.error('Get stats error:', error);
      return res.status(500).json({ message: 'Server error' });
    }

    res.json(stats || []);
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Create or update stats for a sport
exports.upsertStats = async (req, res) => {
  try {
    const userId = req.user.id;
    const { sport, stats } = req.body;

    if (!sport) {
      return res.status(400).json({ message: 'Sport is required' });
    }

    // Check if stats exist
    const { data: existingStats } = await supabase
      .from('player_stats')
      .select('id')
      .eq('user_id', userId)
      .eq('sport', sport)
      .single();

    if (existingStats) {
      // Update existing stats
      const { data, error } = await supabase
        .from('player_stats')
        .update({ 
          ...stats, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', existingStats.id)
        .select()
        .single();

      if (error) {
        console.error('Update stats error:', error);
        return res.status(500).json({ message: 'Failed to update stats' });
      }

      return res.json({ message: 'Stats updated!', stats: data });
    } else {
      // Create new stats
      const { data, error } = await supabase
        .from('player_stats')
        .insert({
          user_id: userId,
          sport,
          total_matches: 0,
          wins: 0,
          losses: 0,
          draws: 0,
          goals_scored: 0,
          assists: 0,
          clean_sheets: 0,
          yellow_cards: 0,
          red_cards: 0,
          position_forward: 0,
          position_midfielder: 0,
          position_defender: 0,
          position_goalkeeper: 0,
          ...stats
        })
        .select()
        .single();

      if (error) {
        console.error('Create stats error:', error);
        return res.status(500).json({ message: 'Failed to create stats' });
      }

      return res.json({ message: 'Stats created!', stats: data });
    }
  } catch (error) {
    console.error('Upsert stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Add match
exports.addMatch = async (req, res) => {
  try {
    const userId = req.user.id;
    const { sport, matchData } = req.body;

    if (!sport || !matchData) {
      return res.status(400).json({ message: 'Sport and match data are required' });
    }

    // Validate matchData
    if (!matchData.opponent || !matchData.result) {
      return res.status(400).json({ message: 'Opponent and result are required' });
    }

    if (!['win', 'loss', 'draw'].includes(matchData.result)) {
      return res.status(400).json({ message: 'Result must be win, loss, or draw' });
    }

    // Get or create player stats
    let { data: stats } = await supabase
      .from('player_stats')
      .select('*')
      .eq('user_id', userId)
      .eq('sport', sport)
      .single();

    if (!stats) {
      const { data: newStats, error: createError } = await supabase
        .from('player_stats')
        .insert({
          user_id: userId,
          sport,
          total_matches: 0,
          wins: 0,
          losses: 0,
          draws: 0,
          goals_scored: 0,
          assists: 0,
          clean_sheets: 0,
          yellow_cards: 0,
          red_cards: 0,
          position_forward: 0,
          position_midfielder: 0,
          position_defender: 0,
          position_goalkeeper: 0
        })
        .select()
        .single();

      if (createError) {
        console.error('Create stats error:', createError);
        return res.status(500).json({ message: 'Failed to create stats' });
      }

      stats = newStats;
    }

    // Prepare updates
    const updates = {
      total_matches: stats.total_matches + 1,
      updated_at: new Date().toISOString()
    };

    if (matchData.result === 'win') updates.wins = stats.wins + 1;
    if (matchData.result === 'loss') updates.losses = stats.losses + 1;
    if (matchData.result === 'draw') updates.draws = stats.draws + 1;

    if (matchData.goalsScored) {
      updates.goals_scored = stats.goals_scored + (matchData.goalsScored || 0);
    }
    if (matchData.assists) {
      updates.assists = stats.assists + (matchData.assists || 0);
    }
    if (matchData.cleanSheet) {
      updates.clean_sheets = stats.clean_sheets + 1;
    }
    if (matchData.yellowCards) {
      updates.yellow_cards = stats.yellow_cards + (matchData.yellowCards || 0);
    }
    if (matchData.redCards) {
      updates.red_cards = stats.red_cards + (matchData.redCards || 0);
    }

    // Update position stats
    if (matchData.position) {
      const positionMap = {
        'forward': 'position_forward',
        'midfielder': 'position_midfielder',
        'defender': 'position_defender',
        'goalkeeper': 'position_goalkeeper'
      };
      const posField = positionMap[matchData.position.toLowerCase()];
      if (posField && stats[posField] !== undefined) {
        updates[posField] = stats[posField] + 1;
      }
    }

    // Add match to history
    const { error: historyError } = await supabase
      .from('player_match_history')
      .insert({
        player_stats_id: stats.id,
        match_date: matchData.date || new Date().toISOString().split('T')[0],
        opponent: matchData.opponent,
        result: matchData.result,
        score: matchData.score || '',
        goals_scored: matchData.goalsScored || 0,
        assists: matchData.assists || 0,
        position: matchData.position || null
      });

    if (historyError) {
      console.error('Add match history error:', historyError);
      // Don't fail the request - continue
    }

    // Update stats
    const { data: updatedStats, error: updateError } = await supabase
      .from('player_stats')
      .update(updates)
      .eq('id', stats.id)
      .select()
      .single();

    if (updateError) {
      console.error('Update stats error:', updateError);
      return res.status(500).json({ message: 'Failed to update stats' });
    }

    // Update user's overall rating
    try {
      const { data: allStats } = await supabase
        .from('player_stats')
        .select('*')
        .eq('user_id', userId);

      if (allStats && allStats.length > 0) {
        const totalStats = {
          totalMatches: 0,
          totalWins: 0,
          totalGoals: 0,
          totalAssists: 0,
          totalCleanSheets: 0,
          totalYellowCards: 0,
          totalRedCards: 0
        };

        allStats.forEach(stat => {
          totalStats.totalMatches += stat.total_matches || 0;
          totalStats.totalWins += stat.wins || 0;
          totalStats.totalGoals += stat.goals_scored || 0;
          totalStats.totalAssists += stat.assists || 0;
          totalStats.totalCleanSheets += stat.clean_sheets || 0;
          totalStats.totalYellowCards += stat.yellow_cards || 0;
          totalStats.totalRedCards += stat.red_cards || 0;
        });

        const newRating = calculateUserRating(totalStats);

        await supabase
          .from('users')
          .update({
            rating_overall: newRating.overall,
            rating_attack: newRating.attack,
            rating_defense: newRating.defense,
            rating_teamwork: newRating.teamwork,
            rating_consistency: newRating.consistency,
            rank: newRating.rank,
            total_matches: totalStats.totalMatches,
            total_wins: totalStats.totalWins,
            total_goals: totalStats.totalGoals,
            rating_last_updated: new Date().toISOString()
          })
          .eq('id', userId);
      }
    } catch (ratingError) {
      console.error('Update rating error:', ratingError);
      // Don't fail the request
    }

    res.json({ 
      message: 'Match added successfully!', 
      stats: updatedStats 
    });
  } catch (error) {
    console.error('Add match error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete match
exports.deleteMatch = async (req, res) => {
  try {
    const userId = req.user.id;
    const { matchId } = req.params;
    const { sport } = req.query;

    if (!sport) {
      return res.status(400).json({ message: 'Sport parameter is required' });
    }

    // Get player stats
    const { data: stats } = await supabase
      .from('player_stats')
      .select('*')
      .eq('user_id', userId)
      .eq('sport', sport)
      .single();

    if (!stats) {
      return res.status(404).json({ message: 'Stats not found' });
    }

    // Get match details
    const { data: match, error: fetchError } = await supabase
      .from('player_match_history')
      .select('*')
      .eq('id', matchId)
      .eq('player_stats_id', stats.id)
      .single();

    if (fetchError || !match) {
      return res.status(404).json({ message: 'Match not found' });
    }

    // Prepare reverse updates
    const updates = {
      total_matches: Math.max(0, stats.total_matches - 1),
      updated_at: new Date().toISOString()
    };

    if (match.result === 'win') updates.wins = Math.max(0, stats.wins - 1);
    if (match.result === 'loss') updates.losses = Math.max(0, stats.losses - 1);
    if (match.result === 'draw') updates.draws = Math.max(0, stats.draws - 1);

    updates.goals_scored = Math.max(0, stats.goals_scored - (match.goals_scored || 0));
    updates.assists = Math.max(0, stats.assists - (match.assists || 0));

    // Update stats
    await supabase
      .from('player_stats')
      .update(updates)
      .eq('id', stats.id);

    // Delete match
    const { error: deleteError } = await supabase
      .from('player_match_history')
      .delete()
      .eq('id', matchId);

    if (deleteError) {
      console.error('Delete match error:', deleteError);
      return res.status(500).json({ message: 'Failed to delete match' });
    }

    res.json({ message: 'Match deleted!', stats: updates });
  } catch (error) {
    console.error('Delete match error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = exports;