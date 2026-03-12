const { supabase } = require('../config/supabase');
const { createNotificationHelper } = require('./notificationController');

// Dohvati sve konverzacije korisnika
exports.getConversations = async (req, res) => {
  try {
    const userId = req.user.id;

    const { data: messages, error } = await supabase
      .from('direct_messages')
      .select(`
        id, sender_id, recipient_id, text, read, created_at,
        sender:users!direct_messages_sender_id_fkey(id, username, avatar),
        recipient:users!direct_messages_recipient_id_fkey(id, username, avatar)
      `)
      .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Grupiraj po konverzaciji
    const conversationsMap = {};
    messages?.forEach(msg => {
      const otherId = msg.sender_id === userId ? msg.recipient_id : msg.sender_id;
      const otherUser = msg.sender_id === userId ? msg.recipient : msg.sender;
      if (!conversationsMap[otherId]) {
        conversationsMap[otherId] = {
          userId: otherId,
          user: otherUser,
          lastMessage: msg,
          unreadCount: 0
        };
      }
      if (!msg.read && msg.recipient_id === userId) {
        conversationsMap[otherId].unreadCount++;
      }
    });

    res.json(Object.values(conversationsMap));
  } catch (error) {
    console.error('❌ getConversations error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Dohvati poruke između dva korisnika
exports.getMessages = async (req, res) => {
  try {
    const userId = req.user.id;
    const { otherId } = req.params;

    const { data: messages, error } = await supabase
      .from('direct_messages')
      .select(`
        id, sender_id, recipient_id, text, read, created_at,
        sender:users!direct_messages_sender_id_fkey(id, username, avatar)
      `)
      .or(`and(sender_id.eq.${userId},recipient_id.eq.${otherId}),and(sender_id.eq.${otherId},recipient_id.eq.${userId})`)
      .order('created_at', { ascending: true });

    if (error) throw error;

    // Označi kao pročitano
    await supabase
      .from('direct_messages')
      .update({ read: true, read_at: new Date().toISOString() })
      .eq('recipient_id', userId)
      .eq('sender_id', otherId)
      .eq('read', false);

    res.json(messages || []);
  } catch (error) {
    console.error('❌ getMessages error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Pošalji poruku (REST fallback)
exports.sendMessage = async (req, res) => {
  try {
    const userId = req.user.id;
    const { recipientId, text } = req.body;

    if (!text?.trim()) return res.status(400).json({ message: 'Poruka ne može biti prazna' });

    const { data: message, error } = await supabase
      .from('direct_messages')
      .insert({ sender_id: userId, recipient_id: recipientId, text })
      .select(`
        id, sender_id, recipient_id, text, read, created_at,
        sender:users!direct_messages_sender_id_fkey(id, username, avatar)
      `)
      .single();

    if (error) throw error;

    // In-app notifikacija
    try {
      const { data: sender } = await supabase
        .from('users').select('username').eq('id', userId).single();
      await createNotificationHelper(
        recipientId, 'new_message',
        '💬 Nova poruka',
        `${sender?.username || 'Netko'} ti je poslao/la poruku`,
        `/messages/${userId}`, {}, userId
      );
    } catch (e) { console.error('Notification error:', e); }

    res.json(message);
  } catch (error) {
    console.error('❌ sendMessage error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};