import React, { useState } from 'react';
import './SportRatingModal.css';
import { useLanguage } from '../i18n/LanguageContext';

function SportRatingModal({ sport, onSubmit, onCancel, existingRating = null }) {
  const { t } = useLanguage();
  const [rating, setRating] = useState(existingRating || 3);
  const [submitting, setSubmitting] = useState(false);

  const sportIcons = {
    'Nogomet': '⚽', 'Košarka': '🏀', 'Odbojka': '🏐', 'Tenis': '🎾',
    'Rukomet': '🤾', 'Stolni tenis': '🏓', 'Badminton': '🏸',
    'Plivanje': '🏊', 'Trčanje': '🏃', 'Biciklizam': '🚴'
  };

  const getLevelLabel = (level) => {
    const keys = { 1: 'rating.amateur', 2: 'rating.beginner', 3: 'rating.intermediate', 4: 'rating.advanced', 5: 'rating.pro' };
    return t(keys[level]);
  };

  const getLevelDesc = (level) => {
    const keys = { 1: 'rating.amateurDesc', 2: 'rating.beginnerDesc', 3: 'rating.intermediateDesc', 4: 'rating.advancedDesc', 5: 'rating.proDesc' };
    return t(keys[level]);
  };

  const getLevelColor = (level) => {
    const colors = { 1: '#9ca3af', 2: '#f59e0b', 3: '#3b82f6', 4: '#8b5cf6', 5: '#e91e63' };
    return colors[level];
  };

  const getLevelIcon = (level) => {
    const icons = { 1: '🌱', 2: '⭐', 3: '⭐⭐', 4: '🔥', 5: '👑' };
    return icons[level];
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await onSubmit({
        sport,
        overallRating: rating * 20, // Convert 1-5 to 0-100 for backend
        skillLevel: rating
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="sport-rating-overlay" onClick={onCancel}>
      <div className="sport-rating-modal" onClick={(e) => e.stopPropagation()}>
        <div className="sport-rating-header">
          <span className="sport-icon">{sportIcons[sport] || '🏅'}</span>
          <h2>{t('rating.rateYourself')} — {sport}</h2>
          <p>{t('rating.rateBeforeOthers')}</p>
        </div>

        <div className="sport-rating-simple">
          <div className="skill-level-options">
            {[1, 2, 3, 4, 5].map((level) => (
              <button
                key={level}
                className={`skill-level-btn ${rating === level ? 'selected' : ''}`}
                onClick={() => setRating(level)}
                style={{
                  '--level-color': getLevelColor(level),
                  borderColor: rating === level ? getLevelColor(level) : undefined,
                  background: rating === level ? getLevelColor(level) : undefined,
                  color: rating === level ? '#fff' : undefined
                }}
              >
                <span className="level-icon">{getLevelIcon(level)}</span>
                <span className="level-number">{level}</span>
                <span className="level-label">{getLevelLabel(level)}</span>
              </button>
            ))}
          </div>

          <div className="selected-level-description">
            <p>{getLevelDesc(rating)}</p>
          </div>
        </div>

        <div className="sport-rating-actions">
          <button
            className="btn btn-secondary"
            onClick={onCancel}
            disabled={submitting}
          >
            {t('common.cancel')}
          </button>
          <button
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? t('common.saving') : ('✅ ' + t('rating.saveRating'))}
          </button>
        </div>
      </div>
    </div>
  );
}

export default SportRatingModal;
