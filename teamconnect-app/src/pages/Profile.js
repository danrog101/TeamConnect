import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Toast from '../components/Toast';
import { authAPI } from '../services/api';
import './Profile.css';
import SportRatingModal from '../components/SportRatingModal';
import { useLanguage } from '../i18n/LanguageContext';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const SPORTS = [
  '⚽ Nogomet','🏀 Košarka','🏐 Odbojka','🎾 Tenis','🤾 Rukomet',
  '🏊 Plivanje','🏃 Atletika','🏸 Badminton','🏓 Stolni tenis',
  '🥊 Boks','🥋 Džudo','🧘 Yoga','💪 CrossFit','🏋️ Fitness'
];

const SKILL_LEVELS = [
  { value: 'beginner',      label: '🟢 Početnik' },
  { value: 'intermediate',  label: '🟡 Srednji' },
  { value: 'advanced',      label: '🟠 Napredni' },
  { value: 'professional',  label: '🔴 Profesionalac' },
];

const AVATARS = [
  '👤','😀','😎','🤓','🥳','🤩','😺','🦁','🐯','🐻',
  '🦊','🐼','🐨','🐸','🦄','🐲','⚽','🏀','🎾','🏐'
];

function Profile() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { userId } = useParams();

  const [profile, setProfile]           = useState(null);
  const [isOwnProfile, setIsOwnProfile] = useState(true);
  const [activeTab, setActiveTab]       = useState('about');
  const [isEditing, setIsEditing]       = useState(false);
  const [toast, setToast]               = useState(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showAvatarModal, setShowAvatarModal]     = useState(false);
  const [showRateModal, setShowRateModal]         = useState(false);
  const [hasRatedUser, setHasRatedUser] = useState(false);
  const [saving, setSaving]             = useState(false);

  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

  const [editForm, setEditForm] = useState({
    username: '', firstName: '', lastName: '', bio: '', dateOfBirth: '',
    gender: '', sport: '', favoriteSports: [], skillLevel: '',
    position: '', country: '', city: '', phone: '',
    instagram: '', twitter: '', facebook: '',
    profileVisibility: 'public', showEmail: false, showPhone: false,
    leagueLevel: '', yearsExperience: '', selfRating: 5
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '', newPassword: '', confirmPassword: ''
  });

  useEffect(() => { loadProfile(); }, [userId]);

  const loadProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) { navigate('/login'); return; }

      let user;
      if (userId && userId !== currentUser.id) {
        const res = await fetch(`${API_URL}/profile/${userId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) { setToast({ message: 'Profil nije pronađen', type: 'error' }); return; }
        user = await res.json();
        setIsOwnProfile(false);
      } else {
        user = await authAPI.getCurrentUser();
        if (!user) return;
        setIsOwnProfile(true);

        let friends = [], stats = {};
        try { friends = await authAPI.getFriends(); } catch (e) {}
        user = { ...user, friends: friends || [], stats: stats || {} };
      }

      setProfile(user);
      console.log('isOwnProfile:', isOwnProfile, 'userId:', userId, 'currentUser.id:', currentUser.id);
      setEditForm({
        username:          user.username        || '',
        firstName:         user.first_name      || user.firstName    || '',
        lastName:          user.last_name       || user.lastName     || '',
        bio:               user.bio             || '',
        dateOfBirth:       user.date_of_birth ? new Date(user.date_of_birth).toISOString().split('T')[0] : '',
        gender:            user.gender          || '',
        sport:             user.sport           || '',
        favoriteSports:    user.favorite_sports || user.favoriteSports || [],
        skillLevel:        user.skill_level     || user.skillLevel   || '',
        position:          user.position        || '',
        country:           user.country         || '',
        city:              user.city            || '',
        phone:             user.phone           || '',
        instagram:         user.instagram       || '',
        twitter:           user.twitter         || '',
        facebook:          user.facebook        || '',
        profileVisibility: user.profile_visibility || user.profileVisibility || 'public',
        showEmail:         user.show_email      || user.showEmail    || false,
        showPhone:         user.show_phone      || user.showPhone    || false,
        leagueLevel:       user.league_level    || user.leagueLevel  || '',
        yearsExperience:   user.years_experience || user.yearsExperience || '',
        selfRating:        user.self_rating     || user.selfRating   || 5,
      });
    } catch (e) {
      setToast({ message: 'Greška pri učitavanju profila', type: 'error' });
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const dbData = {
        username:            editForm.username,
        first_name:          editForm.firstName,
        last_name:           editForm.lastName,
        bio:                 editForm.bio,
        gender:              editForm.gender || null,
        sport:               editForm.sport,
        position:            editForm.position,
        country:             editForm.country,
        city:                editForm.city,
        phone:               editForm.phone,
        instagram:           editForm.instagram,
        twitter:             editForm.twitter,
        facebook:            editForm.facebook,
        profile_visibility:  editForm.profileVisibility,
        show_email:          editForm.showEmail,
        show_phone:          editForm.showPhone,
      };
      const response = await authAPI.updateProfile(dbData);
      const updated = response.data;
      setProfile(prev => ({ ...prev, ...updated }));
      localStorage.setItem('user', JSON.stringify({ ...currentUser, ...updated }));
      setIsEditing(false);
      setToast({ message: '✅ Profil uspješno ažuriran!', type: 'success' });
    } catch (e) {
      setToast({ message: 'Greška pri ažuriranju profila', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      setToast({ message: 'Popuni sva polja', type: 'error' }); return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setToast({ message: 'Lozinke se ne podudaraju', type: 'error' }); return;
    }
    if (passwordForm.newPassword.length < 6) {
      setToast({ message: 'Lozinka mora imati min. 6 znakova', type: 'error' }); return;
    }
    try {
      await authAPI.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      setToast({ message: '✅ Lozinka promijenjena!', type: 'success' });
      setShowPasswordModal(false);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (e) {
      setToast({ message: e.response?.data?.message || 'Greška', type: 'error' });
    }
  };

  const handleChangeAvatar = async (avatar) => {
    try {
      const response = await authAPI.updateProfile({ avatar });
      if (response.data) {
        const upd = { ...currentUser, avatar };
        localStorage.setItem('user', JSON.stringify(upd));
        setProfile(prev => ({ ...prev, avatar }));
        setShowAvatarModal(false);
        setToast({ message: '✅ Avatar promijenjen!', type: 'success' });
      }
    } catch (e) {
      setToast({ message: 'Greška', type: 'error' });
    }
  };

  const handleRatePlayer = async ({ sport, skillLevel }) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/ratings/rate-player`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ targetUserId: userId, skillLevel, sport: sport || profile.sport || 'Nogomet' }),
      });
      const data = await res.json();
      if (res.ok) {
        setToast({ message: '✅ Ocjena spremljena!', type: 'success' });
        setShowRateModal(false);
        setHasRatedUser(true);
      } else {
        setToast({ message: data.message, type: 'error' });
        setShowRateModal(false);
      }
    } catch (e) {
      setToast({ message: 'Greška pri ocjenjivanju', type: 'error' });
    }
  };

  const getSkillLabel = (val) => SKILL_LEVELS.find(s => s.value === val)?.label || val;
  const ef = editForm;

  if (!profile) {
    return (
      <div className="profile-page">
        <Navbar />
        <div className="loading">Učitavanje profila...</div>
      </div>
    );
  }

  const displayName = profile.first_name && profile.last_name
    ? `${profile.first_name} ${profile.last_name}`
    : profile.firstName && profile.lastName
    ? `${profile.firstName} ${profile.lastName}`
    : profile.username;

  const canRate = !isOwnProfile && !hasRatedUser;

  return (
    <div className="profile-page">
      <Navbar />

      <button className="profile-back-btn" onClick={() => navigate(-1)}>← Natrag</button>

      {/* COVER */}
      <div className="profile-cover">
        {isOwnProfile && (
          <button className="btn-edit-cover">📷 Promijeni cover</button>
        )}
      </div>

      <div className="profile-container">

        {/* ── HEADER CARD ── */}
        <div className="profile-header card">
          <div className="profile-avatar-section">

            {/* Avatar */}
            <div
              className="profile-avatar-large"
              onClick={() => isOwnProfile && setShowAvatarModal(true)}
              style={{
                cursor: isOwnProfile ? 'pointer' : 'default',
                backgroundImage: profile.avatar?.startsWith('data:image') ? `url(${profile.avatar})` : 'none',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            >
              {!profile.avatar?.startsWith('data:image') && (profile.avatar || '👤')}
              {isOwnProfile && <div className="avatar-edit-overlay"><span>✏️</span></div>}
            </div>

            {/* Info */}
            <div className="profile-header-info">
              <h1>{displayName}</h1>
              <p className="profile-username">@{profile.username}</p>
              {profile.bio && <p className="profile-bio">{profile.bio}</p>}

              <div className="profile-meta">
                {profile.city && profile.country && <span>📍 {profile.city}, {profile.country}</span>}
                {profile.sport && <span>🏅 {profile.sport}</span>}
                {(profile.skill_level || profile.skillLevel) && (
                  <span>⭐ {getSkillLabel(profile.skill_level || profile.skillLevel)}</span>
                )}
                {(profile.years_experience || profile.yearsExperience) && (
                  <span>📅 {profile.years_experience || profile.yearsExperience} god. iskustva</span>
                )}
              </div>

              <div className="profile-stats-mini">
                <div className="stat-mini">
                  <strong>{profile.friends?.length || 0}</strong>
                  <span>Prijatelji</span>
                </div>
                <div className="stat-mini">
                  <strong>{profile.stats?.totalMatches || 0}</strong>
                  <span>Utakmice</span>
                </div>
                <div className="stat-mini">
                  <strong>{profile.stats?.totalWins || 0}</strong>
                  <span>Pobjede</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="profile-actions-header">
              {isOwnProfile ? (
                <>
                  <button className="btn btn-primary" onClick={() => setIsEditing(!isEditing)}>
                    {isEditing ? '✕ Odustani' : '✏️ Uredi profil'}
                  </button>
                  <button className="btn btn-secondary" onClick={() => setShowPasswordModal(true)}>
                    🔒 Lozinka
                  </button>
                </>
              ) : (
                <button
                  className="btn btn-primary"
                  onClick={() => setShowRateModal(true)}
                  disabled={hasRatedUser}
                >
                  {hasRatedUser ? '✅ Ocijenjeno' : '⭐ Ocijeni igrača'}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ── TABS ── */}
        <div className="profile-tabs">
          {['about', 'stats', 'activity', ...(isOwnProfile ? ['settings'] : [])].map(tab => (
            <button key={tab} className={`tab ${activeTab === tab ? 'active' : ''}`} onClick={() => setActiveTab(tab)}>
              {{ about: '👤 O meni', stats: '📊 Statistike', activity: '📰 Aktivnosti', settings: '⚙️ Postavke' }[tab]}
            </button>
          ))}
        </div>

        {/* ── CONTENT ── */}
        <div className="profile-content">

          {/* ── ABOUT ── */}
          {activeTab === 'about' && (
            <div className="about-section">
              {isEditing ? (
                <div className="edit-profile-form card">
                  <div className="edit-form-header">
                    <h2>✏️ Uredi profil</h2>
                    <button className="btn btn-primary" onClick={handleSaveProfile} disabled={saving}>
                      {saving ? 'Spremanje...' : '💾 Spremi promjene'}
                    </button>
                  </div>

                  <div className="edit-section">
                    <h3 className="edit-section-title">👤 Osobni podaci</h3>
                    <div className="form-group">
                      <label>Korisničko ime</label>
                      <input type="text" placeholder="username" value={ef.username}
                        onChange={e => setEditForm({...ef, username: e.target.value})} />
                    </div>
                    <div className="edit-grid-2">
                      <div className="form-group">
                        <label>Ime</label>
                        <input type="text" placeholder="Tvoje ime" value={ef.firstName}
                          onChange={e => setEditForm({...ef, firstName: e.target.value})} />
                      </div>
                      <div className="form-group">
                        <label>Prezime</label>
                        <input type="text" placeholder="Tvoje prezime" value={ef.lastName}
                          onChange={e => setEditForm({...ef, lastName: e.target.value})} />
                      </div>
                    </div>
                    <div className="form-group">
                      <label>Bio</label>
                      <textarea placeholder="Kratki opis o sebi..." value={ef.bio} rows={3}
                        onChange={e => setEditForm({...ef, bio: e.target.value})} />
                    </div>
                    <div className="edit-grid-2">
                      <div className="form-group">
                        <label>Datum rođenja</label>
                        <input type="date" value={ef.dateOfBirth}
                          onChange={e => setEditForm({...ef, dateOfBirth: e.target.value})} />
                      </div>
                      <div className="form-group">
                        <label>Spol</label>
                        <select value={ef.gender} onChange={e => setEditForm({...ef, gender: e.target.value})}>
                          <option value="">-- Odaberi --</option>
                          <option value="male">Muško</option>
                          <option value="female">Žensko</option>
                          <option value="other">Drugo</option>
                          <option value="prefer_not_to_say">Ne želim reći</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="edit-section">
                    <h3 className="edit-section-title">🏅 Sportski podaci</h3>
                    <div className="edit-grid-2">
                      <div className="form-group">
                        <label>Primarni sport</label>
                        <select value={ef.sport} onChange={e => setEditForm({...ef, sport: e.target.value})}>
                          <option value="">-- Odaberi sport --</option>
                          {SPORTS.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Razina vještine</label>
                        <select value={ef.skillLevel} onChange={e => setEditForm({...ef, skillLevel: e.target.value})}>
                          <option value="">-- Odaberi --</option>
                          {SKILL_LEVELS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                        </select>
                      </div>
                    </div>
                    <div className="edit-grid-2">
                      <div className="form-group">
                        <label>Pozicija</label>
                        <input type="text" placeholder="npr. Napadač, Bek..." value={ef.position}
                          onChange={e => setEditForm({...ef, position: e.target.value})} />
                      </div>
                      <div className="form-group">
                        <label>Godine iskustva</label>
                        <input type="number" min="0" max="50" placeholder="0" value={ef.yearsExperience}
                          onChange={e => setEditForm({...ef, yearsExperience: e.target.value})} />
                      </div>
                    </div>
                    <div className="form-group">
                      <label>Liga/natjecanje</label>
                      <input type="text" placeholder="npr. Gradska liga, HNL amaterska..." value={ef.leagueLevel}
                        onChange={e => setEditForm({...ef, leagueLevel: e.target.value})} />
                    </div>
                    <div className="form-group">
                      <label>Samoprocjena (1-10): <strong style={{color:'var(--color-primary)'}}>{ef.selfRating}</strong></label>
                      <input type="range" min="1" max="10" value={ef.selfRating}
                        onChange={e => setEditForm({...ef, selfRating: parseInt(e.target.value)})} />
                    </div>
                  </div>

                  <div className="edit-section">
                    <h3 className="edit-section-title">📍 Lokacija</h3>
                    <div className="edit-grid-2">
                      <div className="form-group">
                        <label>Država</label>
                        <input type="text" placeholder="npr. Hrvatska" value={ef.country}
                          onChange={e => setEditForm({...ef, country: e.target.value})} />
                      </div>
                      <div className="form-group">
                        <label>Grad</label>
                        <input type="text" placeholder="npr. Split" value={ef.city}
                          onChange={e => setEditForm({...ef, city: e.target.value})} />
                      </div>
                    </div>
                  </div>

                  <div className="edit-section">
                    <h3 className="edit-section-title">📱 Kontakt & Društvene mreže</h3>
                    <div className="edit-grid-2">
                      <div className="form-group">
                        <label>Telefon</label>
                        <input type="tel" placeholder="+385..." value={ef.phone}
                          onChange={e => setEditForm({...ef, phone: e.target.value})} />
                      </div>
                      <div className="form-group">
                        <label>Instagram</label>
                        <input type="text" placeholder="@username" value={ef.instagram}
                          onChange={e => setEditForm({...ef, instagram: e.target.value})} />
                      </div>
                      <div className="form-group">
                        <label>Twitter / X</label>
                        <input type="text" placeholder="@username" value={ef.twitter}
                          onChange={e => setEditForm({...ef, twitter: e.target.value})} />
                      </div>
                      <div className="form-group">
                        <label>Facebook</label>
                        <input type="text" placeholder="Profil URL" value={ef.facebook}
                          onChange={e => setEditForm({...ef, facebook: e.target.value})} />
                      </div>
                    </div>
                  </div>

                  <div className="edit-save-row">
                    <button className="btn btn-secondary" onClick={() => setIsEditing(false)}>Odustani</button>
                    <button className="btn btn-primary" onClick={handleSaveProfile} disabled={saving}>
                      {saving ? 'Spremanje...' : '💾 Spremi promjene'}
                    </button>
                  </div>
                </div>

              ) : (
                <div className="about-info card">
                  <h2>📋 Informacije</h2>
                  <div className="info-grid">
                    {profile.first_name && <div className="info-item"><span className="info-label">Ime</span><span className="info-value">{profile.first_name} {profile.last_name}</span></div>}
                    {profile.sport && <div className="info-item"><span className="info-label">Sport</span><span className="info-value">{profile.sport}</span></div>}
                    {(profile.skill_level||profile.skillLevel) && <div className="info-item"><span className="info-label">Razina</span><span className="info-value">{getSkillLabel(profile.skill_level||profile.skillLevel)}</span></div>}
                    {profile.position && <div className="info-item"><span className="info-label">Pozicija</span><span className="info-value">{profile.position}</span></div>}
                    {(profile.city||profile.country) && <div className="info-item"><span className="info-label">Lokacija</span><span className="info-value">{[profile.city,profile.country].filter(Boolean).join(', ')}</span></div>}
                    {(profile.years_experience||profile.yearsExperience) && <div className="info-item"><span className="info-label">Iskustvo</span><span className="info-value">{profile.years_experience||profile.yearsExperience} god.</span></div>}
                    {(profile.league_level||profile.leagueLevel) && <div className="info-item"><span className="info-label">Liga</span><span className="info-value">{profile.league_level||profile.leagueLevel}</span></div>}
                    {profile.gender && <div className="info-item"><span className="info-label">Spol</span><span className="info-value">{{male:'Muško',female:'Žensko',other:'Drugo',prefer_not_to_say:'—'}[profile.gender]||profile.gender}</span></div>}
                  </div>

                  {(profile.instagram||profile.twitter||profile.facebook) && (
                    <div style={{marginTop:'24px'}}>
                      <h3 style={{marginBottom:'14px',fontSize:'1rem',fontWeight:700}}>📱 Društvene mreže</h3>
                      <div className="social-links">
                        {profile.instagram && <a href={`https://instagram.com/${profile.instagram.replace('@','')}`} target="_blank" rel="noreferrer">📸 Instagram</a>}
                        {profile.twitter   && <a href={`https://twitter.com/${profile.twitter.replace('@','')}`}   target="_blank" rel="noreferrer">🐦 Twitter</a>}
                        {profile.facebook  && <a href={profile.facebook} target="_blank" rel="noreferrer">👥 Facebook</a>}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── STATS ── */}
          {activeTab === 'stats' && (
            <div className="stats-tab card">
              <h2>📊 Statistike</h2>
              <div className="info-grid">
                <div className="info-item"><span className="info-label">Ukupno utakmica</span><span className="info-value">{profile.stats?.totalMatches||0}</span></div>
                <div className="info-item"><span className="info-label">Pobjede</span><span className="info-value">{profile.stats?.totalWins||0}</span></div>
                <div className="info-item"><span className="info-label">Porazi</span><span className="info-value">{profile.stats?.totalLosses||0}</span></div>
                <div className="info-item"><span className="info-label">Prijatelji</span><span className="info-value">{profile.friends?.length||0}</span></div>
                {(profile.self_rating||profile.selfRating) && (
                  <div className="info-item"><span className="info-label">Samoprocjena</span><span className="info-value">{'⭐'.repeat(Math.round((profile.self_rating||profile.selfRating)/2))} {profile.self_rating||profile.selfRating}/10</span></div>
                )}
              </div>
            </div>
          )}

          {/* ── ACTIVITY ── */}
          {activeTab === 'activity' && (
            <div className="activity-tab card">
              <h2>📰 Aktivnosti</h2>
              <div style={{textAlign:'center',padding:'48px 20px',color:'var(--text-tertiary)'}}>
                <div style={{fontSize:'3rem',marginBottom:'16px'}}>📭</div>
                <p>Aktivnosti uskoro...</p>
              </div>
            </div>
          )}

          {/* ── SETTINGS ── */}
          {activeTab === 'settings' && isOwnProfile && (
            <div className="settings-tab card">
              <h2>⚙️ Postavke privatnosti</h2>

              <div className="settings-section">
                <h3>👁️ Vidljivost profila</h3>
                <select value={ef.profileVisibility} onChange={e => setEditForm({...ef, profileVisibility: e.target.value})}>
                  <option value="public">🌍 Javni profil</option>
                  <option value="friends">👥 Samo prijatelji</option>
                  <option value="private">🔒 Privatni</option>
                </select>
              </div>

              <div className="settings-section">
                <h3>📧 Kontakt vidljivost</h3>
                <label className="checkbox-label">
                  <input type="checkbox" checked={ef.showEmail} onChange={e => setEditForm({...ef, showEmail: e.target.checked})} />
                  <span>Prikaži email na profilu</span>
                </label>
                <label className="checkbox-label" style={{marginTop:'10px'}}>
                  <input type="checkbox" checked={ef.showPhone} onChange={e => setEditForm({...ef, showPhone: e.target.checked})} />
                  <span>Prikaži telefon na profilu</span>
                </label>
              </div>

              <div className="settings-section">
                <h3>🔒 Sigurnost</h3>
                <button className="btn btn-secondary" onClick={() => setShowPasswordModal(true)}>
                  🔒 Promijeni lozinku
                </button>
              </div>

              <div className="settings-section support-section">
                <h3>💬 Podrška</h3>
                <p>Imaš pitanje ili problem? Kontaktiraj nas:</p>
                <a className="support-email-link" href="mailto:teamconnect0102@gmail.com">
                  📧 teamconnect0102@gmail.com
                </a>
              </div>

              <div style={{display:'flex',justifyContent:'flex-end',marginTop:'24px'}}>
                <button className="btn btn-primary" onClick={handleSaveProfile} disabled={saving}>
                  {saving ? 'Spremanje...' : '💾 Spremi postavke'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── PASSWORD MODAL ── */}
      {showPasswordModal && (
        <div className="modal-overlay" onClick={() => setShowPasswordModal(false)}>
          <div className="password-modal" onClick={e => e.stopPropagation()}>
            <h2>🔒 Promijeni lozinku</h2>
            <div className="form-group">
              <label>Trenutna lozinka</label>
              <input type="password" value={passwordForm.currentPassword}
                onChange={e => setPasswordForm({...passwordForm, currentPassword: e.target.value})} />
            </div>
            <div className="form-group">
              <label>Nova lozinka</label>
              <input type="password" value={passwordForm.newPassword}
                onChange={e => setPasswordForm({...passwordForm, newPassword: e.target.value})} />
            </div>
            <div className="form-group">
              <label>Potvrdi novu lozinku</label>
              <input type="password" value={passwordForm.confirmPassword}
                onChange={e => setPasswordForm({...passwordForm, confirmPassword: e.target.value})} />
            </div>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowPasswordModal(false)}>Odustani</button>
              <button className="btn btn-primary" onClick={handleChangePassword}>Spremi</button>
            </div>
          </div>
        </div>
      )}

      {/* ── AVATAR MODAL ── */}
      {showAvatarModal && (
        <div className="modal-overlay" onClick={() => setShowAvatarModal(false)}>
          <div className="avatar-modal" onClick={e => e.stopPropagation()}>
            <h2>🎭 Promijeni avatar</h2>
            <div className="avatar-grid">
              {AVATARS.map(av => (
                <div key={av} className={`avatar-option ${profile.avatar === av ? 'selected' : ''}`}
                  onClick={() => handleChangeAvatar(av)}>
                  {av}
                </div>
              ))}
            </div>
            <div className="avatar-divider"><span>ili</span></div>
            <div className="avatar-upload-section">
              <p>Učitaj vlastitu sliku</p>
              <input type="file" accept="image/*" id="avatar-upload" style={{display:'none'}}
                onChange={async e => {
                  const file = e.target.files[0];
                  if (!file) return;
                  if (file.size > 2*1024*1024) { setToast({message:'Max 2MB',type:'error'}); return; }
                  const reader = new FileReader();
                  reader.onload = async ev => { await handleChangeAvatar(ev.target.result); };
                  reader.readAsDataURL(file);
                }}
              />
              <label htmlFor="avatar-upload" className="btn btn-secondary upload-btn">📁 Odaberi sliku</label>
              <small>Max 2MB — JPG, PNG, GIF</small>
            </div>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowAvatarModal(false)}>Zatvori</button>
            </div>
          </div>
        </div>
      )}

      {showRateModal && (
       <SportRatingModal
  sport={null}
  isRatingOther={true}
  onSubmit={handleRatePlayer}
  onCancel={() => setShowRateModal(false)}
/>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

export default Profile;