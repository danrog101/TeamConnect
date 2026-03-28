import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Toast from '../components/Toast';
import { API_URL } from '../config';
import './MyStudio.css';
import { useLanguage } from '../i18n/LanguageContext';

const SPORTS = [
  'Nogomet', 'Košarka', 'Odbojka', 'Tenis', 'Rukomet',
  'Plivanje', 'Atletika', 'Badminton', 'Stolni tenis', 'Boks',
  'Džudo', 'Karate', 'Yoga', 'CrossFit', 'Trčanje'
];

const SESSION_TYPES = [
  'Trening', 'Utakmica', 'Prijateljska utakmica', 'Turnir',
  'Piknik', 'Rekreacija', 'Slobodna igra'
];

function SignupsList({ signups }) {
  const [open, setOpen] = React.useState(false);
  const { t } = useLanguage();
  const active = signups?.filter(s => !s.cancelled_at) || [];
  return (
    <div>
      <button className="btn btn-secondary btn-small" onClick={() => setOpen(!open)} style={{ marginTop: '6px' }}>
        {open ? '🔼 Sakrij prijavljene' : `👥 Prijavljeni (${active.length})`}
      </button>
      {open && (
        <div style={{ marginTop: '8px' }}>
          {active.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Nema prijavljenih</p>
          ) : (
            active.map((s, index) => (
              <div key={s.id} className="signup-person" style={{ marginBottom: '4px' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', minWidth: '20px' }}>{index + 1}.</span>
                <span className="signup-avatar">{s.user?.avatar || '👤'}</span>
                <span className="signup-name">{s.user?.username}</span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

function Groups() {
  const navigate = useNavigate();
  const { t } = useLanguage();
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

  const [groupForm, setGroupForm] = useState({ name: '', description: '', sport: '', min_skill_level: 1, max_skill_level: 10 });
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
      setToast({ message: t('common.error'), type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const loadSessions = async (groupId) => {
    try {
      const res = await fetch(`${API_URL}/groups/${groupId}/sessions`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setSessions(await res.json());
    } catch (e) { console.error(e); }
  };

  const loadMembers = async (groupId) => {
    try {
      const res = await fetch(`${API_URL}/groups/${groupId}/members`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setMembers(await res.json());
    } catch (e) { console.error(e); }
  };

  const handleCreateGroup = async () => {
    if (!groupForm.name || !groupForm.sport) {
      setToast({ message: t('groups.nameLabel') + ' ' + t('groups.sportLabel'), type: 'error' });
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
        setToast({ message: t('groups.groupCreated'), type: 'success' });
        setShowCreateGroup(false);
        setGroupForm({ name: '', description: '', sport: '', min_skill_level: 1, max_skill_level: 10 });
        loadData();
      } else {
        setToast({ message: data.message, type: 'error' });
      }
    } catch (e) { setToast({ message: t('common.error'), type: 'error' }); }
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
        setToast({ message: t('groups.joinSuccess'), type: 'success' });
        setShowJoinGroup(false);
        setJoinCode('');
        loadData();
      } else {
        setToast({ message: data.message, type: 'error' });
      }
    } catch (e) { setToast({ message: t('common.error'), type: 'error' }); }
  };

  const handleLeaveGroup = async (groupId) => {
    try {
      const res = await fetch(`${API_URL}/groups/${groupId}/leave`, {
        method: 'POST', headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setToast({ message: t('groups.leaveSuccess'), type: 'info' });
        setSelectedGroup(null);
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
      const res = await fetch(`${API_URL}/groups/${selectedGroup.id}/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(sessionForm)
      });
      const data = await res.json();
      if (res.ok) {
        setToast({ message: t('groups.sessionCreated'), type: 'success' });
        setShowCreateSession(false);
        setSessionForm({ title: '', type: '', date: '', time: '', max_participants: 10, min_participants: 2, signup_deadline_hours: 2, cancel_deadline_hours: 1, notes: '', min_skill_level: 1, max_skill_level: 10 });
        loadSessions(selectedGroup.id);
      } else {
        setToast({ message: data.message, type: 'error' });
      }
    } catch (e) { setToast({ message: t('common.error'), type: 'error' }); }
  };

  const handleTogglePublic = async (sessionId) => {
    try {
      const res = await fetch(`${API_URL}/groups/${selectedGroup.id}/sessions/${sessionId}/toggle-public`, {
        method: 'PUT', headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        loadSessions(selectedGroup.id);
        setToast({ message: t('groups.visibilityChanged'), type: 'info' });
      }
    } catch (e) { setToast({ message: t('common.error'), type: 'error' }); }
  };

  const handleDeleteSession = async (sessionId) => {
    try {
      await fetch(`${API_URL}/groups/${selectedGroup.id}/sessions/${sessionId}`, {
        method: 'DELETE', headers: { Authorization: `Bearer ${token}` }
      });
      setToast({ message: t('groups.sessionDeleted'), type: 'info' });
      loadSessions(selectedGroup.id);
    } catch (e) { setToast({ message: t('common.error'), type: 'error' }); }
  };

  const handleSignup = async (sessionId) => {
    try {
      const res = await fetch(`${API_URL}/groups/${selectedGroup.id}/sessions/${sessionId}/signup`, {
        method: 'POST', headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setToast({ message: t('groups.signupSuccess'), type: 'success' });
        loadSessions(selectedGroup.id);
      } else {
        setToast({ message: data.message, type: 'error' });
      }
    } catch (e) { setToast({ message: t('common.error'), type: 'error' }); }
  };

  const handleCancel = async (sessionId) => {
    try {
      const res = await fetch(`${API_URL}/groups/sessions/${sessionId}/cancel`, {
        method: 'PUT', headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setToast({ message: t('common.cancel'), type: 'info' });
        loadSessions(selectedGroup.id);
      } else {
        setToast({ message: data.message, type: 'error' });
      }
    } catch (e) { setToast({ message: t('common.error'), type: 'error' }); }
  };

  const handleRemoveMember = async (memberId) => {
    try {
      await fetch(`${API_URL}/groups/${selectedGroup.id}/members/${memberId}`, {
        method: 'DELETE', headers: { Authorization: `Bearer ${token}` }
      });
      setToast({ message: t('groups.memberRemoved'), type: 'info' });
      loadMembers(selectedGroup.id);
    } catch (e) { setToast({ message: t('common.error'), type: 'error' }); }
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
    <div className="studio-page"><Navbar /><div className="loading">{t('common.loading')}</div></div>
  );

  return (
    <div className="studio-page">
      <Navbar />
      <div className="studio-container">
        {!selectedGroup ? (
          <>
            <div className="studio-header">
              <h1>🏃 {t('groups.title')}</h1>
              <p>{t('groups.subtitle')}</p>
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
                <button className="btn btn-primary" onClick={() => setShowCreateGroup(true)}>
                  + {t('groups.createGroup')}
                </button>
                <button className="btn btn-secondary" onClick={() => setShowJoinGroup(true)}>
                  {t('groups.joinByCode')}
                </button>
              </div>
            </div>

            {allGroups.length === 0 ? (
              <div className="no-studios card">
                <span style={{ fontSize: '3rem' }}>🏃</span>
                <h2>{t('groups.noGroups')}</h2>
                <p>{t('groups.noGroupsDesc')}</p>
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
                          {group.role === 'creator' ? t('groups.creator') : t('groups.member')}
                        </span>
                      </div>
                    </div>
                    <p className="studio-desc">⚽ {group.sport}</p>
                    {group.description && <p className="studio-desc">{group.description}</p>}
                    <div className="studio-card-footer"><span>{t('common.select')} →</span></div>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <>
            <div className="studio-detail-header">
              <button className="btn btn-secondary" onClick={() => { setSelectedGroup(null); setSessions([]); setMembers([]); }}>
                ← {t('common.back')}
              </button>
              <div>
                <h1>🏃 {selectedGroup.name}</h1>
                <p style={{ color: 'var(--text-secondary)', margin: 0 }}>⚽ {selectedGroup.sport}</p>
                <span className={`studio-role-badge ${isCreator(selectedGroup) ? 'trainer' : 'member'}`}>
                  {isCreator(selectedGroup) ? t('groups.youAreCreator') : t('groups.youAreMember')}
                </span>
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {isCreator(selectedGroup) && (
                  <>
                    <button className="btn btn-primary" onClick={() => setShowCreateSession(true)}>
                      + {t('groups.newSession')}
                    </button>
                    <button className="btn btn-secondary" onClick={() => setShowInviteCode(true)}>
                      {t('groups.inviteCode')}
                    </button>
                  </>
                )}
                {!isCreator(selectedGroup) && (
                  <button className="btn btn-danger" onClick={() => handleLeaveGroup(selectedGroup.id)}>
                    {t('groups.leaveGroup')}
                  </button>
                )}
              </div>
            </div>

            {isCreator(selectedGroup) && (
              <div className="studio-tabs">
                <button className={`tab ${activeTab === 'sessions' ? 'active' : ''}`} onClick={() => setActiveTab('sessions')}>
                  📅 {t('groups.sessions')}
                </button>
                <button className={`tab ${activeTab === 'members' ? 'active' : ''}`} onClick={() => setActiveTab('members')}>
                  👥 {t('groups.members')} ({members.length})
                </button>
              </div>
            )}

            {(activeTab === 'sessions' || !isCreator(selectedGroup)) && (
              <div className="sessions-list">
                {sessions.length === 0 ? (
                  <div className="no-sessions card">
                    <span style={{ fontSize: '3rem' }}>📅</span>
                    <h3>{t('groups.noSessions')}</h3>
                    {isCreator(selectedGroup) && <p>{t('groups.noSessionsDesc')}</p>}
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
                                  {t('groups.publicBadge')}
                                </div>
                              )}
                              {!isPast && belowMin && (
                                <div className="session-type-badge" style={{ background: 'rgba(245,158,11,0.15)', color: '#f59e0b' }}>
                                  {t('groups.belowMin')}
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
                                  ❌ {t('common.cancel')}
                                </button>
                              ) : (
                                <button className="btn btn-primary" onClick={() => handleSignup(session.id)} disabled={!canSignup(session) || count >= session.max_participants}>
                                  ✅ {t('common.confirm')}
                                </button>
                              )
                            )}

                            {isSignedUp && !isPast && (
                              <span className="signed-up-badge">✅ {t('groups.signedUp')}</span>
                            )}

                            <SignupsList signups={session.signups} />

                            {isCreator(selectedGroup) && (
                              <>
                                {!isPast && belowMin && (
                                  <button
                                    className={`btn btn-small ${session.is_public ? 'btn-secondary' : 'btn-primary'}`}
                                    onClick={() => handleTogglePublic(session.id)}
                                  >
                                    {session.is_public ? t('groups.makePrivate') : t('groups.isPublic')}
                                  </button>
                                )}
                                {session.is_public && !belowMin && (
                                  <button className="btn btn-secondary btn-small" onClick={() => handleTogglePublic(session.id)}>
                                    {t('groups.makePrivate')}
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
                    <h3>{t('groups.noMembers')}</h3>
                    <p>{t('groups.noMembersDesc')}</p>
                  </div>
                ) : (
                  members.map(member => (
                    <div key={member.id} className="member-card card">
                      <div className="member-info">
                        <span className="member-avatar">{member.user?.avatar || '👤'}</span>
                        <div>
                          <strong>{member.user?.username}</strong>
                          <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                            {member.role === 'admin' ? t('groups.creator') : t('groups.member')}
                          </p>
                        </div>
                      </div>
                      {member.user?.id !== currentUser.id && member.role !== 'admin' && (
                        <button className="btn btn-danger btn-small" onClick={() => handleRemoveMember(member.id)}>
                          {t('common.delete')}
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
            <h2>🏃 {t('groups.createGroupTitle')}</h2>
            <div className="form-group">
              <label>{t('groups.nameLabel')}</label>
              <input type="text" placeholder={t('groups.namePlaceholder')} value={groupForm.name}
                onChange={e => setGroupForm({ ...groupForm, name: e.target.value })} />
            </div>
            <div className="form-group">
              <label>{t('groups.sportLabel')}</label>
              <select value={groupForm.sport} onChange={e => setGroupForm({ ...groupForm, sport: e.target.value })}>
                <option value="">-- {t('common.select')} --</option>
                {SPORTS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>{t('groups.descLabel')}</label>
              <textarea value={groupForm.description}
                onChange={e => setGroupForm({ ...groupForm, description: e.target.value })} rows={3} />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>{t('groups.minSkill')}</label>
                <input type="number" min="1" max="10" value={groupForm.min_skill_level}
                  onChange={e => setGroupForm({ ...groupForm, min_skill_level: parseInt(e.target.value) })} />
              </div>
              <div className="form-group">
                <label>{t('groups.maxSkill')}</label>
                <input type="number" min="1" max="10" value={groupForm.max_skill_level}
                  onChange={e => setGroupForm({ ...groupForm, max_skill_level: parseInt(e.target.value) })} />
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowCreateGroup(false)}>{t('common.cancel')}</button>
              <button className="btn btn-primary" onClick={handleCreateGroup}>{t('common.confirm')}</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal - Pridruži se kodom */}
      {showJoinGroup && (
        <div className="modal-overlay" onClick={() => setShowJoinGroup(false)}>
          <div className="studio-modal card" onClick={e => e.stopPropagation()}>
            <h2>{t('groups.joinGroup')}</h2>
            <div className="form-group">
              <label>{t('groups.inviteCodeLabel')}</label>
              <input type="text" placeholder={t('groups.inviteCodePlaceholder')} value={joinCode}
                onChange={e => setJoinCode(e.target.value)} />
            </div>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowJoinGroup(false)}>{t('common.cancel')}</button>
              <button className="btn btn-primary" onClick={handleJoinGroup}>{t('common.confirm')}</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal - Invite kod */}
      {showInviteCode && selectedGroup && (
        <div className="modal-overlay" onClick={() => setShowInviteCode(false)}>
          <div className="studio-modal card" onClick={e => e.stopPropagation()}>
            <h2>{t('groups.inviteCodeTitle')}</h2>
            <p style={{ color: 'var(--text-secondary)' }}>{t('groups.inviteCodeDesc')}</p>
            <div style={{ background: 'var(--bg-tertiary)', borderRadius: '12px', padding: '20px', textAlign: 'center', fontSize: '2rem', fontWeight: '800', letterSpacing: '6px', color: 'var(--color-primary)', margin: '16px 0' }}>
              {selectedGroup.invite_code}
            </div>
            <button className="btn btn-primary" style={{ width: '100%' }}
              onClick={() => { navigator.clipboard.writeText(selectedGroup.invite_code); setToast({ message: t('groups.codeCopied'), type: 'success' }); }}>
              {t('groups.copyCode')}
            </button>
            <div className="modal-actions" style={{ marginTop: '12px' }}>
              <button className="btn btn-secondary" onClick={() => setShowInviteCode(false)}>{t('common.close')}</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal - Kreiraj Trening */}
      {showCreateSession && (
        <div className="modal-overlay" onClick={() => setShowCreateSession(false)}>
          <div className="studio-modal card" onClick={e => e.stopPropagation()}>
            <h2>📅 {t('groups.newSession')}</h2>
            <div className="form-group">
              <label>{t('groups.nameLabel')}</label>
              <input type="text" value={sessionForm.title}
                onChange={e => setSessionForm({ ...sessionForm, title: e.target.value })} />
            </div>
            <div className="form-group">
              <label>{t('common.select')} *</label>
              <select value={sessionForm.type} onChange={e => setSessionForm({ ...sessionForm, type: e.target.value })}>
                <option value="">-- {t('common.select')} --</option>
                {SESSION_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
              </select>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>{t('statistics.dateLabel')}</label>
                <input type="date" value={sessionForm.date} min={new Date().toISOString().split('T')[0]}
                  onChange={e => setSessionForm({ ...sessionForm, date: e.target.value })} />
              </div>
              <div className="form-group">
                <label>{t('statistics.timeLabel') || 'Vrijeme'}</label>
                <input type="time" value={sessionForm.time}
                  onChange={e => setSessionForm({ ...sessionForm, time: e.target.value })} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>{t('groups.maxPlayers')}</label>
                <input type="number" min="1" max="100" value={sessionForm.max_participants}
                  onChange={e => setSessionForm({ ...sessionForm, max_participants: parseInt(e.target.value) })} />
              </div>
              <div className="form-group">
                <label>{t('groups.minPlayers')}</label>
                <input type="number" min="1" max="100" value={sessionForm.min_participants}
                  onChange={e => setSessionForm({ ...sessionForm, min_participants: parseInt(e.target.value) })} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>{t('groups.minSkill')}</label>
                <input type="number" min="1" max="10" value={sessionForm.min_skill_level}
                  onChange={e => setSessionForm({ ...sessionForm, min_skill_level: parseInt(e.target.value) })} />
              </div>
              <div className="form-group">
                <label>{t('groups.maxSkill')}</label>
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
                  {[1,2,3,6,12,24].map(h => <option key={h} value={h}>{h}h</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Otkaz do (h prije)</label>
                <select value={sessionForm.cancel_deadline_hours}
                  onChange={e => setSessionForm({ ...sessionForm, cancel_deadline_hours: parseInt(e.target.value) })}>
                  <option value={0}>Uvijek</option>
                  {[1,2,3,6,12,24].map(h => <option key={h} value={h}>{h}h</option>)}
                </select>
              </div>
            </div>
            <div className="form-group">
              <label>Napomene</label>
              <textarea value={sessionForm.notes}
                onChange={e => setSessionForm({ ...sessionForm, notes: e.target.value })} rows={2} />
            </div>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowCreateSession(false)}>{t('common.cancel')}</button>
              <button className="btn btn-primary" onClick={handleCreateSession}>{t('common.confirm')}</button>
            </div>
          </div>
        </div>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

export default Groups;