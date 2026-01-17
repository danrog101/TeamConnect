const { supabase } = require('../config/supabase');
const { calculateUserRating } = require('../utils/ratingCalculator');

// Get leaderboard
exports.getLeaderboard = async (req, res) => {
  try {
    const { sport, limit = 100, rank } = req.query;
    
    let query = supabase
      .from('users')
      .select('id, username, avatar, rating_overall, rating_attack, rating_defense, rating_teamwork, rating_consistency, rank, sport, location, total_matches, total_wins, total_goals')
      .order('rating_overall', { ascending: false })
      .limit(parseInt(limit));

    if (rank) {
      query = query.eq('rank', rank);
    }

    if (sport) {
      query = query.eq('sport', sport);
    }

    const { data: users, error } = await query;

    if (error) {
      console.error('Get leaderboard error:', error);
      return res.status(500).json({ message: 'Server error' });
    }

    // Add position to each user
    const leaderboard = users?.map((user, index) => ({
      ...user,
      position: index + 1
    })) || [];

    res.json(leaderboard);
  } catch (error) {
    console.error('Get leaderboard error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get user rating
exports.getUserRating = async (req, res) => {
  try {
    const { userId } = req.params;

    const { data: user, error } = await supabase
      .from('users')
      .select('id, username, avatar, rating_overall, rating_attack, rating_defense, rating_teamwork, rating_consistency, rank, sport, location, total_matches, total_wins, total_goals, rating_last_updated')
      .eq('id', userId)
      .single();

    if (error || !user) {
      console.error('Get user rating error:', error);
      return res.status(404).json({ message: 'User not found' });
    }

    // Get leaderboard position
    const { data: betterPlayers } = await supabase
      .from('users')
      .select('id')
      .gt('rating_overall', user.rating_overall);

    const leaderboardPosition = (betterPlayers?.length || 0) + 1;

    res.json({
      ...user,
      leaderboardPosition
    });
  } catch (error) {
    console.error('Get user rating error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Recalculate rating manually
exports.recalculateRating = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get current user
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('rank')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const oldRank = user.rank;

    // Get all player stats for this user
    const { data: allStats, error: statsError } = await supabase
      .from('player_stats')
      .select('*')
      .eq('user_id', userId);

    if (statsError) {
      console.error('Get stats error:', statsError);
      return res.status(500).json({ message: 'Failed to fetch stats' });
    }

    if (!allStats || allStats.length === 0) {
      return res.status(400).json({ message: 'No statistics found to calculate rating!' });
    }

    // Aggregate stats across all sports
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

    // Calculate new rating
    const newRating = calculateUserRating(totalStats);
    const newRank = newRating.rank;

    // Update user rating
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update({
        rating_overall: newRating.overall,
        rating_attack: newRating.attack,
        rating_defense: newRating.defense,
        rating_teamwork: newRating.teamwork,
        rating_consistency: newRating.consistency,
        rank: newRank,
        total_matches: totalStats.totalMatches,
        total_wins: totalStats.totalWins,
        total_goals: totalStats.totalGoals,
        rating_last_updated: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single();

    if (updateError) {
      console.error('Update rating error:', updateError);
      return res.status(500).json({ message: 'Failed to update rating' });
    }

    res.json({ 
      message: 'Rating recalculated!', 
      rating: {
        overall: newRating.overall,
        attack: newRating.attack,
        defense: newRating.defense,
        teamwork: newRating.teamwork,
        consistency: newRating.consistency,
        rank: newRank
      },
      rankChanged: oldRank !== newRank,
      oldRank,
      newRank,
      user: updatedUser
    });
  } catch (error) {
    console.error('Recalculate rating error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get achievements
exports.getAchievements = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get user
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('rank, rating_overall, total_matches, total_wins, total_goals')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get all player stats
    const { data: allStats } = await supabase
      .from('player_stats')
      .select('*')
      .eq('user_id', userId);

    const totalStats = {
      totalMatches: user.total_matches || 0,
      totalWins: user.total_wins || 0,
      totalGoals: user.total_goals || 0
    };

    const achievements = [
      {
        id: 'first_match',
        name: 'First Match',
        description: 'Play your first match',
        icon: '⚽',
        unlocked: totalStats.totalMatches >= 1,
        progress: Math.min(totalStats.totalMatches, 1),
        required: 1
      },
      {
        id: 'veteran',
        name: 'Veteran',
        description: 'Play 50 matches',
        icon: '🎖️',
        unlocked: totalStats.totalMatches >= 50,
        progress: totalStats.totalMatches,
        required: 50
      },
      {
        id: 'legend',
        name: 'Legend',
        description: 'Play 100 matches',
        icon: '👑',
        unlocked: totalStats.totalMatches >= 100,
        progress: totalStats.totalMatches,
        required: 100
      },
      {
        id: 'first_win',
        name: 'First Victory',
        description: 'Win your first match',
        icon: '🏆',
        unlocked: totalStats.totalWins >= 1,
        progress: Math.min(totalStats.totalWins, 1),
        required: 1
      },
      {
        id: 'champion',
        name: 'Champion',
        description: 'Win 25 matches',
        icon: '🥇',
        unlocked: totalStats.totalWins >= 25,
        progress: totalStats.totalWins,
        required: 25
      },
      {
        id: 'scorer',
        name: 'Scorer',
        description: 'Score 10 goals',
        icon: '⚽',
        unlocked: totalStats.totalGoals >= 10,
        progress: totalStats.totalGoals,
        required: 10
      },
      {
        id: 'top_scorer',
        name: 'Top Scorer',
        description: 'Score 50 goals',
        icon: '🔥',
        unlocked: totalStats.totalGoals >= 50,
        progress: totalStats.totalGoals,
        required: 50
      },
      {
        id: 'gold_rank',
        name: 'Gold Rank',
        description: 'Reach Gold rank',
        icon: '🥇',
        unlocked: ['gold', 'platinum', 'diamond', 'master'].includes(user.rank),
        progress: user.rating_overall,
        required: 1800
      },
      {
        id: 'platinum_rank',
        name: 'Platinum Rank',
        description: 'Reach Platinum rank',
        icon: '💿',
        unlocked: ['platinum', 'diamond', 'master'].includes(user.rank),
        progress: user.rating_overall,
        required: 2200
      },
      {
        id: 'diamond_rank',
        name: 'Diamond Rank',
        description: 'Reach Diamond rank',
        icon: '💎',
        unlocked: ['diamond', 'master'].includes(user.rank),
        progress: user.rating_overall,
        required: 2600
      },
      {
        id: 'master_rank',
        name: 'Master Rank',
        description: 'Reach the ultimate Master rank',
        icon: '👑',
        unlocked: user.rank === 'master',
        progress: user.rating_overall,
        required: 2600
      }
    ];

    res.json(achievements);
  } catch (error) {
    console.error('Get achievements error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = exports;