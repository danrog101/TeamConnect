const { supabase } = require('../config/supabase');

// Helper function to create activity
const createActivityHelper = async (userId, type, data, visibility = 'public') => {
  try {
    const activityData = {
      user_id: userId,
      type,
      visibility,
      ...data,
      created_at: new Date().toISOString()
    };

    const { data: activity, error } = await supabase
      .from('activities')
      .insert(activityData)
      .select()
      .single();

    if (error) {
      console.error('Create activity helper error:', error);
      throw error;
    }

    return activity;
  } catch (error) {
    console.error('Create activity helper error:', error);
    throw error;
  }
};

// Get activity feed - shows only friends' activities and own activities
exports.getActivityFeed = async (req, res) => {
  try {
    const userId = req.user.id;
    const { type, limit = 50, page = 1 } = req.query;

    const offset = (page - 1) * limit;

    // Get user's friends
    const { data: friendships, error: friendError } = await supabase
      .from('friendships')
      .select('user1_id, user2_id')
      .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
      .eq('status', 'accepted');

    if (friendError) {
      console.error('Get friends error:', friendError);
      return res.status(500).json({ message: 'Server error' });
    }

    // Extract friend IDs
    const friendIds = friendships?.map(f =>
      f.user1_id === userId ? f.user2_id : f.user1_id
    ) || [];

    // Include user's own ID to see their own activities
    const userIds = [userId, ...friendIds];

    // Build query for activities from friends and self
    let query = supabase
      .from('activities')
      .select(`
        id,
        user_id,
        type,
        visibility,
        team_id,
        team_name,
        match_id,
        video_id,
        video_title,
        tournament_id,
        tournament_name,
        field_id,
        field_name,
        friend_id,
        friend_name,
        achievement_name,
        old_rank,
        new_rank,
        score,
        opponent,
        created_at,
        user:users!activities_user_id_fkey (
          id,
          username,
          avatar
        )
      `)
      .in('user_id', userIds)
      .order('created_at', { ascending: false })
      .range(offset, offset + parseInt(limit) - 1);

    // Filter by visibility - show public activities from friends, and all own activities
    // For friends, only show 'public' and 'friends' visibility
    // For self, show all

    if (type) {
      query = query.eq('type', type);
    }

    const { data: activities, error: activitiesError } = await query;

    if (activitiesError) {
      console.error('Get activities error:', activitiesError);
      return res.status(500).json({ message: 'Server error' });
    }

    // Filter out private activities from friends (keep all own activities)
    const filteredActivities = activities?.filter(activity => {
      if (activity.user_id === userId) {
        return true; // Show all own activities
      }
      // For friends, show public and friends visibility
      return activity.visibility === 'public' || activity.visibility === 'friends';
    }) || [];

    // Get total count for pagination
    const { count, error: countError } = await supabase
      .from('activities')
      .select('*', { count: 'exact', head: true })
      .in('user_id', userIds);

    res.json({
      activities: filteredActivities,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count || 0,
        pages: Math.ceil((count || 0) / limit)
      }
    });
  } catch (error) {
    console.error('Get activity feed error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get user activities
exports.getUserActivities = async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 50 } = req.query;
    const currentUserId = req.user?.id;

    // Check if viewing own profile or friend's profile
    let isFriend = false;
    let isSelf = currentUserId === userId;

    if (!isSelf && currentUserId) {
      const { data: friendship } = await supabase
        .from('friendships')
        .select('id')
        .or(`(user1_id.eq.${currentUserId}.and.user2_id.eq.${userId}),(user1_id.eq.${userId}.and.user2_id.eq.${currentUserId})`)
        .eq('status', 'accepted')
        .single();

      isFriend = !!friendship;
    }

    // Build visibility filter
    let visibilityFilter = ['public'];
    if (isSelf) {
      visibilityFilter = ['public', 'friends', 'private'];
    } else if (isFriend) {
      visibilityFilter = ['public', 'friends'];
    }

    const { data: activities, error } = await supabase
      .from('activities')
      .select(`
        id,
        user_id,
        type,
        visibility,
        team_name,
        video_title,
        tournament_name,
        field_name,
        friend_name,
        achievement_name,
        old_rank,
        new_rank,
        score,
        opponent,
        created_at,
        user:users!activities_user_id_fkey (
          id,
          username,
          avatar
        )
      `)
      .eq('user_id', userId)
      .in('visibility', visibilityFilter)
      .order('created_at', { ascending: false })
      .limit(parseInt(limit));

    if (error) {
      console.error('Get user activities error:', error);
      return res.status(500).json({ message: 'Server error' });
    }

    res.json(activities || []);
  } catch (error) {
    console.error('Get user activities error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Create activity
exports.createActivity = async (req, res) => {
  try {
    const userId = req.user.id;
    const { type, visibility, ...data } = req.body;

    if (!type) {
      return res.status(400).json({ message: 'Type is required!' });
    }

    const activity = await createActivityHelper(userId, type, data, visibility);

    // Fetch with user info
    const { data: activityWithUser, error } = await supabase
      .from('activities')
      .select(`
        *,
        user:users!activities_user_id_fkey (
          id,
          username,
          avatar
        )
      `)
      .eq('id', activity.id)
      .single();

    if (error) {
      return res.status(201).json({ message: 'Activity created!', activity });
    }

    res.status(201).json({
      message: 'Activity created!',
      activity: activityWithUser
    });
  } catch (error) {
    console.error('Create activity error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete activity
exports.deleteActivity = async (req, res) => {
  try {
    const { activityId } = req.params;
    const userId = req.user.id;

    // Check if activity exists and belongs to user
    const { data: activity, error: fetchError } = await supabase
      .from('activities')
      .select('user_id')
      .eq('id', activityId)
      .single();

    if (fetchError || !activity) {
      return res.status(404).json({ message: 'Activity not found' });
    }

    // Only owner can delete
    if (activity.user_id !== userId) {
      return res.status(403).json({ message: 'You cannot delete this activity!' });
    }

    const { error: deleteError } = await supabase
      .from('activities')
      .delete()
      .eq('id', activityId);

    if (deleteError) {
      console.error('Delete activity error:', deleteError);
      return res.status(500).json({ message: 'Failed to delete activity' });
    }

    res.json({ message: 'Activity deleted!' });
  } catch (error) {
    console.error('Delete activity error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Export helper
exports.createActivityHelper = createActivityHelper;
