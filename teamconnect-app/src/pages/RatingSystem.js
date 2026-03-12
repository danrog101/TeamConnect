import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Toast from '../components/Toast';
import { API_URL } from '../config';
import './RatingSystem.css';
import { useLanguage } from '../i18n/LanguageContext';
import { getAllSports } from '../data/sports';

function RatingSystem() {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('my-ratings');
  const [toast, setToast] = useState(null);
  const [sportRatings, setSportRatings] = useState([]);
  const [loadingRatings, setLoadingRatings] = useState(true);
  const [selectedSport, setSelectedSport] = useState(null);
  const [selectedLevel, setSelectedLevel] = useState(3);
  const [submitting, setSubmitting] = useState(false);

  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const token = localStorage.getItem('token');
  const allSports = getAllSports();

  useEffect(() => {
    loadSportRatings();
  }, []);

  const loadSportRatings = async () => {
    try {
      setLoadingRatings(true);
      const res = await fetch(`${API_URL}/ratings/my-sports`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setSportRatings(await res.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingRatings(false);
    }
  };

  const handleSaveSportRating = async () => {
    if (!selectedSport) {
      setToast({ message: 'Odaberi sport!', type: 'error' });
      return;
    }
    try {
      setSubmitting(true);
      const res = await fetch(`${API_URL}/ratings/sport`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ sport: selectedSport, overallRating: selectedLevel * 20, skillLevel: selectedLevel })
      });
      const data = await res.json();
      if (res.ok) {
        setToast({ message: '✅ Ocjena spremljena!', type: 'success' });
        loadSportRatings();
        setActiveTab('my-ratings');
        setSelectedSport(null);
      } else {
        setToast({ message: data.message || 'Greška', type: 'error' });
      }
    } catch (e) {
      setToast({ message: 'Greška', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const getLevelLabel = (level) => {
    const map = { 1: 'Amater', 2: 'Početnik', 3: 'Srednji', 4: 'Napredni', 5: 'Pro' };
    return map[level] || '-';
  };

  const getLevelIcon = (level) => {
    const map = { 1: '🌱', 2: '⭐', 3: '⭐⭐', 4: '🔥', 5: '👑' };
    return map[level] || '❓';
  };

  const getLevelColor = (level) => {
    const map = { 1: '#9ca3af', 2: '#f59e0b', 3: '#3b82f6', 4: '#8b5cf6', 5: '#e91e63' };
    return map[level] || '#9ca3af';
  };

  const getLevelDesc = (level) => {
    const map = {
      1: 'Igram rekreativno, nemam posebnog iskustva.',
      2: 'Znam osnove, igram povremeno.',
      3: 'Imam iskustva, igram redovito.',
      4: 'Igram na visokoj razini, imam natjecateljskog iskustva.',
      5: 'Profesionalni ili polu-profesionalni igrač.'
    };
    return map[level] || '';
  };

  if (loadingRatings) {
    return (
      <div className="rating-system-page">
        <Navbar />
        <div className="loading">Učitavanje...</div>
      </div>
    );
  }

  return (
    <div className="rating-system-page">
      <Navbar />
      <div className="rating-container">
        <div className="rating-header">
          <h1>⭐ Moje Ocjene</h1>
          <p>Ocijeni se po sportovima koje igraš</p>
        </div>

        <div className="rating-tabs">
          <button
            className={`tab ${activeTab === 'my-ratings' ? 'active' : ''}`}
            onClick={() => setActiveTab('my-ratings')}
          >
            🏅 Moje ocjene
          </button>
          <button
            className={`tab ${activeTab === 'add-rating' ? 'active' : ''}`}
            onClick={() => setActiveTab('add-rating')}
          >
            ➕ Dodaj ocjenu
          </button>
        </div>

        {/* Moje ocjene po sportovima */}
        {activeTab === 'my-ratings' && (
          <div className="my-rating-section">
            {sportRatings.length === 0 ? (
              <div className="self-rating-card card" style={{ textAlign: 'center' }}>
                <span style={{ fontSize: '4rem', display: 'block', marginBottom: '16px' }}>⭐</span>
                <h2>Još nisi ocijenjen/a</h2>
                <p>Dodaj ocjenu za sportove koje igraš</p>
                <button className="btn btn-primary" onClick={() => setActiveTab('add-rating')}>
                  ➕ Dodaj ocjenu
                </button>
              </div>
            ) : (
              <div className="sport-ratings-list">
                {sportRatings.map((sr, i) => (
                  <div key={i} className="sport-rating-item card">
                    <div className="sport-rating-info">
                      <span className="sport-name">{sr.sport}</span>
                      <span className="sport-level-badge" style={{ background: getLevelColor(sr.skill_level) }}>
                        {getLevelIcon(sr.skill_level)} {getLevelLabel(sr.skill_level)}
                      </span>
                    </div>
                    <button
                      className="btn btn-secondary btn-small"
                      onClick={() => {
                        setSelectedSport(sr.sport);
                        setSelectedLevel(sr.skill_level);
                        setActiveTab('add-rating');
                      }}
                    >
                      ✏️ Uredi
                    </button>
                  </div>
                ))}
                <button className="btn btn-primary" style={{ marginTop: '16px' }} onClick={() => { setSelectedSport(null); setSelectedLevel(3); setActiveTab('add-rating'); }}>
                  ➕ Dodaj novi sport
                </button>
              </div>
            )}
          </div>
        )}

        {/* Dodaj/uredi ocjenu */}
        {activeTab === 'add-rating' && (
          <div className="self-rating-section">
            <div className="self-rating-card card">
              <h2>{selectedSport ? `✏️ Uredi — ${selectedSport}` : '➕ Dodaj ocjenu'}</h2>

              {/* Odabir sporta */}
              {!selectedSport && (
                <div className="form-group" style={{ marginBottom: '24px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>
                    Odaberi sport *
                  </label>
                  <div className="sport-chips">
                    {allSports.map(sport => (
                      <button
                        key={sport.id}
                        className={`sport-chip ${selectedSport === sport.name ? 'selected' : ''}`}
                        onClick={() => setSelectedSport(sport.name)}
                      >
                        {sport.icon} {sport.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {selectedSport && (
                <>
                  <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>
                    Sport: <strong>{selectedSport}</strong>
                    <button
                      className="btn btn-ghost btn-small"
                      style={{ marginLeft: '8px' }}
                      onClick={() => setSelectedSport(null)}
                    >
                      Promijeni
                    </button>
                  </p>

                  <div className="skill-level-options">
                    {[1, 2, 3, 4, 5].map((level) => (
                      <button
                        key={level}
                        className={`skill-level-btn ${selectedLevel === level ? 'selected' : ''}`}
                        onClick={() => setSelectedLevel(level)}
                        style={selectedLevel === level ? {
                          background: getLevelColor(level),
                          borderColor: getLevelColor(level),
                          color: '#fff'
                        } : {}}
                      >
                        <span className="level-icon">{getLevelIcon(level)}</span>
                        <span className="level-number">{level}</span>
                        <span className="level-label">{getLevelLabel(level)}</span>
                      </button>
                    ))}
                  </div>

                  <div className="skill-level-description" style={{ margin: '16px 0' }}>
                    <p>{getLevelDesc(selectedLevel)}</p>
                  </div>

                  <button
                    className="btn btn-primary btn-large"
                    onClick={handleSaveSportRating}
                    disabled={submitting}
                    style={{ width: '100%', marginTop: '8px' }}
                  >
                    {submitting ? 'Spremanje...' : '✅ Spremi ocjenu'}
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

export default RatingSystem;