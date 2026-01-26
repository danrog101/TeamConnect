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

// Helper function to calculate skill level from rating (1-5)
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
  if (overallRating === null || overallRating === undefined) return true;
  // Convert overall rating (0-3000) to percentage (0-100)
  const percentage = (overallRating / 3000) * 100;
  return percentage < 60; // Amateur if less than 60%
};

// Submit self-rating
exports.submitSelfRating = async (req, res) => {
  try {
    const userId = req.user.id;
    const { attack, defense, teamwork, consistency } = req.body;

    // Validate ratings (0-100)
    const validateRating = (value) => {
      const num = parseInt(value);
      return !isNaN(num) && num >= 0 && num <= 100 ? num : null;
    };

    const selfRatings = {
      self_rating_attack: validateRating(attack),
      self_rating_defense: validateRating(defense),
      self_rating_teamwork: validateRating(teamwork),
      self_rating_consistency: validateRating(consistency)
    };

    // Check all ratings are valid
    if (Object.values(selfRatings).some(v => v === null)) {
      return res.status(400).json({ message: 'All ratings must be between 0 and 100' });
    }

    // Calculate overall self-rating (0-100)
    const overallSelfRating = Math.round(
      (selfRatings.self_rating_attack +
       selfRatings.self_rating_defense +
       selfRatings.self_rating_teamwork +
       selfRatings.self_rating_consistency) / 4
    );

    // Calculate skill level (1-5)
    const skillLevel = calculateSkillLevel(overallSelfRating);

    // Convert to rating scale (0-3000)
    const overallRatingScaled = overallSelfRating * 30;

    // Determine amateur status (amateur if rating < 60%)
    const amateur = isUserAmateur(overallRatingScaled);

    // Update user with self-ratings
    const { data: updatedUser, error } = await supabase
      .from('users')
      .update({
        ...selfRatings,
        has_self_rated: true,
        self_rated_at: new Date().toISOString(),
        // Initialize actual ratings from self-ratings (will be adjusted by others later)
        rating_attack: selfRatings.self_rating_attack,
        rating_defense: selfRatings.self_rating_defense,
        rating_teamwork: selfRatings.self_rating_teamwork,
        rating_consistency: selfRatings.self_rating_consistency,
        rating_overall: overallRatingScaled,
        rating_last_updated: new Date().toISOString(),
        // Set skill level and amateur status
        skill_level_numeric: skillLevel,
        is_amateur: amateur
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('Submit self-rating error:', error);
      return res.status(500).json({ message: 'Failed to save self-rating' });
    }

    res.json({
      message: 'Self-rating submitted successfully!',
      selfRatings: {
        attack: selfRatings.self_rating_attack,
        defense: selfRatings.self_rating_defense,
        teamwork: selfRatings.self_rating_teamwork,
        consistency: selfRatings.self_rating_consistency,
        overall: overallSelfRating
      },
      skillLevel,
      isAmateur: amateur,
      user: updatedUser
    });
  } catch (error) {
    console.error('Submit self-rating error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get self-rating status
exports.getSelfRatingStatus = async (req, res) => {
  try {
    const userId = req.user.id;

    const { data: user, error } = await supabase
      .from('users')
      .select('has_self_rated, self_rating_attack, self_rating_defense, self_rating_teamwork, self_rating_consistency, self_rated_at')
      .eq('id', userId)
      .single();

    if (error || !user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      hasSelfRated: user.has_self_rated || false,
      selfRatings: user.has_self_rated ? {
        attack: user.self_rating_attack,
        defense: user.self_rating_defense,
        teamwork: user.self_rating_teamwork,
        consistency: user.self_rating_consistency
      } : null,
      selfRatedAt: user.self_rated_at
    });
  } catch (error) {
    console.error('Get self-rating status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Rate another player (only allowed if target has self-rated)
exports.ratePlayer = async (req, res) => {
  try {
    const raterId = req.user.id;
    const { targetUserId, attack, defense, teamwork, consistency } = req.body;

    // Cannot rate yourself
    if (raterId === targetUserId) {
      return res.status(400).json({ message: 'Cannot rate yourself. Use self-rating instead.' });
    }

    // Check if target user has self-rated
    const { data: targetUser, error: targetError } = await supabase
      .from('users')
      .select('has_self_rated, username')
      .eq('id', targetUserId)
      .single();

    if (targetError || !targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!targetUser.has_self_rated) {
      return res.status(400).json({
        message: `${targetUser.username} has not completed their self-rating yet. They must rate themselves first.`
      });
    }

    // Validate ratings
    const validateRating = (value) => {
      const num = parseInt(value);
      return !isNaN(num) && num >= 0 && num <= 100 ? num : null;
    };

    const ratings = {
      attack: validateRating(attack),
      defense: validateRating(defense),
      teamwork: validateRating(teamwork),
      consistency: validateRating(consistency)
    };

    if (Object.values(ratings).some(v => v === null)) {
      return res.status(400).json({ message: 'All ratings must be between 0 and 100' });
    }

    // Store the peer rating (you may want to create a separate peer_ratings table for this)
    // For now, we'll just update the user's ratings as an average with existing
    const { data: currentRatings, error: fetchError } = await supabase
      .from('users')
      .select('rating_attack, rating_defense, rating_teamwork, rating_consistency, rating_overall')
      .eq('id', targetUserId)
      .single();

    if (fetchError) {
      return res.status(500).json({ message: 'Failed to fetch current ratings' });
    }

    // Simple average (in production, you'd want a more sophisticated system)
    const newRatings = {
      rating_attack: Math.round((currentRatings.rating_attack + ratings.attack) / 2),
      rating_defense: Math.round((currentRatings.rating_defense + ratings.defense) / 2),
      rating_teamwork: Math.round((currentRatings.rating_teamwork + ratings.teamwork) / 2),
      rating_consistency: Math.round((currentRatings.rating_consistency + ratings.consistency) / 2)
    };

    const newOverall = Math.round(
      (newRatings.rating_attack + newRatings.rating_defense +
       newRatings.rating_teamwork + newRatings.rating_consistency) / 4
    ) * 30;

    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update({
        ...newRatings,
        rating_overall: newOverall,
        rating_last_updated: new Date().toISOString()
      })
      .eq('id', targetUserId)
      .select()
      .single();

    if (updateError) {
      return res.status(500).json({ message: 'Failed to update rating' });
    }

    res.json({
      message: 'Rating submitted successfully!',
      newRatings: {
        attack: newRatings.rating_attack,
        defense: newRatings.rating_defense,
        teamwork: newRatings.rating_teamwork,
        consistency: newRatings.rating_consistency,
        overall: newOverall
      }
    });
  } catch (error) {
    console.error('Rate player error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = exports;