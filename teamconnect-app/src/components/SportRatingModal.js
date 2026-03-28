import React, { useState } from 'react';
import './SportRatingModal.css';
import { useLanguage } from '../i18n/LanguageContext';

const SPORTS = [
  { name: 'Nogomet', icon: '⚽' },
  { name: 'Košarka', icon: '🏀' },
  { name: 'Odbojka', icon: '🏐' },
  { name: 'Tenis', icon: '🎾' },
  { name: 'Rukomet', icon: '🤾' },
  { name: 'Stolni tenis', icon: '🏓' },
  { name: 'Badminton', icon: '🏸' },
  { name: 'Plivanje', icon: '🏊' },
  { name: 'Atletika', icon: '🏃' },
  { name: 'Boks', icon: '🥊' },
  { name: 'Džudo', icon: '🥋' },
  { name: 'Yoga', icon: '🧘' },
  { name: 'CrossFit', icon: '💪' },
  { name: 'Fitness', icon: '🏋️' },
];

function SportRatingModal({ sport: defaultSport, onSubmit, onCancel, existingRating = null, isRatingOther = false }) {
  const { t } = useLanguage();
  const [selectedSport, setSelectedSport] = useState(defaultSport || null);
  const [rating, setRating] = useState(existingRating || 3);
  const [submitting, setSubmitting] = useState(false);

  const getLevelLabel = (level) => {
    const map = { 1: 'Amater', 2: 'Početnik', 3: 'Srednji', 4: 'Napredni', 5: 'Pro' };
    return map[level] || '-';
  };

  const getLevelDesc = (level) => {
    const map = {
      1: 'Igra rekreativno, nema posebnog iskustva.',
      2: 'Zna osnove, igra povremeno.',
      3: 'Ima iskustva, igra redovito.',
      4: 'Igra na visokoj razini, ima natjecateljskog iskustva.',
      5: 'Profesionalni ili polu-profesionalni igrač.'
    };
    return map[level] || '';
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
    if (!selectedSport) return;
    setSubmitting(true);
    try {
      await onSubmit({
        sport: selectedSport,
        overallRating: rating * 20,
        skillLevel: rating
      });
    } finally {
      setSubmitting(false);
    }
  };

  const selectedSportIcon = SPORTS.find(s => s.name === selectedSport)?.icon || '🏅';

  return (
    <div className="sport-rating-overlay" onClick={onCancel}>
      <div className="sport-rating-modal" onClick={(e) => e.stopPropagation()}>
        
        <div className="sport-rating-header">
          <span className="sport-icon">{selectedSport ? selectedSportIcon : '⭐'}</span>
          <h2>{isRatingOther ? '⭐ Ocijeni igrača' : '⭐ Ocijeni se'}</h2>
          <p>{isRatingOther ? 'Odaberi sport i ocijeni ovog igrača' : 'Odaberi sport i ocijeni svoje vještine'}</p>
        </div>

        <div className="sport-rating-simple">

          {/* Odabir sporta */}
          {!selectedSport ? (
            <div style={{ marginBottom: '8px' }}>
              <p style={{ fontWeight: 700, marginBottom: '12px', color: 'var(--text-primary)', fontSize: '0.95rem' }}>
                Odaberi sport:
              </p>
              <div className="sport-select-grid">
                {SPORTS.map(sport => (
                  <button
                    key={sport.name}
                    className="sport-select-btn"
                    onClick={() => setSelectedSport(sport.name)}
                  >
                    <span style={{ fontSize: '1.4rem' }}>{sport.icon}</span>
                    <span style={{ fontSize: '0.78rem', fontWeight: 600 }}>{sport.name}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <span style={{ fontSize: '1.5rem' }}>{selectedSportIcon}</span>
                <strong style={{ color: 'var(--text-primary)' }}>{selectedSport}</strong>
                <button
                  onClick={() => setSelectedSport(null)}
                  style={{
                    marginLeft: 'auto', background: 'none', border: '1px solid var(--border-primary)',
                    borderRadius: '8px', padding: '4px 10px', cursor: 'pointer',
                    fontSize: '0.8rem', color: 'var(--text-secondary)'
                  }}
                >
                  Promijeni
                </button>
              </div>

              <div className="skill-level-options">
                {[1, 2, 3, 4, 5].map((level) => (
                  <button
                    key={level}
                    className={`skill-level-btn ${rating === level ? 'selected' : ''}`}
                    onClick={() => setRating(level)}
                    style={{
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
            </>
          )}
        </div>

        <div className="sport-rating-actions">
          <button className="btn btn-secondary" onClick={onCancel} disabled={submitting}>
            Odustani
          </button>
          <button
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={submitting || !selectedSport}
          >
            {submitting ? 'Spremanje...' : '✅ Spremi ocjenu'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default SportRatingModal;