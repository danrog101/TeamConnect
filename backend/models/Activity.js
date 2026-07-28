const supabase = require('../config/supabase');

class ActivityModel {
  // Create a new activity
  static async create(activityData) {
    const { data, error } = await supabase
      .from('activities')
      .insert([activityData])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  // Find activity by ID
  static async findById(id) {
    const { data, error } = await supabase
      .from('activities')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  // Update activity by ID
  static async updateById(id, updateData) {
    const { data, error } = await supabase
      .from('activities')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  // Delete activity by ID
  static async deleteById(id) {
    const { error } = await supabase
      .from('activities')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    return true;
  }

  // Find activities with filters and pagination
  static async find(filters = {}, options = {}) {
    let query = supabase.from('activities').select('*');
    
    // Apply filters
    if (filters.user_id) {
      query = query.eq('user_id', filters.user_id);
    }
    if (filters.type) {
      query = query.eq('type', filters.type);
    }
    if (filters.visibility) {
      query = query.eq('visibility', filters.visibility);
    }
    if (filters.date_from) {
      query = query.gte('created_at', filters.date_from);
    }
    if (filters.date_to) {
      query = query.lte('created_at', filters.date_to);
    }
    
    // Search
    if (filters.search) {
      query = query.or(`team_name.ilike.%${filters.search}%,tournament_name.ilike.%${filters.search}%,field_name.ilike.%${filters.search}%,friend_name.ilike.%${filters.search}%`);
    }
    
    // Sorting
    if (options.sort) {
      const [field, order] = options.sort.split(':');
      query = query.order(field, { ascending: order !== 'desc' });
    } else {
      query = query.order('created_at', { ascending: false });
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

  // Get activities for user with related data
  static async getUserActivities(userId, options = {}) {
    let query = supabase
      .from('activities')
      .select('*')
      .eq('user_id', userId);
    
    // Apply filters
    if (options.type) {
      query = query.eq('type', options.type);
    }
    if (options.visibility) {
      query = query.eq('visibility', options.visibility);
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

  // Get public activities feed
  static async getPublicFeed(options = {}) {
    let query = supabase
      .from('activities')
      .select('*')
      .eq('visibility', 'public');
    
    // Apply filters
    if (options.type) {
      query = query.eq('type', options.type);
    }
    if (options.sport) {
      // This would need to be implemented based on related sport data
      // For now, we'll filter by team or tournament sport if available
    }
    
    // Sorting
    query = query.order('created_at', { ascending: false });
    
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

  // Get activities for user's friends
  static async getFriendsActivities(userId, options = {}) {
    // First get user's friends
    const { data: friendships, error: friendsError } = await supabase
      .from('friendships')
      .select('user1_id, user2_id')
      .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
      .eq('status', 'accepted');
    
    if (friendsError) throw friendsError;
    
    // Extract friend IDs
    const friendIds = friendships.map(f => 
      f.user1_id === userId ? f.user2_id : f.user1_id
    );
    
    if (friendIds.length === 0) {
      return [];
    }
    
    // Get activities from friends
    let query = supabase
      .from('activities')
      .select('*')
      .in('user_id', friendIds)
      .in('visibility', ['public', 'friends']);
    
    // Apply filters
    if (options.type) {
      query = query.eq('type', options.type);
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

  // Create activity helper functions
  static async createTeamCreated(userId, teamId, teamName) {
    return this.create({
      user_id: userId,
      type: 'team_created',
      team_id: teamId,
      team_name: teamName,
      visibility: 'public'
    });
  }

  static async createTeamJoined(userId, teamId, teamName) {
    return this.create({
      user_id: userId,
      type: 'team_joined',
      team_id: teamId,
      team_name: teamName,
      visibility: 'public'
    });
  }

  static async createMatchPlayed(userId, matchId, score, opponent) {
    return this.create({
      user_id: userId,
      type: 'match_played',
      match_id: matchId,
      score,
      opponent,
      visibility: 'public'
    });
  }

  static async createVideoUploaded(userId, videoId, videoTitle) {
    return this.create({
      user_id: userId,
      type: 'video_uploaded',
      video_id: videoId,
      video_title: videoTitle,
      visibility: 'public'
    });
  }

  static async createTournamentCreated(userId, tournamentId, tournamentName) {
    return this.create({
      user_id: userId,
      type: 'tournament_created',
      tournament_id: tournamentId,
      tournament_name: tournamentName,
      visibility: 'public'
    });
  }

  static async createTournamentJoined(userId, tournamentId, tournamentName) {
    return this.create({
      user_id: userId,
      type: 'tournament_joined',
      tournament_id: tournamentId,
      tournament_name: tournamentName,
      visibility: 'public'
    });
  }

  static async createFieldAdded(userId, fieldId, fieldName) {
    return this.create({
      user_id: userId,
      type: 'field_added',
      field_id: fieldId,
      field_name: fieldName,
      visibility: 'public'
    });
  }

  static async createFriendAdded(userId, friendId, friendName) {
    return this.create({
      user_id: userId,
      type: 'friend_added',
      friend_id: friendId,
      friend_name: friendName,
      visibility: 'friends'
    });
  }

  static async createAchievementUnlocked(userId, achievementName) {
    return this.create({
      user_id: userId,
      type: 'achievement_unlocked',
      achievement_name: achievementName,
      visibility: 'public'
    });
  }

  static async createRankUp(userId, oldRank, newRank) {
    return this.create({
      user_id: userId,
      type: 'rank_up',
      old_rank: oldRank,
      new_rank: newRank,
      visibility: 'public'
    });
  }

  static async createGoalScored(userId, score, opponent) {
    return this.create({
      user_id: userId,
      type: 'goal_scored',
      score,
      opponent,
      visibility: 'public'
    });
  }

  static async createMatchWon(userId, opponent, score) {
    return this.create({
      user_id: userId,
      type: 'match_won',
      opponent,
      score,
      visibility: 'public'
    });
  }

  // Get activity statistics
  static async getActivityStats(userId, days = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const { data, error } = await supabase
      .from('activities')
      .select('type, created_at')
      .eq('user_id', userId)
      .gte('created_at', startDate.toISOString());
    
    if (error) throw error;
    
    const stats = {
      totalActivities: data.length,
      activitiesByType: {},
      recentActivities: data.slice(0, 5)
    };
    
    data.forEach(activity => {
      stats.activitiesByType[activity.type] = (stats.activitiesByType[activity.type] || 0) + 1;
    });
    
    return stats;
  }

  // Delete old activities (cleanup)
  static async deleteOldActivities(daysOld = 365) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);
    
    const { error } = await supabase
      .from('activities')
      .delete()
      .lt('created_at', cutoffDate.toISOString());
    
    if (error) throw error;
    return true;
  }

  // Get trending activities
  static async getTrendingActivities(hours = 24, limit = 10) {
    const startDate = new Date();
    startDate.setHours(startDate.getHours() - hours);
    
    const { data, error } = await supabase
      .from('activities')
      .select('type, team_name, tournament_name, field_name')
      .eq('visibility', 'public')
      .gte('created_at', startDate.toISOString());
    
    if (error) throw error;
    
    // Count activities by type and related entities
    const trending = {};
    data.forEach(activity => {
      const key = activity.type;
      trending[key] = (trending[key] || 0) + 1;
    });
    
    // Sort by count and return top activities
    return Object.entries(trending)
      .sort(([,a], [,b]) => b - a)
      .slice(0, limit)
      .map(([type, count]) => ({ type, count }));
  }

  // Search activities
  static async searchActivities(searchTerm, filters = {}) {
    let query = supabase
      .from('activities')
      .select('*')
      .or(`team_name.ilike.%${searchTerm}%,tournament_name.ilike.%${searchTerm}%,field_name.ilike.%${searchTerm}%,friend_name.ilike.%${searchTerm}%,achievement_name.ilike.%${searchTerm}%`);
    
    // Apply additional filters
    if (filters.user_id) {
      query = query.eq('user_id', filters.user_id);
    }
    if (filters.type) {
      query = query.eq('type', filters.type);
    }
    if (filters.visibility) {
      query = query.eq('visibility', filters.visibility);
    }
    
    query = query.order('created_at', { ascending: false }).limit(50);
    
    const { data, error } = await query;
    if (error) throw error;
    return data;
  }

  // Get activities by type
  static async getActivitiesByType(type, options = {}) {
    let query = supabase
      .from('activities')
      .select('*')
      .eq('type', type);
    
    // Apply additional filters
    if (filters.user_id) {
      query = query.eq('user_id', filters.user_id);
    }
    if (filters.visibility) {
      query = query.eq('visibility', filters.visibility);
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
}

module.exports = ActivityModel;
