import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Toast from '../components/Toast';
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
      setToast({ message: 'Upiši barem 2 znaka!', type: 'error' });
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
        setToast({ message: errorData.message || 'Greška pri pretrazi', type: 'error' });
      }
    } catch (error) {
      console.error('❌ Search error:', error);
      setToast({ message: 'Greška pri pretrazi', type: 'error' });
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
        setToast({ message: '✉️ Zahtjev poslan!', type: 'success' });
        setShowMessageModal(false);
        setFriendRequestMessage('');
        setSelectedUser(null);
        handleSearch(); // refresh search results
      } else {
        setToast({ message: data.message || 'Greška pri slanju zahtjeva', type: 'error' });
      }
    } catch (error) {
      console.error('❌ Send request error:', error);
      setToast({ message: 'Greška pri slanju zahtjeva', type: 'error' });
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
        setToast({ message: data.message || 'Greška pri prihvaćanju', type: 'error' });
      }
    } catch (error) {
      console.error('❌ Accept request error:', error);
      setToast({ message: 'Greška pri prihvaćanju zahtjeva', type: 'error' });
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
        setToast({ message: 'Zahtjev odbijen', type: 'info' });
        loadRequests();
      }
    } catch (error) {
      console.error('❌ Reject request error:', error);
      setToast({ message: 'Greška pri odbijanju zahtjeva', type: 'error' });
    }
  };

  const handleRemoveFriend = async (friendId) => {
    if (!window.confirm('Jesi li siguran/a da želiš ukloniti prijatelja?')) {
      return;
    }

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
        setToast({ message: 'Prijatelj uklonjen', type: 'info' });
        loadFriends();
      }
    } catch (error) {
      console.error('❌ Remove friend error:', error);
      setToast({ message: 'Greška pri uklanjanju prijatelja', type: 'error' });
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
          <h1>👥 Prijatelji</h1>
          <p>Povežite se s igračima</p>
        </div>

        {/* Search */}
        <div className="search-section card">
          <h3>🔍 Pretraži korisnike</h3>
          <div className="search-bar">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Pretraži po korisničkom imenu ili emailu..."
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              disabled={loading}
            />
            <button 
              className="btn btn-primary" 
              onClick={handleSearch}
              disabled={loading}
            >
              {loading ? 'Tražim...' : 'Pretraži'}
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="friends-tabs">
          <button
            className={`tab ${activeTab === 'friends' ? 'active' : ''}`}
            onClick={() => setActiveTab('friends')}
          >
            Prijatelji ({friends.length})
          </button>
          <button
            className={`tab ${activeTab === 'requests' ? 'active' : ''}`}
            onClick={() => setActiveTab('requests')}
          >
            Zahtjevi ({requests.length})
            {requests.length > 0 && <span className="notification-dot"></span>}
          </button>
          {searchResults.length > 0 && (
            <button
              className={`tab ${activeTab === 'search' ? 'active' : ''}`}
              onClick={() => setActiveTab('search')}
            >
              Rezultati ({searchResults.length})
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
                  <h3>Nemaš prijatelja</h3>
                  <p>Pretraži korisnike i dodaj ih u prijatelje!</p>
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
                          Vidi profil
                        </button>
                        <button
                          className="btn btn-danger btn-small"
                          onClick={() => handleRemoveFriend(friend.id)}
                        >
                          Ukloni
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
                  <h3>Nemaš novih zahtjeva</h3>
                  <p>Kada te netko doda, vidjet ćeš to ovdje</p>
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
                          ✓ Prihvati
                        </button>
                        <button
                          className="btn btn-secondary"
                          onClick={() => handleRejectRequest(request.id)}
                        >
                          ✕ Odbij
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
                  <h3>Nema rezultata</h3>
                  <p>Pokušaj s drugim pojmom za pretragu</p>
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
                            ✓ Već prijatelji
                          </button>
                        ) : user.requestSent ? (
                          <button className="btn btn-disabled" disabled>
                            ✉️ Zahtjev poslan
                          </button>
                        ) : user.id === currentUser.id ? (
                          <button className="btn btn-disabled" disabled>
                            👤 To si ti
                          </button>
                        ) : (
                          <button
                            className="btn btn-primary"
                            onClick={() => handleSendFriendRequest(user)}
                          >
                            + Dodaj prijatelja
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
            <h2>✉️ Dodaj prijatelja</h2>
            <p>Pošalji zahtjev korisniku <strong>{selectedUser.username}</strong></p>

            <div className="form-group">
              <label>Poruka (opcionalno)</label>
              <textarea
                value={friendRequestMessage}
                onChange={(e) => setFriendRequestMessage(e.target.value)}
                placeholder="Napiši kratku poruku..."
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
                Odustani
              </button>
              <button className="btn btn-primary" onClick={confirmSendRequest}>
                Pošalji zahtjev
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

export default Friends;