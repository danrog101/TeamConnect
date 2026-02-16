import React, { useState } from 'react';
import { getRatingCategories, getSkillLevelName } from '../data/sportRatings';
import './SportRatingModal.css';
import { useLanguage } from '../i18n/LanguageContext'; 
function SportRatingModal({ sport, onSubmit, onCancel, existingRatings = null }) {
   const { t } = useLanguage();
  const sportConfig = getRatingCategories(sport);

  // Initialize ratings - either from existing (convert from 0-100 to 1-5) or default to 3
  const initialRatings = {};
  sportConfig.categories.forEach(cat => {
    if (existingRatings?.[cat.id]) {
      // Convert 0-100 to 1-5 scale
      initialRatings[cat.id] = Math.round(existingRatings[cat.id] / 20) || 3;
    } else {
      initialRatings[cat.id] = 3; // Default to middle value
    }
  });

  const [ratings, setRatings] = useState(initialRatings);
  const [submitting, setSubmitting] = useState(false);

  const handleRatingChange = (categoryId, value) => {
    setRatings(prev => ({
      ...prev,
      [categoryId]: value
    }));
  };

  // Calculate overall rating (1-5 scale)
  const calculateOverall = () => {
    const values = Object.values(ratings);
    if (values.length === 0) return 3;
    const sum = values.reduce((a, b) => a + b, 0);
    return Math.round(sum / values.length);
  };

  const overallRating = calculateOverall();
  const skillLevelName = getSkillLevelName(overallRating);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      // Convert 1-5 ratings to 0-100 for backend compatibility
      const scaledRatings = {};
      Object.keys(ratings).forEach(key => {
        scaledRatings[key] = ratings[key] * 20;
      });

      await onSubmit({
        sport,
        ratings: scaledRatings,
        overallRating: overallRating * 20,
        skillLevel: overallRating
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getLevelLabel = (level) => {
    const labels = {
      1: 'Amater',
      2: 'Početnik',
      3: 'Srednji',
      4: 'Napredan',
      5: 'Pro'
    };
    return labels[level];
  };

  const getLevelColor = (level) => {
    const colors = {
      1: '#9ca3af',
      2: '#f59e0b',
      3: '#22c55e',
      4: '#3b82f6',
      5: '#8b5cf6'
    };
    return colors[level];
  };

  return (
    <div className="sport-rating-overlay" onClick={onCancel}>
      <div className="sport-rating-modal" onClick={(e) => e.stopPropagation()}>
        <div className="sport-rating-header">
          <span className="sport-icon">{sportConfig.icon}</span>
          <h2>Ocijeni svoje vještine - {sport}</h2>
          <p>Budi iskren - to pomaže u stvaranju uravnoteženih timova!</p>
        </div>

        <div className="sport-rating-categories">
          {sportConfig.categories.map(category => (
            <div key={category.id} className="rating-category">
              <div className="category-header">
                <span className="category-icon">{category.icon}</span>
                <div className="category-info">
                  <span className="category-name">{category.name}</span>
                  <span className="category-description">{category.description}</span>
                </div>
              </div>

              <div className="category-rating-buttons">
                {[1, 2, 3, 4, 5].map((level) => (
                  <button
                    key={level}
                    className={`rating-level-btn ${ratings[category.id] === level ? 'selected' : ''}`}
                    onClick={() => handleRatingChange(category.id, level)}
                    style={{
                      '--level-color': getLevelColor(level),
                      borderColor: ratings[category.id] === level ? getLevelColor(level) : undefined,
                      background: ratings[category.id] === level ? getLevelColor(level) : undefined
                    }}
                  >
                    <span className="level-num">{level}</span>
                  </button>
                ))}
              </div>
              <div className="rating-level-labels">
                <span>Amater</span>
                <span>Pro</span>
              </div>
            </div>
          ))}
        </div>

        <div className="sport-rating-summary">
          <div className="overall-rating">
            <span className="overall-label">Ukupna ocjena:</span>
            <div className="overall-stars">
              {[1, 2, 3, 4, 5].map((star) => (
                <span
                  key={star}
                  className={`star ${star <= overallRating ? 'filled' : ''}`}
                  style={{ color: star <= overallRating ? getLevelColor(overallRating) : '#ddd' }}
                >
                  ★
                </span>
              ))}
            </div>
          </div>
          <div className="skill-level">
            <span className="level-label">Razina vještine:</span>
            <span className="level-badge" style={{ background: getLevelColor(overallRating) }}>
              {skillLevelName}
            </span>
          </div>
        </div>

        <div className="sport-rating-actions">
          <button
            className="btn btn-secondary"
            onClick={onCancel}
            disabled={submitting}
          >
            Odustani
          </button>
          <button
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? 'Spremanje...' : 'Spremi ocjenu'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default SportRatingModal;
