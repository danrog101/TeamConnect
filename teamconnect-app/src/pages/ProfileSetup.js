import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Auth.css';
import { useLanguage } from '../i18n/LanguageContext';

function ProfileSetup() {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ sport: '', location: '' });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const user = JSON.parse(localStorage.getItem('user'));
    localStorage.setItem('user', JSON.stringify({ ...user, ...formData }));
    navigate('/dashboard');
  };

  const sportovi = [
    '⚽ Nogomet', '🏀 Košarka', '🏐 Odbojka', '🎾 Tenis',
    '🤾 Rukomet', '⚾ Baseball', '🏸 Badminton', '🏓 Stolni tenis'
  ];

  const gradovi = [
    'Zagreb', 'Split', 'Rijeka', 'Osijek', 'Zadar',
    'Pula', 'Slavonski Brod', 'Karlovac', 'Varaždin',
    'Šibenik', 'Sisak', 'Dubrovnik'
  ];

  return (
    <div className="auth-container">
      <div className="auth-card card">
        <h1 className="auth-title">⚙️</h1>
        <h2>{language === 'en' ? 'Set up your profile' : 'Postavi svoj profil'}</h2>
        <p style={{ textAlign: 'center', color: '#666', marginBottom: '30px' }}>
          {language === 'en'
            ? 'Choose a sport and location to find teams near you'
            : 'Odaberi sport i lokaciju kako bi pronašao/la timove'}
        </p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>{language === 'en' ? 'Which sport interests you?' : 'Koji sport te zanima?'}</label>
            <select name="sport" value={formData.sport} onChange={handleChange} required>
              <option value="">{language === 'en' ? '-- Select sport --' : '-- Odaberi sport --'}</option>
              {sportovi.map(sport => (
                <option key={sport} value={sport}>{sport}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>{language === 'en' ? 'Which city are you in?' : 'U kojem gradu si?'}</label>
            <select name="location" value={formData.location} onChange={handleChange} required>
              <option value="">{language === 'en' ? '-- Select city --' : '-- Odaberi grad --'}</option>
              {gradovi.map(grad => (
                <option key={grad} value={grad}>{grad}</option>
              ))}
            </select>
          </div>

          <button type="submit" className="btn btn-primary">
            {language === 'en' ? 'Continue to Dashboard' : 'Nastavi na Dashboard'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default ProfileSetup;