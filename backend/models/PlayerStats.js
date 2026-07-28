const supabase = require('../config/supabase');

class PlayerStatsModel {
  // Create or update player stats
  static async upsert(statsData) {
    const { data, error } = await supabase
      .from('player_stats')
      .upsert([statsData])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  // Find player stats by ID
  static async findById(id) {
    const { data, error } = await supabase
      .from('player_stats')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  // Get player stats by user and sport
  static async findByUserAndSport(userId, sport) {
    const { data, error } = await supabase
      .from('player_stats')
      .select('*')
      .eq('user_id', userId)
      .eq('sport', sport)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  // Update player stats by ID
  static async updateById(id, updateData) {
    const { data, error } = await supabase
      .from('player_stats')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  // Update player stats by user and sport
  static async updateByUserAndSport(userId, sport, updateData) {
    const { data, error } = await supabase
      .from('player_stats')
      .update(updateData)
      .eq('user_id', userId)
      .eq('sport', sport)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  // Delete player stats by ID
  static async deleteById(id) {
    const { error } = await supabase
      .from('player_stats')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    return true;
  }

  // Find player stats with filters
  static async find(filters = {}, options = {}) {
    let query = supabase.from('player_stats').select('*');
    
    // Apply filters
    if (filters.user_id) {
      query = query.eq('user_id', filters.user_id);
    }
    if (filters.sport) {
      query = query.eq('sport', filters.sport);
    }
    if (filters.min_matches) {
      query = query.gte('total_matches', filters.min_matches);
    }
    if (filters.min_wins) {
      query = query.gte('wins', filters.min_wins);
    }
    if (filters.min_goals) {
      query = query.gte('goals_scored', filters.min_goals);
    }
    
    // Sorting
    if (options.sort) {
      const [field, order] = options.sort.split(':');
      query = query.order(field, { ascending: order !== 'desc' });
    } else {
      query = query.order('total_matches', { ascending: false });
    }
    
    // Pagination
    if (options.limit) {
      query = query.limit(options.limit);
    }
    if (options.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data;
  }

  // Get all stats for a user across all sports
  static async getUserStats(userId) {
    const { data, error } = await supabase
      .from('player_stats')
      .select('*')
      .eq('user_id', userId)
      .order('total_matches', { ascending: false });
    
    if (error) throw error;
    return data;
  }

  // Get stats with match history
  static async findByIdWithHistory(id) {
    const { data, error } = await supabase
      .from('player_stats')
      .select(`
        *,
        player_match_history (
          id,
          match_date,
          opponent,
          result,
          score,
          goals_scored,
          assists,
          position
        )
      `)
      .eq('id', id)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    
    if (data && data.player_match_history) {
      data.player_match_history.sort((a, b) => new Date(b.match_date) - new Date(a.match_date));
    }
    
    return data;
  }

  // Add match to history
  static async addMatchHistory(statsId, matchData) {
    const { data, error } = await supabase
      .from('player_match_history')
      .insert([{
        player_stats_id: statsId,
        match_date: matchData.matchDate,
        opponent: matchData.opponent,
        result: matchData.result,
        score: matchData.score,
        goals_scored: matchData.goalsScored || 0,
        assists: matchData.assists || 0,
        position: matchData.position
      }])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  // Update match history
  static async updateMatchHistory(matchHistoryId, matchData) {
    const { data, error } = await supabase
      .from('player_match_history')
      .update({
        match_date: matchData.matchDate,
        opponent: matchData.opponent,
        result: matchData.result,
        score: matchData.score,
        goals_scored: matchData.goalsScored || 0,
        assists: matchData.assists || 0,
        position: matchData.position
      })
      .eq('id', matchHistoryId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  // Delete match history
  static async deleteMatchHistory(matchHistoryId) {
    const { error } = await supabase
      .from('player_match_history')
      .delete()
      .eq('id', matchHistoryId);
    
    if (error) throw error;
    return true;
  }

  // Update stats after a match
  static async updateAfterMatch(userId, sport, matchResult) {
    // Get existing stats
    let stats = await this.findByUserAndSport(userId, sport);
    
    if (!stats) {
      // Create new stats record
      stats = await this.upsert({
        user_id: userId,
        sport: sport,
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
      });
    }
    
    // Update stats
    const updateData = {
      total_matches: stats.total_matches + 1,
      updated_at: new Date().toISOString()
    };
    
    if (matchResult.result === 'win') {
      updateData.wins = stats.wins + 1;
    } else if (matchResult.result === 'loss') {
      updateData.losses = stats.losses + 1;
    } else if (matchResult.result === 'draw') {
      updateData.draws = stats.draws + 1;
    }
    
    if (matchResult.goalsScored) {
      updateData.goals_scored = stats.goals_scored + matchResult.goalsScored;
    }
    
    if (matchResult.assists) {
      updateData.assists = stats.assists + matchResult.assists;
    }
    
    if (matchResult.cleanSheet) {
      updateData.clean_sheets = stats.clean_sheets + 1;
    }
    
    if (matchResult.yellowCards) {
      updateData.yellow_cards = stats.yellow_cards + matchResult.yellowCards;
    }
    
    if (matchResult.redCards) {
      updateData.red_cards = stats.red_cards + matchResult.redCards;
    }
    
    // Update position stats
    if (matchResult.position) {
      const positionField = `position_${matchResult.position.toLowerCase()}`;
      if (updateData[positionField] !== undefined) {
        updateData[positionField] = stats[positionField] + 1;
      }
    }
    
    return await this.updateById(stats.id, updateData);
  }

  // Get top players by sport
  static async getTopPlayers(sport, limit = 10, sortBy = 'total_matches') {
    const { data, error } = await supabase
      .from('player_stats')
      .select(`
        *,
        users (
          id, username, avatar, skill_level
        )
      `)
      .eq('sport', sport)
      .gte('total_matches', 5) // Minimum matches to qualify
      .order(sortBy, { ascending: false })
      .limit(limit);
    
    if (error) throw error;
    return data;
  }

  // Get player rankings
  static async getPlayerRankings(sport, limit = 50) {
    const { data, error } = await supabase
      .from('player_stats')
      .select(`
        *,
        users (
          id, username, avatar, skill_level, rating_overall
        )
      `)
      .eq('sport', sport)
      .gte('total_matches', 3)
      .order('wins', { ascending: false })
      .limit(limit);
    
    if (error) throw error;
    
    // Calculate rankings
    return data.map((player, index) => ({
      ...player,
      rank: index + 1,
      winRate: player.total_matches > 0 ? Math.round((player.wins / player.total_matches) * 100) : 0,
      goalsPerMatch: player.total_matches > 0 ? Math.round((player.goals_scored / player.total_matches) * 10) / 10 : 0,
      assistsPerMatch: player.total_matches > 0 ? Math.round((player.assists / player.total_matches) * 10) / 10 : 0
    }));
  }

  // Get player statistics summary
  static async getPlayerStatsSummary(userId, sport) {
    const stats = await this.findByUserAndSport(userId, sport);
    if (!stats) {
      return null;
    }
    
    return {
      basic: {
        totalMatches: stats.total_matches,
        wins: stats.wins,
        losses: stats.losses,
        draws: stats.draws,
        winRate: stats.total_matches > 0 ? Math.round((stats.wins / stats.total_matches) * 100) : 0
      },
      offensive: {
        goalsScored: stats.goals_scored,
        assists: stats.assists,
        goalsPerMatch: stats.total_matches > 0 ? Math.round((stats.goals_scored / stats.total_matches) * 10) / 10 : 0,
        assistsPerMatch: stats.total_matches > 0 ? Math.round((stats.assists / stats.total_matches) * 10) / 10 : 0
      },
      defensive: {
        cleanSheets: stats.clean_sheets,
        cleanSheetRate: stats.total_matches > 0 ? Math.round((stats.clean_sheets / stats.total_matches) * 100) : 0
      },
      disciplinary: {
        yellowCards: stats.yellow_cards,
        redCards: stats.red_cards,
        cardsPerMatch: stats.total_matches > 0 ? Math.round(((stats.yellow_cards + stats.red_cards) / stats.total_matches) * 10) / 10 : 0
      },
      positions: {
        forward: stats.position_forward,
        midfielder: stats.position_midfielder,
        defender: stats.position_defender,
        goalkeeper: stats.position_goalkeeper,
        mostPlayed: this.getMostPlayedPosition(stats)
      }
    };
  }

  // Get most played position
  static getMostPlayedPosition(stats) {
    const positions = {
      forward: stats.position_forward,
      midfielder: stats.position_midfielder,
      defender: stats.position_defender,
      goalkeeper: stats.position_goalkeeper
    };
    
    return Object.keys(positions).reduce((a, b) => 
      positions[a] > positions[b] ? a : b
    );
  }

  // Search player stats
  static async searchPlayerStats(searchTerm, filters = {}) {
    let query = supabase
      .from('player_stats')
      .select(`
        *,
        users (
          id, username, avatar, skill_level, city
        )
      `);
    
    // Apply filters
    if (filters.sport) {
      query = query.eq('sport', filters.sport);
    }
    if (filters.min_matches) {
      query = query.gte('total_matches', filters.min_matches);
    }
    
    // Search by username
    if (searchTerm) {
      query = query.ilike('users.username', `%${searchTerm}%`);
    }
    
    query = query.order('total_matches', { ascending: false }).limit(50);
    
    const { data, error } = await query;
    if (error) throw error;
    return data;
  }

  // Get sport statistics
  static async getSportStats(sport) {
    const { data, error } = await supabase
      .from('player_stats')
      .select('*')
      .eq('sport', sport);
    
    if (error) throw error;
    
    if (data.length === 0) {
      return null;
    }
    
    const totals = data.reduce((acc, player) => {
      acc.totalMatches += player.total_matches;
      acc.totalWins += player.wins;
      acc.totalLosses += player.losses;
      acc.totalDraws += player.draws;
      acc.totalGoals += player.goals_scored;
      acc.totalAssists += player.assists;
      acc.totalCleanSheets += player.clean_sheets;
      acc.totalYellowCards += player.yellow_cards;
      acc.totalRedCards += player.red_cards;
      return acc;
    }, {
      totalMatches: 0,
      totalWins: 0,
      totalLosses: 0,
      totalDraws: 0,
      totalGoals: 0,
      totalAssists: 0,
      totalCleanSheets: 0,
      totalYellowCards: 0,
      totalRedCards: 0
    });
    
    return {
      ...totals,
      totalPlayers: data.length,
      averageMatches: Math.round(totals.totalMatches / data.length),
      averageWinRate: totals.totalMatches > 0 ? Math.round((totals.totalWins / totals.totalMatches) * 100) : 0,
      averageGoalsPerMatch: totals.totalMatches > 0 ? Math.round((totals.totalGoals / totals.totalMatches) * 10) / 10 : 0
    };
  }

  // Compare two players
  static async comparePlayers(userId1, userId2, sport) {
    const [stats1, stats2] = await Promise.all([
      this.findByUserAndSport(userId1, sport),
      this.findByUserAndSport(userId2, sport)
    ]);
    
    const [user1, user2] = await Promise.all([
      this.getUserById(userId1),
      this.getUserById(userId2)
    ]);
    
    return {
      player1: {
        user: user1,
        stats: stats1
      },
      player2: {
        user: user2,
        stats: stats2
      }
    };
  }

  // Helper to get user by ID
  static async getUserById(userId) {
    const UserModel = require('./UserModel');
    return await UserModel.findById(userId);
  }
}

module.exports = PlayerStatsModel;
