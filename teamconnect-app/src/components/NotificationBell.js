import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_URL } from '../config';
import './NotificationBell.css';

function NotificationBell() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    // ✅ Samo učitaj ako postoji token
    const token = localStorage.getItem('token');
    if (!token) {
      console.log('NotificationBell: No token, skipping initial load');
      return;
    }

    loadNotifications();
    
    // Auto-refresh svake 30 sekundi
    const interval = setInterval(() => {
      const currentToken = localStorage.getItem('token');
      if (currentToken) {
        loadNotifications(true);
      }
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Close dropdown when clicking outside
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadNotifications = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      
      const token = localStorage.getItem('token');
      
      // ✅ Check token exists
      if (!token) {
        console.log('NotificationBell: No token found');
        return; // ✅ Samo return, ne redirect
      }
      
      const response = await fetch(`${API_URL}/notifications?limit=10`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      // ✅ Handle 401 Unauthorized - ALI NE REDIRECT ODMAH
      if (response.status === 401) {
        console.log('NotificationBell: Token expired');
        // ✅ NE briši localStorage ovdje - možda je samo privremena greška
        // localStorage.clear();
        // navigate('/login');
        return;
      }

      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      } else {
        console.error('NotificationBell: Failed to load notifications', response.status);
      }
    } catch (error) {
      console.error('NotificationBell: Load error:', error);
      // Don't show error to user for notifications - not critical
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const handleNotificationClick = async (notification) => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        navigate('/login');
        return;
      }
      
      // ✅ Provjeri je li _id ili id
      const notificationId = notification._id || notification.id;
      
      await fetch(`${API_URL}/notifications/${notificationId}/read`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (notification.link) {
        navigate(notification.link);
      }

      loadNotifications();
      setShowDropdown(false);
    } catch (error) {
      console.error('Handle notification error:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        navigate('/login');
        return;
      }
      
      await fetch(`${API_URL}/notifications/read-all`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      loadNotifications();
    } catch (error) {
      console.error('Mark all as read error:', error);
    }
  };

  const handleDeleteNotification = async (e, notificationId) => {
    e.stopPropagation();
    
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        navigate('/login');
        return;
      }
      
      await fetch(`${API_URL}/notifications/${notificationId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      loadNotifications();
    } catch (error) {
      console.error('Delete notification error:', error);
    }
  };

  const getNotificationIcon = (type) => {
    const icons = {
      friend_request: '👋',
      friend_accepted: '🎉',
      team_invite: '📧',
      team_joined: '🤝',
      match_starting: '⚽',
      tournament_starting: '🏆',
      waitlist_spot_available: '🎉',
      achievement_unlocked: '🎖️',
      rank_up: '⬆️',
      video_liked: '❤️',
      video_commented: '💬',
      mention: '📢',
      system: '🔔'
    };
    return icons[type] || '🔔';
  };

  const formatTime = (timestamp) => {
    try {
      const date = new Date(timestamp);
      const now = new Date();
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return 'Upravo sada';
      if (diffMins < 60) return `Prije ${diffMins} min`;
      if (diffHours < 24) return `Prije ${diffHours}h`;
      if (diffDays < 7) return `Prije ${diffDays} dana`;
      return date.toLocaleDateString('hr-HR');
    } catch (error) {
      return '';
    }
  };

  return (
    <div className="notification-bell-container" ref={dropdownRef}>
      <button 
        className="notification-bell-button"
        onClick={() => setShowDropdown(!showDropdown)}
      >
        🔔
        {unreadCount > 0 && (
          <span className="notification-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
        )}
      </button>

      {showDropdown && (
        <div className="notification-dropdown">
          <div className="notification-header">
            <h3>Notifikacije</h3>
            {unreadCount > 0 && (
              <button 
                className="mark-all-read-btn"
                onClick={handleMarkAllAsRead}
              >
                Označi sve
              </button>
            )}
          </div>

          <div className="notification-list">
            {loading ? (
              <div className="notification-loading">
                <div className="loading-spinner-small"></div>
                <p>Učitavanje...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="no-notifications">
                <span className="empty-icon">🔔</span>
                <p>Nemaš notifikacija</p>
              </div>
            ) : (
              notifications.map(notification => (
                <div
                  key={notification._id || notification.id}
                  className={`notification-item ${!notification.read ? 'unread' : ''}`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="notification-icon">
                    {getNotificationIcon(notification.type)}
                  </div>
                  
                  <div className="notification-content">
                    <div className="notification-title">{notification.title}</div>
                    <div className="notification-message">{notification.message}</div>
                    <div className="notification-time">{formatTime(notification.created_at || notification.createdAt)}</div>
                  </div>

                  {!notification.read && (
                    <div className="notification-unread-dot"></div>
                  )}

                  <button
                    className="notification-delete-btn"
                    onClick={(e) => handleDeleteNotification(e, notification._id || notification.id)}
                  >
                    ✕
                  </button>
                </div>
              ))
            )}
          </div>

          {notifications.length > 0 && (
            <div className="notification-footer">
              <button 
                className="view-all-btn"
                onClick={() => {
                  navigate('/notifications');
                  setShowDropdown(false);
                }}
              >
                Vidi sve notifikacije
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default NotificationBell;