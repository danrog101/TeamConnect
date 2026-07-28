const supabase = require('../config/supabase');

class TournamentModel {
  // Create a new tournament
  static async create(tournamentData) {
    const { data, error } = await supabase
      .from('tournaments')
      .insert([tournamentData])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  // Find tournament by ID
  static async findById(id) {
    const { data, error } = await supabase
      .from('tournaments')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  // Update tournament by ID
  static async updateById(id, updateData) {
    const { data, error } = await supabase
      .from('tournaments')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  // Delete tournament by ID
  static async deleteById(id) {
    const { error } = await supabase
      .from('tournaments')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    return true;
  }

  // Find tournaments with filters and pagination
  static async find(filters = {}, options = {}) {
    let query = supabase.from('tournaments').select('*');
    
    // Apply filters
    if (filters.sport) {
      query = query.eq('sport', filters.sport);
    }
    if (filters.city) {
      query = query.eq('city', filters.city);
    }
    if (filters.status) {
      query = query.eq('status', filters.status);
    }
    if (filters.gender_filter) {
      query = query.eq('gender_filter', filters.gender_filter);
    }
    if (filters.creator_id) {
      query = query.eq('creator_id', filters.creator_id);
    }
    if (filters.start_date_from) {
      query = query.gte('start_date', filters.start_date_from);
    }
    if (filters.start_date_to) {
      query = query.lte('start_date', filters.start_date_to);
    }
    if (filters.entry_fee_max) {
      query = query.lte('entry_fee', filters.entry_fee_max);
    }
    if (filters.free_only) {
      query = query.eq('entry_fee', 0);
    }
    
    // Search
    if (filters.search) {
      query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
    }
    
    // Sorting
    if (options.sort) {
      const [field, order] = options.sort.split(':');
      query = query.order(field, { ascending: order !== 'desc' });
    } else {
      query = query.order('start_date', { ascending: true });
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

  // Get tournament with registered teams
  static async findByIdWithTeams(id) {
    const { data, error } = await supabase
      .from('tournaments')
      .select(`
        *,
        tournament_teams (
          id,
          team_name,
          captain_id,
          registered_at,
          users (
            id, username, email, avatar
          ),
          tournament_team_players (
            id,
            name,
            position
          )
        )
      `)
      .eq('id', id)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  // Get tournament with bracket
  static async findByIdWithBracket(id) {
    const { data, error } = await supabase
      .from('tournaments')
      .select(`
        *,
        tournament_bracket (
          id,
          round_number,
          match_number,
          team1_name,
          team2_name,
          score1,
          score2,
          winner,
          scheduled_date,
          played_date
        )
      `)
      .eq('id', id)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  // Get tournament with waitlist
  static async findByIdWithWaitlist(id) {
    const { data, error } = await supabase
      .from('tournaments')
      .select(`
        *,
        tournament_waitlist (
          id,
          user_id,
          email,
          added_at,
          users (
            id, username, email, avatar, skill_level, sport, city
          )
        )
      `)
      .eq('id', id)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  // Register team for tournament
  static async registerTeam(tournamentId, teamData) {
    const { data, error } = await supabase
      .from('tournament_teams')
      .insert([{
        tournament_id: tournamentId,
        team_name: teamData.teamName,
        captain_id: teamData.captainId
      }])
      .select()
      .single();
    
    if (error) throw error;
    
    // Add players if provided
    if (teamData.players && teamData.players.length > 0) {
      const playersData = teamData.players.map(player => ({
        tournament_team_id: data.id,
        name: player.name,
        position: player.position
      }));
      
      await supabase
        .from('tournament_team_players')
        .insert(playersData);
    }
    
    return data;
  }

  // Get waitlist for tournament
  static async getWaitlist(tournamentId) {
    const { data, error } = await supabase
      .from('tournament_waitlist')
      .select(`
        id,
        user_id,
        email,
        added_at,
        users (
          id, username, email, avatar, skill_level, sport, city
        )
      `)
      .eq('tournament_id', tournamentId)
      .order('added_at', { ascending: true });
    
    if (error) throw error;
    return data;
  }

  // Add user to tournament waitlist
  static async addToWaitlist(tournamentId, userId, email = null) {
    const { error } = await supabase
      .from('tournament_waitlist')
      .insert([{
        tournament_id: tournamentId,
        user_id: userId,
        email: email
      }]);
    
    if (error) throw error;
    return true;
  }

  // Remove user from tournament waitlist
  static async removeFromWaitlist(tournamentId, userId) {
    const { error } = await supabase
      .from('tournament_waitlist')
      .delete()
      .eq('tournament_id', tournamentId)
      .eq('user_id', userId);
    
    if (error) throw error;
    return true;
  }

  // Check if user is on tournament waitlist
  static async isOnWaitlist(tournamentId, userId) {
    const { data, error } = await supabase
      .from('tournament_waitlist')
      .select('*')
      .eq('tournament_id', tournamentId)
      .eq('user_id', userId)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return !!data;
  }

  // Check if team is registered for tournament
  static async isTeamRegistered(tournamentId, teamName) {
    const { data, error } = await supabase
      .from('tournament_teams')
      .select('*')
      .eq('tournament_id', tournamentId)
      .eq('team_name', teamName)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return !!data;
  }

  // Get registered teams count
  static async getRegisteredTeamsCount(tournamentId) {
    const { data, error } = await supabase
      .from('tournament_teams')
      .select('id')
      .eq('tournament_id', tournamentId);
    
    if (error) throw error;
    return data.length;
  }

  // Update tournament bracket
  static async updateBracket(tournamentId, bracketData) {
    // Clear existing bracket
    await supabase
      .from('tournament_bracket')
      .delete()
      .eq('tournament_id', tournamentId);
    
    // Insert new bracket data
    if (bracketData && bracketData.length > 0) {
      const bracketInsertData = bracketData.map(match => ({
        tournament_id: tournamentId,
        round_number: match.roundNumber,
        match_number: match.matchNumber,
        team1_name: match.team1,
        team2_name: match.team2,
        score1: match.score1,
        score2: match.score2,
        winner: match.winner,
        scheduled_date: match.scheduledDate,
        played_date: match.playedDate
      }));
      
      const { error } = await supabase
        .from('tournament_bracket')
        .insert(bracketInsertData);
      
      if (error) throw error;
    }
    
    return true;
  }

  // Get tournaments created by user
  static async getCreatedTournaments(userId, options = {}) {
    let query = supabase
      .from('tournaments')
      .select('*')
      .eq('creator_id', userId);
    
    // Apply filters
    if (options.status) {
      query = query.eq('status', options.status);
    }
    if (options.sport) {
      query = query.eq('sport', options.sport);
    }
    
    // Sorting
    query = query.order('created_at', { ascending: false });
    
    // Pagination
    if (options.limit) {
      query = query.limit(options.limit);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data;
  }

  // Get tournaments user is participating in
  static async getParticipatingTournaments(userId, options = {}) {
    const { data, error } = await supabase
      .from('tournament_teams')
      .select(`
        tournaments (
          id, name, sport, location, city, start_date, end_date,
          status, entry_fee, description, creator_id, created_at
        )
      `)
      .eq('captain_id', userId);
    
    if (error) throw error;
    
    let tournaments = data.map(item => item.tournaments);
    
    // Apply additional filters
    if (options.status) {
      tournaments = tournaments.filter(t => t.status === options.status);
    }
    if (options.sport) {
      tournaments = tournaments.filter(t => t.sport === options.sport);
    }
    
    // Sort
    tournaments.sort((a, b) => new Date(a.start_date) - new Date(b.start_date));
    
    // Pagination
    if (options.limit) {
      tournaments = tournaments.slice(0, options.limit);
    }
    
    return tournaments;
  }

  // Search tournaments
  static async searchTournaments(searchTerm, filters = {}) {
    let query = supabase
      .from('tournaments')
      .select('*')
      .or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,location.ilike.%${searchTerm}%`);
    
    // Apply additional filters
    if (filters.sport) {
      query = query.eq('sport', filters.sport);
    }
    if (filters.city) {
      query = query.eq('city', filters.city);
    }
    if (filters.status) {
      query = query.eq('status', filters.status);
    }
    if (filters.gender_filter) {
      query = query.eq('gender_filter', filters.gender_filter);
    }
    if (filters.start_date_from) {
      query = query.gte('start_date', filters.start_date_from);
    }
    if (filters.start_date_to) {
      query = query.lte('start_date', filters.start_date_to);
    }
    
    query = query.order('start_date', { ascending: true }).limit(20);
    
    const { data, error } = await query;
    if (error) throw error;
    return data;
  }

  // Get tournament statistics
  static async getTournamentStats(tournamentId) {
    const { data, error } = await supabase
      .from('tournament_teams')
      .select(`
        captain_id,
        users (
          skill_level,
          rating_overall,
          total_matches,
          total_wins
        )
      `)
      .eq('tournament_id', tournamentId);
    
    if (error) throw error;
    
    const captains = data.map(item => item.users);
    const stats = {
      totalTeams: data.length,
      skillLevels: {},
      averageRating: 0,
      totalMatches: 0,
      totalWins: 0
    };
    
    captains.forEach(captain => {
      // Count skill levels
      const skill = captain.skill_level || 'unknown';
      stats.skillLevels[skill] = (stats.skillLevels[skill] || 0) + 1;
      
      // Sum ratings and stats
      stats.averageRating += captain.rating_overall || 0;
      stats.totalMatches += captain.total_matches || 0;
      stats.totalWins += captain.total_wins || 0;
    });
    
    // Calculate averages
    if (captains.length > 0) {
      stats.averageRating = Math.round(stats.averageRating / captains.length);
    }
    
    return stats;
  }

  // Update tournament status
  static async updateStatus(tournamentId, status) {
    const { data, error } = await supabase
      .from('tournaments')
      .update({ status })
      .eq('id', tournamentId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  // Get upcoming tournaments
  static async getUpcomingTournaments(limit = 10) {
    const { data, error } = await supabase
      .from('tournaments')
      .select('*')
      .eq('status', 'upcoming')
      .gte('start_date', new Date().toISOString().split('T')[0])
      .order('start_date', { ascending: true })
      .limit(limit);
    
    if (error) throw error;
    return data;
  }

  // Get active tournaments
  static async getActiveTournaments(limit = 10) {
    const { data, error } = await supabase
      .from('tournaments')
      .select('*')
      .eq('status', 'active')
      .order('start_date', { ascending: false })
      .limit(limit);
    
    if (error) throw error;
    return data;
  }

  // Get finished tournaments
  static async getFinishedTournaments(limit = 10) {
    const { data, error } = await supabase
      .from('tournaments')
      .select('*')
      .eq('status', 'finished')
      .order('end_date', { ascending: false })
      .limit(limit);
    
    if (error) throw error;
    return data;
  }
}

module.exports = TournamentModel;
