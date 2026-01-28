import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import NotificationBell from './NotificationBell';
import LanguageSelector from './LanguageSelector';
import './Navbar.css';

const ADMIN_EMAIL = 'teamconnect0102@gmail.com';

function Navbar() {
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useTheme();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [showMenu, setShowMenu] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const isAdmin = user.email === ADMIN_EMAIL;

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('refreshToken');
    navigate('/login');
  };

  const confirmLogout = () => {
    setShowLogoutConfirm(true);
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-brand" onClick={() => navigate('/dashboard')}>
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="16" cy="16" r="14" fill="#667eea" stroke="#764ba2" strokeWidth="2"/>
            <path d="M12 10L20 16L12 22V10Z" fill="white"/>
          </svg>
          <span>TeamConnect</span>
        </div>

        <button 
          className="menu-toggle"
          onClick={() => setShowMenu(!showMenu)}
        >
          ☰
        </button>

        <div className={`navbar-menu ${showMenu ? 'show' : ''}`}>
          <button className="nav-link" onClick={() => { navigate('/dashboard'); setShowMenu(false); }}>
            🏠 Dashboard
          </button>
          
          <button className="nav-link" onClick={() => { navigate('/my-teams'); setShowMenu(false); }}>
            👥 Moji timovi
          </button>
          
          <button className="nav-link" onClick={() => { navigate('/tournaments'); setShowMenu(false); }}>
            🏆 Turniri
          </button>
          
          <button className="nav-link" onClick={() => { navigate('/ratings'); setShowMenu(false); }}>
            ⭐ Ratings
          </button>
          
          <button className="nav-link" onClick={() => { navigate('/fields'); setShowMenu(false); }}>
            📍 Tereni
          </button>
          
          <button className="nav-link" onClick={() => { navigate('/friends'); setShowMenu(false); }}>
            👫 Prijatelji
          </button>
          
          <button className="nav-link" onClick={() => { navigate('/statistics'); setShowMenu(false); }}>
            📊 Statistika
          </button>
          
          <button className="nav-link" onClick={() => { navigate('/highlights'); setShowMenu(false); }}>
            📹 Highlights
          </button>
          
          <button className="nav-link" onClick={() => { navigate('/activity'); setShowMenu(false); }}>
            📰 Aktivnosti
          </button>

          {isAdmin && (
            <button className="nav-link admin-link" onClick={() => { navigate('/admin'); setShowMenu(false); }}>
              ⚙️ Admin
            </button>
          )}
        </div>

        <div className="navbar-user">
          <LanguageSelector />
          <button
            className="theme-toggle"
            onClick={toggleTheme}
            title={isDark ? 'Prebaci na svijetli način' : 'Prebaci na tamni način'}
          >
            {isDark ? '☀️' : '🌙'}
          </button>
          <NotificationBell />
          <button className="user-avatar" onClick={() => navigate('/profile')}>
            {user.avatar || '👤'}
          </button>
          <span className="user-name" onClick={() => navigate('/profile')}>
            {user.username}
          </span>
          <button className="btn-logout" onClick={confirmLogout}>
            Odjava
          </button>
        </div>
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="logout-modal-overlay" onClick={() => setShowLogoutConfirm(false)}>
          <div className="logout-modal" onClick={(e) => e.stopPropagation()}>
            <div className="logout-modal-icon">👋</div>
            <h3>Odjava</h3>
            <p>Jeste li sigurni da se želite odjaviti?</p>
            <div className="logout-modal-actions">
              <button
                className="btn btn-secondary"
                onClick={() => setShowLogoutConfirm(false)}
              >
                Odustani
              </button>
              <button
                className="btn btn-primary btn-logout-confirm"
                onClick={handleLogout}
              >
                Da, odjavi me
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}

export default Navbar;