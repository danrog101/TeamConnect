import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import Toast from '../components/Toast';
import './Auth.css';

function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: email, 2: code, 3: new password
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  // Step 1: Request reset code
  const handleRequestCode = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authAPI.forgotPassword({ email });

      if (response.data.success) {
        setToast({ message: 'Kod je poslan na vaš email!', type: 'success' });
        setStep(2);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Greška pri slanju koda');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify reset code
  const handleVerifyCode = async (e) => {
    e.preventDefault();
    setError('');

    if (code.length !== 6) {
      setError('Kod mora imati 6 znamenki!');
      return;
    }

    setLoading(true);

    try {
      const response = await authAPI.verifyResetCode({ email, code });

      if (response.data.success) {
        setResetToken(response.data.resetToken);
        setToast({ message: 'Kod je ispravan!', type: 'success' });
        setStep(3);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Neispravan kod');
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Set new password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 6) {
      setError('Lozinka mora imati najmanje 6 znakova!');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Lozinke se ne podudaraju!');
      return;
    }

    setLoading(true);

    try {
      const response = await authAPI.resetPassword({ resetToken, newPassword });

      if (response.data.success) {
        setToast({ message: 'Lozinka je uspješno promijenjena!', type: 'success' });
        setTimeout(() => navigate('/login'), 2000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Greška pri promjeni lozinke');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card card">
        <h1 className="auth-title">🔐</h1>
        <h2>
          {step === 1 && 'Zaboravljena lozinka'}
          {step === 2 && 'Unesite kod'}
          {step === 3 && 'Nova lozinka'}
        </h2>

        {step === 1 && (
          <p style={{ textAlign: 'center', color: '#666', marginBottom: '20px' }}>
            Unesite email adresu vašeg računa i poslat ćemo vam kod za resetiranje lozinke.
          </p>
        )}

        {step === 2 && (
          <p style={{ textAlign: 'center', color: '#666', marginBottom: '20px' }}>
            Unesite 6-znamenkasti kod koji ste primili na <strong>{email}</strong>
          </p>
        )}

        {step === 3 && (
          <p style={{ textAlign: 'center', color: '#666', marginBottom: '20px' }}>
            Unesite novu lozinku za vaš račun.
          </p>
        )}

        {error && <div className="error-message">{error}</div>}

        {/* Step 1: Email form */}
        {step === 1 && (
          <form onSubmit={handleRequestCode}>
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="vas@email.com"
                required
              />
            </div>

            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Slanje...' : 'Pošalji kod'}
            </button>
          </form>
        )}

        {/* Step 2: Code verification */}
        {step === 2 && (
          <form onSubmit={handleVerifyCode}>
            <div className="form-group">
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="123456"
                maxLength={6}
                style={{ fontSize: '2rem', textAlign: 'center', letterSpacing: '10px' }}
                required
              />
            </div>

            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Provjera...' : 'Potvrdi kod'}
            </button>

            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setStep(1)}
              style={{ marginTop: '10px' }}
            >
              Pošalji novi kod
            </button>
          </form>
        )}

        {/* Step 3: New password */}
        {step === 3 && (
          <form onSubmit={handleResetPassword}>
            <div className="form-group">
              <label>Nova lozinka</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimalno 6 znakova"
                required
                minLength={6}
              />
            </div>

            <div className="form-group">
              <label>Potvrdi lozinku</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Ponovno unesite lozinku"
                required
              />
            </div>

            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Spremanje...' : 'Spremi novu lozinku'}
            </button>
          </form>
        )}

        <p className="auth-link" style={{ marginTop: '20px' }}>
          <a href="/login">Povratak na prijavu</a>
        </p>

        <div className="support-info" style={{ marginTop: '30px', padding: '15px', background: '#f8fafc', borderRadius: '10px', textAlign: 'center' }}>
          <p style={{ margin: 0, fontSize: '0.9rem', color: '#64748b' }}>
            Trebate pomoć? Kontaktirajte nas:
          </p>
          <a href="mailto:teamconnect0102@gmail.com" style={{ color: '#4f46e5', fontWeight: '600' }}>
            teamconnect0102@gmail.com
          </a>
        </div>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

export default ForgotPassword;
