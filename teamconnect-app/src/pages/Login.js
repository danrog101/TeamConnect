import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import { useLanguage } from '../i18n/LanguageContext';
import Toast from '../components/Toast';
import './Auth.css';
import { useLanguage } from '../i18n/LanguageContext'; 

function Login() {
  const navigate = useNavigate();
  
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
        <h2>Dobrodošao/la natrag!</h2>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Tvoj email"
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
              placeholder="Tvoja lozinka"
              required
            />
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Prijavljivanje...' : 'Prijavi se'}
          </button>
        </form>

        <p className="auth-link">
          <a href="/forgot-password">Zaboravili ste lozinku?</a>
        </p>

        <p className="auth-link">
          Nemaš račun? <a href="/">Registriraj se</a>
        </p>

        <div className="support-info" style={{ marginTop: '20px', padding: '15px', background: '#f8fafc', borderRadius: '10px', textAlign: 'center' }}>
          <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>
            Podrška: <a href="mailto:teamconnect0102@gmail.com" style={{ color: '#4f46e5' }}>teamconnect0102@gmail.com</a>
          </p>
        </div>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

export default Login;