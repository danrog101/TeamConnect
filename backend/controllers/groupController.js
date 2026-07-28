const { supabase } = require('../config/supabase');

// ===== GROUPS =====

exports.getMyGroups = async (req, res) => {
  try {
    const userId = req.user.id;
    const { data, error } = await supabase
      .from('groups')
      .select('*')
      .eq('creator_id', userId)
      .order('created_at', { ascending: false });

    if (error) return res.status(500).json({ message: 'Server error' });
    res.json(data || []);
  } catch (e) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getMyMemberGroups = async (req, res) => {
  try {
    const userId = req.user.id;
    const { data, error } = await supabase
      .from('group_members')
      .select(`
        group:groups!group_members_group_id_fkey (
          *,
          creator:users!groups_creator_id_fkey (
            id, username, avatar
          )
        )
      `)
      .eq('user_id', userId);

    if (error) return res.status(500).json({ message: 'Server error' });
    res.json(data?.map(d => d.group).filter(Boolean) || []);
  } catch (e) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.createGroup = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, description, sport, min_skill_level, max_skill_level } = req.body;

    if (!name || !sport) return res.status(400).json({ message: 'Naziv i sport su obavezni' });

    const { data, error } = await supabase
      .from('groups')
      .insert({
        name,
        description: description || '',
        sport,
        creator_id: userId,
        min_skill_level: min_skill_level || 1,
        max_skill_level: max_skill_level || 10
      })
      .select()
      .single();

    if (error) return res.status(500).json({ message: 'Greška pri kreiranju grupe' });

    // Automatski dodaj kreatora kao člana
    await supabase.from('group_members').insert({
      group_id: data.id,
      user_id: userId,
      role: 'admin'
    });

    res.status(201).json(data);
  } catch (e) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.deleteGroup = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const { data: group } = await supabase.from('groups').select('*').eq('id', id).single();
    if (!group) return res.status(404).json({ message: 'Grupa nije pronađena' });
    if (group.creator_id !== userId) return res.status(403).json({ message: 'Nije dozvoljeno' });

    await supabase.from('groups').delete().eq('id', id);
    res.json({ message: 'Grupa obrisana' });
  } catch (e) {
    res.status(500).json({ message: 'Server error' });
  }
};

// ===== MEMBERS =====

exports.getGroupMembers = async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from('group_members')
      .select(`
        *,
        user:users!group_members_user_id_fkey (
          id, username, avatar, email
        )
      `)
      .eq('group_id', id)
      .order('joined_at', { ascending: true });

    if (error) return res.status(500).json({ message: 'Server error' });
    res.json(data || []);
  } catch (e) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.joinGroupByCode = async (req, res) => {
  try {
    const userId = req.user.id;
    const { invite_code } = req.body;

    const { data: group } = await supabase
      .from('groups')
      .select('*')
      .eq('invite_code', invite_code)
      .single();

    if (!group) return res.status(404).json({ message: 'Nevažeći kod grupe' });

    const { data: existing } = await supabase
      .from('group_members')
      .select('id')
      .eq('group_id', group.id)
      .eq('user_id', userId)
      .single();

    if (existing) return res.status(400).json({ message: 'Već si član ove grupe' });

    await supabase.from('group_members').insert({
      group_id: group.id,
      user_id: userId,
      role: 'member'
    });

    res.json({ message: 'Pridružen/a si grupi!', group });
  } catch (e) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.leaveGroup = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const { data: group } = await supabase.from('groups').select('creator_id').eq('id', id).single();
    if (group?.creator_id === userId) return res.status(400).json({ message: 'Kreator ne može napustiti grupu' });

    await supabase.from('group_members').delete().eq('group_id', id).eq('user_id', userId);
    res.json({ message: 'Napustio/la si grupu' });
  } catch (e) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.removeMember = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id, memberId } = req.params;

    const { data: group } = await supabase.from('groups').select('creator_id').eq('id', id).single();
    if (!group || group.creator_id !== userId) return res.status(403).json({ message: 'Nije dozvoljeno' });

    await supabase.from('group_members').delete().eq('id', memberId);
    res.json({ message: 'Član uklonjen' });
  } catch (e) {
    res.status(500).json({ message: 'Server error' });
  }
};

// ===== SESSIONS =====

exports.getGroupSessions = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const { data: group } = await supabase.from('groups').select('creator_id').eq('id', id).single();
    if (!group) return res.status(404).json({ message: 'Grupa nije pronađena' });

    const isCreator = group.creator_id === userId;
    if (!isCreator) {
      const { data: member } = await supabase
        .from('group_members')
        .select('id')
        .eq('group_id', id)
        .eq('user_id', userId)
        .single();
      if (!member) return res.status(403).json({ message: 'Nije dozvoljeno' });
    }

    const { data, error } = await supabase
      .from('group_sessions')
      .select(`
        *,
        signups:group_signups!group_signups_session_id_fkey (
          id, user_id, signed_up_at, cancelled_at,
          user:users!group_signups_user_id_fkey (
            id, username, avatar
          )
        )
      `)
      .eq('group_id', id)
      .order('date', { ascending: true })
      .order('time', { ascending: true });

    if (error) return res.status(500).json({ message: 'Server error' });
    res.json(data || []);
  } catch (e) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getPublicSessions = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('group_sessions')
      .select(`
        *,
        group:groups!group_sessions_group_id_fkey (
          id, name, sport
        ),
        signups:group_signups!group_signups_session_id_fkey (
          id, user_id, cancelled_at
        )
      `)
      .eq('is_public', true)
      .gte('date', new Date().toISOString().split('T')[0])
      .order('date', { ascending: true });

    if (error) return res.status(500).json({ message: 'Server error' });
    res.json(data || []);
  } catch (e) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.createSession = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const {
      title, type, date, time, max_participants, min_participants,
      signup_deadline_hours, cancel_deadline_hours, notes,
      min_skill_level, max_skill_level
    } = req.body;

    const { data: group } = await supabase.from('groups').select('*').eq('id', id).single();
    if (!group) return res.status(404).json({ message: 'Grupa nije pronađena' });
    if (group.creator_id !== userId) return res.status(403).json({ message: 'Nije dozvoljeno' });

    if (!title || !type || !date || !time) {
      return res.status(400).json({ message: 'Popuni sva obavezna polja' });
    }

    const { data, error } = await supabase
      .from('group_sessions')
      .insert({
        group_id: id,
        title, type, date, time,
        max_participants: max_participants || 10,
        min_participants: min_participants || 2,
        signup_deadline_hours: signup_deadline_hours ?? 2,
        cancel_deadline_hours: cancel_deadline_hours ?? 1,
        notes: notes || '',
        min_skill_level: min_skill_level || 1,
        max_skill_level: max_skill_level || 10,
        is_public: false
      })
      .select()
      .single();

    if (error) return res.status(500).json({ message: 'Greška pri kreiranju treninga' });
    res.status(201).json(data);
  } catch (e) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.togglePublic = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id, sessionId } = req.params;

    const { data: group } = await supabase.from('groups').select('creator_id').eq('id', id).single();
    if (!group || group.creator_id !== userId) return res.status(403).json({ message: 'Nije dozvoljeno' });

    const { data: session } = await supabase.from('group_sessions').select('is_public').eq('id', sessionId).single();
    if (!session) return res.status(404).json({ message: 'Trening nije pronađen' });

    const { data, error } = await supabase
      .from('group_sessions')
      .update({ is_public: !session.is_public })
      .eq('id', sessionId)
      .select()
      .single();

    if (error) return res.status(500).json({ message: 'Greška' });
    res.json(data);
  } catch (e) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.deleteSession = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id, sessionId } = req.params;

    const { data: group } = await supabase.from('groups').select('creator_id').eq('id', id).single();
    if (!group || group.creator_id !== userId) return res.status(403).json({ message: 'Nije dozvoljeno' });

    await supabase.from('group_sessions').delete().eq('id', sessionId);
    res.json({ message: 'Trening obrisan' });
  } catch (e) {
    res.status(500).json({ message: 'Server error' });
  }
};

// ===== SIGNUPS =====

exports.signupSession = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id, sessionId } = req.params;

    const { data: session } = await supabase
      .from('group_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();
    if (!session) return res.status(404).json({ message: 'Trening nije pronađen' });

    // Ako nije javni, mora biti član grupe
    if (!session.is_public) {
      const { data: member } = await supabase
        .from('group_members')
        .select('id')
        .eq('group_id', id)
        .eq('user_id', userId)
        .single();
      if (!member) return res.status(403).json({ message: 'Nisi član ove grupe' });
    }

    // Provjeri skill level korisnika
    const { data: userProfile } = await supabase
      .from('users')
      .select('skill_level_numeric')
      .eq('id', userId)
      .single();

    const userSkill = userProfile?.skill_level_numeric || 5;
    if (userSkill < session.min_skill_level || userSkill > session.max_skill_level) {
      return res.status(400).json({ message: `Trening je za razinu ${session.min_skill_level}-${session.max_skill_level}` });
    }

    // Provjeri rok prijave
    const sessionDateTime = new Date(`${session.date}T${session.time}`);
    const signupDeadline = new Date(sessionDateTime.getTime() - session.signup_deadline_hours * 60 * 60 * 1000);
    if (new Date() > signupDeadline) {
      return res.status(400).json({ message: `Prijava je zatvorena ${session.signup_deadline_hours}h prije treninga` });
    }

    // Provjeri kapacitet
    const { count } = await supabase
      .from('group_signups')
      .select('*', { count: 'exact', head: true })
      .eq('session_id', sessionId)
      .is('cancelled_at', null);

    if (count >= session.max_participants) {
      return res.status(400).json({ message: 'Trening je popunjen' });
    }

    const { data: existing } = await supabase
      .from('group_signups')
      .select('*')
      .eq('session_id', sessionId)
      .eq('user_id', userId)
      .single();

    if (existing && !existing.cancelled_at) {
      return res.status(400).json({ message: 'Već si prijavljen/a' });
    }

    if (existing && existing.cancelled_at) {
      const { data } = await supabase
        .from('group_signups')
        .update({ cancelled_at: null, signed_up_at: new Date().toISOString() })
        .eq('id', existing.id)
        .select()
        .single();
      return res.json(data);
    }

    const { data, error } = await supabase
      .from('group_signups')
      .insert({ session_id: sessionId, user_id: userId })
      .select()
      .single();

    if (error) return res.status(500).json({ message: 'Greška pri prijavi' });
    res.status(201).json(data);
  } catch (e) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.cancelSignup = async (req, res) => {
  try {
    const userId = req.user.id;
    const { sessionId } = req.params;

    const { data: session } = await supabase
      .from('group_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();
    if (!session) return res.status(404).json({ message: 'Trening nije pronađen' });

    const sessionDateTime = new Date(`${session.date}T${session.time}`);
    const cancelDeadline = new Date(sessionDateTime.getTime() - session.cancel_deadline_hours * 60 * 60 * 1000);
    if (new Date() > cancelDeadline) {
      return res.status(400).json({ message: `Otkazivanje nije moguće ${session.cancel_deadline_hours}h prije` });
    }

    const { data, error } = await supabase
      .from('group_signups')
      .update({ cancelled_at: new Date().toISOString() })
      .eq('session_id', sessionId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) return res.status(500).json({ message: 'Greška pri otkazivanju' });
    res.json(data);
  } catch (e) {
    res.status(500).json({ message: 'Server error' });
  }
};