const { supabase } = require('../config/supabase');
const { createNotificationHelper } = require('./notificationController');
// Email transporter - moved inside function to avoid initialization errors
const getTransporter = () => {
  const nodemailer = require('nodemailer');
  return nodemailer.createTransporter({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};

// Search users
exports.searchUsers = async (req, res) => {
  try {
    const { query } = req.query;
    const userId = req.user.id;

    console.log('🔍 Search users request:', { query, userId });

    if (!query || query.trim().length < 2) {
      return res.json([]);
    }

    const { data: users, error } = await supabase
      .from('users')
      .select('id, username, email, avatar, sport, location')
      .neq('id', userId)
      .or(`username.ilike.%${query}%,email.ilike.%${query}%`)
      .limit(20);

    if (error) {
      console.error('Search users error:', error);
      return res.status(500).json({ message: 'Server error' });
    }

    console.log(`✅ Found ${users?.length || 0} users`);

    const { data: friendships } = await supabase
      .from('friendships')
      .select('user1_id, user2_id')
      .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
      .eq('status', 'accepted');

    const friendIds = new Set(
      friendships?.map(f => f.user1_id === userId ? f.user2_id : f.user1_id) || []
    );

    const { data: sentRequests } = await supabase
      .from('friend_requests')
      .select('to_user_id')
      .eq('from_user_id', userId);

    const requestSentIds = new Set(
      sentRequests?.map(r => r.to_user_id) || []
    );

    const usersWithStatus = users?.map(user => ({
      ...user,
      isFriend: friendIds.has(user.id),
      requestSent: requestSentIds.has(user.id)
    })) || [];

    console.log('✅ Returning users with status:', usersWithStatus.length);

    res.json(usersWithStatus);
  } catch (error) {
    console.error('❌ Search users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Send friend request
exports.sendFriendRequest = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user.id;
    const { message } = req.body;

    console.log('📤 Send friend request:', { from: currentUserId, to: userId });
    // In-app notifikacija
try {
  await createNotificationHelper(
    userId,           // recipient (osoba koja prima zahtjev)
    'friend_request',
    `👋 Novi zahtjev za prijateljstvo`,
    `${currentUser?.username || 'Netko'} želi biti tvoj prijatelj!`,
    '/friends',
    {},
    currentUserId     // sender
  );
} catch (notifErr) {
  console.error('Notification error:', notifErr);
}
    if (userId === currentUserId) {
      return res.status(400).json({ message: 'Cannot send friend request to yourself' });
    }

    const { data: targetUser, error: userError } = await supabase
      .from('users')
      .select('id, username, email, sport, location')
      .eq('id', userId)
      .single();

    if (userError || !targetUser) {
      console.log('❌ Target user not found:', userId);
      return res.status(404).json({ message: 'User not found' });
    }

    const { data: existingFriendship } = await supabase
      .from('friendships')
      .select('id')
      .or(`(user1_id.eq.${currentUserId} AND user2_id.eq.${userId}), (user1_id.eq.${userId} AND user2_id.eq.${currentUserId})`)
      .eq('status', 'accepted')
      .single();

    if (existingFriendship) {
      return res.status(400).json({ message: 'You are already friends!' });
    }

    const { data: existingRequest } = await supabase
      .from('friend_requests')
      .select('id')
      .eq('from_user_id', currentUserId)
      .eq('to_user_id', userId)
      .single();

    if (existingRequest) {
      return res.status(400).json({ message: 'Friend request already sent!' });
    }

    const { data: currentUser } = await supabase
      .from('users')
      .select('username, sport, location')
      .eq('id', currentUserId)
      .single();

    const { error: insertError } = await supabase
      .from('friend_requests')
      .insert({
        from_user_id: currentUserId,
        to_user_id: userId,
        message: message || '',
        sent_at: new Date().toISOString()
      });

    if (insertError) {
      console.error('Insert friend request error:', insertError);
      return res.status(500).json({ message: 'Failed to send friend request' });
    }

    console.log('✅ Friend request sent');

    // Send email notification
    try {
      const transporter = getTransporter();
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: targetUser.email,
        subject: `👋 ${currentUser?.username || 'Someone'} wants to be your friend on TeamConnect`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #667eea; text-align: center;">👋 New Friend Request!</h1>
            
            <div style="background: #f5f7fa; padding: 30px; border-radius: 15px; margin: 20px 0;">
              <p style="font-size: 18px; color: #333;">
                <strong>${currentUser?.username || 'Someone'}</strong> wants to be your friend on TeamConnect!
              </p>
              
              ${message ? `
                <div style="background: white; padding: 15px; border-radius: 10px; margin: 15px 0; border-left: 4px solid #667eea;">
                  <p style="margin: 0; color: #666; font-style: italic;">"${message}"</p>
                </div>
              ` : ''}
              
              <p style="margin-top: 20px;">
                <strong>Sport:</strong> ${currentUser?.sport || 'Not specified'}<br>
                <strong>Location:</strong> ${currentUser?.location || 'Not specified'}
              </p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.FRONTEND_URL}/friends" 
                 style="background: linear-gradient(135deg, #667eea, #764ba2); 
                        color: white; 
                        padding: 15px 40px; 
                        text-decoration: none; 
                        border-radius: 25px; 
                        font-weight: bold;
                        display: inline-block;">
                View Request
              </a>
            </div>
            
            <p style="color: #999; text-align: center; font-size: 14px;">
              TeamConnect - Connect with players 🏆
            </p>
          </div>
        `
      };

      await transporter.sendMail(mailOptions);
      console.log('✅ Email notification sent');
    } catch (emailErr) {
      console.error('Email send error:', emailErr);
    }

    res.json({ message: 'Friend request sent!' });
  } catch (error) {
    console.error('❌ Send friend request error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get friend requests
exports.getFriendRequests = async (req, res) => {
  try {
    const userId = req.user.id;
    
    console.log('📥 Get friend requests for:', userId);

    const { data: requests, error } = await supabase
      .from('friend_requests')
      .select(`
        id,
        message,
        sent_at,
        from_user:users!friend_requests_from_user_id_fkey (
          id,
          username,
          email,
          avatar,
          sport,
          location
        )
      `)
      .eq('to_user_id', userId)
      .order('sent_at', { ascending: false });

    if (error) {
      console.error('Get friend requests error:', error);
      return res.status(500).json({ message: 'Server error' });
    }

    console.log(`✅ Found ${requests?.length || 0} requests`);

    res.json(requests || []);
  } catch (error) {
    console.error('❌ Get friend requests error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Accept friend request
exports.acceptFriendRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const userId = req.user.id;

    console.log('✅ Accept friend request:', { requestId, userId });

    const { data: request, error: fetchError } = await supabase
      .from('friend_requests')
      .select('from_user_id, to_user_id')
      .eq('id', requestId)
      .eq('to_user_id', userId)
      .single();

    if (fetchError || !request) {
      console.log('❌ Request not found:', requestId);
      return res.status(404).json({ message: 'Friend request not found' });
    }

    const friendId = request.from_user_id;

    const { error: friendshipError } = await supabase
      .from('friendships')
      .insert({
        user1_id: userId,
        user2_id: friendId,
        status: 'accepted',
        created_at: new Date().toISOString()
      });

    if (friendshipError) {
      console.error('Create friendship error:', friendshipError);
      return res.status(500).json({ message: 'Failed to create friendship' });
    }

    const { error: deleteError } = await supabase
      .from('friend_requests')
      .delete()
      .eq('id', requestId);

    if (deleteError) {
      console.error('Delete request error:', deleteError);
    }

    console.log('✅ Friendship created');
    // In-app notifikacija
try {
  await createNotificationHelper(
    friendId,         // recipient (osoba čiji je zahtjev prihvaćen)
    'friend_accepted',
    `🎉 Zahtjev prihvaćen!`,
    `${currentUser?.username || 'Netko'} je prihvatio/la tvoj zahtjev za prijateljstvo!`,
    '/friends',
    {},
    userId            // sender
  );
} catch (notifErr) {
  console.error('Notification error:', notifErr);
}
    const { data: currentUser } = await supabase
      .from('users')
      .select('username, email')
      .eq('id', userId)
      .single();

    const { data: friend } = await supabase
      .from('users')
      .select('username, email')
      .eq('id', friendId)
      .single();

    // Send email notification
    try {
      const transporter = getTransporter();
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: friend?.email,
        subject: `🎉 ${currentUser?.username || 'Someone'} accepted your friend request!`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #4caf50; text-align: center;">🎉 You're now friends!</h1>
            
            <div style="background: #f5f7fa; padding: 30px; border-radius: 15px; margin: 20px 0; text-align: center;">
              <p style="font-size: 18px; color: #333;">
                <strong>${currentUser?.username || 'Someone'}</strong> accepted your friend request!
              </p>
              <p style="font-size: 16px; color: #666;">
                You can now play together and follow each other on TeamConnect.
              </p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.FRONTEND_URL}/friends" 
                 style="background: linear-gradient(135deg, #4caf50, #66bb6a); 
                        color: white; 
                        padding: 15px 40px; 
                        text-decoration: none; 
                        border-radius: 25px; 
                        font-weight: bold;
                        display: inline-block;">
                View Friends
              </a>
            </div>
          </div>
        `
      };

      await transporter.sendMail(mailOptions);
    } catch (emailErr) {
      console.error('Email send error:', emailErr);
    }

    res.json({ message: 'Friend request accepted!' });
  } catch (error) {
    console.error('❌ Accept friend request error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Reject friend request
exports.rejectFriendRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const userId = req.user.id;

    console.log('❌ Reject friend request:', { requestId, userId });

    const { error } = await supabase
      .from('friend_requests')
      .delete()
      .eq('id', requestId)
      .eq('to_user_id', userId);

    if (error) {
      console.error('Reject request error:', error);
      return res.status(500).json({ message: 'Failed to reject request' });
    }

    console.log('✅ Request rejected');

    res.json({ message: 'Friend request rejected' });
  } catch (error) {
    console.error('❌ Reject friend request error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get friends
exports.getFriends = async (req, res) => {
  try {
    const userId = req.user.id;
    
    console.log('👥 Get friends for:', userId);

    const { data: friendships, error } = await supabase
      .from('friendships')
      .select(`
        user1_id,
        user2_id,
        created_at,
        user1:users!friendships_user1_id_fkey (
          id,
          username,
          email,
          avatar,
          sport,
          location
        ),
        user2:users!friendships_user2_id_fkey (
          id,
          username,
          email,
          avatar,
          sport,
          location
        )
      `)
      .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
      .eq('status', 'accepted');

    if (error) {
      console.error('Get friends error:', error);
      return res.status(500).json({ message: 'Server error' });
    }

    const friends = friendships?.map(friendship => {
      if (friendship.user1_id === userId) {
        return friendship.user2;
      } else {
        return friendship.user1;
      }
    }) || [];

    console.log(`✅ Found ${friends.length} friends`);

    res.json(friends);
  } catch (error) {
    console.error('❌ Get friends error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Remove friend
exports.removeFriend = async (req, res) => {
  try {
    const { friendId } = req.params;
    const userId = req.user.id;

    console.log('🗑️ Remove friend:', { userId, friendId });

    const { error } = await supabase
      .from('friendships')
      .delete()
      .or(`(user1_id.eq.${userId} AND user2_id.eq.${friendId}), (user1_id.eq.${friendId} AND user2_id.eq.${userId})`);

    if (error) {
      console.error('Remove friend error:', error);
      return res.status(500).json({ message: 'Failed to remove friend' });
    }

    console.log('✅ Friend removed');

    res.json({ message: 'Friend removed' });
  } catch (error) {
    console.error('❌ Remove friend error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = exports;