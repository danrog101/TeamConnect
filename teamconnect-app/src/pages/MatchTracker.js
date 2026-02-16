import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Toast from '../components/Toast';
import { API_URL } from '../config';
import './MatchTracker.css';
import { useLanguage } from '../i18n/LanguageContext'; 
function MatchTracker() {
  const { matchId } = useParams();
   const { t } = useLanguage();
  const navigate = useNavigate();
  
  // ============ STATE ============
  const [match, setMatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [activeTab, setActiveTab] = useState('live');
  const [showEventModal, setShowEventModal] = useState(false);
  const [showCommentaryModal, setShowCommentaryModal] = useState(false);
  
  const [eventForm, setEventForm] = useState({
    type: 'goal',
    team: 'team1',
    player: '',
    minute: '',
    description: ''
  });
  
  const [commentaryForm, setCommentaryForm] = useState({
    minute: '',
    text: ''
  });

  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

  // ============ EFFECTS ============
  useEffect(() => {
    fetchMatch();
    
    // Auto-refresh svake 3 sekunde ako je live
    const interval = setInterval(() => {
      if (match?.status === 'live') {
        fetchMatch(true); // silent refresh
      }
    }, 3000);
    
    return () => clearInterval(interval);
  }, [matchId, match?.status]);

  // ============ API FUNCTIONS ============
  const fetchMatch = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      
      const response = await fetch(`${API_URL}/matches/${matchId}`);
      
      if (response.ok) {
        const data = await response.json();
        setMatch(data);
      } else {
        const error = await response.json();
        setToast({ message: error.message || 'Utakmica ne postoji', type: 'error' });
        setTimeout(() => navigate('/dashboard'), 2000);
      }
    } catch (error) {
      console.error('Fetch match error:', error);
      setToast({ message: 'Greška pri učitavanju utakmice', type: 'error' });
    } finally {
      if (!silent) setLoading(false);
    }
  };

  // ============ HANDLER FUNCTIONS ============
  const handleStatusChange = async (newStatus) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/matches/${matchId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setToast({ message: '✅ Status ažuriran!', type: 'success' });
        fetchMatch();
      } else {
        setToast({ message: data.message, type: 'error' });
      }
    } catch (error) {
      console.error('Update status error:', error);
      setToast({ message: 'Greška pri ažuriranju statusa', type: 'error' });
    }
  };

  const handleAddEvent = async () => {
    if (!eventForm.type || !eventForm.team || !eventForm.minute) {
      setToast({ message: 'Popuni obavezna polja!', type: 'error' });
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/matches/${matchId}/event`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(eventForm)
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setToast({ message: '✅ Event dodan!', type: 'success' });
        setShowEventModal(false);
        setEventForm({
          type: 'goal',
          team: 'team1',
          player: '',
          minute: '',
          description: ''
        });
        fetchMatch();
      } else {
        setToast({ message: data.message, type: 'error' });
      }
    } catch (error) {
      console.error('Add event error:', error);
      setToast({ message: 'Greška pri dodavanju eventa', type: 'error' });
    }
  };

  const handleAddCommentary = async () => {
    if (!commentaryForm.minute || !commentaryForm.text) {
      setToast({ message: 'Popuni obavezna polja!', type: 'error' });
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/matches/${matchId}/commentary`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(commentaryForm)
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setToast({ message: '✅ Komentar dodan!', type: 'success' });
        setShowCommentaryModal(false);
        setCommentaryForm({ minute: '', text: '' });
        fetchMatch();
      } else {
        setToast({ message: data.message, type: 'error' });
      }
    } catch (error) {
      console.error('Add commentary error:', error);
      setToast({ message: 'Greška pri dodavanju komentara', type: 'error' });
    }
  };

  const handleScoreUpdate = async (team, increment) => {
    try {
      const token = localStorage.getItem('token');
      const newScore = {
        team1Score: match.score.team1 + (team === 'team1' ? increment : 0),
        team2Score: match.score.team2 + (team === 'team2' ? increment : 0)
      };

      const response = await fetch(`${API_URL}/matches/${matchId}/score`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newScore)
      });
      
      const data = await response.json();
      
      if (response.ok) {
        fetchMatch();
      } else {
        setToast({ message: data.message, type: 'error' });
      }
    } catch (error) {
      console.error('Update score error:', error);
      setToast({ message: 'Greška pri ažuriranju rezultata', type: 'error' });
    }
  };

  // ============ HELPER FUNCTIONS ============
  const getEventIcon = (type) => {
    const icons = {
      goal: '⚽',
      yellow_card: '🟨',
      red_card: '🟥',
      substitution: '🔄',
      injury: '🤕',
      penalty: '🎯',
      other: '📝'
    };
    return icons[type] || '📌';
  };

  const getEventLabel = (type) => {
    const labels = {
      goal: 'Gol',
      yellow_card: 'Žuti karton',
      red_card: 'Crveni karton',
      substitution: 'Zamjena',
      injury: 'Ozljeda',
      penalty: 'Penal',
      other: 'Ostalo'
    };
    return labels[type] || 'Event';
  };

  // Check if user is moderator
  const isModerator = match && (
    match.createdBy?._id === currentUser._id || 
    match.createdBy?._id === currentUser.id ||
    match.moderators?.some(m => m._id === currentUser._id || m._id === currentUser.id)
  );

  // ============ LOADING STATE ============
  if (loading || !match) {
    return (
      <div className="match-tracker-page">
        <Navbar />
        <div className="loading">Učitavanje utakmice...</div>
      </div>
    );
  }

  // ============ RENDER ============
  return (
    <div className="match-tracker-page">
      <Navbar />
      
      <div className="match-tracker-container">
        {/* HEADER */}
        <div className="match-header">
          <button className="back-btn" onClick={() => navigate('/my-teams')}>
            ← Natrag
          </button>
          <div className="match-date">
            {new Date(match.date).toLocaleDateString('hr-HR', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric'
            })}
          </div>
          <div className="match-status-badge" data-status={match.status}>
            {match.status === 'live' && `⚡ UŽIVO - ${match.currentMinute || 0}'`}
            {match.status === 'finished' && '🏁 ZAVRŠENO'}
            {match.status === 'scheduled' && '📅 NADOLAZEĆE'}
          </div>
        </div>

        {/* SCOREBOARD */}
        <div className="scoreboard card">
          <div className="team-section home-team">
            <div className="team-logo">{match.team1?.logo || '⚽'}</div>
            <h2>{match.team1?.name || 'Tim 1'}</h2>
            <div className="team-score">{match.score?.team1 || 0}</div>
          </div>

          <div className="scoreboard-center">
            <div className="vs-divider">VS</div>
            <div className="match-sport">{match.sport || '⚽ Nogomet'}</div>
          </div>

          <div className="team-section away-team">
            <div className="team-logo">{match.team2?.logo || '⚽'}</div>
            <h2>{match.team2?.name || 'Tim 2'}</h2>
            <div className="team-score">{match.score?.team2 || 0}</div>
          </div>
        </div>

        {/* MODERATOR CONTROLS */}
        {isModerator && match.status !== 'finished' && (
          <div className="match-controls card">
            <h3>⚙️ Kontrole</h3>
            
            <div className="status-controls">
              <button 
                className={`btn ${match.status === 'scheduled' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => handleStatusChange('scheduled')}
                disabled={match.status === 'scheduled'}
              >
                📅 Zakazano
              </button>
              <button 
                className={`btn ${match.status === 'live' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => handleStatusChange('live')}
                disabled={match.status === 'live'}
              >
                🔴 LIVE
              </button>
              <button 
                className={`btn ${match.status === 'finished' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => handleStatusChange('finished')}
                disabled={match.status === 'finished'}
              >
                ✅ Završeno
              </button>
            </div>

            <div className="action-buttons">
              <button 
                className="btn btn-primary"
                onClick={() => setShowEventModal(true)}
              >
                + Dodaj event
              </button>
              <button 
                className="btn btn-secondary"
                onClick={() => setShowCommentaryModal(true)}
              >
                💬 Dodaj komentar
              </button>
            </div>

            <div className="score-controls">
              <div className="team-score-control">
                <h4>{match.team1?.name || 'Tim 1'}</h4>
                <div className="score-buttons">
                  <button 
                    className="btn btn-small btn-secondary"
                    onClick={() => handleScoreUpdate('team1', -1)}
                    disabled={match.score?.team1 === 0}
                  >
                    -
                  </button>
                  <span className="score-display">{match.score?.team1 || 0}</span>
                  <button 
                    className="btn btn-small btn-primary"
                    onClick={() => handleScoreUpdate('team1', 1)}
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="team-score-control">
                <h4>{match.team2?.name || 'Tim 2'}</h4>
                <div className="score-buttons">
                  <button 
                    className="btn btn-small btn-secondary"
                    onClick={() => handleScoreUpdate('team2', -1)}
                    disabled={match.score?.team2 === 0}
                  >
                    -
                  </button>
                  <span className="score-display">{match.score?.team2 || 0}</span>
                  <button 
                    className="btn btn-small btn-primary"
                    onClick={() => handleScoreUpdate('team2', 1)}
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TABS */}
        <div className="match-tabs">
          <button 
            className={`tab ${activeTab === 'live' ? 'active' : ''}`}
            onClick={() => setActiveTab('live')}
          >
            ⚡ Uživo
          </button>
          <button 
            className={`tab ${activeTab === 'stats' ? 'active' : ''}`}
            onClick={() => setActiveTab('stats')}
          >
            📊 Statistika
          </button>
          <button 
            className={`tab ${activeTab === 'commentary' ? 'active' : ''}`}
            onClick={() => setActiveTab('commentary')}
          >
            💬 Komentari
          </button>
        </div>

        {/* TAB CONTENT */}
        <div className="match-content">
          {/* LIVE TAB */}
          {activeTab === 'live' && (
            <div className="match-timeline card">
              <h3>⏱️ Timeline događaja</h3>
              {(!match.events || match.events.length === 0) ? (
                <div className="no-events">
                  <p>Još nema događaja</p>
                </div>
              ) : (
                <div className="timeline-events">
                  {match.events.map(event => (
                    <div 
                      key={event._id || event.id} 
                      className={`timeline-event ${event.team}-event`}
                    >
                      <div className="event-minute">{event.minute}'</div>
                      <div className="event-icon">{getEventIcon(event.type)}</div>
                      <div className="event-details">
                        <div className="event-header">
                          <span className="event-type">{getEventLabel(event.type)}</span>
                          {event.player && <span className="event-player">{event.player}</span>}
                        </div>
                        {event.description && (
                          <p className="event-description">{event.description}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* STATS TAB */}
          {activeTab === 'stats' && (
            <div className="match-statistics card">
              <h3>📊 Statistika</h3>
              {match.statistics ? (
                <div className="stat-bars">
                  <div className="stat-item">
                    <div className="stat-label">Posjed lopte</div>
                    <div className="stat-bar-container">
                      <div className="stat-value home">{match.statistics.team1?.possession || 50}%</div>
                      <div className="stat-bar">
                        <div 
                          className="stat-fill home-fill"
                          style={{ width: `${match.statistics.team1?.possession || 50}%` }}
                        />
                      </div>
                      <div className="stat-value away">{match.statistics.team2?.possession || 50}%</div>
                    </div>
                  </div>

                  <div className="stat-item">
                    <div className="stat-label">Udarci</div>
                    <div className="stat-bar-container">
                      <div className="stat-value home">{match.statistics.team1?.shots || 0}</div>
                      <div className="stat-bar">
                        <div 
                          className="stat-fill home-fill"
                          style={{ 
                            width: `${((match.statistics.team1?.shots || 0) / ((match.statistics.team1?.shots || 0) + (match.statistics.team2?.shots || 1))) * 100}%` 
                          }}
                        />
                      </div>
                      <div className="stat-value away">{match.statistics.team2?.shots || 0}</div>
                    </div>
                  </div>
                </div>
              ) : (
                <p>Statistika nije dostupna</p>
              )}
            </div>
          )}

          {/* COMMENTARY TAB */}
          {activeTab === 'commentary' && (
            <div className="match-commentary card">
              <h3>💬 Komentari uživo</h3>
              {(!match.commentary || match.commentary.length === 0) ? (
                <div className="no-commentary">
                  <p>Još nema komentara</p>
                </div>
              ) : (
                <div className="commentary-list">
                  {match.commentary.map(comment => (
                    <div key={comment._id || comment.id} className="commentary-item">
                      <div className="commentary-minute">{comment.minute}'</div>
                      <div className="commentary-content">
                        <div className="commentary-author">{comment.author || 'Nepoznat'}</div>
                        <p className="commentary-text">{comment.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* EVENT MODAL */}
      {showEventModal && (
        <div className="modal-overlay" onClick={() => setShowEventModal(false)}>
          <div className="event-modal" onClick={(e) => e.stopPropagation()}>
            <h2>➕ Dodaj event</h2>
            
            <div className="form-group">
              <label>Tip eventa *</label>
              <select
                value={eventForm.type}
                onChange={(e) => setEventForm({ ...eventForm, type: e.target.value })}
              >
                <option value="goal">⚽ Gol</option>
                <option value="yellow_card">🟨 Žuti karton</option>
                <option value="red_card">🟥 Crveni karton</option>
                <option value="substitution">🔄 Zamjena</option>
                <option value="injury">🤕 Ozljeda</option>
                <option value="other">📝 Ostalo</option>
              </select>
            </div>

            <div className="form-group">
              <label>Tim *</label>
              <select
                value={eventForm.team}
                onChange={(e) => setEventForm({ ...eventForm, team: e.target.value })}
              >
                <option value="team1">{match.team1?.name || 'Tim 1'}</option>
                <option value="team2">{match.team2?.name || 'Tim 2'}</option>
              </select>
            </div>

            <div className="form-group">
              <label>Igrač</label>
              <input
                type="text"
                value={eventForm.player}
                onChange={(e) => setEventForm({ ...eventForm, player: e.target.value })}
                placeholder="Ime igrača"
              />
            </div>

            <div className="form-group">
              <label>Minuta *</label>
              <input
                type="number"
                value={eventForm.minute}
                onChange={(e) => setEventForm({ ...eventForm, minute: e.target.value })}
                placeholder="npr. 23"
                min="0"
                max="120"
              />
            </div>

            <div className="form-group">
              <label>Opis</label>
              <textarea
                value={eventForm.description}
                onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                placeholder="Dodatne informacije..."
                rows="3"
              />
            </div>

            <div className="modal-actions">
              <button 
                className="btn btn-secondary"
                onClick={() => setShowEventModal(false)}
              >
                Odustani
              </button>
              <button 
                className="btn btn-primary"
                onClick={handleAddEvent}
              >
                Dodaj event
              </button>
            </div>
          </div>
        </div>
      )}

      {/* COMMENTARY MODAL */}
      {showCommentaryModal && (
        <div className="modal-overlay" onClick={() => setShowCommentaryModal(false)}>
          <div className="commentary-modal" onClick={(e) => e.stopPropagation()}>
            <h2>💬 Dodaj live komentar</h2>
            
            <div className="form-group">
              <label>Minuta *</label>
              <input
                type="number"
                value={commentaryForm.minute}
                onChange={(e) => setCommentaryForm({ ...commentaryForm, minute: e.target.value })}
                placeholder="npr. 34"
                min="0"
                max="120"
              />
            </div>

            <div className="form-group">
              <label>Komentar *</label>
              <textarea
                value={commentaryForm.text}
                onChange={(e) => setCommentaryForm({ ...commentaryForm, text: e.target.value })}
                placeholder="npr. Nevjerovatan pokušaj sa distance..."
                rows="4"
              />
            </div>

            <div className="modal-actions">
              <button 
                className="btn btn-secondary"
                onClick={() => setShowCommentaryModal(false)}
              >
                Odustani
              </button>
              <button 
                className="btn btn-primary"
                onClick={handleAddCommentary}
              >
                Dodaj komentar
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

export default MatchTracker;