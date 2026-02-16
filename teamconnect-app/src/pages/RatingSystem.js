import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Toast from '../components/Toast';
import { API_URL } from '../config';
import './RatingSystem.css';

function RatingSystem() {
  const navigate = useNavigate();

  const [players, setPlayers] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('rating');
  const [activeTab, setActiveTab] = useState('leaderboard');
  const [toast, setToast] = useState(null);

  // ✅ SIMPLIFIED: Just 1-5 rating
  const [hasSelfRated, setHasSelfRated] = useState(false);
  const [selfRating, setSelfRating] = useState(3); // Default 3/5
  const [submittingSelfRating, setSubmittingSelfRating] = useState(false);

  useEffect(() => {
    loadRatings();
    checkSelfRatingStatus();
    if (activeTab === 'achievements') {
      loadAchievements();
    }
  }, [activeTab]);

  const checkSelfRatingStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`${API_URL}/ratings/self-rating/status`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setHasSelfRated(data.hasSelfRated);
        if (data.skillLevel) {
          setSelfRating(data.skillLevel);
        }
      }
    } catch (error) {
      console.error('Check self-rating status error:', error);
    }
  };

  // ✅ SIMPLIFIED: Submit just single number 1-5
  const handleSubmitSelfRating = async () => {
    try {
      setSubmittingSelfRating(true);
      const token = localStorage.getItem('token');

      const response = await fetch(`${API_URL}/ratings/self-rating`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ skillLevel: selfRating })
      });

      const data = await response.json();

      if (response.ok) {
        setToast({ message: '✅ Ocjena uspješno spremljena!', type: 'success' });
        setHasSelfRated(true);
        loadRatings();
        setActiveTab('leaderboard');
      } else {
        setToast({ message: data.message || 'Greška pri spremanju ocjene', type: 'error' });
      }
    } catch (error) {
      console.error('Submit self-rating error:', error);
      setToast({ message: 'Greška pri spremanju ocjene', type: 'error' });
    } finally {
      setSubmittingSelfRating(false);
    }
  };

  const loadRatings = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/ratings/leaderboard?limit=100`);

      if (response.ok) {
        const data = await response.json();
        setPlayers(data);
      } else {
        console.error('Failed to load ratings');
        loadDemoPlayers();
      }
    } catch (error) {
      console.error('Load ratings error:', error);
      loadDemoPlayers();
    } finally {
      setLoading(false);
    }
  };

  const loadAchievements = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/ratings/achievements`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setAchievements(data);
      } else {
        loadDemoAchievements();
      }
    } catch (error) {
      console.error('Load achievements error:', error);
      loadDemoAchievements();
    }
  };

  const handleRecalculateRating = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/ratings/recalculate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (response.ok) {
        setToast({ message: '✅ Rating preračunat!', type: 'success' });
        loadRatings();
      } else {
        setToast({ message: data.message, type: 'error' });
      }
    } catch (error) {
      console.error('Recalculate error:', error);
      setToast({ message: 'Greška pri preračunavanju ratinga', type: 'error' });
    }
  };

  const loadDemoPlayers = () => {
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    const demo = [
      {
        _id: currentUser.id || '1',
        username: currentUser.username || 'You',
        avatar: currentUser.avatar || '👤',
        location: currentUser.location || null,
        position: null,
        rank: null,
        rating: {
          overall: null,
          attack: null,
          defense: null,
          teamwork: null,
          consistency: null
        }
      }
    ];
    setPlayers(demo);
  };

  const loadDemoAchievements = () => {
    const demo = [
      {
        id: '1',
        icon: '👑',
        name: 'MVP',
        description: 'Najbolji igrač utakmice 10+ puta',
        unlocked: true,
        progress: 12,
        required: 10
      },
      {
        id: '2',
        icon: '🤝',
        name: 'Team Player',
        description: '15+ asistencija u karijeri',
        unlocked: false,
        progress: 8,
        required: 15
      },
      {
        id: '3',
        icon: '⚽⚽⚽',
        name: 'Hat-trick Hero',
        description: '3+ gola u jednoj utakmici',
        unlocked: true,
        progress: 5,
        required: 1
      }
    ];
    setAchievements(demo);
  };

  const getRankColor = (rank) => {
    const colors = {
      beginner: '#9e9e9e',
      intermediate: '#4caf50',
      advanced: '#ff9800',
      pro: '#e91e63',
      elite: '#9c27b0'
    };
    return colors[rank?.toLowerCase()] || colors.beginner;
  };

  const getRankIcon = (rank) => {
    const icons = {
      beginner: '🌱',
      intermediate: '⭐',
      advanced: '🔥',
      pro: '👑',
      elite: '💎'
    };
    return icons[rank?.toLowerCase()] || icons.beginner;
  };

  const filterPlayers = () => {
    let filtered = [...players];

    if (filter !== 'all') {
      filtered = filtered.filter(p => p.rank?.toLowerCase() === filter.toLowerCase());
    }

    filtered.sort((a, b) => {
      if (sortBy === 'rating') return (b.rating?.overall || 0) - (a.rating?.overall || 0);
      if (sortBy === 'position') return (a.position || 999) - (b.position || 999);
      return 0;
    });

    return filtered;
  };

  const filteredPlayers = filterPlayers();

  if (loading && players.length === 0) {
    return (
      <div className="rating-system-page">
        <Navbar />
        <div className="loading">Učitavanje ratinga...</div>
      </div>
    );
  }

  return (
    <div className="rating-system-page">
      <Navbar />
      
      <div className="rating-container">
        <div className="rating-header">
          <h1>⭐ Rating System</h1>
          <p>Leaderboard najboljih igrača</p>
        </div>

        <div className="rating-tabs">
          <button
            className={`tab ${activeTab === 'leaderboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('leaderboard')}
          >
            🏆 Leaderboard
          </button>
          <button
            className={`tab ${activeTab === 'self-rating' ? 'active' : ''}`}
            onClick={() => setActiveTab('self-rating')}
          >
            ⭐ {hasSelfRated ? 'Moja ocjena' : 'Ocijeni se'}
          </button>
          <button
            className={`tab ${activeTab === 'achievements' ? 'active' : ''}`}
            onClick={() => setActiveTab('achievements')}
          >
            🎖️ Achievements
          </button>
        </div>

        {/* LEADERBOARD TAB */}
        {activeTab === 'leaderboard' && (
          <>
            <div className="rating-filters card">
              <div className="filter-section">
                <label>Skill Level:</label>
                <div className="filter-buttons">
                  <button 
                    className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
                    onClick={() => setFilter('all')}
                  >
                    Svi
                  </button>
                  <button 
                    className={`filter-btn ${filter === 'pro' ? 'active' : ''}`}
                    onClick={() => setFilter('pro')}
                  >
                    Pro
                  </button>
                  <button 
                    className={`filter-btn ${filter === 'advanced' ? 'active' : ''}`}
                    onClick={() => setFilter('advanced')}
                  >
                    Advanced
                  </button>
                  <button 
                    className={`filter-btn ${filter === 'intermediate' ? 'active' : ''}`}
                    onClick={() => setFilter('intermediate')}
                  >
                    Intermediate
                  </button>
                  <button 
                    className={`filter-btn ${filter === 'beginner' ? 'active' : ''}`}
                    onClick={() => setFilter('beginner')}
                  >
                    Beginner
                  </button>
                </div>
              </div>

              <div className="filter-section">
                <label>Sortiraj po:</label>
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                  <option value="rating">Rating</option>
                  <option value="position">Pozicija</option>
                </select>
              </div>
            </div>

            <div className="rating-controls">
              <button 
                className="btn btn-secondary"
                onClick={handleRecalculateRating}
              >
                🔄 Preračunaj moj rating
              </button>
            </div>

            <div className="leaderboard">
              {filteredPlayers.length === 0 ? (
                <div className="empty-leaderboard card">
                  <span className="empty-icon">⭐</span>
                  <p>Nema igrača s ovim filterima</p>
                </div>
              ) : (
                filteredPlayers.map((player) => (
                  <div key={player._id} className="player-rating-card card">
                    {player.position ? (
                      <div className="rank-badge" style={{ background: getRankColor(player.rank) }}>
                        #{player.position}
                      </div>
                    ) : (
                      <div className="rank-badge" style={{ background: '#9e9e9e' }}>
                        -
                      </div>
                    )}

                    <div className="player-rating-info">
                      <div className="player-rating-header">
                        <div className="player-rating-avatar">{player.avatar}</div>
                        <div className="player-rating-details">
                          <h4>{player.username}</h4>
                          {player.location && <p className="player-rating-location">📍 {player.location}</p>}
                        </div>
                      </div>

                      {player.rating?.overall != null ? (
                        <>
                          <div className="rating-overall">
                            <span className="rating-label">Overall Rating</span>
                            <span className="rating-value">{player.rating.overall}</span>
                          </div>

                          <div className="rating-breakdown">
                            <div className="rating-stat">
                              <span className="stat-name">Attack</span>
                              <div className="stat-bar">
                                <div
                                  className="stat-fill"
                                  style={{ width: `${player.rating?.attack || 0}%`, background: '#4caf50' }}
                                />
                              </div>
                              <span className="stat-value">{player.rating?.attack ?? '-'}</span>
                            </div>

                            <div className="rating-stat">
                              <span className="stat-name">Defense</span>
                              <div className="stat-bar">
                                <div
                                  className="stat-fill"
                                  style={{ width: `${player.rating?.defense || 0}%`, background: '#2196f3' }}
                                />
                              </div>
                              <span className="stat-value">{player.rating?.defense ?? '-'}</span>
                            </div>

                            <div className="rating-stat">
                              <span className="stat-name">Teamwork</span>
                              <div className="stat-bar">
                                <div
                                  className="stat-fill"
                                  style={{ width: `${player.rating?.teamwork || 0}%`, background: '#ff9800' }}
                                />
                              </div>
                              <span className="stat-value">{player.rating?.teamwork ?? '-'}</span>
                            </div>

                            <div className="rating-stat">
                              <span className="stat-name">Consistency</span>
                              <div className="stat-bar">
                                <div
                                  className="stat-fill"
                                  style={{ width: `${player.rating?.consistency || 0}%`, background: '#9c27b0' }}
                                />
                              </div>
                              <span className="stat-value">{player.rating?.consistency ?? '-'}</span>
                            </div>
                          </div>

                          <div className="player-rank-badge" style={{ background: getRankColor(player.rank) }}>
                            {getRankIcon(player.rank)} {player.rank?.toUpperCase() || 'UNRANKED'}
                          </div>
                        </>
                      ) : (
                        <div className="not-rated-message">
                          <span className="not-rated-icon">⭐</span>
                          <p>Not rated yet</p>
                          <small>Rate yourself or play matches to get rated!</small>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}

        {/* ✅ SIMPLIFIED SELF-RATING TAB */}
        {activeTab === 'self-rating' && (
          <div className="self-rating-section">
            <div className="self-rating-card card">
              <h2>{hasSelfRated ? '✅ Tvoja ocjena' : '⭐ Ocijeni se'}</h2>
              <p className="self-rating-description">
                {hasSelfRated
                  ? 'Već si se ocijenio. Drugi igrači te sada mogu ocjenjivati na temelju tvojih performansi.'
                  : 'Prije nego te drugi mogu ocijeniti, trebaš se sam ocijeniti. Budi iskren - to pomaže u stvaranju uravnoteženih timova!'
                }
              </p>

              <div className="self-rating-form">
                <div className="simple-rating-group">
                  <label className="simple-rating-label">
                    Koja je tvoja razina vještine? (1-5)
                  </label>

                  {/* ✅ SIMPLIFIED: Just 5 buttons */}
                  <div className="skill-level-options">
                    {[1, 2, 3, 4, 5].map((level) => (
                      <button
                        key={level}
                        className={`skill-level-btn ${selfRating === level ? 'selected' : ''}`}
                        onClick={() => !hasSelfRated && setSelfRating(level)}
                        disabled={hasSelfRated}
                      >
                        <span className="level-number">{level}</span>
                        <span className="level-label">
                          {level === 1 && 'Amater'}
                          {level === 2 && 'Početnik'}
                          {level === 3 && 'Srednji'}
                          {level === 4 && 'Napredan'}
                          {level === 5 && 'Pro'}
                        </span>
                        <span className="level-icon">
                          {level === 1 && '🌱'}
                          {level === 2 && '⭐'}
                          {level === 3 && '⭐⭐'}
                          {level === 4 && '🔥'}
                          {level === 5 && '👑'}
                        </span>
                      </button>
                    ))}
                  </div>

                  <div className="skill-level-description">
                    {selfRating === 1 && (
                      <p>🌱 <strong>Amater (1/5)</strong> - Tek počinjem, učim osnove sporta</p>
                    )}
                    {selfRating === 2 && (
                      <p>⭐ <strong>Početnik (2/5)</strong> - Znam osnove, igram rekreativno</p>
                    )}
                    {selfRating === 3 && (
                      <p>⭐⭐ <strong>Srednji (3/5)</strong> - Solidno igram, imam iskustva</p>
                    )}
                    {selfRating === 4 && (
                      <p>🔥 <strong>Napredan (4/5)</strong> - Igram u klubu ili na višoj razini</p>
                    )}
                    {selfRating === 5 && (
                      <p>👑 <strong>Pro (5/5)</strong> - Profesionalni ili poluprofesionalni igrač</p>
                    )}
                  </div>
                </div>

                {!hasSelfRated && (
                  <button
                    className="btn btn-primary btn-large"
                    onClick={handleSubmitSelfRating}
                    disabled={submittingSelfRating}
                  >
                    {submittingSelfRating ? 'Spremanje...' : '✅ Spremi ocjenu'}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ACHIEVEMENTS TAB */}
        {activeTab === 'achievements' && (
          <div className="achievements-section">
            <div className="achievements-header">
              <h2>🏆 Moji Achievements</h2>
              <p>Otkljućaj achievements igranjem utakmica i postizanjem ciljeva</p>
            </div>

            {achievements.length === 0 ? (
              <div className="no-achievements card">
                <span className="empty-icon">🎖️</span>
                <p>Još nemaš achievements. Igraj utakmice da ih otkljućaš!</p>
              </div>
            ) : (
              <div className="achievements-grid">
                {achievements.map(achievement => (
                  <div 
                    key={achievement.id} 
                    className={`achievement-card card ${achievement.unlocked ? 'unlocked' : 'locked'}`}
                  >
                    <div className="achievement-icon">{achievement.icon}</div>
                    <h4>{achievement.name}</h4>
                    <p>{achievement.description}</p>
                    
                    {!achievement.unlocked && (
                      <div className="achievement-progress">
                        <div className="progress-bar">
                          <div 
                            className="progress-fill"
                            style={{ width: `${(achievement.progress / achievement.required) * 100}%` }}
                          />
                        </div>
                        <span className="progress-text">
                          {achievement.progress}/{achievement.required}
                        </span>
                      </div>
                    )}
                    
                    {achievement.unlocked && (
                      <div className="achievement-unlocked">
                        ✅ Otkljućano!
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

export default RatingSystem;