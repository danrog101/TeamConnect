import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SportRatingModal from './SportRatingModal';
import './TeamCard.css';

function TeamCard({ team, onJoin, onLeave, onDelete, onJoinWaitlist, onShowNotification, showActions = true, autoExpandMembers = false }) {
  const navigate = useNavigate();
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [joinPosition, setJoinPosition] = useState('');
  const [showMembers, setShowMembers] = useState(autoExpandMembers);
  const [teamMembers, setTeamMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [userSportRating, setUserSportRating] = useState(null);
  const [checkingRating, setCheckingRating] = useState(false);
  
  console.log('🔵 TeamCard received team:', team);
  console.log('🔵 Team ID:', team.id);
  
  const getUserFromStorage = () => {
    try {
      const userStr = localStorage.getItem('user');
      if (!userStr) return null;
      return JSON.parse(userStr);
    } catch (error) {
      console.error('Error parsing user from localStorage:', error);
      return null;
    }
  };

  const user = getUserFromStorage();
  
  const getUserId = () => {
    if (!user) return null;
    return user.id || user._id || null;
  };

  const userId = getUserId();

  const isTeamCreator = () => {
    if (!userId) return false;
    if (!team || !team.creator) return false;
    
    const creatorId = team.creator.id || team.creator._id || team.creator;
    return creatorId === userId;
  };

  const isJoined = () => {
    if (!userId) return false;
    if (!team || !team.players) return false;
    
    return team.players.some(player => {
      const playerId = player.id || player._id || player;
      return playerId === userId;
    });
  };

  const isOnWaitlist = () => {
    if (!userId) return false;
    if (!team || !team.waitlist) return false;
    
    return team.waitlist.some(w => {
      const waitlistUserId = w.user?.id || w.user?._id || w.user;
      return waitlistUserId === userId;
    });
  };

  // ✅ FIXED: Use snake_case for Supabase fields
  const isFull = (team.current_players || 0) >= (team.max_players || 0);
  const creator = isTeamCreator();
  const joined = isJoined();
  const onWaitlist = isOnWaitlist();

  // Auto-load members for creators when autoExpandMembers is true
  useEffect(() => {
    if (creator && autoExpandMembers && showMembers && teamMembers.length === 0 && !loadingMembers) {
      loadTeamMembers();
    }
  }, [creator, autoExpandMembers, showMembers]);

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('hr-HR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    } catch (error) {
      return dateString;
    }
  };

  const getProgressColor = () => {
    const currentPlayers = team.current_players || 0;
    const maxPlayers = team.max_players || 1;
    const percentage = (currentPlayers / maxPlayers) * 100;
    if (percentage >= 90) return '#f44336';
    if (percentage >= 70) return '#ff9800';
    return '#4caf50';
  };

  const handleAction = (action, teamId) => {
    console.log('🔵 HandleAction called with teamId:', teamId);

    if (!userId) {
      if (onShowNotification) {
        onShowNotification('Molimo prijavite se kako biste pristupili ovoj funkciji!', 'error');
      }
      navigate('/login');
      return;
    }

    if (!teamId) {
      console.error('❌ Team ID is undefined!');
      if (onShowNotification) {
        onShowNotification('Greška: ID tima nije dostupan', 'error');
      }
      return;
    }

    if (action) {
      action(teamId);
    }
  };

  const handleJoinClick = async () => {
    if (!userId) {
      if (onShowNotification) {
        onShowNotification('Molimo prijavite se kako biste pristupili ovoj funkciji!', 'error');
      }
      navigate('/login');
      return;
    }

    // Check if team has skill requirements
    const hasSkillRequirements = team.min_skill_level || team.max_skill_level;

    if (hasSkillRequirements) {
      setCheckingRating(true);
      try {
        const sportRating = await checkUserSportRating();

        if (!sportRating || !sportRating.hasRating) {
          // User hasn't rated themselves for this sport - show rating modal
          setCheckingRating(false);
          setShowRatingModal(true);
          return;
        }

        // User has rating, proceed to join modal
        setUserSportRating(sportRating);
      } catch (error) {
        console.error('Error checking rating:', error);
      }
      setCheckingRating(false);
    }

    setShowJoinModal(true);
  };

  // Check if user has sport-specific rating
  const checkUserSportRating = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/ratings/sport/${team.sport}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        return data;
      }
      return null;
    } catch (error) {
      console.error('Check sport rating error:', error);
      return null;
    }
  };

  // Submit sport-specific rating
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

      if (response.ok) {
        setShowRatingModal(false);
        setUserSportRating(ratingData);
        // Now proceed with joining
        setShowJoinModal(true);
      } else {
        const data = await response.json();
        if (onShowNotification) {
          onShowNotification(data.message || 'Greška pri spremanju ocjene', 'error');
        }
      }
    } catch (error) {
      console.error('Submit sport rating error:', error);
      if (onShowNotification) {
        onShowNotification('Greška pri spremanju ocjene', 'error');
      }
    }
  };

  const handleJoinConfirm = () => {
    if (onJoin) {
      onJoin(team.id, joinPosition);
    }
    setShowJoinModal(false);
    setJoinPosition('');
  };

  const loadTeamMembers = async () => {
    if (loadingMembers || teamMembers.length > 0) return;

    setLoadingMembers(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/teams/${team.id}/members`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setTeamMembers(data);
      }
    } catch (error) {
      console.error('Failed to load team members:', error);
    } finally {
      setLoadingMembers(false);
    }
  };

  const handleShowMembers = () => {
    if (!showMembers) {
      loadTeamMembers();
    }
    setShowMembers(!showMembers);
  };

  return (
    <div className="team-card card">
      <div className="team-card-header">
        <div className="team-sport">{team.sport}</div>
        <div className="team-badges">
          {isFull && <div className="team-full-badge">PUNO</div>}
          {onWaitlist && <div className="team-waitlist-badge">📧 Na listi čekanja</div>}
          {(team.min_skill_level || team.max_skill_level) && (
            <div className="team-skill-badge">
              ⭐ Razina {team.min_skill_level || 1}-{team.max_skill_level || 5}
            </div>
          )}
          {team.amateur_only && (
            <div className="team-amateur-badge">🌱 Amateri</div>
          )}
        </div>
      </div>

      <h3>{team.name}</h3>
      
      <div className="team-info">
        <p>📅 {formatDate(team.date)}</p>
        <p>🕐 {team.time}</p>
        <p>📍 {team.city}, {team.country || 'Hrvatska'}</p>
        <p>🏟️ {team.location}</p>
      </div>

      {team.description && (
        <p className="team-description">{team.description}</p>
      )}

      <div className="team-players">
        <div className="players-count">
          Igrači: {team.current_players || 0}/{team.max_players || 0}
        </div>
        <div className="progress-bar">
          <div 
            className="progress-fill" 
            style={{ 
              width: `${((team.current_players || 0) / (team.max_players || 1)) * 100}%`,
              background: getProgressColor()
            }}
          />
        </div>
      </div>

      {team.waitlist && team.waitlist.length > 0 && (
        <div className="waitlist-info">
          📧 {team.waitlist.length} {team.waitlist.length === 1 ? 'osoba' : 'osobe'} na listi čekanja
        </div>
      )}

      {showActions && (
        <div className="team-actions">
          {!userId ? (
            <button 
              className="btn btn-primary" 
              onClick={() => navigate('/login')}
            >
              Prijavi se za pristup
            </button>
          ) : creator ? (
            <>
              <button className="btn btn-secondary" disabled>
                Kreator
              </button>
              {onDelete && (
                <button 
                  className="btn btn-danger" 
                  onClick={() => handleAction(onDelete, team.id)}
                >
                  Obriši
                </button>
              )}
            </>
          ) : joined ? (
            onLeave && (
              <button 
                className="btn btn-secondary" 
                onClick={() => handleAction(onLeave, team.id)}
              >
                Napusti tim
              </button>
            )
          ) : isFull ? (
            onWaitlist ? (
              <button className="btn btn-disabled" disabled>
                Na listi čekanja
              </button>
            ) : (
              onJoinWaitlist && (
                <button 
                  className="btn btn-secondary" 
                  onClick={() => handleAction(onJoinWaitlist, team.id)}
                >
                  📧 Dodaj me na listu čekanja
                </button>
              )
            )
          ) : (
            onJoin && (
              <button
                className="btn btn-primary"
                onClick={handleJoinClick}
                disabled={checkingRating}
              >
                {checkingRating ? 'Provjera...' : 'Pridruži se'}
              </button>
            )
          )}
        </div>
      )}

      <div className="team-creator">
        Kreator: {team.creator?.username || 'Unknown'}
      </div>

      {/* Show registered players section for creator - always visible and prominent */}
      {creator && (
        <div className="team-members-section creator-view">
          <div className="members-header">
            <h4>Prijavljeni igrači ({team.current_players || 0}/{team.max_players || 0})</h4>
            <button
              className="btn btn-secondary btn-small"
              onClick={handleShowMembers}
            >
              {showMembers ? 'Sakrij' : 'Prikaži'}
            </button>
          </div>

          {showMembers && (
            <div className="team-members-list">
              {loadingMembers ? (
                <p className="loading-text">Učitavanje...</p>
              ) : teamMembers.length === 0 ? (
                <div className="empty-members">
                  <span className="empty-icon">👥</span>
                  <p>Još nema prijavljenih igrača</p>
                  <small>Podijeli link tima da privučeš igrače!</small>
                </div>
              ) : (
                <ul>
                  {teamMembers.map((member, index) => (
                    <li key={member.id || index} className="member-item">
                      <span className="member-avatar">{member.user?.avatar || '👤'}</span>
                      <div className="member-details">
                        <span className="member-name">{member.user?.username || 'Nepoznato'}</span>
                        {member.user?.location && (
                          <span className="member-location">📍 {member.user.location}</span>
                        )}
                      </div>
                      {member.position && (
                        <span className="member-position">{member.position}</span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      )}

      {/* Sport Rating Modal - shown when joining skill-restricted team without rating */}
      {showRatingModal && (
        <SportRatingModal
          sport={team.sport}
          onSubmit={handleSportRatingSubmit}
          onCancel={() => setShowRatingModal(false)}
          existingRatings={userSportRating?.ratings}
        />
      )}

      {/* Join modal with position selection */}
      {showJoinModal && (
        <div className="modal-overlay" onClick={() => setShowJoinModal(false)}>
          <div className="join-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Pridruži se timu</h3>
            <p>Unesite poziciju na kojoj želite igrati (opcionalno)</p>

            {userSportRating && (
              <div className="user-rating-preview">
                <span className="rating-label">Tvoja ocjena za {team.sport}:</span>
                <span className="rating-value">{userSportRating.overallRating || userSportRating.overall_rating}</span>
              </div>
            )}

            <div className="form-group">
              <label>Pozicija</label>
              <input
                type="text"
                value={joinPosition}
                onChange={(e) => setJoinPosition(e.target.value)}
                placeholder="npr. Napadač, Vratar, Centar..."
              />
            </div>

            <div className="modal-actions">
              <button
                className="btn btn-secondary"
                onClick={() => setShowJoinModal(false)}
              >
                Odustani
              </button>
              <button
                className="btn btn-primary"
                onClick={handleJoinConfirm}
              >
                Pridruži se
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TeamCard;