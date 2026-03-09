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
  const { t } = useLanguage();

  const [teams, setTeams] = useState([]);
  const [filteredTeams, setFilteredTeams] = useState([]);
  const [toast, setToast] = useState(null);
  const [filters, setFilters] = useState({
    sport: '',
    country: '',
    city: '',
    date: ''
  });
  const [loading, setLoading] = useState(true);

  const sportsList = getAllSports();
  const countries = Object.keys(europeanCities).sort((a, b) => a.localeCompare(b, 'hr'));

  useEffect(() => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      console.log('❌ No token found, redirecting to login');
      navigate('/login', { replace: true });
      return;
    }

    console.log('✅ Token found, fetching data');
    fetchTeams();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [teams, filters]);

  const fetchTeams = async () => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        navigate('/login', { replace: true });
        return;
      }

      console.log('📡 Fetching teams with token:', token.substring(0, 20) + '...');

      const response = await fetch(`${API_URL}/teams`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('📡 Teams response status:', response.status);

      if (response.status === 401) {
        console.log('❌ Unauthorized - clearing tokens and redirecting');
        localStorage.clear();
        navigate('/login', { replace: true });
        return;
      }

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Teams loaded:', data.length);
        console.log('📋 First team sample:', data[0]);
        setTeams(data);
      } else {
        console.error('❌ Failed to fetch teams:', response.status);
        setToast({ message: t('dashboard.loadError'), type: 'error' });
      }
    } catch (error) {
      console.error('❌ Fetch teams error:', error);
      setToast({ message: t('dashboard.loadError'), type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...teams];

    if (filters.sport) {
      filtered = filtered.filter(team => team.sport === filters.sport);
    }

    if (filters.country) {
      filtered = filtered.filter(team => team.country === filters.country);
    }

    if (filters.city) {
      filtered = filtered.filter(team => team.city === filters.city);
    }

    if (filters.date) {
      filtered = filtered.filter(team => {
        if (!team.date) return false;
        const teamDate = new Date(team.date).toISOString().split('T')[0];
        return teamDate === filters.date;
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
    console.log('🔵 Dashboard - Join team called with ID:', teamId, 'Position:', position);

    try {
      const token = localStorage.getItem('token');

      if (!token) {
        navigate('/login', { replace: true });
        return;
      }

      if (!teamId) {
        console.error('❌ Team ID is undefined!');
        setToast({ message: t('dashboard.teamIdError'), type: 'error' });
        return;
      }

      console.log('📡 Sending JOIN request to:', `${API_URL}/teams/${teamId}/join`);

      const response = await fetch(`${API_URL}/teams/${teamId}/join`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ position: position || null })
      });

      console.log('📡 Join response status:', response.status);

      if (response.status === 401) {
        localStorage.clear();
        navigate('/login', { replace: true });
        return;
      }

      const data = await response.json();
      console.log('📡 Join response data:', data);

      if (response.ok) {
        setToast({ message: t('dashboard.joinSuccess'), type: 'success' });
        fetchTeams();
      } else {
        setToast({ message: data.message || t('dashboard.joinError'), type: 'error' });
      }
    } catch (error) {
      console.error('❌ Join team error:', error);
      setToast({ message: t('dashboard.joinError'), type: 'error' });
    }
  };

  const handleJoinWaitlist = async (teamId) => {
    console.log('🔵 Dashboard - Join waitlist called with ID:', teamId);
    
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        navigate('/login', { replace: true });
        return;
      }

      if (!teamId) {
        console.error('❌ Team ID is undefined!');
        setToast({ message: t('dashboard.teamIdError'), type: 'error' });
        return;
      }

      const response = await fetch(`${API_URL}/waitlist/${teamId}/join`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.status === 401) {
        localStorage.clear();
        navigate('/login', { replace: true });
        return;
      }

      const data = await response.json();

      if (response.ok) {
        setToast({ message: '📧 ' + data.message, type: 'success' });
        fetchTeams();
      } else {
        setToast({ message: data.message, type: 'error' });
      }
    } catch (error) {
      console.error('❌ Join waitlist error:', error);
      setToast({ message: t('dashboard.waitlistError'), type: 'error' });
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

        <div className="filters-section card">
          <h3>🔍 {t('dashboard.filterTeams')}</h3>
          <div className="filters-grid">
            <div className="filter-group">
              <label>{t('teams.sport')}</label>
              <select 
                value={filters.sport} 
                onChange={(e) => handleFilterChange('sport', e.target.value)}
              >
                <option value="">{t('dashboard.allSports')}</option>
                <optgroup label={t('dashboard.popular')}>
                  {sportsList.filter(s => s.popular).map(sport => (
                    <option key={sport.id} value={sport.name}>{sport.name}</option>
                  ))}
                </optgroup>
                <optgroup label={t('dashboard.other')}>
                  {sportsList.filter(s => !s.popular).map(sport => (
                    <option key={sport.id} value={sport.name}>{sport.name}</option>
                  ))}
                </optgroup>
              </select>
            </div>

            <div className="filter-group">
              <label>{t('createTeam.countryLabel')}</label>
              <select 
                value={filters.country} 
                onChange={(e) => handleFilterChange('country', e.target.value)}
              >
                <option value="">{t('dashboard.allCountries')}</option>
                {countries.map(country => (
                  <option key={country} value={country}>{country}</option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label>{t('createTeam.cityLabel')}</label>
              <select 
                value={filters.city} 
                onChange={(e) => handleFilterChange('city', e.target.value)}
                disabled={!filters.country}
              >
                <option value="">{t('dashboard.allCities')}</option>
                {filters.country && europeanCities[filters.country]?.map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label>{t('teams.date')}</label>
              <input 
                type="date"
                value={filters.date}
                onChange={(e) => handleFilterChange('date', e.target.value)}
              />
            </div>

            {(filters.sport || filters.country || filters.city || filters.date) && (
              <button 
                className="btn btn-secondary"
                onClick={() => setFilters({ sport: '', country: '', city: '', date: '' })}
              >
                {t('dashboard.resetFilters')}
              </button>
            )}
          </div>
          <div style={{ display: 'flex', gap: '8px', marginTop: '12px', flexWrap: 'wrap' }}>
            <button 
              className={`btn btn-small ${filters.date === new Date().toISOString().split('T')[0] ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => {
                const today = new Date().toISOString().split('T')[0];
                setFilters({ ...filters, date: filters.date === today ? '' : today });
              }}
            >
              {'📅 ' + t('dashboard.today')}
            </button>
            <button 
              className={`btn btn-small ${filters.date === new Date(Date.now() + 86400000).toISOString().split('T')[0] ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => {
                const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
                setFilters({ ...filters, date: filters.date === tomorrow ? '' : tomorrow });
              }}
            >
              {'📅 ' + t('dashboard.tomorrow')}
            </button>
            <button 
              className={`btn btn-small ${(() => {
                const now = new Date();
                const sat = new Date(now);
                sat.setDate(now.getDate() + (6 - now.getDay()));
                return filters.date === sat.toISOString().split('T')[0];
              })() ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => {
                const now = new Date();
                const sat = new Date(now);
                sat.setDate(now.getDate() + (6 - now.getDay()));
                const satDate = sat.toISOString().split('T')[0];
                setFilters({ ...filters, date: filters.date === satDate ? '' : satDate });
              }}
            >
              {'📅 ' + t('dashboard.saturday')}
            </button>
            <button 
              className={`btn btn-small ${(() => {
                const now = new Date();
                const sun = new Date(now);
                sun.setDate(now.getDate() + (7 - now.getDay()));
                return filters.date === sun.toISOString().split('T')[0];
              })() ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => {
                const now = new Date();
                const sun = new Date(now);
                sun.setDate(now.getDate() + (7 - now.getDay()));
                const sunDate = sun.toISOString().split('T')[0];
                setFilters({ ...filters, date: filters.date === sunDate ? '' : sunDate });
              }}
            >
              {'📅 ' + t('dashboard.sunday')}
            </button>
          </div>
        </div>

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