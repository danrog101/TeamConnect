import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Toast from '../components/Toast';
import { API_URL } from '../config';
import './RatingSystem.css';
import { useLanguage } from '../i18n/LanguageContext';

function RatingSystem() {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const [activeTab, setActiveTab] = useState('my-rating');
  const [toast, setToast] = useState(null);
  const [hasSelfRated, setHasSelfRated] = useState(false);
  const [selfRating, setSelfRating] = useState(3);
  const [submittingSelfRating, setSubmittingSelfRating] = useState(false);
  const [myRating, setMyRating] = useState(null);
  const [loadingRating, setLoadingRating] = useState(true);

  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    checkSelfRatingStatus();
    loadMyRating();
  }, []);

  const checkSelfRatingStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      const response = await fetch(`${API_URL}/ratings/self-rating/status`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setHasSelfRated(data.hasSelfRated);
        if (data.skillLevel) setSelfRating(data.skillLevel);
      }
    } catch (error) {
      console.error('Check self-rating status error:', error);
    }
  };

  const loadMyRating = async () => {
    try {
      setLoadingRating(true);
      const token = localStorage.getItem('token');
      const userId = currentUser.id;
      if (!userId) return;
      const response = await fetch(`${API_URL}/ratings/user/${userId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setMyRating(data);
      }
    } catch (error) {
      console.error('Load my rating error:', error);
    } finally {
      setLoadingRating(false);
    }
  };

  const handleSubmitSelfRating = async () => {
    try {
      setSubmittingSelfRating(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/ratings/self-rating`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ skillLevel: selfRating })
      });
      const data = await response.json();
      if (response.ok) {
        setToast({ message: '✅ ' + t('rating.savedSuccess'), type: 'success' });
        setHasSelfRated(true);
        loadMyRating();
        setActiveTab('my-rating');
      } else {
        setToast({ message: data.message || t('rating.sportRatingError'), type: 'error' });
      }
    } catch (error) {
      setToast({ message: t('rating.sportRatingError'), type: 'error' });
    } finally {
      setSubmittingSelfRating(false);
    }
  };

  const getLevelLabel = (level) => {
    const map = { 1: t('rating.amateur'), 2: t('rating.beginner'), 3: t('rating.intermediate'), 4: t('rating.advanced'), 5: t('rating.pro') };
    return map[level] || '-';
  };

  const getLevelIcon = (level) => {
    const map = { 1: '🌱', 2: '⭐', 3: '⭐⭐', 4: '🔥', 5: '👑' };
    return map[level] || '❓';
  };

  const getLevelColor = (level) => {
    const map = { 1: '#9ca3af', 2: '#f59e0b', 3: '#3b82f6', 4: '#8b5cf6', 5: '#e91e63' };
    return map[level] || '#9ca3af';
  };

  if (loadingRating) {
    return (
      <div className="rating-system-page">
        <Navbar />
        <div className="loading">{t('rating.loadingRatings')}</div>
      </div>
    );
  }

  return (
    <div className="rating-system-page">
      <Navbar />

      <div className="rating-container">
        <div className="rating-header">
          <h1>⭐ {t('rating.title')}</h1>
          <p>{t('rating.subtitle') || 'Tvoja ocjena i razina vještine'}</p>
        </div>

        <div className="rating-tabs">
          <button
            className={`tab ${activeTab === 'my-rating' ? 'active' : ''}`}
            onClick={() => setActiveTab('my-rating')}
          >
            🏅 {t('rating.myRating') || 'Moja ocjena'}
          </button>
          <button
            className={`tab ${activeTab === 'self-rating' ? 'active' : ''}`}
            onClick={() => setActiveTab('self-rating')}
          >
            ⭐ {hasSelfRated ? t('rating.yourRating') : t('rating.rateYourself')}
          </button>
        </div>

        {activeTab === 'my-rating' && (
          <div className="my-rating-section">
            {myRating && myRating.skill_level_numeric ? (
              <div className="self-rating-card card">
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
                  <div style={{ fontSize: '3rem' }}>{currentUser.avatar || '👤'}</div>
                  <div>
                    <h2 style={{ margin: 0 }}>{currentUser.username}</h2>
                    {myRating.location && <p style={{ margin: 0, color: 'var(--text-secondary)' }}>📍 {myRating.location}</p>}
                  </div>
                </div>

                <div style={{
                  display: 'flex', alignItems: 'center', gap: '16px',
                  padding: '20px', borderRadius: '12px', marginBottom: '20px',
                  border: `2px solid ${getLevelColor(myRating.skill_level_numeric)}`,
                  background: 'var(--bg-tertiary)'
                }}>
                  <span style={{ fontSize: '2.5rem' }}>{getLevelIcon(myRating.skill_level_numeric)}</span>
                  <div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                      {t('rating.yourLevel') || 'Tvoja razina'}
                    </div>
                    <div style={{ fontSize: '1.4rem', fontWeight: 800, color: getLevelColor(myRating.skill_level_numeric) }}>
                      {myRating.skill_level_numeric}/5 — {getLevelLabel(myRating.skill_level_numeric)}
                    </div>
                  </div>
                </div>

                {myRating.sport && (
                  <div style={{ marginBottom: '20px', color: 'var(--text-secondary)' }}>
                    🏅 {t('teams.sport') || 'Sport'}: <strong>{myRating.sport}</strong>
                  </div>
                )}

                <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>
                  {t('rating.rateFromProfile') || 'Suigrače možeš ocjeniti s njihovog profila nakon zajedničke utakmice.'}
                </p>

                <button className="btn btn-secondary" onClick={() => setActiveTab('self-rating')}>
                  ✏️ {t('rating.updateRating') || 'Ažuriraj svoju ocjenu'}
                </button>
              </div>
            ) : (
              <div className="self-rating-card card" style={{ textAlign: 'center' }}>
                <span style={{ fontSize: '4rem', display: 'block', marginBottom: '16px' }}>⭐</span>
                <h2>{t('rating.notRatedYet') || 'Još nisi ocijenjen/a'}</h2>
                <p>{t('rating.rateBeforeOthers')}</p>
                <button className="btn btn-primary" onClick={() => setActiveTab('self-rating')}>
                  ⭐ {t('rating.rateYourself')}
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'self-rating' && (
          <div className="self-rating-section">
            <div className="self-rating-card card">
              <h2>{hasSelfRated ? '✅ ' + t('rating.yourRating') : '⭐ ' + t('rating.rateYourself')}</h2>
              <p className="self-rating-description">
                {hasSelfRated ? t('rating.alreadyRatedDesc') : t('rating.rateBeforeOthers')}
              </p>

              <div className="self-rating-form">
                <div className="simple-rating-group">
                  <label className="simple-rating-label">{t('rating.whatLevel')}</label>

                  <div className="skill-level-options">
                    {[1, 2, 3, 4, 5].map((level) => (
                      <button
                        key={level}
                        className={`skill-level-btn ${selfRating === level ? 'selected' : ''}`}
                        onClick={() => setSelfRating(level)}
                        style={selfRating === level ? {
                          background: getLevelColor(level),
                          borderColor: getLevelColor(level),
                          color: '#fff'
                        } : {}}
                      >
                        <span className="level-number">{level}</span>
                        <span className="level-label">{getLevelLabel(level)}</span>
                        <span className="level-icon">{getLevelIcon(level)}</span>
                      </button>
                    ))}
                  </div>

                  <div className="skill-level-description">
                    {selfRating === 1 && <p>{t('rating.amateurDesc')}</p>}
                    {selfRating === 2 && <p>{t('rating.beginnerDesc')}</p>}
                    {selfRating === 3 && <p>{t('rating.intermediateDesc')}</p>}
                    {selfRating === 4 && <p>{t('rating.advancedDesc')}</p>}
                    {selfRating === 5 && <p>{t('rating.proDesc')}</p>}
                  </div>
                </div>

                <button
                  className="btn btn-primary btn-large"
                  onClick={handleSubmitSelfRating}
                  disabled={submittingSelfRating}
                >
                  {submittingSelfRating ? t('common.saving') : '✅ ' + t('rating.saveRating')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

export default RatingSystem;