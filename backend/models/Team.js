const supabase = require('../config/supabase');

class TeamModel {
  // Create a new team
  static async create(teamData) {
    const { data, error } = await supabase
      .from('teams')
      .insert([teamData])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  // Find team by ID
  static async findById(id) {
    const { data, error } = await supabase
      .from('teams')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  // Update team by ID
  static async updateById(id, updateData) {
    const { data, error } = await supabase
      .from('teams')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  // Delete team by ID
  static async deleteById(id) {
    const { error } = await supabase
      .from('teams')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    return true;
  }

  // Find teams with filters and pagination
  static async find(filters = {}, options = {}) {
    let query = supabase.from('teams').select('*');
    
    // Apply filters
    if (filters.sport) {
      query = query.eq('sport', filters.sport);
    }
    if (filters.city) {
      query = query.eq('city', filters.city);
    }
    if (filters.creator_id) {
      query = query.eq('creator_id', filters.creator_id);
    }
    if (filters.date) {
      query = query.gte('date', filters.date);
    }
    if (filters.min_players) {
      query = query.gt('current_players', filters.min_players);
    }
    if (filters.max_players) {
      query = query.lt('current_players', filters.max_players);
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
      query = query.order('date', { ascending: true });
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

  // Get team with members
  static async findByIdWithMembers(id) {
    const { data, error } = await supabase
      .from('teams')
      .select(`
        *,
        team_members (
          user_id,
          joined_at,
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

  // Get team with waitlist
  static async findByIdWithWaitlist(id) {
    const { data, error } = await supabase
      .from('teams')
      .select(`
        *,
        team_waitlist (
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

  // Get team with messages
  static async findByIdWithMessages(id, limit = 50) {
    const { data, error } = await supabase
      .from('teams')
      .select(`
        *,
        team_messages (
          id,
          user_id,
          text,
          type,
          location_lat,
          location_lng,
          location_address,
          image_url,
          created_at,
          users (
            id, username, avatar
          )
        )
      `)
      .eq('id', id)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    
    // Sort messages by created_at
    if (data && data.team_messages) {
      data.team_messages.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    }
    
    return data;
  }

  // Add member to team
  static async addMember(teamId, userId) {
    const { error } = await supabase
      .from('team_members')
      .insert([{
        team_id: teamId,
        user_id: userId
      }]);
    
    if (error) throw error;
    
    // Update current_players count
    await this.updatePlayerCount(teamId);
    
    return true;
  }

  // Remove member from team
  static async removeMember(teamId, userId) {
    const { error } = await supabase
      .from('team_members')
      .delete()
      .eq('team_id', teamId)
      .eq('user_id', userId);
    
    if (error) throw error;
    
    // Update current_players count
    await this.updatePlayerCount(teamId);
    
    return true;
  }

  // Add user to waitlist
  static async addToWaitlist(teamId, userId, email = null) {
    const { error } = await supabase
      .from('team_waitlist')
      .insert([{
        team_id: teamId,
        user_id: userId,
        email: email
      }]);
    
    if (error) throw error;
    return true;
  }

  // Remove user from waitlist
  static async removeFromWaitlist(teamId, userId) {
    const { error } = await supabase
      .from('team_waitlist')
      .delete()
      .eq('team_id', teamId)
      .eq('user_id', userId);
    
    if (error) throw error;
    return true;
  }

  // Get waitlist for team
  static async getWaitlist(teamId) {
    const { data, error } = await supabase
      .from('team_waitlist')
      .select(`
        id,
        user_id,
        email,
        added_at,
        users (
          id, username, email, avatar, skill_level, sport, city
        )
      `)
      .eq('team_id', teamId)
      .order('added_at', { ascending: true });
    
    if (error) throw error;
    return data;
  }

  // Check if user is member of team
  static async isMember(teamId, userId) {
    const { data, error } = await supabase
      .from('team_members')
      .select('*')
      .eq('team_id', teamId)
      .eq('user_id', userId)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return !!data;
  }

  // Check if user is on waitlist
  static async isOnWaitlist(teamId, userId) {
    const { data, error } = await supabase
      .from('team_waitlist')
      .select('*')
      .eq('team_id', teamId)
      .eq('user_id', userId)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return !!data;
  }

  // Get teams for user
  static async getTeamsForUser(userId, options = {}) {
    let query = supabase
      .from('team_members')
      .select(`
        teams (
          id, name, sport, location, city, date, time, max_players, 
          current_players, description, creator_id, created_at
        )
      `)
      .eq('user_id', userId);
    
    if (options.includeCreated) {
      query = supabase
        .from('teams')
        .select('*')
        .or(`creator_id.eq.${userId},id.in.(
          select team_id from team_members where user_id = ${userId}
        )`);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    
    if (options.includeCreated) {
      return data;
    }
    
    return data.map(item => item.teams);
  }

  // Get teams created by user
  static async getCreatedTeams(userId, options = {}) {
    let query = supabase
      .from('teams')
      .select('*')
      .eq('creator_id', userId);
    
    // Apply filters
    if (options.sport) {
      query = query.eq('sport', options.sport);
    }
    if (options.status) {
      query = query.eq('status', options.status);
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

  // Update player count
  static async updatePlayerCount(teamId) {
    // Get current member count
    const { data: members, error: countError } = await supabase
      .from('team_members')
      .select('user_id')
      .eq('team_id', teamId);
    
    if (countError) throw countError;
    
    // Update team with new count
    const { error: updateError } = await supabase
      .from('teams')
      .update({ current_players: members.length })
      .eq('id', teamId);
    
    if (updateError) throw updateError;
    return members.length;
  }

  // Add message to team
  static async addMessage(teamId, userId, messageData) {
    const { data, error } = await supabase
      .from('team_messages')
      .insert([{
        team_id: teamId,
        user_id: userId,
        text: messageData.text,
        type: messageData.type || 'text',
        location_lat: messageData.location?.lat,
        location_lng: messageData.location?.lng,
        location_address: messageData.location?.address,
        image_url: messageData.imageUrl
      }])
      .select(`
        *,
        users (
          id, username, avatar
        )
      `)
      .single();
    
    if (error) throw error;
    return data;
  }

  // Get messages for team
  static async getMessages(teamId, limit = 50, before = null) {
    let query = supabase
      .from('team_messages')
      .select(`
        *,
        users (
          id, username, avatar
        )
      `)
      .eq('team_id', teamId)
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (before) {
      query = query.lt('created_at', before);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    
    // Reverse to get chronological order
    return data.reverse();
  }

  // Search teams
  static async searchTeams(searchTerm, filters = {}) {
    let query = supabase
      .from('teams')
      .select('*')
      .or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,location.ilike.%${searchTerm}%`);
    
    // Apply additional filters
    if (filters.sport) {
      query = query.eq('sport', filters.sport);
    }
    if (filters.city) {
      query = query.eq('city', filters.city);
    }
    if (filters.date_from) {
      query = query.gte('date', filters.date_from);
    }
    if (filters.date_to) {
      query = query.lte('date', filters.date_to);
    }
    
    query = query.order('date', { ascending: true }).limit(20);
    
    const { data, error } = await query;
    if (error) throw error;
    return data;
  }

  // Get team statistics
  static async getTeamStats(teamId) {
    const { data, error } = await supabase
      .from('team_members')
      .select(`
        users (
          skill_level,
          rating_overall,
          total_matches,
          total_wins
        )
      `)
      .eq('team_id', teamId);
    
    if (error) throw error;
    
    const members = data.map(item => item.users);
    const stats = {
      totalMembers: members.length,
      skillLevels: {},
      averageRating: 0,
      totalMatches: 0,
      totalWins: 0
    };
    
    members.forEach(member => {
      // Count skill levels
      const skill = member.skill_level || 'unknown';
      stats.skillLevels[skill] = (stats.skillLevels[skill] || 0) + 1;
      
      // Sum ratings and stats
      stats.averageRating += member.rating_overall || 0;
      stats.totalMatches += member.total_matches || 0;
      stats.totalWins += member.total_wins || 0;
    });
    
    // Calculate averages
    if (members.length > 0) {
      stats.averageRating = Math.round(stats.averageRating / members.length);
    }
    
    return stats;
  }
}

module.exports = TeamModel;
