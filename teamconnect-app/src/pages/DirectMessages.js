import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Toast from '../components/Toast';
import { getSocket } from '../utils/socket';
import { API_URL } from '../config';
import { useLanguage } from '../i18n/LanguageContext';
import './DirectMessages.css';

function DirectMessages() {
  const { userId: otherUserId } = useParams();
  const navigate = useNavigate();
const { t, language } = useLanguage();

  const [messages, setMessages]           = useState([]);
  const [conversations, setConversations] = useState([]);
  const [otherUser, setOtherUser]         = useState(null);
  const [newMessage, setNewMessage]       = useState('');
  const [loading, setLoading]             = useState(true);
  const [typingUsers, setTypingUsers]     = useState([]);
  const [toast, setToast]                 = useState(null);
  const [searchQuery, setSearchQuery]     = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [mobileChatOpen, setMobileChatOpen] = useState(false);
  const [isTyping, setIsTyping]           = useState(false);

  const messagesEndRef   = useRef(null);
  const typingTimeoutRef = useRef(null);
  const socketRef        = useRef(null);

  const currentUser   = JSON.parse(localStorage.getItem('user') || '{}');
  const currentUserId = currentUser._id || currentUser.id;

  useEffect(() => {
    if (otherUserId) setMobileChatOpen(true);
  }, [otherUserId]);

  useEffect(() => {
    socketRef.current = getSocket();
    socketRef.current.emit('join_dm', currentUserId);

    socketRef.current.on('new_dm', (message) => {
      const isRelevant =
        message.sender_id === otherUserId ||
        message.recipient_id === otherUserId;
      if (isRelevant) {
        setMessages(prev => [...prev, message]);
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      }
      loadConversations();
    });

    socketRef.current.on('dm_user_typing', ({ userId }) => {
      if (userId === otherUserId) setTypingUsers([{ userId }]);
    });

    socketRef.current.on('dm_user_stop_typing', ({ userId }) => {
      if (userId === otherUserId) setTypingUsers([]);
    });

    loadConversations();

    return () => {
      socketRef.current.off('new_dm');
      socketRef.current.off('dm_user_typing');
      socketRef.current.off('dm_user_stop_typing');
    };
  }, [currentUserId]);

  useEffect(() => {
    if (otherUserId) loadMessages();
  }, [otherUserId]);

  const loadConversations = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/dm/conversations`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setConversations(await res.json());
    } catch (e) { console.error('Load conversations error:', e); }
  };

  const loadMessages = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/dm/${otherUserId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
        if (data.length > 0) {
          const other = data[0].sender_id === currentUserId
            ? data[0].recipient
            : data[0].sender;
          setOtherUser(other);
        } else {
          // dohvati usera ako nema poruka
          const userRes = await fetch(`${API_URL}/users/${otherUserId}`, {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
          });
          if (userRes.ok) setOtherUser(await userRes.json());
        }
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      }
    } catch (e) { console.error('Load messages error:', e); }
    finally { setLoading(false); }
  };

  const handleSearchUsers = async (query) => {
    setSearchQuery(query);
    if (query.length < 2) { setSearchResults([]); return; }
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/profile/search?q=${encodeURIComponent(query)}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSearchResults(Array.isArray(data) ? data.filter(u => u.id !== currentUserId) : []);
      }
    } catch (e) { console.error(e); }
  };

  const handleSendMessage = useCallback((e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    socketRef.current.emit('send_dm', {
      senderId: currentUserId,
      recipientId: otherUserId,
      text: newMessage.trim()
    });
    setNewMessage('');
    socketRef.current.emit('dm_stop_typing', {
      senderId: currentUserId,
      recipientId: otherUserId
    });
  }, [newMessage, currentUserId, otherUserId]);

  const handleTyping = useCallback(() => {
    if (!isTyping) {
      setIsTyping(true);
      socketRef.current.emit('dm_typing', {
        senderId: currentUserId,
        recipientId: otherUserId
      });
    }
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      socketRef.current.emit('dm_stop_typing', {
        senderId: currentUserId,
        recipientId: otherUserId
      });
    }, 2000);
  }, [isTyping, currentUserId, otherUserId]);

  const openConversation = (userId) => {
    navigate(`/messages/${userId}`);
    setSearchQuery('');
    setSearchResults([]);
    setMobileChatOpen(true);
  };

  const formatTime = (ts) =>
    new Date(ts).toLocaleTimeString('hr-HR', { hour: '2-digit', minute: '2-digit' });

  const formatDate = (ts) => {
    const date      = new Date(ts);
    const today     = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === today.toDateString())     return t('chat.today')     || 'Danas';
    if (date.toDateString() === yesterday.toDateString()) return t('chat.yesterday') || 'Jučer';
    return date.toLocaleDateString('hr-HR');
  };

  const renderMessage = (message, index) => {
    const isOwn = message.sender_id === currentUserId;
    const showDate =
      index === 0 ||
      formatDate(messages[index - 1].created_at) !== formatDate(message.created_at);

    return (
      <React.Fragment key={message.id}>
        {showDate && (
          <div className="date-separator">
            <span>{formatDate(message.created_at)}</span>
          </div>
        )}
        <div className={`message-wrapper ${isOwn ? 'own' : 'other'}`}>
          {!isOwn && (
            <div className="message-avatar">{message.sender?.avatar || '👤'}</div>
          )}
          <div className={`message-bubble ${isOwn ? 'own' : 'other'}`}>
            {!isOwn && <div className="message-sender">{message.sender?.username}</div>}
            <div className="message-text">{message.text}</div>
            <div className="message-time">{formatTime(message.created_at)}</div>
          </div>
        </div>
      </React.Fragment>
    );
  };

  return (
    <div className="team-chat-page">
      <Navbar />

      {/* DESKTOP */}
      <div className="chat-container dm-layout dm-desktop">

        {/* SIDEBAR */}
        <div className="dm-sidebar card">
          <h3>💬 {t('dm.title') || 'Poruke'}</h3>
          <div className="dm-search-box">
            <input
              type="text"
             placeholder={language === 'en' ? '🔍 Search users...' : '🔍 Pretraži korisnike...'}
              value={searchQuery}
              onChange={(e) => handleSearchUsers(e.target.value)}
            />
          </div>
          {searchResults.length > 0 && (
            <div className="dm-search-results">
              {searchResults.map(user => (
                <div key={user.id} className="search-result-item"
                  onClick={() => openConversation(user.id)}>
                  <div className="conv-avatar">{user.avatar || '👤'}</div>
                  <div className="conv-name">{user.username}</div>
                </div>
              ))}
            </div>
          )}
          {conversations.length === 0 ? (
            <div className="no-conversations">
              <span>📭</span>
              <p>{t('dm.noConversations') || 'Nema konverzacija'}</p>
            </div>
          ) : (
            conversations.map(conv => (
              <div
                key={conv.userId}
                className={`conversation-item ${conv.userId === otherUserId ? 'active' : ''}`}
                onClick={() => openConversation(conv.userId)}
              >
                <div className="conv-avatar">{conv.user?.avatar || '👤'}</div>
                <div className="conv-info">
                  <div className="conv-name">{conv.user?.username}</div>
                  <div className="conv-last">
                    {conv.lastMessage?.text?.substring(0, 30)}...
                  </div>
                </div>
                {conv.unreadCount > 0 && (
                  <div className="conv-unread">{conv.unreadCount}</div>
                )}
              </div>
            ))
          )}
        </div>

        {/* CHAT PANEL */}
        {otherUserId ? (
          <div className="chat-messages-container card">
            <div className="chat-header-dm">
              <div className="chat-header-info">
                <span className="dm-avatar">{otherUser?.avatar || '👤'}</span>
                <h2>{otherUser?.username || '...'}</h2>
              </div>
            </div>
            <div className="chat-messages">
              {loading ? (
                <div className="loading-container"><div className="loading-spinner" /></div>
              ) : messages.length === 0 ? (
                <div className="no-messages">
                  <span className="empty-icon">💬</span>
                  <p>{language === 'en' ? 'No messages. Send the first one!' : 'Nema poruka. Pošalji prvu!'}</p>
                </div>
              ) : (
                messages.map(renderMessage)
              )}
              {typingUsers.length > 0 && (
                <div className="typing-indicator">
                  <div className="typing-dots"><span /><span /><span /></div>
                  <span className="typing-text">{language === 'en' ? 'typing...' : 'piše...'}</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
            <form className="chat-input-container" onSubmit={handleSendMessage}>
              <input
                type="text"
                className="chat-input"
                value={newMessage}
                onChange={(e) => { setNewMessage(e.target.value); handleTyping(); }}
                placeholder="Napiši poruku..."
                autoComplete="off"
              />
              <button type="submit" className="btn-send" disabled={!newMessage.trim()}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              </button>
            </form>
          </div>
        ) : (
          <div className="dm-empty card">
            <span>💬</span>
            <h3>{t('dm.selectConversation') || 'Odaberi konverzaciju'}</h3>
            <p>{language === 'en' ? 'Or search for a user above and send them a message' : 'Ili pretraži korisnika gore pa mu pošalji poruku'}</p>
          </div>
        )}
      </div>

      {/* MOBILE */}
      <div className="dm-mobile">
        {mobileChatOpen && otherUserId ? (
          <div className="chat-messages-container card">
            <div className="chat-header-dm">
              <button
                className="dm-back-btn"
                onClick={() => { setMobileChatOpen(false); navigate('/messages'); }}
              >←</button>
              <div className="chat-header-info">
                <span className="dm-avatar">{otherUser?.avatar || '👤'}</span>
                <h2>{otherUser?.username || '...'}</h2>
              </div>
            </div>
            <div className="chat-messages">
              {loading ? (
                <div className="loading-container"><div className="loading-spinner" /></div>
              ) : messages.length === 0 ? (
                <div className="no-messages">
                  <span className="empty-icon">💬</span>
                  <p>{language === 'en' ? 'No messages. Send the first one!' : 'Nema poruka. Pošalji prvu!'}</p>

                </div>
              ) : (
                messages.map(renderMessage)
              )}
              {typingUsers.length > 0 && (
                <div className="typing-indicator">
                  <div className="typing-dots"><span /><span /><span /></div>
                  <span className="typing-text">piše...</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
            <form className="chat-input-container" onSubmit={handleSendMessage}>
              <input
                type="text"
                className="chat-input"
                value={newMessage}
                onChange={(e) => { setNewMessage(e.target.value); handleTyping(); }}
                placeholder={language === 'en' ? 'Write a message...' : 'Napiši poruku...'}
                autoComplete="off"
              />
              <button type="submit" className="btn-send" disabled={!newMessage.trim()}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              </button>
            </form>
          </div>
        ) : (
          <div className="dm-sidebar card">
            <h3>💬 {t('dm.title') || 'Poruke'}</h3>
            <div className="dm-search-box">
              <input
                type="text"
                placeholder={language === 'en' ? 'Write a message...' : 'Napiši poruku...'}
                value={searchQuery}
                onChange={(e) => handleSearchUsers(e.target.value)}
              />
            </div>
            {searchResults.length > 0 && (
              <div className="dm-search-results">
                {searchResults.map(user => (
                  <div key={user.id} className="search-result-item"
                    onClick={() => openConversation(user.id)}>
                    <div className="conv-avatar">{user.avatar || '👤'}</div>
                    <div className="conv-name">{user.username}</div>
                  </div>
                ))}
              </div>
            )}
            {conversations.length === 0 ? (
              <div className="no-conversations">
                <span>📭</span>
                <p>{t('dm.noConversations') || 'Nema konverzacija'}</p>
              </div>
            ) : (
              conversations.map(conv => (
                <div
                  key={conv.userId}
                  className={`conversation-item ${conv.userId === otherUserId ? 'active' : ''}`}
                  onClick={() => openConversation(conv.userId)}
                >
                  <div className="conv-avatar">{conv.user?.avatar || '👤'}</div>
                  <div className="conv-info">
                    <div className="conv-name">{conv.user?.username}</div>
                    <div className="conv-last">
                      {conv.lastMessage?.text?.substring(0, 30)}...
                    </div>
                  </div>
                  {conv.unreadCount > 0 && (
                    <div className="conv-unread">{conv.unreadCount}</div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

export default DirectMessages;