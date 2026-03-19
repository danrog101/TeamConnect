const { supabase } = require('../config/supabase');

// ===== STUDIO =====

// Dohvati moje studije (kao trener)
exports.getMyStudios = async (req, res) => {
  try {
    const userId = req.user.id;
    const { data, error } = await supabase
      .from('studios')
      .select('*')
      .eq('trainer_id', userId)
      .order('created_at', { ascending: false });

    if (error) return res.status(500).json({ message: 'Server error' });
    res.json(data || []);
  } catch (e) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Dohvati studije kojima sam član (kao klijent)
exports.getMyMemberStudios = async (req, res) => {
  try {
    const userId = req.user.id;
    const { data, error } = await supabase
      .from('studio_members')
      .select(`
        studio:studios!studio_members_studio_id_fkey (
          *,
          trainer:users!studios_trainer_id_fkey (
            id, username, avatar
          )
        )
      `)
      .eq('user_id', userId);

    if (error) return res.status(500).json({ message: 'Server error' });
    res.json(data?.map(d => d.studio).filter(Boolean) || []);
  } catch (e) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Kreiraj studio
exports.createStudio = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, description } = req.body;

    if (!name) return res.status(400).json({ message: 'Naziv je obavezan' });

    const { data, error } = await supabase
      .from('studios')
      .insert({ name, description: description || '', trainer_id: userId })
      .select()
      .single();

    if (error) return res.status(500).json({ message: 'Greška pri kreiranju studija' });
    res.status(201).json(data);
  } catch (e) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Obriši studio
exports.deleteStudio = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const { data: studio } = await supabase.from('studios').select('*').eq('id', id).single();
    if (!studio) return res.status(404).json({ message: 'Studio nije pronađen' });
    if (studio.trainer_id !== userId) return res.status(403).json({ message: 'Nije dozvoljeno' });

    await supabase.from('studios').delete().eq('id', id);
    res.json({ message: 'Studio obrisan' });
  } catch (e) {
    res.status(500).json({ message: 'Server error' });
  }
};

// ===== MEMBERS =====

// Dohvati članove studija
exports.getStudioMembers = async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from('studio_members')
      .select(`
        *,
        user:users!studio_members_user_id_fkey (
          id, username, avatar, email
        )
      `)
      .eq('studio_id', id)
      .order('added_at', { ascending: true });

    if (error) return res.status(500).json({ message: 'Server error' });
    res.json(data || []);
  } catch (e) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Dodaj člana u studio (trener dodaje po emailu ili usernameu)
exports.addMember = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { usernameOrEmail } = req.body;

    // Provjeri je li trener vlasnik
    const { data: studio } = await supabase.from('studios').select('*').eq('id', id).single();
    if (!studio) return res.status(404).json({ message: 'Studio nije pronađen' });
    if (studio.trainer_id !== userId) return res.status(403).json({ message: 'Nije dozvoljeno' });

    // Pronađi korisnika
    const { data: targetUser } = await supabase
      .from('users')
      .select('id, username, avatar')
      .or(`email.eq.${usernameOrEmail},username.eq.${usernameOrEmail}`)
      .single();

    if (!targetUser) return res.status(404).json({ message: 'Korisnik nije pronađen' });

    // Provjeri već je li član
    const { data: existing } = await supabase
      .from('studio_members')
      .select('id')
      .eq('studio_id', id)
      .eq('user_id', targetUser.id)
      .single();

    if (existing) return res.status(400).json({ message: 'Korisnik je već član' });

    const { data, error } = await supabase
      .from('studio_members')
      .insert({ studio_id: id, user_id: targetUser.id })
      .select()
      .single();

if (error) return res.status(500).json({ message: 'Greška pri dodavanju člana' });

// Notifikacija klijentu
try {
  const { createNotificationHelper } = require('./notificationController');
  const trainerData = await supabase.from('users').select('username').eq('id', userId).single();
  await createNotificationHelper(
    targetUser.id,
    'studio_added',
    '💪 Dodan/a si u studio!',
    `${trainerData.data?.username || 'Trener'} te dodao/la u studio "${studio.name}"`,
    '/my-studio',
    {},
    userId
  );
} catch (notifErr) {
  console.error('Notification error:', notifErr);
}

res.status(201).json({ ...data, user: targetUser });
  } catch (e) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Ukloni člana
exports.removeMember = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id, memberId } = req.params;

    const { data: studio } = await supabase.from('studios').select('*').eq('id', id).single();
    if (!studio) return res.status(404).json({ message: 'Studio nije pronađen' });
    if (studio.trainer_id !== userId) return res.status(403).json({ message: 'Nije dozvoljeno' });

    await supabase.from('studio_members').delete().eq('id', memberId);
    res.json({ message: 'Član uklonjen' });
  } catch (e) {
    res.status(500).json({ message: 'Server error' });
  }
};

// ===== SESSIONS =====

// Dohvati sesije studija
exports.getStudioSessions = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    // Provjeri je li trener ili član
    const { data: studio } = await supabase.from('studios').select('trainer_id').eq('id', id).single();
    if (!studio) return res.status(404).json({ message: 'Studio nije pronađen' });

    const isTrainer = studio.trainer_id === userId;
    if (!isTrainer) {
      const { data: member } = await supabase
        .from('studio_members')
        .select('id')
        .eq('studio_id', id)
        .eq('user_id', userId)
        .single();
      if (!member) return res.status(403).json({ message: 'Nije dozvoljeno' });
    }

    const { data, error } = await supabase
      .from('studio_sessions')
      .select(`
        *,
        signups:session_signups!session_signups_session_id_fkey (
          id, user_id, signed_up_at, cancelled_at,
          user:users!session_signups_user_id_fkey (
            id, username, avatar
          )
        )
      `)
      .eq('studio_id', id)
      .order('date', { ascending: true })
      .order('time', { ascending: true });

    if (error) return res.status(500).json({ message: 'Server error' });
    res.json(data || []);
  } catch (e) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Kreiraj sesiju
exports.createSession = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { title, type, date, time, max_participants, signup_deadline_hours, cancel_deadline_hours, notes } = req.body;

    const { data: studio } = await supabase.from('studios').select('*').eq('id', id).single();
    if (!studio) return res.status(404).json({ message: 'Studio nije pronađen' });
    if (studio.trainer_id !== userId) return res.status(403).json({ message: 'Nije dozvoljeno' });

    if (!title || !type || !date || !time) {
      return res.status(400).json({ message: 'Popuni sva obavezna polja' });
    }

    const { data, error } = await supabase
      .from('studio_sessions')
      .insert({
        studio_id: id,
        title,
        type,
        date,
        time,
        max_participants: max_participants || 10,
        signup_deadline_hours: signup_deadline_hours ?? 2,
        cancel_deadline_hours: cancel_deadline_hours ?? 1,
        notes: notes || ''
      })
      .select()
      .single();

    if (error) return res.status(500).json({ message: 'Greška pri kreiranju sesije' });
    res.status(201).json(data);
  } catch (e) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Obriši sesiju
exports.deleteSession = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id, sessionId } = req.params;

    const { data: studio } = await supabase.from('studios').select('*').eq('id', id).single();
    if (!studio) return res.status(404).json({ message: 'Studio nije pronađen' });
    if (studio.trainer_id !== userId) return res.status(403).json({ message: 'Nije dozvoljeno' });

    await supabase.from('studio_sessions').delete().eq('id', sessionId);
    res.json({ message: 'Sesija obrisana' });
  } catch (e) {
    res.status(500).json({ message: 'Server error' });
  }
};

// ===== SIGNUPS =====

// Prijavi se na sesiju
exports.signupSession = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id, sessionId } = req.params;

    // Provjeri je li član studija
    const { data: member } = await supabase
      .from('studio_members')
      .select('id')
      .eq('studio_id', id)
      .eq('user_id', userId)
      .single();
    if (!member) return res.status(403).json({ message: 'Nisi član ovog studija' });
    const { data: memberData } = await supabase
  .from('studio_members')
  .select('membership_paid')
  .eq('studio_id', id)
  .eq('user_id', userId)
  .single();

if (!memberData?.membership_paid) {
  return res.status(403).json({ message: '❌ Nisi platio/la članarinu. Kontaktiraj trenera.' });
}
    // Dohvati sesiju
    const { data: session } = await supabase
      .from('studio_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();
    if (!session) return res.status(404).json({ message: 'Sesija nije pronađena' });

    // Provjeri rok prijave
    const sessionDateTime = new Date(`${session.date}T${session.time}`);
    const signupDeadline = new Date(sessionDateTime.getTime() - session.signup_deadline_hours * 60 * 60 * 1000);
    if (new Date() > signupDeadline) {
      return res.status(400).json({ message: `Prijava je zatvorena ${session.signup_deadline_hours}h prije treninga` });
    }

    // Provjeri kapacitet
    const { count } = await supabase
      .from('session_signups')
      .select('*', { count: 'exact', head: true })
      .eq('session_id', sessionId)
      .is('cancelled_at', null);

    if (count >= session.max_participants) {
      return res.status(400).json({ message: 'Trening je popunjen' });
    }

    // Provjeri već prijavljen
    const { data: existing } = await supabase
      .from('session_signups')
      .select('*')
      .eq('session_id', sessionId)
      .eq('user_id', userId)
      .single();

    if (existing && !existing.cancelled_at) {
      return res.status(400).json({ message: 'Već si prijavljen/a' });
    }

    // Ako je bio otkazan, reaktiviraj
    if (existing && existing.cancelled_at) {
      const { data } = await supabase
        .from('session_signups')
        .update({ cancelled_at: null, signed_up_at: new Date().toISOString() })
        .eq('id', existing.id)
        .select()
        .single();
      return res.json(data);
    }

    const { data, error } = await supabase
      .from('session_signups')
      .insert({ session_id: sessionId, user_id: userId })
      .select()
      .single();

    if (error) return res.status(500).json({ message: 'Greška pri prijavi' });
    res.status(201).json(data);
  } catch (e) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Otkaži prijavu
exports.cancelSignup = async (req, res) => {
  try {
    const userId = req.user.id;
    const { sessionId } = req.params;

    const { data: session } = await supabase
      .from('studio_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();
    if (!session) return res.status(404).json({ message: 'Sesija nije pronađena' });

    // Provjeri rok otkazivanja
    const sessionDateTime = new Date(`${session.date}T${session.time}`);
    const cancelDeadline = new Date(sessionDateTime.getTime() - session.cancel_deadline_hours * 60 * 60 * 1000);
    if (new Date() > cancelDeadline) {
      return res.status(400).json({ message: `Otkazivanje nije moguće ${session.cancel_deadline_hours}h prije treninga` });
    }

    const { data, error } = await supabase
      .from('session_signups')
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
// Kopiraj sesije tjedna u sljedeći tjedan
exports.copyWeekSessions = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { weekStart } = req.body; // ISO datum, npr. "2026-03-16"

    // Provjeri je li trener
    const { data: studio } = await supabase.from('studios').select('trainer_id').eq('id', id).single();
    if (!studio) return res.status(404).json({ message: 'Studio nije pronađen' });
    if (studio.trainer_id !== userId) return res.status(403).json({ message: 'Nije dozvoljeno' });

    // Izračunaj početak i kraj tjedna
    const start = new Date(weekStart);
    const end = new Date(weekStart);
    end.setDate(end.getDate() + 6);

    const startStr = start.toISOString().split('T')[0];
    const endStr = end.toISOString().split('T')[0];

    // Dohvati sve sesije tog tjedna
    const { data: sessions, error } = await supabase
      .from('studio_sessions')
      .select('title, type, time, max_participants, signup_deadline_hours, cancel_deadline_hours, notes, date')
      .eq('studio_id', id)
      .gte('date', startStr)
      .lte('date', endStr);

    if (error) return res.status(500).json({ message: 'Greška pri dohvaćanju sesija' });
    if (!sessions || sessions.length === 0) {
      return res.status(400).json({ message: 'Nema sesija u odabranom tjednu za kopiranje' });
    }

    // Dupliciraj svaku sesiju +7 dana
    const newSessions = sessions.map(s => {
      const newDate = new Date(s.date);
      newDate.setDate(newDate.getDate() + 7);
      return {
        studio_id: id,
        title: s.title,
        type: s.type,
        date: newDate.toISOString().split('T')[0],
        time: s.time,
        max_participants: s.max_participants,
        signup_deadline_hours: s.signup_deadline_hours,
        cancel_deadline_hours: s.cancel_deadline_hours,
        notes: s.notes || ''
      };
    });

    const { data: created, error: insertError } = await supabase
      .from('studio_sessions')
      .insert(newSessions)
      .select();

    if (insertError) return res.status(500).json({ message: 'Greška pri kopiranju sesija' });

    res.status(201).json({
      message: `✅ Kopirano ${created.length} treninga u sljedeći tjedan!`,
      sessions: created
    });
  } catch (e) {
    res.status(500).json({ message: 'Server error' });
  }
};
// Toggle članarina
exports.toggleMembership = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id, memberId } = req.params;

    const { data: studio } = await supabase.from('studios').select('trainer_id').eq('id', id).single();
    if (!studio || studio.trainer_id !== userId) return res.status(403).json({ message: 'Nije dozvoljeno' });

    const { data: member } = await supabase.from('studio_members').select('membership_paid').eq('id', memberId).single();
    if (!member) return res.status(404).json({ message: 'Član nije pronađen' });

    const { data, error } = await supabase
      .from('studio_members')
      .update({ membership_paid: !member.membership_paid })
      .eq('id', memberId)
      .select()
      .single();

    if (error) return res.status(500).json({ message: 'Greška' });
    res.json(data);
  } catch (e) {
    res.status(500).json({ message: 'Server error' });
  }

};