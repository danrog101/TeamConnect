const supabase = require('../config/supabase');

class VideoModel {
  // Create a new video
  static async create(videoData) {
    const { data, error } = await supabase
      .from('videos')
      .insert([videoData])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  // Find video by ID
  static async findById(id) {
    const { data, error } = await supabase
      .from('videos')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  // Update video by ID
  static async updateById(id, updateData) {
    const { data, error } = await supabase
      .from('videos')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  // Delete video by ID
  static async deleteById(id) {
    const { error } = await supabase
      .from('videos')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    return true;
  }

  // Find videos with filters and pagination
  static async find(filters = {}, options = {}) {
    let query = supabase.from('videos').select('*');
    
    // Apply filters
    if (filters.author_id) {
      query = query.eq('author_id', filters.author_id);
    }
    if (filters.category) {
      query = query.eq('category', filters.category);
    }
    if (filters.trending !== undefined) {
      query = query.eq('trending', filters.trending);
    }
    if (filters.min_views) {
      query = query.gte('views', filters.min_views);
    }
    if (filters.date_from) {
      query = query.gte('created_at', filters.date_from);
    }
    if (filters.date_to) {
      query = query.lte('created_at', filters.date_to);
    }
    
    // Search
    if (filters.search) {
      query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
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

  // Get video with author details
  static async findByIdWithAuthor(id) {
    const { data, error } = await supabase
      .from('videos')
      .select(`
        *,
        author:users!videos_author_id_fkey (
          id, username, avatar, skill_level, sport
        )
      `)
      .eq('id', id)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  // Get video with likes and comments
  static async findByIdWithDetails(id, userId = null) {
    const { data, error } = await supabase
      .from('videos')
      .select(`
        *,
        author:users!videos_author_id_fkey (
          id, username, avatar, skill_level, sport
        ),
        video_likes (
          user_id
        ),
        video_comments (
          id,
          user_id,
          text,
          created_at,
          users (
            id, username, avatar
          )
        )
      `)
      .eq('id', id)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    
    if (data) {
      // Process likes
      data.likes = data.video_likes || [];
      data.likesCount = data.likes.length;
      data.isLiked = userId ? data.likes.some(like => like.user_id === userId) : false;
      
      // Process comments
      data.comments = data.video_comments || [];
      data.commentsCount = data.comments.length;
      // Sort comments by date
      data.comments.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
      
      // Clean up the response
      delete data.video_likes;
      delete data.video_comments;
    }
    
    return data;
  }

  // Like video
  static async likeVideo(videoId, userId) {
    const { error } = await supabase
      .from('video_likes')
      .insert([{
        video_id: videoId,
        user_id: userId
      }]);
    
    if (error) throw error;
    
    // Update video likes count
    await this.updateLikesCount(videoId);
    
    return true;
  }

  // Unlike video
  static async unlikeVideo(videoId, userId) {
    const { error } = await supabase
      .from('video_likes')
      .delete()
      .eq('video_id', videoId)
      .eq('user_id', userId);
    
    if (error) throw error;
    
    // Update video likes count
    await this.updateLikesCount(videoId);
    
    return true;
  }

  // Check if user liked video
  static async isLikedByUser(videoId, userId) {
    const { data, error } = await supabase
      .from('video_likes')
      .select('*')
      .eq('video_id', videoId)
      .eq('user_id', userId)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return !!data;
  }

  // Update likes count (helper function)
  static async updateLikesCount(videoId) {
    const { data, error } = await supabase
      .from('video_likes')
      .select('user_id')
      .eq('video_id', videoId);
    
    if (error) throw error;
    
    // Note: In a real implementation, you might want to store likes_count as a separate field
    // or use a database trigger to keep it updated
    
    return data.length;
  }

  // Add comment to video
  static async addComment(videoId, userId, text) {
    const { data, error } = await supabase
      .from('video_comments')
      .insert([{
        video_id: videoId,
        user_id: userId,
        text
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

  // Update comment
  static async updateComment(commentId, userId, text) {
    const { data, error } = await supabase
      .from('video_comments')
      .update({ text })
      .eq('id', commentId)
      .eq('user_id', userId)
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

  // Delete comment
  static async deleteComment(commentId, userId) {
    const { error } = await supabase
      .from('video_comments')
      .delete()
      .eq('id', commentId)
      .eq('user_id', userId);
    
    if (error) throw error;
    return true;
  }

  // Get comments for video
  static async getComments(videoId, options = {}) {
    let query = supabase
      .from('video_comments')
      .select(`
        *,
        users (
          id, username, avatar
        )
      `)
      .eq('video_id', videoId)
      .order('created_at', { ascending: true });
    
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

  // Increment video views
  static async incrementViews(videoId) {
    const { data, error } = await supabase.rpc('increment_video_views', { 
      video_id: videoId 
    });
    
    if (error) {
      // Fallback if RPC doesn't exist
      const video = await this.findById(videoId);
      if (video) {
        await this.updateById(videoId, { views: video.views + 1 });
      }
    }
    
    return data;
  }

  // Get videos by author
  static async getVideosByAuthor(authorId, options = {}) {
    let query = supabase
      .from('videos')
      .select('*')
      .eq('author_id', authorId);
    
    // Apply filters
    if (options.category) {
      query = query.eq('category', options.category);
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

  // Get trending videos
  static async getTrendingVideos(limit = 10, category = null) {
    let query = supabase
      .from('videos')
      .select('*')
      .eq('trending', true)
      .order('views', { ascending: false })
      .limit(limit);
    
    if (category) {
      query = query.eq('category', category);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data;
  }

  // Get most viewed videos
  static async getMostViewedVideos(limit = 10, category = null, days = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    let query = supabase
      .from('videos')
      .select('*')
      .gte('created_at', startDate.toISOString())
      .order('views', { ascending: false })
      .limit(limit);
    
    if (category) {
      query = query.eq('category', category);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data;
  }

  // Get recent videos
  static async getRecentVideos(limit = 20, category = null) {
    let query = supabase
      .from('videos')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (category) {
      query = query.eq('category', category);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data;
  }

  // Search videos
  static async searchVideos(searchTerm, filters = {}) {
    let query = supabase
      .from('videos')
      .select(`
        *,
        author:users!videos_author_id_fkey (
          id, username, avatar
        )
      `)
      .or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
    
    // Apply additional filters
    if (filters.category) {
      query = query.eq('category', filters.category);
    }
    if (filters.author_id) {
      query = query.eq('author_id', filters.author_id);
    }
    
    query = query.order('created_at', { ascending: false }).limit(50);
    
    const { data, error } = await query;
    if (error) throw error;
    return data;
  }

  // Get video statistics
  static async getVideoStats(videoId) {
    const { data, error } = await supabase
      .from('videos')
      .select(`
        views,
        video_likes (
          user_id
        ),
        video_comments (
          id
        )
      `)
      .eq('id', videoId)
      .single();
    
    if (error) throw error;
    
    return {
      views: data.views || 0,
      likesCount: data.video_likes?.length || 0,
      commentsCount: data.video_comments?.length || 0
    };
  }

  // Get author statistics
  static async getAuthorStats(authorId) {
    const { data, error } = await supabase
      .from('videos')
      .select('views, created_at')
      .eq('author_id', authorId);
    
    if (error) throw error;
    
    if (data.length === 0) {
      return {
        totalVideos: 0,
        totalViews: 0,
        averageViews: 0,
        oldestVideo: null,
        newestVideo: null
      };
    }
    
    const totalViews = data.reduce((sum, video) => sum + video.views, 0);
    const dates = data.map(video => new Date(video.created_at));
    
    return {
      totalVideos: data.length,
      totalViews,
      averageViews: Math.round(totalViews / data.length),
      oldestVideo: new Date(Math.min(...dates)),
      newestVideo: new Date(Math.max(...dates))
    };
  }

  // Update trending status
  static async updateTrendingStatus() {
    // This would typically be run by a scheduled job
    // Logic to determine which videos should be marked as trending
    // based on views, likes, comments, and recency
    
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    // Reset all trending flags
    await supabase
      .from('videos')
      .update({ trending: false });
    
    // Get top videos by engagement score
    const { data: topVideos, error } = await supabase
      .from('videos')
      .select(`
        id,
        views,
        video_likes (user_id),
        video_comments (id),
        created_at
      `)
      .gte('created_at', thirtyDaysAgo.toISOString());
    
    if (error) throw error;
    
    // Calculate engagement scores and mark top videos as trending
    const videosWithScores = topVideos.map(video => {
      const likesCount = video.video_likes?.length || 0;
      const commentsCount = video.video_comments?.length || 0;
      const daysSinceCreated = Math.max(1, Math.floor((new Date() - new Date(video.created_at)) / (1000 * 60 * 60 * 24)));
      
      // Engagement score: (views + likes*10 + comments*20) / daysSinceCreated
      const engagementScore = (video.views + (likesCount * 10) + (commentsCount * 20)) / daysSinceCreated;
      
      return {
        id: video.id,
        score: engagementScore
      };
    });
    
    // Sort by score and take top 10
    videosWithScores.sort((a, b) => b.score - a.score);
    const trendingIds = videosWithScores.slice(0, 10).map(v => v.id);
    
    // Update trending status
    if (trendingIds.length > 0) {
      await supabase
        .from('videos')
        .update({ trending: true })
        .in('id', trendingIds);
    }
    
    return trendingIds.length;
  }

  // Get videos by category
  static async getVideosByCategory(category, options = {}) {
    let query = supabase
      .from('videos')
      .select('*')
      .eq('category', category);
    
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
    
    const { data, error } = await query;
    if (error) throw error;
    return data;
  }

  // Get category statistics
  static async getCategoryStats() {
    const { data, error } = await supabase
      .from('videos')
      .select('category')
      .not('category', 'is', null);
    
    if (error) throw error;
    
    const stats = {};
    data.forEach(video => {
      stats[video.category] = (stats[video.category] || 0) + 1;
    });
    
    return stats;
  }
}

module.exports = VideoModel;
