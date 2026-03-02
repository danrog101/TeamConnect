import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Toast from '../components/Toast';
import Modal from '../components/Modal';
import { API_URL } from '../config';
import { useLanguage } from '../i18n/LanguageContext';
import './Friends.css';
 
function Friends() {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const [activeTab, setActiveTab] = useState('friends');
  const [friends, setFriends] = useState([]);
  const [requests, setRequests] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [toast, setToast] = useState(null);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [friendRequestMessage, setFriendRequestMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [confirmModal, setConfirmModal] = useState({ open: false, friendId: null });

  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    if (activeTab === 'friends') {
      loadFriends();
    } else if (activeTab === 'requests') {
      loadRequests();
    }
  }, [activeTab]);

  const loadFriends = async () => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        navigate('/login');
        return;
      }
      
      const response = await fetch(`${API_URL}/friends`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.status === 401) {
        localStorage.clear();
        navigate('/login');
        return;
      }

      if (response.ok) {
        const data = await response.json();
        setFriends(data);
        console.log('✅ Loaded friends:', data.length);
      }
    } catch (error) {
      console.error('❌ Load friends error:', error);
    }
  };

  const loadRequests = async () => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        navigate('/login');
        return;
      }
      
      const response = await fetch(`${API_URL}/friends/requests`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.status === 401) {
        localStorage.clear();
        navigate('/login');
        return;
      }

      if (response.ok) {
        const data = await response.json();
        setRequests(data);
        console.log('✅ Loaded requests:', data.length);
      }
    } catch (error) {
      console.error('❌ Load requests error:', error);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      setToast({ message: t('friends.searchMinChars'), type: 'error' });
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        navigate('/login');
        return;
      }

      console.log('🔍 Searching for:', searchQuery);

      const res = await fetch(`${API_URL}/friends/search?query=${encodeURIComponent(searchQuery)}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.status === 401) {
        localStorage.clear();
        navigate('/login');
        return;
      }

      if (res.ok) {
        const data = await res.json();
        setSearchResults(data);
        setActiveTab('search');
        console.log('✅ Search results:', data.length);
      } else {
        const errorData = await res.json();
        setToast({ message: errorData.message || t('friends.searchError'), type: 'error' });
      }
    } catch (error) {
      console.error('❌ Search error:', error);
      setToast({ message: t('friends.searchError'), type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleSendFriendRequest = (user) => {
    setSelectedUser(user);
    setShowMessageModal(true);
  };

  const confirmSendRequest = async () => {
    if (!selectedUser) return;

    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        navigate('/login');
        return;
      }

      console.log('📤 Sending friend request to:', selectedUser.username);

      const res = await fetch(`${API_URL}/friends/request/${selectedUser.id}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message: friendRequestMessage })
      });

      if (res.status === 401) {
        localStorage.clear();
        navigate('/login');
        return;
      }

      const data = await res.json();

      if (res.ok) {
        setToast({ message: t('friends.requestSent'), type: 'success' });
        setShowMessageModal(false);
        setFriendRequestMessage('');
        setSelectedUser(null);
        handleSearch(); // refresh search results
      } else {
        setToast({ message: data.message || t('friends.sendError'), type: 'error' });
      }
    } catch (error) {
      console.error('❌ Send request error:', error);
      setToast({ message: t('friends.sendError'), type: 'error' });
    }
  };

  const handleAcceptRequest = async (requestId) => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        navigate('/login');
        return;
      }

      const res = await fetch(`${API_URL}/friends/accept/${requestId}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.status === 401) {
        localStorage.clear();
        navigate('/login');
        return;
      }

      const data = await res.json();

      if (res.ok) {
        setToast({ message: '🎉 ' + data.message, type: 'success' });
        loadRequests();
        loadFriends();
      } else {
        setToast({ message: data.message || t('friends.acceptError'), type: 'error' });
      }
    } catch (error) {
      console.error('❌ Accept request error:', error);
      setToast({ message: t('friends.acceptError'), type: 'error' });
    }
  };

  const handleRejectRequest = async (requestId) => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        navigate('/login');
        return;
      }

      const res = await fetch(`${API_URL}/friends/reject/${requestId}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.status === 401) {
        localStorage.clear();
        navigate('/login');
        return;
      }

      if (res.ok) {
        setToast({ message: t('friends.rejected'), type: 'info' });
        loadRequests();
      }
    } catch (error) {
      console.error('❌ Reject request error:', error);
      setToast({ message: t('friends.rejectError'), type: 'error' });
    }
  };

  const handleRemoveFriend = async (friendId) => {
    setConfirmModal({ open: true, friendId });
  };

  const confirmRemoveFriend = async () => {
    const friendId = confirmModal.friendId;
    setConfirmModal({ open: false, friendId: null });

    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        navigate('/login');
        return;
      }

      const res = await fetch(`${API_URL}/friends/${friendId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.status === 401) {
        localStorage.clear();
        navigate('/login');
        return;
      }

      if (res.ok) {
        setToast({ message: t('friends.friendRemoved'), type: 'info' });
        loadFriends();
      }
    } catch (error) {
      console.error('❌ Remove friend error:', error);
      setToast({ message: t('friends.removeError'), type: 'error' });
    }
  };

  const formatDate = (timestamp) => {
    try {
      const date = new Date(timestamp);
      const now = new Date();
      const diffMs = now - date;
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffHours < 1) return 'Prije manje od 1h';
      if (diffHours < 24) return `Prije ${diffHours}h`;
      if (diffDays < 7) return `Prije ${diffDays} dana`;
      return date.toLocaleDateString('hr-HR');
    } catch (error) {
      return '';
    }
  };

  return (
    <div className="friends-page">
      <Navbar />

      <div className="friends-container">
        {/* Header */}
        <div className="friends-header">
          <h1>{'👥 ' + t('friends.title')}</h1>
          <p>{t('friends.subtitle')}</p>
        </div>

        {/* Search */}
        <div className="search-section card">
          <h3>{'🔍 ' + t('friends.searchUsers')}</h3>
          <div className="search-bar">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('friends.searchPlaceholder')}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              disabled={loading}
            />
            <button 
              className="btn btn-primary" 
              onClick={handleSearch}
              disabled={loading}
            >
              {loading ? t('common.searching') : t('common.search')}
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="friends-tabs">
          <button
            className={`tab ${activeTab === 'friends' ? 'active' : ''}`}
            onClick={() => setActiveTab('friends')}
          >
            {t('friends.friendsTab')} ({friends.length})
          </button>
          <button
            className={`tab ${activeTab === 'requests' ? 'active' : ''}`}
            onClick={() => setActiveTab('requests')}
          >
            {t('friends.requestsTab')} ({requests.length})
            {requests.length > 0 && <span className="notification-dot"></span>}
          </button>
          {searchResults.length > 0 && (
            <button
              className={`tab ${activeTab === 'search' ? 'active' : ''}`}
              onClick={() => setActiveTab('search')}
            >
              {t('friends.resultsTab')} ({searchResults.length})
            </button>
          )}
        </div>

        {/* Content */}
        <div className="friends-content">
          {/* Friends Tab */}
          {activeTab === 'friends' && (
            <div className="friends-list">
              {friends.length === 0 ? (
                <div className="empty-state card">
                  <span className="empty-icon">👥</span>
                  <h3>{t('friends.noFriends')}</h3>
                  <p>{t('friends.noFriendsDesc')}</p>
                </div>
              ) : (
                <div className="friends-grid">
                  {friends.map(friend => (
                    <div key={friend.id} className="friend-card card">
                      <div className="friend-header">
                        <div className="friend-avatar-wrapper">
                          <div className="friend-avatar">{friend.avatar || '👤'}</div>
                        </div>
                        <div className="friend-info">
                          <h4>{friend.username}</h4>
                          <p className="friend-email">{friend.email}</p>
                          {friend.sport && <p className="friend-sport">⚽ {friend.sport}</p>}
                          {friend.location && <p className="friend-location">📍 {friend.location}</p>}
                        </div>
                      </div>

                      <div className="friend-actions">
                        <button
                          className="btn btn-secondary btn-small"
                          onClick={() => navigate(`/profile/${friend.id}`)}
                        >
                          {t('friends.viewProfile')}
                        </button>
                        <button
                          className="btn btn-danger btn-small"
                          onClick={() => handleRemoveFriend(friend.id)}
                        >
                          {t('friends.removeFriend')}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Requests Tab */}
          {activeTab === 'requests' && (
            <div className="requests-list">
              {requests.length === 0 ? (
                <div className="empty-state card">
                  <span className="empty-icon">📭</span>
                  <h3>{t('friends.noRequests')}</h3>
                  <p>{t('friends.noRequestsDesc')}</p>
                </div>
              ) : (
                <div className="requests-grid">
                  {requests.map(request => (
                    <div key={request.id} className="request-card card">
                      <div className="request-header">
                        <div className="request-avatar">{request.from_user?.avatar || '👤'}</div>
                        <div className="request-info">
                          <h4>{request.from_user?.username || 'Unknown'}</h4>
                          <p className="request-email">{request.from_user?.email || ''}</p>
                          {request.from_user?.sport && <p className="request-sport">⚽ {request.from_user.sport}</p>}
                        </div>
                      </div>

                      {request.message && <p className="request-message">"{request.message}"</p>}

                      <p className="request-time">{formatDate(request.sent_at || request.created_at)}</p>

                      <div className="request-actions">
                        <button
                          className="btn btn-primary"
                          onClick={() => handleAcceptRequest(request.id)}
                        >
                          {'✓ ' + t('friends.accept')}
                        </button>
                        <button
                          className="btn btn-secondary"
                          onClick={() => handleRejectRequest(request.id)}
                        >
                          {'✕ ' + t('friends.reject')}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Search Tab */}
          {activeTab === 'search' && (
            <div className="search-results">
              {searchResults.length === 0 ? (
                <div className="empty-state card">
                  <span className="empty-icon">🔍</span>
                  <h3>{t('friends.noResults')}</h3>
                  <p>{t('friends.noResultsDesc')}</p>
                </div>
              ) : (
                <div className="search-results-grid">
                  {searchResults.map(user => (
                    <div key={user.id} className="search-result-card card">
                      <div className="result-header">
                        <div className="result-avatar">{user.avatar || '👤'}</div>
                        <div className="result-info">
                          <h4>{user.username}</h4>
                          <p className="result-email">{user.email}</p>
                          {user.sport && <p className="result-sport">⚽ {user.sport}</p>}
                          {user.location && <p className="result-location">📍 {user.location}</p>}
                        </div>
                      </div>

                      <div className="result-actions">
                        {user.isFriend ? (
                          <button className="btn btn-disabled" disabled>
                            {'✓ ' + t('friends.alreadyFriends')}
                          </button>
                        ) : user.requestSent ? (
                          <button className="btn btn-disabled" disabled>
                            {'✉️ ' + t('friends.requestAlreadySent')}
                          </button>
                        ) : user.id === currentUser.id ? (
                          <button className="btn btn-disabled" disabled>
                            {'👤 ' + t('friends.itsYou')}
                          </button>
                        ) : (
                          <button
                            className="btn btn-primary"
                            onClick={() => handleSendFriendRequest(user)}
                          >
                            {'+ ' + t('friends.addFriend')}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal za poruku uz friend request */}
      {showMessageModal && selectedUser && (
        <div className="modal-overlay" onClick={() => setShowMessageModal(false)}>
          <div className="friend-message-modal" onClick={(e) => e.stopPropagation()}>
            <h2>{'✉️ ' + t('friends.addFriendTitle')}</h2>
            <p>{t('friends.sendRequestTo')} <strong>{selectedUser.username}</strong></p>

            <div className="form-group">
              <label>{t('friends.messageOptional')}</label>
              <textarea
                value={friendRequestMessage}
                onChange={(e) => setFriendRequestMessage(e.target.value)}
                placeholder={t('friends.messagePlaceholder')}
                rows="3"
                maxLength={200}
              />
            </div>

            <div className="modal-actions">
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setShowMessageModal(false);
                  setFriendRequestMessage('');
                  setSelectedUser(null);
                }}
              >
                {t('common.cancel')}
              </button>
              <button className="btn btn-primary" onClick={confirmSendRequest}>
                {t('friends.sendRequest')}
              </button>
            </div>
          </div>
        </div>
      )}

      <Modal
        isOpen={confirmModal.open}
        onClose={() => setConfirmModal({ open: false, friendId: null })}
        onConfirm={confirmRemoveFriend}
        title={t('friends.removeFriend')}
        message={t('friends.removeFriendConfirm')}
      />

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

export default Friends;