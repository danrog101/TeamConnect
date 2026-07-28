import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';
import Navbar from '../components/Navbar';
import TeamCard from '../components/TeamCard';
import Toast from '../components/Toast';
import { getAllSports } from '../data/sports';
import { europeanCities } from '../data/cities';
import './Dashboard.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

function Dashboard() {
  const navigate = useNavigate();
  const { t, translateSport, translateCountry } = useLanguage();

  const [teams, setTeams] = useState([]);
  const [filteredTeams, setFilteredTeams] = useState([]);
  const [toast, setToast] = useState(null);
  const [filters, setFilters] = useState({ sport: '', country: '', city: '', date: '' });
  const [loading, setLoading] = useState(true);
  const [publicSessions, setPublicSessions] = useState([]);

  const sportsList = getAllSports();
  const countries = Object.keys(europeanCities).sort((a, b) => a.localeCompare(b, 'hr'));

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login', { replace: true });
      return;
    }
    fetchTeams();
    fetchPublicSessions();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [teams, filters]);

  const fetchTeams = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) { navigate('/login', { replace: true }); return; }

      const response = await fetch(`${API_URL}/teams`, {
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
      });

      if (response.status === 401) {
        localStorage.clear();
        navigate('/login', { replace: true });
        return;
      }

      if (response.ok) {
        const data = await response.json();
        setTeams(data);
      } else {
        setToast({ message: t('dashboard.loadError'), type: 'error' });
      }
    } catch (error) {
      setToast({ message: t('dashboard.loadError'), type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const fetchPublicSessions = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/groups/public-sessions`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setPublicSessions(await res.json());
    } catch (e) {
      console.error('Public sessions error:', e);
    }
  };

  const applyFilters = () => {
    let filtered = [...teams];
    if (filters.sport) filtered = filtered.filter(team => team.sport === filters.sport);
    if (filters.country) filtered = filtered.filter(team => team.country === filters.country);
    if (filters.city) filtered = filtered.filter(team => team.city === filters.city);
    if (filters.date) {
      filtered = filtered.filter(team => {
        if (!team.date) return false;
        return new Date(team.date).toISOString().split('T')[0] === filters.date;
      });
    }
    setFilteredTeams(filtered);
  };

  const handleFilterChange = (filterName, value) => {
    if (filterName === 'country') {
      setFilters({ ...filters, country: value, city: '' });
    } else {
      setFilters({ ...filters, [filterName]: value });
    }
  };

  const handleJoinTeam = async (teamId, position = '') => {
    try {
      const token = localStorage.getItem('token');
      if (!token) { navigate('/login', { replace: true }); return; }
      if (!teamId) { setToast({ message: t('dashboard.teamIdError'), type: 'error' }); return; }

      const response = await fetch(`${API_URL}/teams/${teamId}/join`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ position: position || null })
      });

      if (response.status === 401) { localStorage.clear(); navigate('/login', { replace: true }); return; }

      const data = await response.json();
      if (response.ok) {
        setToast({ message: t('dashboard.joinSuccess'), type: 'success' });
        fetchTeams();
      } else {
        setToast({ message: data.message || t('dashboard.joinError'), type: 'error' });
      }
    } catch (error) {
      setToast({ message: t('dashboard.joinError'), type: 'error' });
    }
  };

  const handleJoinWaitlist = async (teamId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) { navigate('/login', { replace: true }); return; }
      if (!teamId) { setToast({ message: t('dashboard.teamIdError'), type: 'error' }); return; }

      const response = await fetch(`${API_URL}/waitlist/${teamId}/join`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
      });

      if (response.status === 401) { localStorage.clear(); navigate('/login', { replace: true }); return; }

      const data = await response.json();
      if (response.ok) {
        setToast({ message: '📧 ' + data.message, type: 'success' });
        fetchTeams();
      } else {
        setToast({ message: data.message, type: 'error' });
      }
    } catch (error) {
      setToast({ message: t('dashboard.waitlistError'), type: 'error' });
    }
  };

  const handleLeaveTeam = async (teamId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/teams/${teamId}/leave`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
      });
      const data = await response.json();
      if (response.ok) {
        setToast({ message: '✅ Napustio/la si tim!', type: 'success' });
        fetchTeams();
      } else {
        setToast({ message: data.message || 'Greška', type: 'error' });
      }
    } catch (e) {
      setToast({ message: 'Greška', type: 'error' });
    }
  };

  const handleSignupPublicSession = async (session) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/groups/${session.group_id}/sessions/${session.id}/signup`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setToast({ message: '✅ Prijavljen/a si na trening!', type: 'success' });
        fetchPublicSessions();
      } else {
        setToast({ message: data.message, type: 'error' });
      }
    } catch (e) {
      setToast({ message: 'Greška', type: 'error' });
    }
  };

  if (loading) {
    return (
      <div className="dashboard-page">
        <Navbar />
        <div className="dashboard-container">
          <div className="loading-spinner">{t('common.loading')}</div>
        </div>
      </div>
    );
  }

  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

  return (
    <div className="dashboard-page">
      <Navbar />

      <div className="dashboard-container">
        <div className="dashboard-header">
          <h1>{t('dashboard.availableTeams')}</h1>
          <p>{t('dashboard.findTeam')}</p>
          <button className="btn btn-primary btn-large" onClick={() => navigate('/create-team')}>
            {t('dashboard.createNewTeam')}
          </button>
        </div>

        {/* Javni grupni treninzi */}
        {publicSessions.length > 0 && (
          <div className="filters-section card" style={{ marginBottom: '24px' }}>
            <h3>🌍 Javni treninzi grupa</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '16px', fontSize: '0.9rem' }}>
              Ovi treninzi su otvoreni za sve — pridruži se!
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {publicSessions.map(session => {
                const activeSignups = session.signups?.filter(s => !s.cancelled_at) || [];
                const isFull = activeSignups.length >= session.max_participants;
                const isSignedUp = activeSignups.some(s => s.user_id === currentUser.id);
                const sessionDateTime = new Date(`${session.date}T${session.time}`);
                const isPast = sessionDateTime < new Date();

                return (
                  <div key={session.id} className="card" style={{ padding: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                      <div>
                        <div style={{ display: 'flex', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
                          <span className="session-type-badge">{session.type}</span>
                          <span className="session-type-badge" style={{ background: 'rgba(99,102,241,0.15)', color: '#6366f1' }}>
                            🏃 {session.group?.name}
                          </span>
                          <span className="session-type-badge" style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981' }}>
                            ⚽ {session.group?.sport}
                          </span>
                        </div>
                        <h4 style={{ margin: '0 0 4px' }}>{session.title}</h4>
                        <p className="session-datetime">
                          📅 {sessionDateTime.toLocaleDateString('hr-HR', {
                            weekday: 'short', day: '2-digit', month: '2-digit'
                          })} u {session.time?.slice(0, 5)}
                        </p>
                        <p className="session-spots">
                          👥 {activeSignups.length}/{session.max_participants} mjesta
                          {isFull && <span className="full-badge"> PUNO</span>}
                        </p>
                        <p className="session-deadlines">
                          ⭐ Razina: {session.min_skill_level}-{session.max_skill_level}
                        </p>
                      </div>
                      {!isPast && (
                        isSignedUp ? (
                          <span className="signed-up-badge">✅ Prijavljen/a</span>
                        ) : (
                          <button
                            className="btn btn-primary"
                            disabled={isFull}
                            onClick={() => handleSignupPublicSession(session)}
                          >
                            {isFull ? 'Popunjeno' : '✅ Prijavi se'}
                          </button>
                        )
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Filteri */}
        <div className="filters-section card">
          <h3>🔍 {t('dashboard.filterTeams')}</h3>
          <div className="filters-grid">
            <div className="filter-group">
              <label>{t('teams.sport')}</label>
              <select value={filters.sport} onChange={(e) => handleFilterChange('sport', e.target.value)}>
                <option value="">{t('dashboard.allSports')}</option>
                <optgroup label={t('dashboard.popular')}>
                  {sportsList.filter(s => s.popular).map(sport => (
                    <option key={sport.id} value={sport.name}>{sport.icon} {translateSport(sport.name)}</option>
                  ))}
                </optgroup>
                <optgroup label={t('dashboard.other')}>
                  {sportsList.filter(s => !s.popular).map(sport => (
                    <option key={sport.id} value={sport.name}>{sport.icon} {translateSport(sport.name)}</option>
                  ))}
                </optgroup>
              </select>
            </div>

            <div className="filter-group">
              <label>{t('createTeam.countryLabel')}</label>
              <select value={filters.country} onChange={(e) => handleFilterChange('country', e.target.value)}>
                <option value="">{t('dashboard.allCountries')}</option>
                {countries.map(country => (
                  <option key={country} value={country}>{translateCountry(country)}</option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label>{t('createTeam.cityLabel')}</label>
              <select value={filters.city} onChange={(e) => handleFilterChange('city', e.target.value)} disabled={!filters.country}>
                <option value="">{t('dashboard.allCities')}</option>
                {filters.country && europeanCities[filters.country]?.map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label>{t('teams.date')}</label>
              <input type="date" value={filters.date} onChange={(e) => handleFilterChange('date', e.target.value)} />
            </div>

            {(filters.sport || filters.country || filters.city || filters.date) && (
              <button className="btn btn-secondary" onClick={() => setFilters({ sport: '', country: '', city: '', date: '' })}>
                {t('dashboard.resetFilters')}
              </button>
            )}
          </div>

          <div style={{ display: 'flex', gap: '8px', marginTop: '12px', flexWrap: 'wrap' }}>
            {[
              { label: t('dashboard.today'), date: new Date().toISOString().split('T')[0] },
              { label: t('dashboard.tomorrow'), date: new Date(Date.now() + 86400000).toISOString().split('T')[0] },
              { label: t('dashboard.saturday'), date: (() => { const d = new Date(); d.setDate(d.getDate() + (6 - d.getDay())); return d.toISOString().split('T')[0]; })() },
              { label: t('dashboard.sunday'), date: (() => { const d = new Date(); d.setDate(d.getDate() + (7 - d.getDay())); return d.toISOString().split('T')[0]; })() }
            ].map(({ label, date }) => (
              <button
                key={label}
                className={`btn btn-small ${filters.date === date ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setFilters({ ...filters, date: filters.date === date ? '' : date })}
              >
                📅 {label}
              </button>
            ))}
          </div>
        </div>

        {/* Timovi */}
        {filteredTeams.length === 0 ? (
          <div className="no-teams card">
            <span className="empty-icon">⚽</span>
            <h2>{t('dashboard.noTeams')}</h2>
            <p>
              {filters.sport || filters.country || filters.city || filters.date
                ? t('dashboard.noTeamsFiltered')
                : t('dashboard.noTeamsEmpty')}
            </p>
            <button className="btn btn-primary" onClick={() => navigate('/create-team')}>
              {t('dashboard.createNewTeam')}
            </button>
          </div>
        ) : (
          <div className="teams-grid">
            {filteredTeams.map(team => (
              <TeamCard
                key={team.id}
                team={team}
                onJoin={handleJoinTeam}
                onLeave={handleLeaveTeam}
                onJoinWaitlist={handleJoinWaitlist}
                onShowNotification={(msg, type) => setToast({ message: msg, type })}
              />
            ))}
          </div>
        )}
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

export default Dashboard;