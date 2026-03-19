const { supabase } = require('../config/supabase');
const bcrypt = require('bcryptjs');

// Get user profile
exports.getProfile = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user.id;

    // Fetch user with friends data
    const { data: user, error } = await supabase
      .from('users')
      .select(`
        id,
        username,
        email,
        first_name,
        last_name,
        avatar,
        bio,
        sport,
        location,
        city,
        country,
        phone,
        instagram,
        twitter,
        facebook,
        profile_visibility,
        show_email,
        show_phone,
        rating_overall,
        rating_attack,
        rating_defense,
        rating_teamwork,
        rating_consistency,
        rank,
        total_matches,
        total_wins,
        total_goals,
        created_at
      `)
      .eq('id', userId)
      .single();

    if (error || !user) {
      console.error('Get profile error:', error);
      return res.status(404).json({ message: 'Korisnik nije pronađen' });
    }

    // Check if users are friends
    const isSelf = userId === currentUserId;
    let isFriend = false;

    if (!isSelf) {
      const { data: friendship } = await supabase
        .from('friendships')
        .select('id')
        .or(`user1_id.eq.${currentUserId},user2_id.eq.${currentUserId}`)
        .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
        .eq('status', 'accepted')
        .single();

      isFriend = !!friendship;
    }

    // Privacy checks
    if (user.profile_visibility === 'private' && !isSelf) {
      return res.status(403).json({ message: 'Ovaj profil je privatan' });
    }

    if (user.profile_visibility === 'friends' && !isSelf && !isFriend) {
      return res.status(403).json({ message: 'Ovaj profil je vidljiv samo prijateljima' });
    }

    // Hide sensitive data if not self
    if (!isSelf) {
      if (!user.show_email) {
        delete user.email;
      }
      if (!user.show_phone) {
        delete user.phone;
      }
    }

    // Remove privacy flags from response
    delete user.show_email;
    delete user.show_phone;

    res.json(user);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Greška servera' });
  }
};

// Update profile
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const updates = req.body;

    // Prevent updating sensitive fields
    const forbiddenFields = [
      'id',
      'password',
      'email',
      'verification_code',
      'is_verified',
      'refresh_token',
      'refresh_token_expiry',
      'created_at',
      'rating_overall',
      'rating_attack',
      'rating_defense',
      'rating_teamwork',
      'rating_consistency',
      'rank',
      'total_matches',
      'total_wins',
      'total_goals'
    ];

    forbiddenFields.forEach(field => delete updates[field]);

    // Update user
    const { data: user, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select('id, username, email, avatar, bio, sport, location, city, country, phone, instagram, twitter, facebook, profile_visibility, show_email, show_phone')
      .single();

    if (error) {
      console.error('Update profile error:', error);
      return res.status(500).json({ message: 'Ažuriranje profila nije uspjelo' });
    }

    res.json({ message: 'Profil je uspješno ažuriran!', user });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Greška servera' });
  }
};

// Change password
exports.changePassword = async (req, res) => {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Sva polja su obavezna' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Nova lozinka mora imati najmanje 6 znakova' });
    }

    // Get current password hash
    const { data: userData, error: fetchError } = await supabase
      .from('users')
      .select('password')
      .eq('id', userId)
      .single();

    if (fetchError || !userData) {
      return res.status(404).json({ message: 'Korisnik nije pronađen' });
    }

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, userData.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Trenutna lozinka nije ispravna' });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update({ password: hashedPassword })
      .eq('id', userId)
      .select('id, email')
      .single();

    if (updateError) {
      console.error('Password update error:', updateError);
      return res.status(500).json({ message: 'Promjena lozinke nije uspjela' });
    }

    res.json({ message: 'Lozinka je uspješno promijenjena!', user: updatedUser });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: 'Greška servera' });
  }
};

// Upload avatar
exports.uploadAvatar = async (req, res) => {
  try {
    const userId = req.user.id;
    const { avatar } = req.body;

    if (!avatar) {
      return res.status(400).json({ message: 'Avatar je obavezan' });
    }

    // Update avatar
    const { data: user, error } = await supabase
      .from('users')
      .update({ avatar })
      .eq('id', userId)
      .select('id, username, email, avatar')
      .single();

    if (error) {
      console.error('Upload avatar error:', error);
      return res.status(500).json({ message: 'Ažuriranje avatara nije uspjelo' });
    }

    res.json({ message: 'Avatar je uspješno ažuriran!', user });
  } catch (error) {
    console.error('Upload avatar error:', error);
    res.status(500).json({ message: 'Greška servera' });
  }
};

// Get user activity
exports.getUserActivity = async (req, res) => {
  try {
    const { userId } = req.params;
    const limit = parseInt(req.query.limit) || 20;

    // Fetch activities for this user
    const { data: activities, error } = await supabase
      .from('activities')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Get user activity error:', error);
      return res.status(500).json({ message: 'Dohvaćanje aktivnosti nije uspjelo' });
    }

    res.json({ 
      activities: activities || [],
      count: activities?.length || 0
    });
  } catch (error) {
    console.error('Get activity error:', error);
    res.status(500).json({ message: 'Greška servera' });
  }
};
exports.searchUsers = async (req, res) => {
  try {
    const { q } = req.query;
    const currentUserId = req.user.id;

    if (!q || q.length < 2) {
      return res.json([]);
    }

    const { supabase } = require('../config/supabase');

    const { data, error } = await supabase
      .from('users')
      .select('id, username, avatar, city, sport')
      .or(`username.ilike.%${q}%,email.ilike.%${q}%`)
      .neq('id', currentUserId)
      .limit(10);

    if (error) return res.status(500).json({ message: 'Server error' });

    res.json(data || []);
  } catch (e) {
    console.error('Search users error:', e);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = exports;