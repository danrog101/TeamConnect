import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Toast from '../components/Toast';
import SportRatingModal from '../components/SportRatingModal';
import { getAllSports } from '../data/sports';
import { getRatingCategories, getSkillLevelName } from '../data/sportRatings';
import './RatingSystem.css';

function RatingSystem() {
  const navigate = useNavigate();

  // ============ STATE ============
  const [players, setPlayers] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('rating');
  const [activeTab, setActiveTab] = useState('leaderboard'); // leaderboard, achievements, self-rating
  const [toast, setToast] = useState(null);

  // Self-rating state - Simple 1-5 scale (1=amateur, 5=pro)
  const [hasSelfRated, setHasSelfRated] = useState(false);
  const [selfRatingForm, setSelfRatingForm] = useState({
    skillLevel: 3 // 1-5 scale
  });
  const [submittingSelfRating, setSubmittingSelfRating] = useState(false);

  // Sport-specific rating state
  const [sportRatings, setSportRatings] = useState([]);
  const [selectedSport, setSelectedSport] = useState('');
  const [showSportRatingModal, setShowSportRatingModal] = useState(false);
  const [loadingSportRatings, setLoadingSportRatings] = useState(false);

  const sportsList = getAllSports();

  // ============ EFFECTS ============
  useEffect(() => {
    loadRatings();
    checkSelfRatingStatus();
    if (activeTab === 'achievements') {
      loadAchievements();
    }
    if (activeTab === 'sport-ratings') {
      loadAllSportRatings();
    }
  }, [activeTab]);

  // Load all sport-specific ratings
  const loadAllSportRatings = async () => {
    try {
      setLoadingSportRatings(true);
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch('http://localhost:5000/api/ratings/sports/all', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSportRatings(data);
      }
    } catch (error) {
      console.error('Load sport ratings error:', error);
    } finally {
      setLoadingSportRatings(false);
    }
  };

  // Handle sport rating submission
  const handleSportRatingSubmit = async (ratingData) => {
    try {
      const token = localStorage.getItem('token');

      const response = await fetch('http://localhost:5000/api/ratings/sport', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(ratingData)
      });

      const data = await response.json();

      if (response.ok) {
        setToast({ message: 'Ocjena za sport uspješno spremljena!', type: 'success' });
        setShowSportRatingModal(false);
        loadAllSportRatings();
      } else {
        setToast({ message: data.message || 'Greška pri spremanju ocjene', type: 'error' });
      }
    } catch (error) {
      console.error('Submit sport rating error:', error);
      setToast({ message: 'Greška pri spremanju ocjene', type: 'error' });
    }
  };

  // Open sport rating modal
  const openSportRatingModal = (sport) => {
    setSelectedSport(sport);
    setShowSportRatingModal(true);
  };

  // Check if user has self-rated
  const checkSelfRatingStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch('http://localhost:5000/api/ratings/self-rating/status', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setHasSelfRated(data.hasSelfRated);
        if (data.skillLevel) {
          setSelfRatingForm({ skillLevel: data.skillLevel });
        }
      }
    } catch (error) {
      console.error('Check self-rating status error:', error);
    }
  };

  // Submit self-rating
  const handleSubmitSelfRating = async () => {
    try {
      setSubmittingSelfRating(true);
      const token = localStorage.getItem('token');

      const response = await fetch('http://localhost:5000/api/ratings/self-rating', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(selfRatingForm)
      });

      const data = await response.json();

      if (response.ok) {
        setToast({ message: 'Self-rating submitted successfully!', type: 'success' });
        setHasSelfRated(true);
        loadRatings(); // Reload to show updated ratings
        setActiveTab('leaderboard');
      } else {
        setToast({ message: data.message || 'Failed to submit self-rating', type: 'error' });
      }
    } catch (error) {
      console.error('Submit self-rating error:', error);
      setToast({ message: 'Failed to submit self-rating', type: 'error' });
    } finally {
      setSubmittingSelfRating(false);
    }
  };

  // ============ API FUNCTIONS ============
  const loadRatings = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5000/api/ratings/leaderboard?limit=100');

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
      const response = await fetch('http://localhost:5000/api/ratings/achievements', {
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
      const response = await fetch('http://localhost:5000/api/ratings/recalculate', {
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

  // ============ DEMO DATA FUNCTIONS ============
  const loadDemoPlayers = () => {
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    // Show current user with empty ratings if they haven't been rated yet
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
      },
      {
        id: '4',
        icon: '🎯',
        name: 'Top Scorer',
        description: '50+ golova u karijeri',
        unlocked: false,
        progress: 32,
        required: 50
      },
      {
        id: '5',
        icon: '🛡️',
        name: 'Defender',
        description: '10+ clean sheets',
        unlocked: false,
        progress: 6,
        required: 10
      },
      {
        id: '6',
        icon: '🥅',
        name: 'Goalkeeper',
        description: '20+ obrana u jednoj utakmici',
        unlocked: false,
        progress: 0,
        required: 20
      }
    ];
    setAchievements(demo);
  };

  // ============ HELPER FUNCTIONS ============
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

  // ============ LOADING STATE ============
  if (loading && players.length === 0) {
    return (
      <div className="rating-system-page">
        <Navbar />
        <div className="loading">Učitavanje ratinga...</div>
      </div>
    );
  }

  // ============ RENDER ============
  return (
    <div className="rating-system-page">
      <Navbar />
      
      <div className="rating-container">
        {/* HEADER */}
        <div className="rating-header">
          <h1>⭐ Rating System</h1>
          <p>Leaderboard najboljih igrača</p>
        </div>

        {/* TABS */}
        <div className="rating-tabs">
          <button
            className={`tab ${activeTab === 'leaderboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('leaderboard')}
          >
            🏆 Leaderboard
          </button>
          <button
            className={`tab ${activeTab === 'sport-ratings' ? 'active' : ''}`}
            onClick={() => setActiveTab('sport-ratings')}
          >
            🏅 Ocjeni se po sportu
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
            {/* FILTERS */}
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

            {/* CONTROLS */}
            <div className="rating-controls">
              <button 
                className="btn btn-secondary"
                onClick={handleRecalculateRating}
              >
                🔄 Preračunaj moj rating
              </button>
            </div>

            {/* LEADERBOARD */}
            <div className="leaderboard">
              {filteredPlayers.length === 0 ? (
                <div className="empty-leaderboard card">
                  <span className="empty-icon">⭐</span>
                  <p>Nema igrača s ovim filterima</p>
                </div>
              ) : (
                filteredPlayers.map((player, index) => (
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

        {/* SPORT-SPECIFIC RATINGS TAB */}
        {activeTab === 'sport-ratings' && (
          <div className="sport-ratings-section">
            <div className="sport-ratings-header card">
              <h2>🏅 Ocijeni se po sportu</h2>
              <p>Ocijeni svoje vještine za svaki sport posebno. Ovo pomaže u pronalaženju pravih timova za tebe!</p>
            </div>

            {/* Existing sport ratings */}
            {sportRatings.length > 0 && (
              <div className="my-sport-ratings">
                <h3>Moje ocjene po sportovima</h3>
                <div className="sport-ratings-grid">
                  {sportRatings.map(rating => {
                    const sportConfig = getRatingCategories(rating.sport);
                    return (
                      <div key={rating.id} className="sport-rating-card card">
                        <div className="sport-rating-header">
                          <span className="sport-icon">{sportConfig.icon}</span>
                          <h4>{rating.sport}</h4>
                        </div>
                        <div className="sport-rating-stats">
                          <div className="overall-stat">
                            <span className="stat-label">Ukupna ocjena</span>
                            <span className="stat-value">{rating.overall_rating}</span>
                          </div>
                          <div className="level-stat">
                            <span className="stat-label">Razina</span>
                            <span className="stat-badge">{getSkillLevelName(rating.skill_level)}</span>
                          </div>
                        </div>
                        <button
                          className="btn btn-secondary btn-small"
                          onClick={() => openSportRatingModal(rating.sport)}
                        >
                          Ažuriraj ocjenu
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Add new sport rating */}
            <div className="add-sport-rating card">
              <h3>Dodaj ocjenu za novi sport</h3>
              <p>Odaberi sport za koji želiš dodati svoju ocjenu</p>

              <div className="sport-selection">
                <select
                  value={selectedSport}
                  onChange={(e) => setSelectedSport(e.target.value)}
                  className="sport-select"
                >
                  <option value="">Odaberi sport...</option>
                  <optgroup label="Popularni sportovi">
                    {sportsList.filter(s => s.popular).map(sport => (
                      <option
                        key={sport.id}
                        value={sport.name}
                        disabled={sportRatings.some(r => r.sport === sport.name)}
                      >
                        {sport.name} {sportRatings.some(r => r.sport === sport.name) ? '(već ocijenjeno)' : ''}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Ostali sportovi">
                    {sportsList.filter(s => !s.popular).map(sport => (
                      <option
                        key={sport.id}
                        value={sport.name}
                        disabled={sportRatings.some(r => r.sport === sport.name)}
                      >
                        {sport.name} {sportRatings.some(r => r.sport === sport.name) ? '(već ocijenjeno)' : ''}
                      </option>
                    ))}
                  </optgroup>
                </select>

                <button
                  className="btn btn-primary"
                  onClick={() => openSportRatingModal(selectedSport)}
                  disabled={!selectedSport || sportRatings.some(r => r.sport === selectedSport)}
                >
                  Ocijeni se za {selectedSport || 'sport'}
                </button>
              </div>
            </div>

            {loadingSportRatings && (
              <div className="loading-indicator">
                <p>Učitavanje ocjena...</p>
              </div>
            )}
          </div>
        )}

        {/* SELF-RATING TAB */}
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
                    Koja je tvoja razina vještine?
                  </label>

                  <div className="skill-level-options">
                    {[1, 2, 3, 4, 5].map((level) => (
                      <button
                        key={level}
                        className={`skill-level-btn ${selfRatingForm.skillLevel === level ? 'selected' : ''}`}
                        onClick={() => !hasSelfRated && setSelfRatingForm({ skillLevel: level })}
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
                    {selfRatingForm.skillLevel === 1 && (
                      <p>🌱 <strong>Amater</strong> - Tek počinjem, učim osnove sporta</p>
                    )}
                    {selfRatingForm.skillLevel === 2 && (
                      <p>⭐ <strong>Početnik</strong> - Znam osnove, igram rekreativno</p>
                    )}
                    {selfRatingForm.skillLevel === 3 && (
                      <p>⭐⭐ <strong>Srednji</strong> - Solidno igram, imam iskustva</p>
                    )}
                    {selfRatingForm.skillLevel === 4 && (
                      <p>🔥 <strong>Napredan</strong> - Igram u klubu ili na višoj razini</p>
                    )}
                    {selfRatingForm.skillLevel === 5 && (
                      <p>👑 <strong>Pro</strong> - Profesionalni ili poluprofesionalni igrač</p>
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

      {/* Sport Rating Modal */}
      {showSportRatingModal && selectedSport && (
        <SportRatingModal
          sport={selectedSport}
          onSubmit={handleSportRatingSubmit}
          onCancel={() => setShowSportRatingModal(false)}
          existingRatings={sportRatings.find(r => r.sport === selectedSport)?.ratings}
        />
      )}
    </div>
  );
}

export default RatingSystem;