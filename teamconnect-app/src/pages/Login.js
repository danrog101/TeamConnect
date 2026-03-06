import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import { useLanguage } from '../i18n/LanguageContext';
import Toast from '../components/Toast';
import './Auth.css';

function Login() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  
  const [formData, setFormData] = useState({ email: '', password: '' });
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

      if (!response.data.accessToken) {
        throw new Error('No access token received from server');
      }

      // Clear old localStorage
      localStorage.clear();

      // Save new tokens and user
      localStorage.setItem('token', response.data.accessToken);
      localStorage.setItem('refreshToken', response.data.refreshToken);
      localStorage.setItem('user', JSON.stringify(response.data.user));

      console.log('💾 Tokens saved to localStorage');
      console.log('👤 User:', response.data.user.username);

      // Navigate to dashboard
      navigate('/dashboard', { replace: true });

    } catch (err) {
      console.error('❌ Login error:', err);

      const errorMessage = err.response?.data?.message || err.message || 'Greška pri prijavi';

      // Handle unverified account
      if (err.response?.status === 401 && errorMessage.toLowerCase().includes('verificiran')) {
        setError('Vaš račun još nije verificiran. Provjerite email.');
        setToast({ message: 'Vaš račun nije verificiran. Provjerite email.', type: 'error' });
        return;
      }

      setError(errorMessage);
      setToast({ message: errorMessage, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    try {
      await authAPI.resendVerification({ email: formData.email });
      setToast({ message: 'Verifikacijski email poslan', type: 'success' });
    } catch (err) {
      setToast({ message: err.response?.data?.message || 'Greška pri slanju emaila', type: 'error' });
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

        {/* Resend verification button */}
        {error.includes('verificiran') && (
          <button
            className="btn btn-secondary resend-btn"
            onClick={handleResendVerification}
          >
            Pošalji ponovno verifikacijski email
          </button>
        )}

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