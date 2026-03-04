import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Toast from '../components/Toast';
import './ActivityFeed.css';
import { useLanguage } from '../i18n/LanguageContext'; 
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

function ActivityFeed() {
   const { t } = useLanguage();
  const navigate = useNavigate();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [toast, setToast] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    loadActivities();
  }, [filter, page]);

  const loadActivities = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      let url = `${API_URL}/activities/feed?page=${page}&limit=20`;
      if (filter !== 'all') {
        url += `&type=${filter}`;
      }

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        
        if (page === 1) {
          setActivities(data.activities);
        } else {
          setActivities([...activities, ...data.activities]);
        }
        
        setHasMore(data.pagination.page < data.pagination.pages);
      } else {
        const error = await response.json();
        setToast({ message: error.message, type: 'error' });
      }
    } catch (error) {
      console.error('Load activities error:', error);
      setToast({ message: t('activities.loadError'), type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (newFilter) => {
    setFilter(newFilter);
    setPage(1);
    setActivities([]);
  };

  const loadMore = () => {
    if (!loading && hasMore) {
      setPage(page + 1);
    }
  };

  const getActivityIcon = (type) => {
    const icons = {
      team_created: '👥',
      team_joined: '🤝',
      match_played: '⚽',
      video_uploaded: '📹',
      tournament_created: '🏆',
      tournament_joined: '🎯',
      field_added: '🏟️',
      friend_added: '👋',
      achievement_unlocked: '🎖️',
      rank_up: '⬆️',
      goal_scored: '⚽',
      match_won: '🏆'
    };
    return icons[type] || '📌';
  };

  const getActivityText = (activity) => {
    const username = activity.user?.username || t('common.unknown');

    switch (activity.type) {
      case 'team_created':
        return (
          <>
            <strong>{username}</strong> {t('activities.teamCreated')}{' '}
            <span className="highlight">{activity.team_name}</span>
          </>
        );
      case 'team_joined':
        return (
          <>
            <strong>{username}</strong> {t('activities.teamJoined')}{' '}
            <span className="highlight">{activity.team_name}</span>
          </>
        );
      case 'match_played':
        return (
          <>
            <strong>{username}</strong> {t('activities.matchPlayed')}{' '}
            <span className="highlight">{activity.opponent}</span>
          </>
        );
      case 'match_won':
        return (
          <>
            <strong>{username}</strong> {t('activities.matchWon')}{' '}
            <span className="highlight">{activity.opponent}</span> {t('activities.scoreResult')}{' '}
            <span className="highlight">{activity.score}</span>
          </>
        );
      case 'video_uploaded':
        return (
          <>
            <strong>{username}</strong> {t('activities.videoUploaded')}{' '}
            <span className="highlight">{activity.video_title}</span>
          </>
        );
      case 'tournament_created':
        return (
          <>
            <strong>{username}</strong> {t('activities.tournamentCreated')}{' '}
            <span className="highlight">{activity.tournament_name}</span>
          </>
        );
      case 'tournament_joined':
        return (
          <>
            <strong>{username}</strong> {t('activities.tournamentJoined')}{' '}
            <span className="highlight">{activity.tournament_name}</span> {t('activities.withTeam')}{' '}
            <span className="highlight">{activity.team_name}</span>
          </>
        );
      case 'field_added':
        return (
          <>
            <strong>{username}</strong> {t('activities.fieldAdded')}{' '}
            <span className="highlight">{activity.field_name}</span>
          </>
        );
      case 'friend_added':
        return (
          <>
            <strong>{username}</strong> i{' '}
            <strong>{activity.friend_name}</strong> {t('activities.friendAdded')}
          </>
        );
      case 'achievement_unlocked':
        return (
          <>
            <strong>{username}</strong> {t('activities.achievementUnlocked')}{' '}
            <span className="highlight">{activity.achievement_name}</span>
          </>
        );
      case 'rank_up':
        return (
          <>
            <strong>{username}</strong> {t('activities.rankUp')}{' '}
            <span className="highlight">{activity.old_rank}</span> u{' '}
            <span className="highlight">{activity.new_rank}</span>
          </>
        );
      case 'goal_scored':
        return (
          <>
            <strong>{username}</strong> {t('activities.goalScored')}
          </>
        );
      default:
        return (
          <>
            <strong>{username}</strong> {t('activities.didSomething')}
          </>
        );
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return t('activities.justNow');
    if (diffMins < 60) return t('activities.minutesAgo').replace('{n}', diffMins);
    if (diffHours < 24) return t('activities.hoursAgo').replace('{n}', diffHours);
    if (diffDays < 7) return t('activities.daysAgo').replace('{n}', diffDays);
    return date.toLocaleDateString('hr-HR');
  };

  if (loading && activities.length === 0) {
    return (
      <div className="activity-feed-page">
        <Navbar />
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="activity-feed-page">
      <Navbar />
      
      <div className="activity-feed-container">
        <div className="activity-feed-header">
          <h1>{'📰 ' + t('activities.title')}</h1>
          <p>{t('activities.subtitle')}</p>
        </div>

        <div className="activity-filters card">
          <button 
            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => handleFilterChange('all')}
          >
            {t('activities.allActivities')}
          </button>
          <button 
            className={`filter-btn ${filter === 'team_created' ? 'active' : ''}`}
            onClick={() => handleFilterChange('team_created')}
          >
            {'👥 ' + t('activities.teamsFilter')}
          </button>
          <button 
            className={`filter-btn ${filter === 'match_won' ? 'active' : ''}`}
            onClick={() => handleFilterChange('match_won')}
          >
            {'⚽ ' + t('activities.matchesFilter')}
          </button>
          <button 
            className={`filter-btn ${filter === 'video_uploaded' ? 'active' : ''}`}
            onClick={() => handleFilterChange('video_uploaded')}
          >
            {'📹 ' + t('activities.videosFilter')}
          </button>
          <button 
            className={`filter-btn ${filter === 'tournament_created' ? 'active' : ''}`}
            onClick={() => handleFilterChange('tournament_created')}
          >
            {'🏆 ' + t('activities.tournamentsFilter')}
          </button>
          <button 
            className={`filter-btn ${filter === 'rank_up' ? 'active' : ''}`}
            onClick={() => handleFilterChange('rank_up')}
          >
            ⬆️ Rank Up
          </button>
        </div>

        {activities.length === 0 ? (
          <div className="no-activities card">
            <span className="empty-icon">📰</span>
            <h3>{t('activities.noActivities')}</h3>
            <p>{t('activities.noActivitiesDesc')}</p>
          </div>
        ) : (
          <>
            <div className="activities-list">
              {activities.map(activity => (
                <div key={activity.id} className="activity-item card">
                  <div className="activity-icon">
                    {getActivityIcon(activity.type)}
                  </div>

                  <div className="activity-content">
                    <div className="activity-avatar">
                      {activity.user?.avatar || '👤'}
                    </div>

                    <div className="activity-text">
                      <p>{getActivityText(activity)}</p>
                      <span className="activity-time">
                        {formatTime(activity.created_at)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {hasMore && (
              <div className="load-more-container">
                <button 
                  className="btn btn-secondary"
                  onClick={loadMore}
                  disabled={loading}
                >
                  {loading ? t('common.loading') : t('activities.loadMore')}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

export default ActivityFeed;