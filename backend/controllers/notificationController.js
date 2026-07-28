const { supabase } = require('../config/supabase');

// ✅ Helper function to create notification (EXPORTED for other controllers)
const createNotificationHelper = async (recipientId, type, title, message, link = null, data = {}, senderId = null) => {
  try {
    const { data: notification, error } = await supabase
      .from('notifications')
      .insert({
        recipient_id: recipientId,
        sender_id: senderId,
        type,
        title,
        message,
        link,
        data,
        read: false
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Create notification helper error:', error);
      throw error;
    }

    return notification;
  } catch (error) {
    console.error('❌ Create notification helper error:', error);
    throw error;
  }
};

// Get user notifications
exports.getNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 50;
    const unreadOnly = req.query.unreadOnly === 'true';

    // Build query
    let query = supabase
      .from('notifications')
      .select(`
        *,
        sender:users!notifications_sender_id_fkey(id, username, avatar)
      `)
      .eq('recipient_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    // Filter unread only if requested
    if (unreadOnly) {
      query = query.eq('read', false);
    }

    const { data: notifications, error } = await query;

    if (error) {
      console.error('❌ Get notifications error:', error);
      throw error;
    }

    // Get unread count
    const { count, error: countError } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('recipient_id', userId)
      .eq('read', false);

    if (countError) {
      console.error('❌ Count unread error:', countError);
      throw countError;
    }

    res.json({
      notifications: notifications || [],
      unreadCount: count || 0
    });
  } catch (error) {
    console.error('❌ Get notifications error:', error);
    res.status(500).json({ 
      message: 'Failed to fetch notifications',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Mark notification as read
exports.markAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user.id;

    // First verify this notification belongs to the user
    const { data: notification, error: fetchError } = await supabase
      .from('notifications')
      .select('*')
      .eq('id', notificationId)
      .eq('recipient_id', userId)
      .single();

    if (fetchError || !notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    // Update to read
    const { error } = await supabase
      .from('notifications')
      .update({ 
        read: true, 
        read_at: new Date().toISOString() 
      })
      .eq('id', notificationId)
      .eq('recipient_id', userId);

    if (error) {
      console.error('❌ Mark as read error:', error);
      throw error;
    }

    res.json({ message: 'Notification marked as read' });
  } catch (error) {
    console.error('❌ Mark as read error:', error);
    res.status(500).json({ 
      message: 'Failed to mark notification as read',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Mark all notifications as read
exports.markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.id;

    const { error } = await supabase
      .from('notifications')
      .update({ 
        read: true, 
        read_at: new Date().toISOString() 
      })
      .eq('recipient_id', userId)
      .eq('read', false);

    if (error) {
      console.error('❌ Mark all as read error:', error);
      throw error;
    }

    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('❌ Mark all as read error:', error);
    res.status(500).json({ 
      message: 'Failed to mark all notifications as read',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Delete notification
exports.deleteNotification = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user.id;

    // Verify ownership before deleting
    const { data: notification, error: fetchError } = await supabase
      .from('notifications')
      .select('*')
      .eq('id', notificationId)
      .eq('recipient_id', userId)
      .single();

    if (fetchError || !notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId)
      .eq('recipient_id', userId);

    if (error) {
      console.error('❌ Delete notification error:', error);
      throw error;
    }

    res.json({ message: 'Notification deleted' });
  } catch (error) {
    console.error('❌ Delete notification error:', error);
    res.status(500).json({ 
      message: 'Failed to delete notification',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Delete all notifications
exports.deleteAllNotifications = async (req, res) => {
  try {
    const userId = req.user.id;

    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('recipient_id', userId);

    if (error) {
      console.error('❌ Delete all notifications error:', error);
      throw error;
    }

    res.json({ message: 'All notifications deleted' });
  } catch (error) {
    console.error('❌ Delete all notifications error:', error);
    res.status(500).json({ 
      message: 'Failed to delete all notifications',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ✅ EXPORT the helper function so other controllers can use it
exports.createNotificationHelper = createNotificationHelper;
