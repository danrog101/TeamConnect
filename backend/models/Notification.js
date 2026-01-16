const supabase = require('../config/supabase');

class NotificationModel {
  // Create a new notification
  static async create(notificationData) {
    const { data, error } = await supabase
      .from('notifications')
      .insert([notificationData])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  // Find notification by ID
  static async findById(id) {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  // Update notification by ID
  static async updateById(id, updateData) {
    const { data, error } = await supabase
      .from('notifications')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  // Delete notification by ID
  static async deleteById(id) {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    return true;
  }

  // Find notifications with filters and pagination
  static async find(filters = {}, options = {}) {
    let query = supabase.from('notifications').select('*');
    
    // Apply filters
    if (filters.recipient_id) {
      query = query.eq('recipient_id', filters.recipient_id);
    }
    if (filters.sender_id) {
      query = query.eq('sender_id', filters.sender_id);
    }
    if (filters.type) {
      query = query.eq('type', filters.type);
    }
    if (filters.read !== undefined) {
      query = query.eq('read', filters.read);
    }
    if (filters.date_from) {
      query = query.gte('created_at', filters.date_from);
    }
    if (filters.date_to) {
      query = query.lte('created_at', filters.date_to);
    }
    
    // Search
    if (filters.search) {
      query = query.or(`title.ilike.%${filters.search}%,message.ilike.%${filters.search}%`);
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

  // Get notifications for user with sender details
  static async getUserNotifications(userId, options = {}) {
    let query = supabase
      .from('notifications')
      .select(`
        *,
        sender:users!notifications_sender_id_fkey (
          id, username, avatar
        )
      `)
      .eq('recipient_id', userId);
    
    // Apply filters
    if (options.type) {
      query = query.eq('type', options.type);
    }
    if (options.read !== undefined) {
      query = query.eq('read', options.read);
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

  // Get unread notifications count for user
  static async getUnreadCount(userId) {
    const { data, error } = await supabase
      .from('notifications')
      .select('id')
      .eq('recipient_id', userId)
      .eq('read', false);
    
    if (error) throw error;
    return data.length;
  }

  // Mark notification as read
  static async markAsRead(notificationId, userId) {
    const { data, error } = await supabase
      .from('notifications')
      .update({ 
        read: true, 
        read_at: new Date().toISOString() 
      })
      .eq('id', notificationId)
      .eq('recipient_id', userId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  // Mark all notifications as read for user
  static async markAllAsRead(userId) {
    const { error } = await supabase
      .from('notifications')
      .update({ 
        read: true, 
        read_at: new Date().toISOString() 
      })
      .eq('recipient_id', userId)
      .eq('read', false);
    
    if (error) throw error;
    return true;
  }

  // Delete notification for user
  static async deleteNotification(notificationId, userId) {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId)
      .eq('recipient_id', userId);
    
    if (error) throw error;
    return true;
  }

  // Delete all notifications for user
  static async deleteAllNotifications(userId, filters = {}) {
    let query = supabase
      .from('notifications')
      .delete()
      .eq('recipient_id', userId);
    
    if (filters.read !== undefined) {
      query = query.eq('read', filters.read);
    }
    if (filters.type) {
      query = query.eq('type', filters.type);
    }
    
    const { error } = await query;
    if (error) throw error;
    return true;
  }

  // Create notification helper functions
  static async createFriendRequest(recipientId, senderId, message = '') {
    return this.create({
      recipient_id: recipientId,
      sender_id: senderId,
      type: 'friend_request',
      title: 'New Friend Request',
      message: message || `${senderId} wants to be your friend!`,
      link: '/friends'
    });
  }

  static async createFriendAccepted(recipientId, senderId, friendName) {
    return this.create({
      recipient_id: recipientId,
      sender_id: senderId,
      type: 'friend_accepted',
      title: 'Friend Request Accepted',
      message: `${friendName} accepted your friend request!`,
      link: '/friends'
    });
  }

  static async createTeamInvite(recipientId, senderId, teamId, teamName) {
    return this.create({
      recipient_id: recipientId,
      sender_id: senderId,
      type: 'team_invite',
      title: 'Team Invitation',
      message: `You've been invited to join ${teamName}!`,
      link: `/teams/${teamId}`,
      team_id: teamId
    });
  }

  static async createTeamJoined(recipientId, senderId, teamId, teamName) {
    return this.create({
      recipient_id: recipientId,
      sender_id: senderId,
      type: 'team_joined',
      title: 'New Team Member',
      message: `${senderId} joined your team ${teamName}!`,
      link: `/teams/${teamId}`,
      team_id: teamId
    });
  }

  static async createMatchStarting(recipientId, matchId, teamName, startTime) {
    return this.create({
      recipient_id: recipientId,
      type: 'match_starting',
      title: 'Match Starting Soon',
      message: `Your match with ${teamName} starts at ${startTime}!`,
      link: `/matches/${matchId}`,
      match_id: matchId
    });
  }

  static async createTournamentStarting(recipientId, tournamentId, tournamentName, startDate) {
    return this.create({
      recipient_id: recipientId,
      type: 'tournament_starting',
      title: 'Tournament Starting Soon',
      message: `${tournamentName} starts on ${startDate}!`,
      link: `/tournaments/${tournamentId}`,
      tournament_id: tournamentId
    });
  }

  static async createWaitlistSpotAvailable(recipientId, tournamentId, tournamentName) {
    return this.create({
      recipient_id: recipientId,
      type: 'waitlist_spot_available',
      title: 'Tournament Spot Available',
      message: `A spot has opened up in ${tournamentName}!`,
      link: `/tournaments/${tournamentId}`,
      tournament_id: tournamentId
    });
  }

  static async createAchievementUnlocked(recipientId, achievementName) {
    return this.create({
      recipient_id: recipientId,
      type: 'achievement_unlocked',
      title: 'Achievement Unlocked',
      message: `Congratulations! You unlocked: ${achievementName}`,
      link: '/profile'
    });
  }

  static async createRankUp(recipientId, oldRank, newRank) {
    return this.create({
      recipient_id: recipientId,
      type: 'rank_up',
      title: 'Rank Up!',
      message: `You ranked up from ${oldRank} to ${newRank}!`,
      link: '/profile'
    });
  }

  static async createVideoLiked(recipientId, videoId, videoTitle, likerName) {
    return this.create({
      recipient_id: recipientId,
      type: 'video_liked',
      title: 'Video Liked',
      message: `${likerName} liked your video: ${videoTitle}`,
      link: `/videos/${videoId}`,
      video_id: videoId
    });
  }

  static async createVideoCommented(recipientId, videoId, videoTitle, commenterName) {
    return this.create({
      recipient_id: recipientId,
      type: 'video_commented',
      title: 'New Video Comment',
      message: `${commenterName} commented on your video: ${videoTitle}`,
      link: `/videos/${videoId}`,
      video_id: videoId
    });
  }

  static async createMention(recipientId, senderId, content, link) {
    return this.create({
      recipient_id: recipientId,
      sender_id: senderId,
      type: 'mention',
      title: 'You were mentioned',
      message: content,
      link: link
    });
  }

  static async createSystemNotification(recipientId, title, message, link = null) {
    return this.create({
      recipient_id: recipientId,
      type: 'system',
      title,
      message,
      link
    });
  }

  // Get notification statistics
  static async getNotificationStats(userId, days = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const { data, error } = await supabase
      .from('notifications')
      .select('type, read, created_at')
      .eq('recipient_id', userId)
      .gte('created_at', startDate.toISOString());
    
    if (error) throw error;
    
    const stats = {
      totalNotifications: data.length,
      unreadNotifications: data.filter(n => !n.read).length,
      notificationsByType: {},
      recentNotifications: data.slice(0, 5)
    };
    
    data.forEach(notification => {
      stats.notificationsByType[notification.type] = (stats.notificationsByType[notification.type] || 0) + 1;
    });
    
    return stats;
  }

  // Delete old read notifications (cleanup)
  static async deleteOldReadNotifications(daysOld = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);
    
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('read', true)
      .lt('created_at', cutoffDate.toISOString());
    
    if (error) throw error;
    return true;
  }

  // Get notifications by type
  static async getNotificationsByType(userId, type, options = {}) {
    let query = supabase
      .from('notifications')
      .select(`
        *,
        sender:users!notifications_sender_id_fkey (
          id, username, avatar
        )
      `)
      .eq('recipient_id', userId)
      .eq('type', type);
    
    // Apply additional filters
    if (options.read !== undefined) {
      query = query.eq('read', options.read);
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

  // Search notifications
  static async searchNotifications(userId, searchTerm, options = {}) {
    let query = supabase
      .from('notifications')
      .select(`
        *,
        sender:users!notifications_sender_id_fkey (
          id, username, avatar
        )
      `)
      .eq('recipient_id', userId)
      .or(`title.ilike.%${searchTerm}%,message.ilike.%${searchTerm}%`);
    
    // Apply additional filters
    if (options.type) {
      query = query.eq('type', options.type);
    }
    if (options.read !== undefined) {
      query = query.eq('read', options.read);
    }
    
    query = query.order('created_at', { ascending: false }).limit(50);
    
    const { data, error } = await query;
    if (error) throw error;
    return data;
  }

  // Get recent notifications for real-time updates
  static async getRecentNotifications(userId, minutes = 5) {
    const startDate = new Date();
    startDate.setMinutes(startDate.getMinutes() - minutes);
    
    const { data, error } = await supabase
      .from('notifications')
      .select(`
        *,
        sender:users!notifications_sender_id_fkey (
          id, username, avatar
        )
      `)
      .eq('recipient_id', userId)
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  }
}

module.exports = NotificationModel;
