import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import { useLanguage } from '../i18n/LanguageContext';
import Toast from '../components/Toast';
import './Auth.css';

function Login() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    console.log('🔐 Attempting login with:', formData.email);

    try {
      const response = await authAPI.login(formData);

      console.log('✅ Login response:', response.data);

      // ✅ Check if we got tokens
      if (!response.data.accessToken) {
        throw new Error('No access token received from server');
      }

      // ✅ Clear old data first
      localStorage.clear();

      // ✅ Save new tokens and user data
      localStorage.setItem('token', response.data.accessToken);
      localStorage.setItem('refreshToken', response.data.refreshToken);
      localStorage.setItem('user', JSON.stringify(response.data.user));

      console.log('💾 Tokens saved to localStorage');
      console.log('👤 User:', response.data.user.username);

      // ✅ Verify tokens were saved
      const savedToken = localStorage.getItem('token');
      if (!savedToken) {
        throw new Error('Failed to save token to localStorage');
      }

      console.log('✅ Token verified in localStorage');

      // ✅ IZMJENA - Koristi navigate umjesto window.location
      // Dodaj delay da se osigura da je token spremljen
      setTimeout(() => {
        navigate('/dashboard', { replace: true });
      }, 100);

    } catch (err) {
      console.error('❌ Login error:', err);

      const errorMessage = err.response?.data?.message || err.message || 'Greška pri prijavi';
      setError(errorMessage);
      setToast({ message: errorMessage, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card card">
        <h1 className="auth-title">🏀 TeamConnect</h1>
        <h2>{t('auth.welcomeBack')}</h2>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>{t('auth.email')}</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder={t('auth.yourEmail')}
              required
            />
          </div>

          <div className="form-group">
            <label>Lozinka</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder={t('auth.yourPassword')}
              required
            />
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? t('auth.loggingIn') : t('auth.loginBtn')}
          </button>
        </form>

        <p className="auth-link">
          <a href="/forgot-password">{t('forgotPw.title')}</a>
        </p>

        <p className="auth-link">
          {t('auth.noAccount')} <a href="/register">{t('auth.registerBtn')}</a>
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

export default Login;