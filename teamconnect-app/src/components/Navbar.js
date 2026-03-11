import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../i18n/LanguageContext';
import NotificationBell from './NotificationBell';
import LanguageSelector from './LanguageSelector';
import './Navbar.css';

const ADMIN_EMAIL = 'teamconnect0102@gmail.com';

function Navbar() {
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useTheme();
  const { t } = useLanguage();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [showMenu, setShowMenu] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const isAdmin = user.email === ADMIN_EMAIL;

  useEffect(() => {
    if (showMenu) {
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
    } else {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
    };
  }, [showMenu]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('refreshToken');
    navigate('/login');
  };

  const confirmLogout = () => {
    setShowLogoutConfirm(true);
  };

  const goTo = (path) => {
    setShowMenu(false);
    navigate(path);
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-brand" onClick={() => goTo('/dashboard')}>
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
            <circle cx="16" cy="16" r="14" fill="var(--color-primary)" stroke="var(--color-accent)" strokeWidth="2"/>
            <path d="M12 10L20 16L12 22V10Z" fill="white"/>
          </svg>
          <span>TeamConnect</span>
        </div>

        <button className="menu-toggle" onClick={() => setShowMenu(!showMenu)}>
          {showMenu ? '✕' : '☰'}
        </button>

        {/* Overlay za zatvaranje menija klikom izvan */}
        {showMenu && (
          <div className="menu-overlay" onClick={() => setShowMenu(false)} />
        )}

        <div className={`navbar-menu ${showMenu ? 'show' : ''}`}>
          <button className="nav-link" onClick={() => goTo('/dashboard')}>
            <span className="nav-icon">🏠</span>{t('nav.dashboard')}
          </button>
          <button className="nav-link" onClick={() => goTo('/my-teams')}>
            <span className="nav-icon">👥</span>{t('nav.myTeams')}
          </button>
          <button className="nav-link" onClick={() => goTo('/tournaments')}>
            <span className="nav-icon">🏆</span>{t('nav.tournaments')}
          </button>
          <button className="nav-link" onClick={() => goTo('/ratings')}>
            <span className="nav-icon">⭐</span>{t('nav.ratings')}
          </button>
          <button className="nav-link" onClick={() => goTo('/fields')}>
            <span className="nav-icon">🏟️</span>{t('nav.fields')}
          </button>
          <button className="nav-link" onClick={() => goTo('/friends')}>
            <span className="nav-icon">🤝</span>{t('nav.friends')}
          </button>
          <button className="nav-link" onClick={() => goTo('/statistics')}>
            <span className="nav-icon">📊</span>{t('nav.statistics')}
          </button>
          <button className="nav-link" onClick={() => goTo('/my-studio')}>
            <span className="nav-icon">💪</span>
           Moj Studio
          </button>
          <button className="nav-link" onClick={() => goTo('/highlights')}>
            <span className="nav-icon">🎬</span>{t('nav.highlights')}
          </button>
          {isAdmin && (
            <button className="nav-link" onClick={() => goTo('/activity')}>
              <span className="nav-icon">📰</span>{t('nav.activities')}
            </button>
          )}
          {isAdmin && (
            <button className="nav-link admin-link" onClick={() => goTo('/admin')}>
              <span className="nav-icon">⚙️</span>{t('nav.admin')}
            </button>
          )}

          {/* Mobile-only extras */}
          <div className="mobile-menu-extras">
            <div className="mobile-menu-divider" />
            <button className="nav-link" onClick={() => goTo('/notifications')}>
              <span className="nav-icon">🔔</span>Notifikacije
            </button>
            <button className="nav-link" onClick={() => goTo('/profile')}>
              <span className="nav-icon">👤</span>{t('nav.profile')}
            </button>
            <button className="nav-link" onClick={() => { toggleTheme(); }}>
              <span className="nav-icon">{isDark ? '☀️' : '🌙'}</span>
              {isDark ? t('nav.lightMode') : t('nav.darkMode')}
            </button>
            <button className="nav-link logout-link" onClick={() => { setShowMenu(false); confirmLogout(); }}>
              <span className="nav-icon">🚪</span>{t('nav.logout')}
            </button>
          </div>
        </div>

        <div className="navbar-user">
          <LanguageSelector />
          <button className="theme-toggle" onClick={toggleTheme} title={isDark ? t('nav.switchToLight') : t('nav.switchToDark')}>
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
            {t('nav.logout')}
          </button>
        </div>
      </div>

      {showLogoutConfirm && (
        <div className="logout-modal-overlay" onClick={() => setShowLogoutConfirm(false)}>
          <div className="logout-modal" onClick={(e) => e.stopPropagation()}>
            <h3>{t('nav.logout')}</h3>
            <p>{t('auth.logoutConfirm')}</p>
            <div className="logout-modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowLogoutConfirm(false)}>
                {t('common.cancel')}
              </button>
              <button className="btn btn-primary" onClick={handleLogout}>
                {t('common.yes')}
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}

export default Navbar;