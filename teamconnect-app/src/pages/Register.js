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
      setError('Lozinke se ne podudaraju!');
      return;
    }

    if (formData.password.length < 6) {
      setError('Lozinka mora imati minimalno 6 znakova!');
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
      if (response.data.accessToken) {
        localStorage.clear(); // Očisti stare podatke
        localStorage.setItem('token', response.data.accessToken);
        localStorage.setItem('refreshToken', response.data.refreshToken);
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }

      setToast({ message: 'Registracija uspješna! Dobrodošao/la!', type: 'success' });
      
      // ✅ Idi odmah na dashboard umjesto na verification stranicu
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 1500);
      
    } catch (err) {
      console.error('Register error:', err);
      setError(err.response?.data?.message || 'Greška pri registraciji');
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
          Dobrodošli u TeamConnect!
        </h2>
        <p style={{ fontSize: '0.95rem', lineHeight: '1.6', color: 'var(--text-secondary, #666)', marginBottom: '16px' }}>
          TeamConnect je aplikacija koja povezuje sportaše i rekreativce po lokaciji i sportu.
          Pronađi suigrače, pridruži se timovima ili organiziraj vlastite sportske događaje.
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', flexWrap: 'wrap', fontSize: '0.9rem', color: 'var(--text-secondary, #666)' }}>
          <span>1. Registriraj se</span>
          <span>→</span>
          <span>2. Odaberi sport</span>
          <span>→</span>
          <span>3. Pronađi tim</span>
        </div>
      </div>
      <div className="auth-card card">
        <h1 className="auth-title">🏀 TeamConnect</h1>
        <h2>Kreiraj račun</h2>
        
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Korisničko ime</label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="Odaberi svoje korisničko ime"
              required
              minLength={3}
            />
          </div>

          <div className="form-group">
            <label>Email</label>
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
            <label>Lozinka</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Minimalno 6 znakova"
              required
              minLength={6}
            />
          </div>

          <div className="form-group">
            <label>Potvrdi lozinku</label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Ponovno upiši lozinku"
              required
            />
          </div>

          <div className="form-group">
            <label>Spol</label>
            <select
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              required
            >
              <option value="">-- Odaberi spol --</option>
              {genderOptions.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Sigurnosno pitanje</label>
            <select
              name="securityQuestion"
              value={formData.securityQuestion}
              onChange={handleChange}
              required
            >
              <option value="">-- Odaberi sigurnosno pitanje --</option>
              <option value="pet">Kako se zove vaš prvi ljubimac?</option>
              <option value="city">U kojem ste gradu rođeni?</option>
              <option value="school">Kako se zvala vaša osnovna škola?</option>
              <option value="team">Koji je vaš omiljeni sportski tim?</option>
              <option value="food">Koja je vaša omiljena hrana?</option>
            </select>
          </div>

          <div className="form-group">
            <label>Odgovor na sigurnosno pitanje</label>
            <input
              type="text"
              name="securityAnswer"
              value={formData.securityAnswer}
              onChange={handleChange}
              placeholder="Vaš odgovor..."
              required
            />
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Registracija...' : 'Registriraj se'}
          </button>
        </form>

        <p className="auth-link">
          Već imaš račun? <a href="/login">Prijavi se</a>
        </p>

        <div className="support-info">
          <p>
            Podrška: <a href="mailto:teamconnect0102@gmail.com">teamconnect0102@gmail.com</a>
          </p>
        </div>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

export default Register;