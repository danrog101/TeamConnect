import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Toast from '../components/Toast';
import { API_URL } from '../config';
import { useLanguage } from '../i18n/LanguageContext';
import './Notifications.css';

function Notifications() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [toast, setToast] = useState(null);

  useEffect(() => {
    loadNotifications();
  }, [filter]);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      let url = `${API_URL}/notifications?limit=100`;
      if (filter === 'unread') {
        url += '&unreadOnly=true';
      }

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications);
      }
    } catch (error) {
      console.error('Load notifications error:', error);
      setToast({ message: 'Greška pri učitavanju notifikacija', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationClick = async (notification) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`${API_URL}/notifications/${notification._id}/read`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (notification.link) {
        navigate(notification.link);
      }

      loadNotifications();
    } catch (error) {
      console.error('Handle notification error:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`${API_URL}/notifications/read-all`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      setToast({ message: '✅ Sve notifikacije označene kao pročitane', type: 'success' });
      loadNotifications();
    } catch (error) {
      console.error('Mark all as read error:', error);
      setToast({ message: 'Greška pri označavanju notifikacija', type: 'error' });
    }
  };

  const handleDeleteAll = async () => {
    if (!window.confirm('Jesi li siguran da želiš obrisati sve notifikacije?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await fetch(`${API_URL}/notifications`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      setToast({ message: 'Sve notifikacije obrisane', type: 'info' });
      loadNotifications();
    } catch (error) {
      console.error('Delete all error:', error);
      setToast({ message: 'Greška pri brisanju notifikacija', type: 'error' });
    }
  };

  const getNotificationIcon = (type) => {
    const icons = {
      friend_request: '👋',
      friend_accepted: '🎉',
      team_joined: '🤝',
      waitlist_spot_available: '🎉',
      achievement_unlocked: '🎖️',
      rank_up: '⬆️',
      video_liked: '❤️',
      video_commented: '💬'
    };
    return icons[type] || '🔔';
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleString('hr-HR');
  };

  if (loading) {
    return (
      <div className="notifications-page">
        <Navbar />
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Učitavanje notifikacija...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="notifications-page">
      <Navbar />
      
      <div className="notifications-container">
        <div className="notifications-page-header">
          <h1>🔔 Notifikacije</h1>
          
          <div className="notifications-actions">
            <button 
              className="btn btn-secondary"
              onClick={handleMarkAllAsRead}
            >
              Označi sve
            </button>
            <button 
              className="btn btn-danger"
              onClick={handleDeleteAll}
            >
              Obriši sve
            </button>
          </div>
        </div>

        <div className="notifications-filters">
          <button 
            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            Sve
          </button>
          <button 
            className={`filter-btn ${filter === 'unread' ? 'active' : ''}`}
            onClick={() => setFilter('unread')}
          >
            Nepročitane
          </button>
        </div>

        {notifications.length === 0 ? (
          <div className="no-notifications-page card">
            <span className="empty-icon">🔔</span>
            <h3>Nemaš notifikacija</h3>
            <p>Kada se nešto dogodi, vidjet ćeš to ovdje</p>
          </div>
        ) : (
          <div className="notifications-list-page">
            {notifications.map(notification => (
              <div
                key={notification._id}
                className={`notification-card card ${!notification.read ? 'unread' : ''}`}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="notification-card-icon">
                  {getNotificationIcon(notification.type)}
                </div>

                <div className="notification-card-content">
                  <h4>{notification.title}</h4>
                  <p>{notification.message}</p>
                  <span className="notification-card-time">
                    {formatTime(notification.createdAt)}
                  </span>
                </div>

                {!notification.read && (
                  <div className="notification-card-unread-badge">NOVO</div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

export default Notifications;