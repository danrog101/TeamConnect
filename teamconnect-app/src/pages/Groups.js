import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Toast from '../components/Toast';
import { API_URL } from '../config';
import './MyStudio.css';

const SPORTS = [
  'Nogomet', 'Košarka', 'Odbojka', 'Tenis', 'Rukomet',
  'Plivanje', 'Atletika', 'Badminton', 'Stolni tenis', 'Boks',
  'Džudo', 'Karate', 'Yoga', 'CrossFit', 'Trčanje'
];

const SESSION_TYPES = [
  'Trening', 'Utakmica', 'Prijateljska utakmica', 'Turnir',
  'Piknik', 'Rekreacija', 'Slobodna igra'
];

function Groups() {
  const navigate = useNavigate();
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const token = localStorage.getItem('token');

  const [myGroups, setMyGroups] = useState([]);
  const [memberGroups, setMemberGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [members, setMembers] = useState([]);
  const [activeTab, setActiveTab] = useState('sessions');
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showCreateSession, setShowCreateSession] = useState(false);
  const [showJoinGroup, setShowJoinGroup] = useState(false);
  const [showInviteCode, setShowInviteCode] = useState(false);

  const [groupForm, setGroupForm] = useState({
    name: '', description: '', sport: '',
    min_skill_level: 1, max_skill_level: 10
  });

  const [sessionForm, setSessionForm] = useState({
    title: '', type: '', date: '', time: '',
    max_participants: 10, min_participants: 2,
    signup_deadline_hours: 2, cancel_deadline_hours: 1,
    notes: '', min_skill_level: 1, max_skill_level: 10
  });

  const [joinCode, setJoinCode] = useState('');

  useEffect(() => { loadData(); }, []);

  useEffect(() => {
    if (selectedGroup) {
      loadSessions(selectedGroup.id);
      setActiveTab('sessions');
      if (isCreator(selectedGroup)) loadMembers(selectedGroup.id);
    }
  }, [selectedGroup]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [myRes, memberRes] = await Promise.all([
        fetch(`${API_URL}/groups/my`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/groups/member`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      if (myRes.ok) setMyGroups(await myRes.json());
      if (memberRes.ok) setMemberGroups(await memberRes.json());
    } catch (e) {
      setToast({ message: 'Greška pri učitavanju', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const loadSessions = async (groupId) => {
    try {
      const res = await fetch(`${API_URL}/groups/${groupId}/sessions`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setSessions(await res.json());
    } catch (e) { console.error(e); }
  };

  const loadMembers = async (groupId) => {
    try {
      const res = await fetch(`${API_URL}/groups/${groupId}/members`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setMembers(await res.json());
    } catch (e) { console.error(e); }
  };

  const handleCreateGroup = async () => {
    if (!groupForm.name || !groupForm.sport) {
      setToast({ message: 'Naziv i sport su obavezni!', type: 'error' });
      return;
    }
    try {
      const res = await fetch(`${API_URL}/groups`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(groupForm)
      });
      const data = await res.json();
      if (res.ok) {
        setToast({ message: '✅ Grupa kreirana!', type: 'success' });
        setShowCreateGroup(false);
        setGroupForm({ name: '', description: '', sport: '', min_skill_level: 1, max_skill_level: 10 });
        loadData();
      } else {
        setToast({ message: data.message, type: 'error' });
      }
    } catch (e) {
      setToast({ message: 'Greška', type: 'error' });
    }
  };

  const handleJoinGroup = async () => {
    if (!joinCode.trim()) return;
    try {
      const res = await fetch(`${API_URL}/groups/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ invite_code: joinCode.trim() })
      });
      const data = await res.json();
      if (res.ok) {
        setToast({ message: '✅ Pridružen/a si grupi!', type: 'success' });
        setShowJoinGroup(false);
        setJoinCode('');
        loadData();
      } else {
        setToast({ message: data.message, type: 'error' });
      }
    } catch (e) {
      setToast({ message: 'Greška', type: 'error' });
    }
  };

  const handleLeaveGroup = async (groupId) => {
    try {
      const res = await fetch(`${API_URL}/groups/${groupId}/leave`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setToast({ message: 'Napustio/la si grupu', type: 'info' });
        setSelectedGroup(null);
        loadData();
      } else {
        setToast({ message: data.message, type: 'error' });
      }
    } catch (e) {
      setToast({ message: 'Greška', type: 'error' });
    }
  };

  const handleCreateSession = async () => {
    if (!sessionForm.title || !sessionForm.type || !sessionForm.date || !sessionForm.time) {
      setToast({ message: 'Popuni sva obavezna polja!', type: 'error' });
      return;
    }
    try {
      const res = await fetch(`${API_URL}/groups/${selectedGroup.id}/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(sessionForm)
      });
      const data = await res.json();
      if (res.ok) {
        setToast({ message: '✅ Trening kreiran!', type: 'success' });
        setShowCreateSession(false);
        setSessionForm({
          title: '', type: '', date: '', time: '',
          max_participants: 10, min_participants: 2,
          signup_deadline_hours: 2, cancel_deadline_hours: 1,
          notes: '', min_skill_level: 1, max_skill_level: 10
        });
        loadSessions(selectedGroup.id);
      } else {
        setToast({ message: data.message, type: 'error' });
      }
    } catch (e) {
      setToast({ message: 'Greška', type: 'error' });
    }
  };

  const handleTogglePublic = async (sessionId) => {
    try {
      const res = await fetch(`${API_URL}/groups/${selectedGroup.id}/sessions/${sessionId}/toggle-public`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        loadSessions(selectedGroup.id);
        setToast({ message: 'Vidljivost treninga promijenjena', type: 'info' });
      }
    } catch (e) {
      setToast({ message: 'Greška', type: 'error' });
    }
  };

  const handleDeleteSession = async (sessionId) => {
    try {
      await fetch(`${API_URL}/groups/${selectedGroup.id}/sessions/${sessionId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      setToast({ message: 'Trening obrisan', type: 'info' });
      loadSessions(selectedGroup.id);
    } catch (e) {
      setToast({ message: 'Greška', type: 'error' });
    }
  };

  const handleSignup = async (sessionId) => {
    try {
      const res = await fetch(`${API_URL}/groups/${selectedGroup.id}/sessions/${sessionId}/signup`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setToast({ message: '✅ Prijavljen/a si!', type: 'success' });
        loadSessions(selectedGroup.id);
      } else {
        setToast({ message: data.message, type: 'error' });
      }
    } catch (e) {
      setToast({ message: 'Greška', type: 'error' });
    }
  };

  const handleCancel = async (sessionId) => {
    try {
      const res = await fetch(`${API_URL}/groups/sessions/${sessionId}/cancel`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setToast({ message: 'Prijava otkazana', type: 'info' });
        loadSessions(selectedGroup.id);
      } else {
        setToast({ message: data.message, type: 'error' });
      }
    } catch (e) {
      setToast({ message: 'Greška', type: 'error' });
    }
  };

  const handleRemoveMember = async (memberId) => {
    try {
      await fetch(`${API_URL}/groups/${selectedGroup.id}/members/${memberId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      setToast({ message: 'Član uklonjen', type: 'info' });
      loadMembers(selectedGroup.id);
    } catch (e) {
      setToast({ message: 'Greška', type: 'error' });
    }
  };

  const isCreator = (group) => group?.creator_id === currentUser.id;

  const getSignupStatus = (session) => {
    if (!session.signups) return { isSignedUp: false, count: 0 };
    const active = session.signups.filter(s => !s.cancelled_at);
    return { isSignedUp: active.some(s => s.user_id === currentUser.id), count: active.length };
  };

  const canSignup = (session) => {
    const dt = new Date(`${session.date}T${session.time}`);
    return new Date() <= new Date(dt.getTime() - session.signup_deadline_hours * 3600000);
  };

  const canCancel = (session) => {
    const dt = new Date(`${session.date}T${session.time}`);
    return new Date() <= new Date(dt.getTime() - session.cancel_deadline_hours * 3600000);
  };

  const formatDateTime = (date, time) => {
    const d = new Date(`${date}T${time}`);
    return d.toLocaleDateString('hr-HR', { weekday: 'short', day: '2-digit', month: '2-digit' }) + ' u ' + time.slice(0, 5);
  };

  const allGroups = [
    ...myGroups.map(g => ({ ...g, role: 'creator' })),
    ...memberGroups.filter(mg => !myGroups.find(g => g.id === mg.id)).map(g => ({ ...g, role: 'member' }))
  ];

  if (loading) return (
    <div className="studio-page">
      <Navbar />
      <div className="loading">Učitavanje...</div>
    </div>
  );

  return (
    <div className="studio-page">
      <Navbar />
      <div className="studio-container">
        {!selectedGroup ? (
          <>
            <div className="studio-header">
              <h1>🏃 Grupe</h1>
              <p>Pridruži se grupi ili kreiraj vlastitu</p>
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
                <button className="btn btn-primary" onClick={() => setShowCreateGroup(true)}>
                  + Kreiraj grupu
                </button>
                <button className="btn btn-secondary" onClick={() => setShowJoinGroup(true)}>
                  🔑 Pridruži se kodom
                </button>
              </div>
            </div>

            {allGroups.length === 0 ? (
              <div className="no-studios card">
                <span style={{ fontSize: '3rem' }}>🏃</span>
                <h2>Nemaš grupa</h2>
                <p>Kreiraj novu grupu ili se pridruži postojećoj kodom</p>
              </div>
            ) : (
              <div className="studios-grid">
                {allGroups.map(group => (
                  <div key={group.id} className="studio-card card" onClick={() => setSelectedGroup(group)}>
                    <div className="studio-card-header">
                      <span style={{ fontSize: '2rem' }}>🏃</span>
                      <div>
                        <h3>{group.name}</h3>
                        <span className={`studio-role-badge ${group.role === 'creator' ? 'trainer' : 'member'}`}>
                          {group.role === 'creator' ? '👑 Organizator' : '🏃 Član'}
                        </span>
                      </div>
                    </div>
                    <p className="studio-desc">⚽ {group.sport}</p>
                    {group.description && <p className="studio-desc">{group.description}</p>}
                    <div className="studio-card-footer">
                      <span>Klikni za detalje →</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <>
            <div className="studio-detail-header">
              <button className="btn btn-secondary" onClick={() => { setSelectedGroup(null); setSessions([]); setMembers([]); }}>
                ← Natrag
              </button>
              <div>
                <h1>🏃 {selectedGroup.name}</h1>
                <p style={{ color: 'var(--text-secondary)', margin: 0 }}>⚽ {selectedGroup.sport}</p>
                <span className={`studio-role-badge ${isCreator(selectedGroup) ? 'trainer' : 'member'}`}>
                  {isCreator(selectedGroup) ? '👑 Ti si organizator' : '🏃 Ti si član'}
                </span>
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {isCreator(selectedGroup) && (
                  <>
                    <button className="btn btn-primary" onClick={() => setShowCreateSession(true)}>
                      + Novi trening
                    </button>
                    <button className="btn btn-secondary" onClick={() => setShowInviteCode(true)}>
                      🔑 Invite kod
                    </button>
                  </>
                )}
                {!isCreator(selectedGroup) && (
                  <button className="btn btn-danger" onClick={() => handleLeaveGroup(selectedGroup.id)}>
                    Napusti grupu
                  </button>
                )}
              </div>
            </div>

            {isCreator(selectedGroup) && (
              <div className="studio-tabs">
                <button className={`tab ${activeTab === 'sessions' ? 'active' : ''}`} onClick={() => setActiveTab('sessions')}>
                  📅 Treninzi
                </button>
                <button className={`tab ${activeTab === 'members' ? 'active' : ''}`} onClick={() => setActiveTab('members')}>
                  👥 Članovi ({members.length})
                </button>
              </div>
            )}

            {(activeTab === 'sessions' || !isCreator(selectedGroup)) && (
              <div className="sessions-list">
                {sessions.length === 0 ? (
                  <div className="no-sessions card">
                    <span style={{ fontSize: '3rem' }}>📅</span>
                    <h3>Nema treninga</h3>
                    {isCreator(selectedGroup) && <p>Kreiraj prvi trening!</p>}
                  </div>
                ) : (
                  sessions.map(session => {
                    const { isSignedUp, count } = getSignupStatus(session);
                    const isPast = new Date(`${session.date}T${session.time}`) < new Date();
                    const belowMin = count < session.min_participants;

                    return (
                      <div key={session.id} className={`session-card card ${isPast ? 'past' : ''}`}>
                        <div className="session-card-main">
                          <div className="session-info">
                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' }}>
                              <div className="session-type-badge">{session.type}</div>
                              {session.is_public && (
                                <div className="session-type-badge" style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981' }}>
                                  🌍 Javno
                                </div>
                              )}
                              {!isPast && belowMin && (
                                <div className="session-type-badge" style={{ background: 'rgba(245,158,11,0.15)', color: '#f59e0b' }}>
                                  ⚠️ Nedovoljno prijava
                                </div>
                              )}
                            </div>
                            <h3>{session.title}</h3>
                            <p className="session-datetime">📅 {formatDateTime(session.date, session.time)}</p>
                            <p className="session-spots">
                              👥 {count}/{session.max_participants} prijavljenih
                              {count >= session.max_participants && <span className="full-badge"> PUNO</span>}
                            </p>
                            <p className="session-deadlines">
                              🎯 Min. igrača: {session.min_participants} &nbsp;|&nbsp;
                              ⭐ Razina: {session.min_skill_level}-{session.max_skill_level}
                            </p>
                            {session.notes && <p className="session-notes">📝 {session.notes}</p>}
                          </div>

                          <div className="session-actions">
                            {!isCreator(selectedGroup) && !isPast && (
                              isSignedUp ? (
                                <button className="btn btn-danger" onClick={() => handleCancel(session.id)} disabled={!canCancel(session)}>
                                  ❌ Otkaži
                                </button>
                              ) : (
                                <button className="btn btn-primary" onClick={() => handleSignup(session.id)} disabled={!canSignup(session) || count >= session.max_participants}>
                                  ✅ Prijavi se
                                </button>
                              )
                            )}

                            {isSignedUp && !isPast && (
                              <span className="signed-up-badge">✅ Prijavljen/a</span>
                            )}

                            <div className="trainer-signups">
  {session.signups?.filter(s => !s.cancelled_at).map(s => (
    <div key={s.id} className="signup-person">
      <span className="signup-avatar">{s.user?.avatar || '👤'}</span>
      <span className="signup-name">{s.user?.username}</span>
    </div>
  ))}
  {count === 0 && (
    <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Nema prijavljenih</p>
  )}
</div>

{isCreator(selectedGroup) && (
  <>
    {!isPast && belowMin && (
                                  <button
                                    className={`btn btn-small ${session.is_public ? 'btn-secondary' : 'btn-primary'}`}
                                    onClick={() => handleTogglePublic(session.id)}
                                  >
                                    {session.is_public ? '🔒 Zatvori javnost' : '🌍 Učini javnim'}
                                  </button>
                                )}
                                {session.is_public && !belowMin && (
                                  <button className="btn btn-secondary btn-small" onClick={() => handleTogglePublic(session.id)}>
                                    🔒 Zatvori javnost
                                  </button>
                                )}
                                <button className="btn btn-danger btn-small" onClick={() => handleDeleteSession(session.id)}>
                                  🗑️
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {isCreator(selectedGroup) && activeTab === 'members' && (
              <div className="members-list">
                {members.length === 0 ? (
                  <div className="no-members card">
                    <span style={{ fontSize: '3rem' }}>👥</span>
                    <h3>Nema članova</h3>
                    <p>Podijeli invite kod da se drugi pridruže</p>
                  </div>
                ) : (
                  members.map(member => (
                    <div key={member.id} className="member-card card">
                      <div className="member-info">
                        <span className="member-avatar">{member.user?.avatar || '👤'}</span>
                        <div>
                          <strong>{member.user?.username}</strong>
                          <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                            {member.role === 'admin' ? '👑 Organizator' : '🏃 Član'}
                          </p>
                        </div>
                      </div>
                      {member.user?.id !== currentUser.id && member.role !== 'admin' && (
                        <button className="btn btn-danger btn-small" onClick={() => handleRemoveMember(member.id)}>
                          Ukloni
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal - Kreiraj Grupu */}
      {showCreateGroup && (
        <div className="modal-overlay" onClick={() => setShowCreateGroup(false)}>
          <div className="studio-modal card" onClick={e => e.stopPropagation()}>
            <h2>🏃 Kreiraj Grupu</h2>
            <div className="form-group">
              <label>Naziv *</label>
              <input type="text" placeholder="npr. OK Jadran Split" value={groupForm.name}
                onChange={e => setGroupForm({ ...groupForm, name: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Sport *</label>
              <select value={groupForm.sport} onChange={e => setGroupForm({ ...groupForm, sport: e.target.value })}>
                <option value="">-- Odaberi sport --</option>
                {SPORTS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Opis</label>
              <textarea placeholder="Kratki opis grupe..." value={groupForm.description}
                onChange={e => setGroupForm({ ...groupForm, description: e.target.value })} rows={3} />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Min. razina (1-10)</label>
                <input type="number" min="1" max="10" value={groupForm.min_skill_level}
                  onChange={e => setGroupForm({ ...groupForm, min_skill_level: parseInt(e.target.value) })} />
              </div>
              <div className="form-group">
                <label>Max. razina (1-10)</label>
                <input type="number" min="1" max="10" value={groupForm.max_skill_level}
                  onChange={e => setGroupForm({ ...groupForm, max_skill_level: parseInt(e.target.value) })} />
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowCreateGroup(false)}>Odustani</button>
              <button className="btn btn-primary" onClick={handleCreateGroup}>Kreiraj</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal - Pridruži se kodom */}
      {showJoinGroup && (
        <div className="modal-overlay" onClick={() => setShowJoinGroup(false)}>
          <div className="studio-modal card" onClick={e => e.stopPropagation()}>
            <h2>🔑 Pridruži se grupi</h2>
            <div className="form-group">
              <label>Invite kod</label>
              <input type="text" placeholder="Upiši kod grupe..." value={joinCode}
                onChange={e => setJoinCode(e.target.value)} />
            </div>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowJoinGroup(false)}>Odustani</button>
              <button className="btn btn-primary" onClick={handleJoinGroup}>Pridruži se</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal - Invite kod */}
      {showInviteCode && selectedGroup && (
        <div className="modal-overlay" onClick={() => setShowInviteCode(false)}>
          <div className="studio-modal card" onClick={e => e.stopPropagation()}>
            <h2>🔑 Invite kod grupe</h2>
            <p style={{ color: 'var(--text-secondary)' }}>Podijeli ovaj kod da se drugi pridruže grupi:</p>
            <div style={{
              background: 'var(--bg-tertiary)', borderRadius: '12px', padding: '20px',
              textAlign: 'center', fontSize: '2rem', fontWeight: '800',
              letterSpacing: '6px', color: 'var(--color-primary)', margin: '16px 0'
            }}>
              {selectedGroup.invite_code}
            </div>
            <button className="btn btn-primary" style={{ width: '100%' }}
              onClick={() => { navigator.clipboard.writeText(selectedGroup.invite_code); setToast({ message: '✅ Kod kopiran!', type: 'success' }); }}>
              📋 Kopiraj kod
            </button>
            <div className="modal-actions" style={{ marginTop: '12px' }}>
              <button className="btn btn-secondary" onClick={() => setShowInviteCode(false)}>Zatvori</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal - Kreiraj Trening */}
      {showCreateSession && (
        <div className="modal-overlay" onClick={() => setShowCreateSession(false)}>
          <div className="studio-modal card" onClick={e => e.stopPropagation()}>
            <h2>📅 Novi Trening</h2>
            <div className="form-group">
              <label>Naziv *</label>
              <input type="text" placeholder="npr. Večernji trening" value={sessionForm.title}
                onChange={e => setSessionForm({ ...sessionForm, title: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Vrsta *</label>
              <select value={sessionForm.type} onChange={e => setSessionForm({ ...sessionForm, type: e.target.value })}>
                <option value="">-- Odaberi vrstu --</option>
                {SESSION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Datum *</label>
                <input type="date" value={sessionForm.date}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={e => setSessionForm({ ...sessionForm, date: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Vrijeme *</label>
                <input type="time" value={sessionForm.time}
                  onChange={e => setSessionForm({ ...sessionForm, time: e.target.value })} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Max. igrača</label>
                <input type="number" min="1" max="100" value={sessionForm.max_participants}
                  onChange={e => setSessionForm({ ...sessionForm, max_participants: parseInt(e.target.value) })} />
              </div>
              <div className="form-group">
                <label>Min. igrača</label>
                <input type="number" min="1" max="100" value={sessionForm.min_participants}
                  onChange={e => setSessionForm({ ...sessionForm, min_participants: parseInt(e.target.value) })} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Min. razina</label>
                <input type="number" min="1" max="10" value={sessionForm.min_skill_level}
                  onChange={e => setSessionForm({ ...sessionForm, min_skill_level: parseInt(e.target.value) })} />
              </div>
              <div className="form-group">
                <label>Max. razina</label>
                <input type="number" min="1" max="10" value={sessionForm.max_skill_level}
                  onChange={e => setSessionForm({ ...sessionForm, max_skill_level: parseInt(e.target.value) })} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Prijava zatvorena (h prije)</label>
                <select value={sessionForm.signup_deadline_hours}
                  onChange={e => setSessionForm({ ...sessionForm, signup_deadline_hours: parseInt(e.target.value) })}>
                  <option value={0}>Otvorene</option>
                  <option value={1}>1h</option>
                  <option value={2}>2h</option>
                  <option value={3}>3h</option>
                  <option value={6}>6h</option>
                  <option value={12}>12h</option>
                  <option value={24}>24h</option>
                </select>
              </div>
              <div className="form-group">
                <label>Otkaz do (h prije)</label>
                <select value={sessionForm.cancel_deadline_hours}
                  onChange={e => setSessionForm({ ...sessionForm, cancel_deadline_hours: parseInt(e.target.value) })}>
                  <option value={0}>Uvijek</option>
                  <option value={1}>1h</option>
                  <option value={2}>2h</option>
                  <option value={3}>3h</option>
                  <option value={6}>6h</option>
                  <option value={12}>12h</option>
                  <option value={24}>24h</option>
                </select>
              </div>
            </div>
            <div className="form-group">
              <label>Napomene</label>
              <textarea placeholder="Dodatne info..." value={sessionForm.notes}
                onChange={e => setSessionForm({ ...sessionForm, notes: e.target.value })} rows={2} />
            </div>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowCreateSession(false)}>Odustani</button>
              <button className="btn btn-primary" onClick={handleCreateSession}>Kreiraj</button>
            </div>
          </div>
        </div>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

export default Groups;