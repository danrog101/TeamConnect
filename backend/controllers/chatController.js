const { supabase } = require('../config/supabase');
const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
const currentUserId = currentUser.id || currentUser._id;
// Dohvati sve poruke tima
exports.getMessages = async (req, res) => {
  try {
    const { teamId } = req.params;
    const userId = req.user.id;
    const { limit = 100 } = req.query;

    // Provjeri je li član tima
    const { data: team, error: teamError } = await supabase
      .from('teams')
      .select('id, creator_id')
      .eq('id', teamId)
      .single();

    if (teamError || !team) {
      return res.status(404).json({ message: 'Tim ne postoji' });
    }

    const { data: membership } = await supabase
      .from('team_members')
      .select('id')
      .eq('team_id', teamId)
      .eq('user_id', userId)
      .single();

    const isCreator = team.creator_id === userId;
    const isMember = !!membership;

    if (!isCreator && !isMember) {
      return res.status(403).json({ message: 'Nisi član tima' });
    }

    // Dohvati poruke s korisničkim podacima
    const { data: messages, error } = await supabase
      .from('team_messages')
      .select(`
        id,
        team_id,
        user_id,
        text,
        type,
        location_lat,
        location_lng,
        location_address,
        image_url,
        created_at,
        user:users!team_messages_user_id_fkey(id, username, avatar)
      `)
      .eq('team_id', teamId)
      .order('created_at', { ascending: true })
      .limit(parseInt(limit));

    if (error) {
      console.error('❌ Get messages error:', error);
      return res.status(500).json({ message: 'Greška pri dohvaćanju poruka' });
    }

    // Formatiraj poruke da odgovaraju frontendu
    const formatted = (messages || []).map(msg => ({
      _id: msg.id,
      id: msg.id,
      team_id: msg.team_id,
      text: msg.text,
      type: msg.type || 'text',
      location: msg.location_lat ? {
        latitude: msg.location_lat,
        longitude: msg.location_lng,
        address: msg.location_address
      } : null,
      image_url: msg.image_url,
      createdAt: msg.created_at,
      user: {
        _id: msg.user?.id,
        id: msg.user?.id,
        username: msg.user?.username,
        avatar: msg.user?.avatar
      }
    }));

    res.json(formatted);
  } catch (error) {
    console.error('❌ Get messages error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Obriši poruku
exports.deleteMessage = async (req, res) => {
  try {
    const { teamId, messageId } = req.params;
    const userId = req.user.id;

    // Dohvati poruku
    const { data: message, error: msgError } = await supabase
      .from('team_messages')
      .select('id, user_id')
      .eq('id', messageId)
      .eq('team_id', teamId)
      .single();

    if (msgError || !message) {
      return res.status(404).json({ message: 'Poruka ne postoji' });
    }

    // Dohvati tim da provjeri je li kreator
    const { data: team } = await supabase
      .from('teams')
      .select('creator_id')
      .eq('id', teamId)
      .single();

    const isOwner = message.user_id === userId;
    const isCreator = team?.creator_id === userId;

    if (!isOwner && !isCreator) {
      return res.status(403).json({ message: 'Nemaš pravo obrisati ovu poruku' });
    }

    const { error: deleteError } = await supabase
      .from('team_messages')
      .delete()
      .eq('id', messageId);

    if (deleteError) {
      console.error('❌ Delete message error:', deleteError);
      return res.status(500).json({ message: 'Greška pri brisanju poruke' });
    }

    // Emit event preko Socket.io
    const io = req.app.get('io');
    io.to(`team_${teamId}`).emit('message_deleted', { messageId });

    res.json({ message: 'Poruka obrisana' });
  } catch (error) {
    console.error('❌ Delete message error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = exports;