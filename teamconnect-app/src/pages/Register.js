import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import { useLanguage } from '../i18n/LanguageContext';
import Toast from '../components/Toast';
import './Auth.css';
 
function Register() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    gender: '',
    securityQuestion: '',
    securityAnswer: ''
  });

  const genderOptions = [
    { value: 'male', label: t('auth.male') },
    { value: 'female', label: t('auth.female') }
  ];
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError(t('auth.passwordMismatch'));
      return;
    }

    if (formData.password.length < 6) {
      setError(t('auth.passwordTooShort'));
      return;
    }

    setLoading(true);

    try {
      const response = await authAPI.register({
        username: formData.username,
        email: formData.email,
        password: formData.password,
        gender: formData.gender,
        security_question: formData.securityQuestion,
        security_answer: formData.securityAnswer
      });

      // ✅ Backend sada vraća tokens odmah - spremi ih i logiraj korisnika
      if (response.data.userId) {
  localStorage.setItem('tempUserId', response.data.userId);
}

setToast({ message: t('auth.registerSuccess'), type: 'success' });

setTimeout(() => {
  window.location.href = '/verify-email';
}, 1500);
      
    } catch (err) {
      console.error('Register error:', err);
      setError(err.response?.data?.message || t('auth.registerError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-info" style={{
        maxWidth: '500px',
        width: '100%',
        marginBottom: '20px',
        padding: '24px',
        background: 'rgba(255,255,255,0.1)',
        borderRadius: '16px',
        textAlign: 'center',
        backdropFilter: 'blur(10px)'
      }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '12px', color: 'var(--text-primary, #333)' }}>
          {t('auth.welcomeTitle')}
        </h2>
        <p style={{ fontSize: '0.95rem', lineHeight: '1.6', color: 'var(--text-secondary, #666)', marginBottom: '16px' }}>
          {t('auth.welcomeDesc')}
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', flexWrap: 'wrap', fontSize: '0.9rem', color: 'var(--text-secondary, #666)' }}>
          <span>{t('auth.step1')}</span>
          <span>→</span>
          <span>{t('auth.step2')}</span>
          <span>→</span>
          <span>{t('auth.step3')}</span>
        </div>
      </div>
      <div className="auth-card card">
        <h1 className="auth-title">🏀 TeamConnects</h1>
        <h2>{t('auth.createAccount')}</h2>
        
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>{t('auth.username')}</label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder={t('auth.chooseUsername')}
              required
              minLength={3}
            />
          </div>

          <div className="form-group">
            <label>{t('auth.email')}</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="tvoj@email.com"
              required
            />
          </div>

          <div className="form-group">
            <label>{t('auth.password')}</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder={t('auth.minChars', { n: 6 })}
              required
              minLength={6}
            />
          </div>

          <div className="form-group">
            <label>{t('auth.confirmPassword')}</label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder={t('auth.reenterPassword')}
              required
            />
          </div>

          <div className="form-group">
            <label>{t('auth.gender')}</label>
            <select
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              required
            >
              <option value="">{t('auth.selectGender')}</option>
              {genderOptions.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>{t('auth.securityQuestion')}</label>
            <select
              name="securityQuestion"
              value={formData.securityQuestion}
              onChange={handleChange}
              required
            >
              <option value="">{t('auth.selectSecurityQuestion')}</option>
              <option value="pet">{t('auth.securityQuestions.pet')}</option>
              <option value="city">{t('auth.securityQuestions.city')}</option>
              <option value="school">{t('auth.securityQuestions.school')}</option>
              <option value="team">{t('auth.securityQuestions.team')}</option>
              <option value="food">{t('auth.securityQuestions.food')}</option>
            </select>
          </div>

          <div className="form-group">
            <label>{t('auth.securityAnswer')}</label>
            <input
              type="text"
              name="securityAnswer"
              value={formData.securityAnswer}
              onChange={handleChange}
              placeholder={t('auth.yourAnswer')}
              required
            />
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? t('auth.registering') : t('auth.registerBtn')}
          </button>
        </form>

        <p className="auth-link">
          {t('auth.hasAccount')} <a href="/login">{t('auth.loginBtn')}</a>
        </p>

        <div className="support-info">
          <p>
            {t('common.support')}: <a href="mailto:teamconnect0102@gmail.com">teamconnect0102@gmail.com</a>
          </p>
        </div>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

export default Register;