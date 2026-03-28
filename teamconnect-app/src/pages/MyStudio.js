import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Toast from '../components/Toast';
import { API_URL } from '../config';
import { useLanguage } from '../i18n/LanguageContext';
import './MyStudio.css';

function MyStudio() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

  const [myStudios, setMyStudios]         = useState([]);
  const [memberStudios, setMemberStudios] = useState([]);
  const [activeTab, setActiveTab]         = useState('my-studios');
  const [selectedStudio, setSelectedStudio] = useState(null);
  const [sessions, setSessions]           = useState([]);
  const [members, setMembers]             = useState([]);
  const [loading, setLoading]             = useState(true);
  const [toast, setToast]                 = useState(null);
  const [showCopyWeek, setShowCopyWeek]   = useState(false);
  const [copyWeekDate, setCopyWeekDate]   = useState('');
  const [copyLoading, setCopyLoading]     = useState(false);
  const [showCreateStudio, setShowCreateStudio]   = useState(false);
  const [showCreateSession, setShowCreateSession] = useState(false);
  const [showAddMember, setShowAddMember]         = useState(false);

  const [studioForm, setStudioForm] = useState({ name: '', description: '' });
  const [sessionForm, setSessionForm] = useState({
    title: '', type: '', date: '', time: '',
    max_participants: 10, signup_deadline_hours: 2,
    cancel_deadline_hours: 1, notes: ''
  });
  const [memberInput, setMemberInput] = useState('');

  const sessionTypes = [
    'Pilates', 'Funkcionalni trening', 'CrossFit', 'Yoga',
    'Zumba', 'Spinning', 'TRX', 'Stretching', 'HIIT', 'Bootcamp'
  ];

  const token = localStorage.getItem('token');

  useEffect(() => { loadData(); }, []);

  useEffect(() => {
    if (memberStudios.length > 0 && myStudios.length === 0) {
      setSelectedStudio(memberStudios[0]);
      setActiveTab('sessions');
    }
  }, [memberStudios, myStudios]);

  useEffect(() => {
    if (selectedStudio) {
      setActiveTab('sessions');
      loadSessions(selectedStudio.id);
      if (isTrainer(selectedStudio)) loadMembers(selectedStudio.id);
    }
  }, [selectedStudio]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [myRes, memberRes] = await Promise.all([
        fetch(`${API_URL}/studios/my`,     { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/studios/member`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      if (myRes.ok)     setMyStudios(await myRes.json());
      if (memberRes.ok) setMemberStudios(await memberRes.json());
    } catch (e) {
      setToast({ message: t('common.error'), type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const loadSessions = async (studioId) => {
    try {
      const res = await fetch(`${API_URL}/studios/${studioId}/sessions`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setSessions(await res.json());
    } catch (e) { console.error(e); }
  };

  const loadMembers = async (studioId) => {
    try {
      const res = await fetch(`${API_URL}/studios/${studioId}/members`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setMembers(await res.json());
    } catch (e) { console.error(e); }
  };

  const handleCreateStudio = async () => {
    if (!studioForm.name) { setToast({ message: t('common.required'), type: 'error' }); return; }
    try {
      const res = await fetch(`${API_URL}/studios`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(studioForm)
      });
      const data = await res.json();
      if (res.ok) {
        setToast({ message: '✅ Studio kreiran!', type: 'success' });
        setShowCreateStudio(false);
        setStudioForm({ name: '', description: '' });
        loadData();
      } else {
        setToast({ message: data.message, type: 'error' });
      }
    } catch (e) { setToast({ message: t('common.error'), type: 'error' }); }
  };

  const handleCreateSession = async () => {
    if (!sessionForm.title || !sessionForm.type || !sessionForm.date || !sessionForm.time) {
      setToast({ message: t('common.required'), type: 'error' });
      return;
    }
    try {
      const res = await fetch(`${API_URL}/studios/${selectedStudio.id}/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(sessionForm)
      });
      const data = await res.json();
      if (res.ok) {
        setToast({ message: '✅ Trening kreiran!', type: 'success' });
        setShowCreateSession(false);
        setSessionForm({ title: '', type: '', date: '', time: '', max_participants: 10, signup_deadline_hours: 2, cancel_deadline_hours: 1, notes: '' });
        loadSessions(selectedStudio.id);
      } else {
        setToast({ message: data.message, type: 'error' });
      }
    } catch (e) { setToast({ message: t('common.error'), type: 'error' }); }
  };

  const handleAddMember = async () => {
    if (!memberInput) return;
    try {
      const res = await fetch(`${API_URL}/studios/${selectedStudio.id}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ usernameOrEmail: memberInput })
      });
      const data = await res.json();
      if (res.ok) {
        setToast({ message: '✅ Član dodan!', type: 'success' });
        setMemberInput('');
        setShowAddMember(false);
        loadMembers(selectedStudio.id);
      } else {
        setToast({ message: data.message, type: 'error' });
      }
    } catch (e) { setToast({ message: t('common.error'), type: 'error' }); }
  };

  const handleRemoveMember = async (memberId) => {
    try {
      await fetch(`${API_URL}/studios/${selectedStudio.id}/members/${memberId}`, {
        method: 'DELETE', headers: { Authorization: `Bearer ${token}` }
      });
      setToast({ message: 'Član uklonjen', type: 'info' });
      loadMembers(selectedStudio.id);
    } catch (e) { setToast({ message: t('common.error'), type: 'error' }); }
  };

  const handleSignup = async (sessionId) => {
    try {
      const res = await fetch(`${API_URL}/studios/${selectedStudio.id}/sessions/${sessionId}/signup`, {
        method: 'POST', headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setToast({ message: '✅ Prijavljen/a si!', type: 'success' });
        loadSessions(selectedStudio.id);
      } else {
        setToast({ message: data.message, type: 'error' });
      }
    } catch (e) { setToast({ message: t('common.error'), type: 'error' }); }
  };

  const handleCancel = async (sessionId) => {
    try {
      const res = await fetch(`${API_URL}/studios/sessions/${sessionId}/cancel`, {
        method: 'PUT', headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setToast({ message: '✅ Prijava otkazana', type: 'info' });
        loadSessions(selectedStudio.id);
      } else {
        setToast({ message: data.message, type: 'error' });
      }
    } catch (e) { setToast({ message: t('common.error'), type: 'error' }); }
  };

  const handleDeleteSession = async (sessionId) => {
    try {
      await fetch(`${API_URL}/studios/${selectedStudio.id}/sessions/${sessionId}`, {
        method: 'DELETE', headers: { Authorization: `Bearer ${token}` }
      });
      setToast({ message: 'Trening obrisan', type: 'info' });
      loadSessions(selectedStudio.id);
    } catch (e) { setToast({ message: t('common.error'), type: 'error' }); }
  };

  const handleToggleMembership = async (memberId) => {
    try {
      const res = await fetch(`${API_URL}/studios/${selectedStudio.id}/members/${memberId}/membership`, {
        method: 'PUT', headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) loadMembers(selectedStudio.id);
    } catch (e) { setToast({ message: t('common.error'), type: 'error' }); }
  };

  const handleCopyWeek = async () => {
    if (!copyWeekDate) { setToast({ message: 'Odaberi tjedan!', type: 'error' }); return; }
    const d = new Date(copyWeekDate);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    const weekStart = d.toISOString().split('T')[0];
    try {
      setCopyLoading(true);
      const res = await fetch(`${API_URL}/studios/${selectedStudio.id}/sessions/copy-week`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ weekStart })
      });
      const data = await res.json();
      if (res.ok) {
        setToast({ message: data.message, type: 'success' });
        setShowCopyWeek(false);
        setCopyWeekDate('');
        loadSessions(selectedStudio.id);
      } else {
        setToast({ message: data.message, type: 'error' });
      }
    } catch (e) {
      setToast({ message: t('common.error'), type: 'error' });
    } finally {
      setCopyLoading(false);
    }
  };

  const isTrainer = (studio) => studio?.trainer_id === currentUser.id;

  const getSignupStatus = (session) => {
    if (!session.signups) return { isSignedUp: false, count: 0 };
    const activeSignups = session.signups.filter(s => !s.cancelled_at);
    return { isSignedUp: activeSignups.some(s => s.user_id === currentUser.id), count: activeSignups.length };
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

  const allStudios = [
    ...myStudios.map(s => ({ ...s, role: 'trainer' })),
    ...memberStudios.filter(ms => !myStudios.find(s => s.id === ms.id)).map(s => ({ ...s, role: 'member' }))
  ];

  if (loading) return (
    <div className="studio-page"><Navbar /><div className="loading">{t('common.loading')}</div></div>
  );

  return (
    <div className="studio-page">
      <Navbar />
      <div className="studio-container">
        {!selectedStudio ? (
          <>
            <div className="studio-header">
              <h1>💪 {t('nav.myStudio')}</h1>
              <p>Upravljaj treninzima i klijentima</p>
              <button className="btn btn-primary" onClick={() => setShowCreateStudio(true)}>
                + Kreiraj Studio
              </button>
            </div>

            {allStudios.length === 0 ? (
              <div className="no-studios card">
                <span style={{ fontSize: '3rem' }}>🏋️</span>
                <h2>Nemaš studija</h2>
                <p>Kreiraj novi studio ili čekaj da te trener doda u grupu</p>
              </div>
            ) : (
              <div className="studios-grid">
                {allStudios.map(studio => (
                  <div key={studio.id} className="studio-card card" onClick={() => setSelectedStudio(studio)}>
                    <div className="studio-card-header">
                      <span style={{ fontSize: '2rem' }}>💪</span>
                      <div>
                        <h3>{studio.name}</h3>
                        <span className={`studio-role-badge ${studio.role}`}>
                          {studio.role === 'trainer' ? '👨‍🏫 Trener' : '🏃 Klijent'}
                        </span>
                      </div>
                    </div>
                    {studio.description && <p className="studio-desc">{studio.description}</p>}
                    <div className="studio-card-footer">{t('common.select')} →</div>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <>
            <div className="studio-detail-header">
              <button className="btn btn-secondary" onClick={() => { setSelectedStudio(null); setSessions([]); setMembers([]); }}>
                ← {t('common.back')}
              </button>
              <div>
                <h1>💪 {selectedStudio.name}</h1>
                <span className={`studio-role-badge ${isTrainer(selectedStudio) ? 'trainer' : 'member'}`}>
                  {isTrainer(selectedStudio) ? '👨‍🏫 Ti si trener' : '🏃 Ti si klijent'}
                </span>
              </div>
              {isTrainer(selectedStudio) && (
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <button className="btn btn-primary" onClick={() => setShowCreateSession(true)}>+ Novi trening</button>
                  <button className="btn btn-secondary" onClick={() => setShowCopyWeek(true)}>📋 Kopiraj tjedan</button>
                  <button className="btn btn-secondary" onClick={() => setShowAddMember(true)}>+ Dodaj klijenta</button>
                </div>
              )}
            </div>

            {isTrainer(selectedStudio) && (
              <div className="studio-tabs">
                <button className={`tab ${activeTab === 'sessions' ? 'active' : ''}`} onClick={() => setActiveTab('sessions')}>
                  📅 Treninzi
                </button>
                <button className={`tab ${activeTab === 'members' ? 'active' : ''}`} onClick={() => setActiveTab('members')}>
                  👥 Klijenti ({members.length})
                </button>
              </div>
            )}

            {(activeTab === 'sessions' || !isTrainer(selectedStudio)) && (
              <div className="sessions-list">
                {sessions.length === 0 ? (
                  <div className="no-sessions card">
                    <span style={{ fontSize: '3rem' }}>📅</span>
                    <h3>Nema treninga</h3>
                    {isTrainer(selectedStudio) && <p>Kreiraj prvi trening!</p>}
                  </div>
                ) : (
                  sessions.map(session => {
                    const { isSignedUp, count } = getSignupStatus(session);
                    const canSign = canSignup(session);
                    const canCan  = canCancel(session);
                    const isPast  = new Date(`${session.date}T${session.time}`) < new Date();

                    return (
                      <div key={session.id} className={`session-card card ${isPast ? 'past' : ''}`}>
                        <div className="session-card-main">
                          <div className="session-info">
                            <div className="session-type-badge">{session.type}</div>
                            <h3>{session.title}</h3>
                            <p className="session-datetime">📅 {formatDateTime(session.date, session.time)}</p>
                            <p className="session-spots">
                              👥 {count}/{session.max_participants} mjesta
                              {count >= session.max_participants && <span className="full-badge"> PUNO</span>}
                            </p>
                            {session.notes && <p className="session-notes">📝 {session.notes}</p>}
                            <p className="session-deadlines">
                              ⏰ Prijava do: {session.signup_deadline_hours}h prije &nbsp;|&nbsp;
                              ❌ Otkaz do: {session.cancel_deadline_hours}h prije
                            </p>
                          </div>

                          <div className="session-actions">
                            {!isTrainer(selectedStudio) && !isPast && (
                              isSignedUp ? (
                                <button className="btn btn-danger" onClick={() => handleCancel(session.id)} disabled={!canCan}>
                                  ❌ {t('common.cancel')}
                                </button>
                              ) : (
                                <button className="btn btn-primary" onClick={() => handleSignup(session.id)} disabled={!canSign || count >= session.max_participants}>
                                  ✅ {t('common.confirm')}
                                </button>
                              )
                            )}

                            {isSignedUp && !isPast && (
                              <span className="signed-up-badge">✅ Prijavljen/a</span>
                            )}

                            {isTrainer(selectedStudio) && (
                              <>
                                <div className="trainer-signups">
                                  {session.signups?.filter(s => !s.cancelled_at).map(s => (
                                    <div key={s.id} className="signup-person">
                                      <span className="signup-avatar">{s.user?.avatar || '👤'}</span>
                                      <span className="signup-name">{s.user?.username}</span>
                                    </div>
                                  ))}
                                  {session.signups?.filter(s => !s.cancelled_at).length === 0 && (
                                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Nema prijavljenih</p>
                                  )}
                                </div>
                                <button className="btn btn-danger btn-small" onClick={() => handleDeleteSession(session.id)}>🗑️</button>
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

            {isTrainer(selectedStudio) && activeTab === 'members' && (
              <div className="members-list">
                {members.length === 0 ? (
                  <div className="no-members card">
                    <span style={{ fontSize: '3rem' }}>👥</span>
                    <h3>Nema klijenata</h3>
                    <p>Dodaj klijente po korisničkom imenu ili emailu</p>
                  </div>
                ) : (
                  members.map(member => (
                    <div key={member.id} className="member-card card">
                      <div className="member-info">
                        <span className="member-avatar">{member.user?.avatar || '👤'}</span>
                        <div>
                          <strong>{member.user?.username}</strong>
                          <p>{member.user?.email}</p>
                          <span className={`membership-status ${member.membership_paid ? 'paid' : 'unpaid'}`}>
                            {member.membership_paid ? '✅ Plaćeno' : '❌ Nije plaćeno'}
                          </span>
                        </div>
                      </div>
                      <div className="member-actions">
                        <button className={`btn-membership ${member.membership_paid ? 'mark-unpaid' : 'mark-paid'}`} onClick={() => handleToggleMembership(member.id)}>
                          {member.membership_paid ? '❌ Označi neplaćeno' : '✅ Označi plaćeno'}
                        </button>
                        <button className="btn btn-danger btn-small" onClick={() => handleRemoveMember(member.id)}>
                          {t('common.delete')}
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal: Kreiraj Studio */}
      {showCreateStudio && (
        <div className="modal-overlay" onClick={() => setShowCreateStudio(false)}>
          <div className="studio-modal card" onClick={e => e.stopPropagation()}>
            <h2>💪 Kreiraj Studio</h2>
            <div className="form-group">
              <label>Naziv *</label>
              <input type="text" placeholder="npr. Ana's Pilates Studio"
                value={studioForm.name} onChange={e => setStudioForm({ ...studioForm, name: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Opis</label>
              <textarea placeholder="Kratki opis studija..." value={studioForm.description}
                onChange={e => setStudioForm({ ...studioForm, description: e.target.value })} rows={3} />
            </div>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowCreateStudio(false)}>{t('common.cancel')}</button>
              <button className="btn btn-primary" onClick={handleCreateStudio}>{t('common.confirm')}</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Kreiraj Sesiju */}
      {showCreateSession && (
        <div className="modal-overlay" onClick={() => setShowCreateSession(false)}>
          <div className="studio-modal card" onClick={e => e.stopPropagation()}>
            <h2>📅 Novi Trening</h2>
            <div className="form-group">
              <label>Naziv treninga *</label>
              <input type="text" placeholder="npr. Jutarnji pilates" value={sessionForm.title}
                onChange={e => setSessionForm({ ...sessionForm, title: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Vrsta treninga *</label>
              <select value={sessionForm.type} onChange={e => setSessionForm({ ...sessionForm, type: e.target.value })}>
                <option value="">-- Odaberi vrstu --</option>
                {sessionTypes.map(type => <option key={type} value={type}>{type}</option>)}
                <option value="custom">✏️ Unesi vlastitu vrstu</option>
              </select>
              {sessionForm.type === 'custom' && (
                <input type="text" placeholder="Upiši vrstu treninga..." style={{ marginTop: '8px' }}
                  onChange={e => setSessionForm({ ...sessionForm, type: e.target.value })} />
              )}
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>{t('statistics.dateLabel')}</label>
                <input type="date" value={sessionForm.date} min={new Date().toISOString().split('T')[0]}
                  onChange={e => setSessionForm({ ...sessionForm, date: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Vrijeme *</label>
                <input type="time" value={sessionForm.time}
                  onChange={e => setSessionForm({ ...sessionForm, time: e.target.value })} />
              </div>
            </div>
            <div className="form-group">
              <label>Maks. sudionika</label>
              <input type="number" min="1" max="100" value={sessionForm.max_participants}
                onChange={e => setSessionForm({ ...sessionForm, max_participants: parseInt(e.target.value) })} />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Prijava zatvorena (h prije)</label>
                <select value={sessionForm.signup_deadline_hours}
                  onChange={e => setSessionForm({ ...sessionForm, signup_deadline_hours: parseInt(e.target.value) })}>
                  <option value={0}>Otvorene prijave</option>
                  {[1,2,3,6,12,24].map(h => <option key={h} value={h}>{h}h prije</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Otkaz moguć do (h prije)</label>
                <select value={sessionForm.cancel_deadline_hours}
                  onChange={e => setSessionForm({ ...sessionForm, cancel_deadline_hours: parseInt(e.target.value) })}>
                  <option value={0}>Uvijek</option>
                  {[1,2,3,6,12,24].map(h => <option key={h} value={h}>{h}h prije</option>)}
                </select>
              </div>
            </div>
            <div className="form-group">
              <label>Napomene</label>
              <textarea placeholder="Dodatne info za klijente..." value={sessionForm.notes}
                onChange={e => setSessionForm({ ...sessionForm, notes: e.target.value })} rows={2} />
            </div>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowCreateSession(false)}>{t('common.cancel')}</button>
              <button className="btn btn-primary" onClick={handleCreateSession}>{t('common.confirm')}</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Dodaj Člana */}
      {showAddMember && (
        <div className="modal-overlay" onClick={() => setShowAddMember(false)}>
          <div className="studio-modal card" onClick={e => e.stopPropagation()}>
            <h2>👥 Dodaj Klijenta</h2>
            <div className="form-group">
              <label>Korisničko ime ili email</label>
              <input type="text" placeholder="Upiši username ili email..."
                value={memberInput} onChange={e => setMemberInput(e.target.value)} />
            </div>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowAddMember(false)}>{t('common.cancel')}</button>
              <button className="btn btn-primary" onClick={handleAddMember}>{t('common.confirm')}</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Kopiraj tjedan */}
      {showCopyWeek && (
        <div className="modal-overlay" onClick={() => setShowCopyWeek(false)}>
          <div className="studio-modal card" onClick={e => e.stopPropagation()}>
            <h2>📋 Kopiraj tjedan treninga</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '16px', fontSize: '0.9rem' }}>
              Odaberi bilo koji dan iz tjedna koji želiš kopirati.
            </p>
            <div className="form-group">
              <label>Odaberi dan iz tjedna *</label>
              <input type="date" value={copyWeekDate} onChange={e => setCopyWeekDate(e.target.value)} />
            </div>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowCopyWeek(false)}>{t('common.cancel')}</button>
              <button className="btn btn-primary" onClick={handleCopyWeek} disabled={copyLoading}>
                {copyLoading ? t('common.saving') : '📋 Kopiraj u sljedeći tjedan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

export default MyStudio;