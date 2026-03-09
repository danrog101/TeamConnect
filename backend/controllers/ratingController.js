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

// Submit self-rating - Simplified 1-5 scale
exports.submitSelfRating = async (req, res) => {
  try {
    const userId = req.user.id;
    const { skillLevel } = req.body;

    // Validate skill level (1-5)
    const level = parseInt(skillLevel);
    if (isNaN(level) || level < 1 || level > 5) {
      return res.status(400).json({ message: 'Skill level must be between 1 and 5' });
    }

    // Convert 1-5 to percentage-based ratings (for compatibility)
    // 1=20%, 2=40%, 3=60%, 4=80%, 5=100%
    const ratingValue = level * 20;

    const selfRatings = {
      self_rating_attack: ratingValue,
      self_rating_defense: ratingValue,
      self_rating_teamwork: ratingValue,
      self_rating_consistency: ratingValue
    };

    // Convert to rating scale (0-3000)
    const overallRatingScaled = ratingValue * 30;

    // Determine amateur status (levels 1-2 are amateur)
    const amateur = level <= 2;

    // Update user with self-ratings
    const { data: updatedUser, error } = await supabase
      .from('users')
      .update({
        ...selfRatings,
        has_self_rated: true,
        self_rated_at: new Date().toISOString(),
        // Initialize actual ratings from self-ratings
        rating_attack: ratingValue,
        rating_defense: ratingValue,
        rating_teamwork: ratingValue,
        rating_consistency: ratingValue,
        rating_overall: overallRatingScaled,
        rating_last_updated: new Date().toISOString(),
        // Set skill level and amateur status
        skill_level_numeric: level,
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
      skillLevel: level,
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
      .select('has_self_rated, skill_level_numeric, self_rated_at')
      .eq('id', userId)
      .single();

    if (error || !user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      hasSelfRated: user.has_self_rated || false,
      skillLevel: user.skill_level_numeric || null,
      selfRatedAt: user.self_rated_at
    });
  } catch (error) {
    console.error('Get self-rating status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get sport-specific rating for current user
exports.getSportRating = async (req, res) => {
  try {
    const userId = req.user.id;
    const { sport } = req.params;

    // Check if user has sport-specific rating
    const { data: sportRating, error } = await supabase
      .from('sport_ratings')
      .select('*')
      .eq('user_id', userId)
      .eq('sport', sport)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Get sport rating error:', error);
      return res.status(500).json({ message: 'Server error' });
    }

    if (!sportRating) {
      return res.json({
        hasRating: false,
        sport: sport
      });
    }

    res.json({
      hasRating: true,
      sport: sport,
      ratings: sportRating.ratings,
      overall_rating: sportRating.overall_rating,
      skill_level: sportRating.skill_level,
      created_at: sportRating.created_at,
      updated_at: sportRating.updated_at
    });
  } catch (error) {
    console.error('Get sport rating error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Submit sport-specific rating
exports.submitSportRating = async (req, res) => {
  try {
    const userId = req.user.id;
    const { sport, overallRating, skillLevel } = req.body;

    if (!sport || overallRating === undefined || skillLevel === undefined) {
      return res.status(400).json({ message: 'Sport, overallRating, and skillLevel are required' });
    }

    const overall = parseInt(overallRating);
    const level = parseInt(skillLevel);

    if (isNaN(overall) || overall < 0 || overall > 100) {
      return res.status(400).json({ message: 'Overall rating must be between 0 and 100' });
    }

    if (isNaN(level) || level < 1 || level > 5) {
      return res.status(400).json({ message: 'Skill level must be between 1 and 5' });
    }

    // Check if user already has a rating for this sport
    const { data: existing } = await supabase
      .from('sport_ratings')
      .select('id')
      .eq('user_id', userId)
      .eq('sport', sport)
      .single();

    let result;

    if (existing) {
      // Update existing rating
      const { data, error } = await supabase
        .from('sport_ratings')
        .update({
          overall_rating: overall,
          skill_level: level,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id)
        .select()
        .single();

      if (error) {
        console.error('Update sport rating error:', error);
        return res.status(500).json({ message: 'Failed to update rating' });
      }
      result = data;
    } else {
      // Insert new rating
      const { data, error } = await supabase
        .from('sport_ratings')
        .insert({
          user_id: userId,
          sport: sport,
          overall_rating: overall,
          skill_level: level
        })
        .select()
        .single();

      if (error) {
        console.error('Insert sport rating error:', error);
        return res.status(500).json({ message: 'Failed to save rating' });
      }
      result = data;
    }

    // Also update user's main skill level if this is their primary sport
    const { data: user } = await supabase
      .from('users')
      .select('sport')
      .eq('id', userId)
      .single();

    if (user && (user.sport === sport || !user.sport)) {
      await supabase
        .from('users')
        .update({
          skill_level_numeric: level,
          has_self_rated: true,
          self_rated_at: new Date().toISOString()
        })
        .eq('id', userId);
    }

    res.json({
      message: 'Rating saved successfully!',
      sportRating: result
    });
  } catch (error) {
    console.error('Submit sport rating error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all sport ratings for a user
exports.getAllSportRatings = async (req, res) => {
  try {
    const userId = req.user.id;

    const { data: sportRatings, error } = await supabase
      .from('sport_ratings')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Get all sport ratings error:', error);
      return res.status(500).json({ message: 'Server error' });
    }

    res.json(sportRatings || []);
  } catch (error) {
    console.error('Get all sport ratings error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Rate another player (only allowed if target has self-rated)
// Rate another player - simplified 1-5 per sport
exports.ratePlayer = async (req, res) => {
  try {
    const raterId = req.user.id;
    const { targetUserId, skillLevel, sport } = req.body;

    // Cannot rate yourself
    if (raterId === targetUserId) {
      return res.status(400).json({ message: 'Ne možeš ocjeniti sebe. Koristi self-rating.' });
    }

    if (!targetUserId || !skillLevel || !sport) {
      return res.status(400).json({ message: 'targetUserId, skillLevel i sport su obavezni.' });
    }

    // Validate skill level (1-5)
    const level = parseInt(skillLevel);
    if (isNaN(level) || level < 1 || level > 5) {
      return res.status(400).json({ message: 'Ocjena mora biti između 1 i 5' });
    }

    // Check if target user exists and has self-rated
    const { data: targetUser, error: targetError } = await supabase
      .from('users')
      .select('has_self_rated, username, rating_overall')
      .eq('id', targetUserId)
      .single();

    if (targetError || !targetUser) {
      return res.status(404).json({ message: 'Korisnik nije pronađen' });
    }

    if (!targetUser.has_self_rated) {
      return res.status(400).json({
        message: `${targetUser.username} još nije ocijenio/la sebe. Moraju prvo ocijeniti sebe.`
      });
    }

    // Convert 1-5 to rating value (20, 40, 60, 80, 100)
    const ratingValue = level * 20;

    // Average with existing rating
    const currentOverall = targetUser.rating_overall || 0;
    const newOverall = Math.round((currentOverall + ratingValue * 30) / 2);

    // Update sport_ratings table for this sport
    const { data: existingSportRating } = await supabase
      .from('sport_ratings')
      .select('id, overall_rating, skill_level')
      .eq('user_id', targetUserId)
      .eq('sport', sport)
      .single();

    if (existingSportRating) {
      // Average with existing sport rating
      const newSportRating = Math.round((existingSportRating.overall_rating + ratingValue) / 2);
      const newSkillLevel = Math.round((existingSportRating.skill_level + level) / 2);

      await supabase
        .from('sport_ratings')
        .update({
          overall_rating: newSportRating,
          skill_level: newSkillLevel,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingSportRating.id);
    } else {
      await supabase
        .from('sport_ratings')
        .insert({
          user_id: targetUserId,
          sport,
          overall_rating: ratingValue,
          skill_level: level
        });
    }

    // Update user overall rating
    const { error: updateError } = await supabase
      .from('users')
      .update({
        rating_overall: newOverall,
        rating_attack: ratingValue,
        rating_defense: ratingValue,
        rating_teamwork: ratingValue,
        rating_consistency: ratingValue,
        rating_last_updated: new Date().toISOString()
      })
      .eq('id', targetUserId);

    if (updateError) {
      console.error('❌ Update rating error:', updateError);
      return res.status(500).json({ message: 'Greška pri ažuriranju ocjene' });
    }

    res.json({
      message: 'Ocjena uspješno spremljena!',
      skillLevel: level,
      sport
    });
  } catch (error) {
    console.error('❌ Rate player error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = exports;