const supabase = require('../config/supabase');

class UserModel {
  // Create a new user
  static async create(userData) {
    const { data, error } = await supabase
      .from('users')
      .insert([userData])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  // Find user by ID
  static async findById(id) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = not found
    return data;
  }

  // Find user by email
  static async findByEmail(email) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  // Find user by username
  static async findByUsername(username) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  // Update user by ID
  static async updateById(id, updateData) {
    const { data, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  // Delete user by ID
  static async deleteById(id) {
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    return true;
  }

  // Find users with filters and pagination
  static async find(filters = {}, options = {}) {
    let query = supabase.from('users').select('*');
    
    // Apply filters
    if (filters.sport) {
      query = query.eq('sport', filters.sport);
    }
    if (filters.city) {
      query = query.eq('city', filters.city);
    }
    if (filters.skill_level) {
      query = query.eq('skill_level', filters.skill_level);
    }
    if (filters.gender) {
      query = query.eq('gender', filters.gender);
    }
    if (filters.min_rating) {
      query = query.gte('rating_overall', filters.min_rating);
    }
    if (filters.max_rating) {
      query = query.lte('rating_overall', filters.max_rating);
    }
    
    // Search
    if (filters.search) {
      query = query.or(`username.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
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

  // Get user's friends
  static async getFriends(userId) {
    const { data, error } = await supabase
      .from('friendships')
      .select(`
        user2_id:users!friendships_user2_id_fkey (
          id, username, email, avatar, skill_level, sport, city
        ),
        user1_id:users!friendships_user1_id_fkey (
          id, username, email, avatar, skill_level, sport, city
        )
      `)
      .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
      .eq('status', 'accepted');
    
    if (error) throw error;
    
    // Transform the data to get friends list
    const friends = data.map(friendship => {
      if (friendship.user1_id.id === userId) {
        return friendship.user2_id;
      } else {
        return friendship.user1_id;
      }
    });
    
    return friends;
  }

  // Get user's friend requests
  static async getFriendRequests(userId) {
    const { data, error } = await supabase
      .from('friend_requests')
      .select(`
        from_user_id:users!friend_requests_from_user_id_fkey (
          id, username, email, avatar, skill_level, sport, city
        )
      `)
      .eq('to_user_id', userId)
      .order('sent_at', { ascending: false });
    
    if (error) throw error;
    return data.map(req => req.from_user_id);
  }

  // Add friend
  static async addFriend(userId1, userId2, message = '') {
    const { error } = await supabase
      .from('friend_requests')
      .insert([{
        from_user_id: userId1,
        to_user_id: userId2,
        message
      }]);
    
    if (error) throw error;
    return true;
  }

  // Accept friend request
  static async acceptFriendRequest(fromUserId, toUserId) {
    // Start a transaction-like operation
    const { error: deleteError } = await supabase
      .from('friend_requests')
      .delete()
      .eq('from_user_id', fromUserId)
      .eq('to_user_id', toUserId);
    
    if (deleteError) throw deleteError;
    
    const { error: insertError } = await supabase
      .from('friendships')
      .insert([{
        user1_id: fromUserId,
        user2_id: toUserId,
        status: 'accepted'
      }]);
    
    if (insertError) throw insertError;
    return true;
  }

  // Update user's rating
  static async updateRating(userId, ratingData) {
    const { data, error } = await supabase
      .from('users')
      .update({
        rating_overall: ratingData.overall,
        rating_attack: ratingData.attack,
        rating_defense: ratingData.defense,
        rating_teamwork: ratingData.teamwork,
        rating_consistency: ratingData.consistency,
        rating_last_updated: new Date().toISOString(),
        rank: ratingData.rank
      })
      .eq('id', userId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  // Update user's statistics
  static async updateStats(userId, statsData) {
    const { data, error } = await supabase
      .from('users')
      .update({
        total_matches: statsData.total_matches,
        total_wins: statsData.total_wins,
        total_goals: statsData.total_goals,
        last_active: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  // Get top players by rating
  static async getTopPlayers(limit = 10, sport = null) {
    let query = supabase
      .from('users')
      .select('*')
      .order('rating_overall', { ascending: false })
      .limit(limit);
    
    if (sport) {
      query = query.eq('sport', sport);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data;
  }

  // Search users
  static async searchUsers(searchTerm, filters = {}) {
    let query = supabase
      .from('users')
      .select('*')
      .or(`username.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%`);
    
    // Apply additional filters
    if (filters.sport) {
      query = query.eq('sport', filters.sport);
    }
    if (filters.city) {
      query = query.eq('city', filters.city);
    }
    if (filters.skill_level) {
      query = query.eq('skill_level', filters.skill_level);
    }
    
    query = query.order('rating_overall', { ascending: false }).limit(20);
    
    const { data, error } = await query;
    if (error) throw error;
    return data;
  }

  // Check if users are friends
  static async areFriends(userId1, userId2) {
    const { data, error } = await supabase
      .from('friendships')
      .select('*')
      .or(`(user1_id.eq.${userId1} AND user2_id.eq.${userId2}), (user1_id.eq.${userId2} AND user2_id.eq.${userId1})`)
      .eq('status', 'accepted')
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return !!data;
  }

  // Remove friend
  static async removeFriend(userId1, userId2) {
    const { error } = await supabase
      .from('friendships')
      .delete()
      .or(`(user1_id.eq.${userId1} AND user2_id.eq.${userId2}), (user1_id.eq.${userId2} AND user2_id.eq.${userId1})`);
    
    if (error) throw error;
    return true;
  }

  // Update last active timestamp
  static async updateLastActive(userId) {
    const { error } = await supabase
      .from('users')
      .update({ last_active: new Date().toISOString() })
      .eq('id', userId);
    
    if (error) throw error;
    return true;
  }
}

module.exports = UserModel;
