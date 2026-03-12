import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SportRatingModal from './SportRatingModal';
import { API_URL } from '../config';
import './TeamCard.css';
import { useLanguage } from '../i18n/LanguageContext';
import ReactDOM from 'react-dom';

function TeamCard({ team, onJoin, onLeave, onDelete, onDetails, onJoinWaitlist, onShowNotification, showActions = true, autoExpandMembers = false }) {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [joinPosition, setJoinPosition] = useState('');
  const [showMembers, setShowMembers] = useState(autoExpandMembers);
  const [linkCopied, setLinkCopied] = useState(false);
  const [teamMembers, setTeamMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [userSportRating, setUserSportRating] = useState(null);
  const [checkingRating, setCheckingRating] = useState(false);

  const getUserFromStorage = () => {
    try {
      const userStr = localStorage.getItem('user');
      if (!userStr) return null;
      return JSON.parse(userStr);
    } catch (error) {
      return null;
    }
  };

  const user = getUserFromStorage();
  const userId = user?.id || user?._id || null;

  const isTeamCreator = () => {
    if (!userId || !team?.creator) return false;
    const creatorId = team.creator.id || team.creator._id || team.creator;
    return creatorId === userId;
  };

  const isJoined = () => {
    if (!userId) return false;
    if (team?.team_members) {
      return team.team_members.some(m => m.user_id === userId);
    }
    if (team?.players) {
      return team.players.some(player => {
        const playerId = player.id || player._id || player;
        return playerId === userId;
      });
    }
    return false;
  };

  const isOnWaitlist = () => {
    if (!userId || !team?.waitlist) return false;
    return team.waitlist.some(w => {
      const waitlistUserId = w.user?.id || w.user?._id || w.user;
      return waitlistUserId === userId;
    });
  };

  const isFull = (team.current_players || 0) >= (team.max_players || 0);
  const creator = isTeamCreator();
  const joined = isJoined();
  const onWaitlist = isOnWaitlist();

  const hasSkillRequirements = !!(team.min_skill_level || team.max_skill_level);

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
    const percentage = ((team.current_players || 0) / (team.max_players || 1)) * 100;
    if (percentage >= 90) return '#f44336';
    if (percentage >= 70) return '#ff9800';
    return '#3b82f6';
  };

  const handleAction = (action, teamId) => {
    if (!userId) {
      if (onShowNotification) onShowNotification(t('teams.loginRequired'), 'error');
      navigate('/login');
      return;
    }
    if (!teamId) {
      if (onShowNotification) onShowNotification('Greška: ID tima nije dostupan', 'error');
      return;
    }
    if (action) action(teamId);
  };

  const handleJoinClick = async () => {
    if (!userId) {
      if (onShowNotification) onShowNotification(t('teams.loginRequired'), 'error');
      navigate('/login');
      return;
    }

    if (!hasSkillRequirements && !team.amateur_only) {
      setShowJoinModal(true);
      return;
    }

    setCheckingRating(true);
    try {
      const sportRating = await checkUserSportRating();

      if (!sportRating || !sportRating.hasRating) {
        setCheckingRating(false);
        setShowRatingModal(true);
        return;
      }

      setUserSportRating(sportRating);
      const userLevel = sportRating.skill_level || Math.round((sportRating.overall_rating || 0) / 20);

      if (team.min_skill_level && userLevel < team.min_skill_level) {
        setCheckingRating(false);
        if (onShowNotification) {
          onShowNotification(
            t('rating.teamRequiresLevel').replace('{level}', team.min_skill_level),
            'error'
          );
        }
        return;
      }
      if (team.max_skill_level && userLevel > team.max_skill_level) {
        setCheckingRating(false);
        if (onShowNotification) {
          onShowNotification(
            t('rating.teamMaxLevel').replace('{level}', team.max_skill_level),
            'error'
          );
        }
        return;
      }
    } catch (error) {
      console.error('Error checking rating:', error);
    }

    setCheckingRating(false);
    setShowJoinModal(true);
  };

  const checkUserSportRating = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/ratings/sport/${team.sport}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) return await response.json();
      return null;
    } catch (error) {
      return null;
    }
  };

  const handleSportRatingSubmit = async (ratingData) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/ratings/sport`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(ratingData)
      });

      if (response.ok) {
        setShowRatingModal(false);

        const savedRating = {
          hasRating: true,
          sport: ratingData.sport,
          overall_rating: ratingData.overallRating,
          skill_level: ratingData.skillLevel
        };
        setUserSportRating(savedRating);

        const userLevel = ratingData.skillLevel;

        if (team.min_skill_level && userLevel < team.min_skill_level) {
          if (onShowNotification) {
            onShowNotification(
              t('rating.teamRequiresLevel').replace('{level}', team.min_skill_level),
              'error'
            );
          }
          return;
        }
        if (team.max_skill_level && userLevel > team.max_skill_level) {
          if (onShowNotification) {
            onShowNotification(
              t('rating.teamMaxLevel').replace('{level}', team.max_skill_level),
              'error'
            );
          }
          return;
        }

        setShowJoinModal(true);
      } else {
        const data = await response.json();
        if (onShowNotification) {
          onShowNotification(data.message || t('teams.ratingError'), 'error');
        }
      }
    } catch (error) {
      if (onShowNotification) onShowNotification(t('teams.ratingError'), 'error');
    }
  };

  const handleJoinConfirm = () => {
    if (onJoin) onJoin(team.id, joinPosition);
    setShowJoinModal(false);
    setJoinPosition('');
  };

  const loadTeamMembers = async () => {
    if (loadingMembers) return;
    setLoadingMembers(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/teams/${team.id}/members`, {
        headers: { 'Authorization': `Bearer ${token}` }
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
    if (!showMembers) loadTeamMembers();
    else setTeamMembers([]);
    setShowMembers(!showMembers);
  };

  return (
    <div className="team-card card">
      <div className="team-card-header">
        <div className="team-sport">{team.sport}</div>
        <div className="team-badges">
          {isFull && <div className="team-full-badge">{t('teams.full')}</div>}
          {onWaitlist && <div className="team-waitlist-badge">📧 {t('teams.onWaitlist')}</div>}
          {hasSkillRequirements && (
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
          {t('teams.players')}: {team.current_players || 0}/{team.max_players || 0}
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
          📧 {t('teams.personsWaiting', { n: team.waitlist.length })}
        </div>
      )}

      {showActions && (
        <div className="team-actions">
          {!userId ? (
            <button className="btn btn-primary" onClick={() => navigate('/login')}>
              {t('teams.loginToAccess')}
            </button>
          ) : creator ? (
            <>
              <button className="btn btn-secondary" disabled>
                {t('teams.creator')}
              </button>
              {onDetails && (
                <button
                  className="btn btn-secondary btn-small"
                  onClick={(e) => { e.stopPropagation(); onDetails(team.id); }}
                >
                  ✏️ Uredi tim
                </button>
              )}
              {onDelete && (
                <button className="btn btn-danger" onClick={() => handleAction(onDelete, team.id)}>
                  {t('teams.deleteTeam')}
                </button>
              )}
              <button
                className="btn btn-secondary btn-small"
                onClick={(e) => {
                  e.stopPropagation();
                  const teamUrl = `${window.location.origin}/dashboard?team=${team.id}`;
                  navigator.clipboard.writeText(teamUrl).then(() => {
                    setLinkCopied(true);
                    setTimeout(() => setLinkCopied(false), 2000);
                  });
                }}
              >
                {linkCopied ? ('✅ ' + t('teams.linkCopied')) : ('🔗 ' + t('teams.shareLink'))}
              </button>
              <button
                className="btn btn-primary btn-small"
                onClick={(e) => { e.stopPropagation(); navigate(`/team/${team.id}/chat`); }}
              >
                💬 Chat
              </button>
            </>
          ) : joined ? (
            <>
              <button className="btn btn-member" disabled>
                {'✓ ' + t('teams.alreadyMember')}
              </button>
              {onLeave && (
                <button className="btn btn-secondary btn-small" onClick={() => handleAction(onLeave, team.id)}>
                  {t('teams.leaveTeam')}
                </button>
              )}
              <button
                className="btn btn-secondary btn-small"
                onClick={(e) => {
                  e.stopPropagation();
                  const teamUrl = `${window.location.origin}/dashboard?team=${team.id}`;
                  navigator.clipboard.writeText(teamUrl).then(() => {
                    setLinkCopied(true);
                    setTimeout(() => setLinkCopied(false), 2000);
                  });
                }}
              >
                {linkCopied ? ('✅ ' + t('teams.linkCopied')) : ('🔗 ' + t('teams.shareLink'))}
              </button>
              <button
                className="btn btn-primary btn-small"
                onClick={(e) => { e.stopPropagation(); navigate(`/team/${team.id}/chat`); }}
              >
                💬 Chat
              </button>
            </>
          ) : isFull ? (
            onWaitlist ? (
              <button className="btn btn-disabled" disabled>{t('teams.onWaitlist')}</button>
            ) : (
              onJoinWaitlist && (
                <button className="btn btn-secondary" onClick={() => handleAction(onJoinWaitlist, team.id)}>
                  {'📧 ' + t('teams.joinWaitlist')}
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
                {checkingRating ? t('teams.checking') : t('teams.joinTeam')}
              </button>
            )
          )}
        </div>
      )}

      <div className="team-creator">
        {t('teams.creator')}: {team.creator?.username || 'Unknown'}
      </div>

      {creator && (
        <div className="team-members-section creator-view">
          <div className="members-header">
            <h4>{t('teams.registeredPlayers')} ({team.current_players || 0}/{team.max_players || 0})</h4>
            <button className="btn btn-secondary btn-small" onClick={handleShowMembers}>
              {showMembers ? t('teams.hidePlayers') : t('teams.showPlayers')}
            </button>
          </div>

          {showMembers && (
            <div className="team-members-list">
              {loadingMembers ? (
                <p className="loading-text">{t('common.loading')}</p>
              ) : teamMembers.length === 0 ? (
                <div className="empty-members">
                  <span className="empty-icon">👥</span>
                  <p>{t('teams.noPlayersYet')}</p>
                  <small>{t('teams.shareToAttract')}</small>
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

      {showRatingModal && ReactDOM.createPortal(
        <SportRatingModal
          sport={team.sport}
          onSubmit={handleSportRatingSubmit}
          onCancel={() => setShowRatingModal(false)}
          existingRating={userSportRating?.skill_level}
        />,
        document.body
      )}

      {showJoinModal && (
        <div className="modal-overlay" onClick={() => setShowJoinModal(false)}>
          <div className="join-modal" onClick={(e) => e.stopPropagation()}>
            <h3>{t('teams.joinTeamTitle')}</h3>
            <p>{t('teams.joinTeamDesc')}</p>

            <div className="form-group">
              <label>{t('teams.position')}</label>
              <input
                type="text"
                value={joinPosition}
                onChange={(e) => setJoinPosition(e.target.value)}
                placeholder={t('teams.positionPlaceholder')}
              />
            </div>

            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowJoinModal(false)}>
                {t('common.cancel')}
              </button>
              <button className="btn btn-primary" onClick={handleJoinConfirm}>
                {t('teams.joinTeam')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TeamCard;