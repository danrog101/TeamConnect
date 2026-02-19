import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import { useLanguage } from '../i18n/LanguageContext';
import Toast from '../components/Toast';
import './Auth.css';

const SECURITY_QUESTIONS = {
  'mothers_maiden_name': 'Koje je prezime vaše majke prije udaje?',
  'first_pet': 'Kako se zvao vaš prvi ljubimac?',
  'birth_city': 'U kojem gradu ste rođeni?',
  'elementary_school': 'Kako se zvala vaša osnovna škola?',
  'favorite_movie': 'Koji je vaš omiljeni film?',
  'favorite_book': 'Koja je vaša omiljena knjiga?',
  'favorite_teacher': 'Kako se zvao vaš omiljeni učitelj?',
  'first_car': 'Koji je bio vaš prvi automobil?'
};
function ForgotPassword() {

  const navigate = useNavigate();
  const { t } = useLanguage();
  
  const [step, setStep] = useState(1); // 1: email, 2: code, 3: new password, 'security': security question flow
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const [securityEmail, setSecurityEmail] = useState('');
  const [securityQuestion, setSecurityQuestion] = useState('');
  const [securityAnswer, setSecurityAnswer] = useState('');
  const [securityStep, setSecurityStep] = useState(1); // 1: enter email, 2: answer question, 3: new password

  // Step 1: Request reset code
  const handleRequestCode = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authAPI.forgotPassword({ email });

      if (response.data.success) {
        setToast({ message: t('forgotPw.codeSent'), type: 'success' });
        setStep(2);
      }
    } catch (err) {
      setError(err.response?.data?.message || t('forgotPw.sendError'));
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify reset code
  const handleVerifyCode = async (e) => {
    e.preventDefault();
    setError('');

    if (code.length !== 6) {
      setError(t('forgotPw.codeMustBe6'));
      return;
    }

    setLoading(true);

    try {
      const response = await authAPI.verifyResetCode({ email, code });

      if (response.data.success) {
        setResetToken(response.data.resetToken);
        setToast({ message: t('forgotPw.codeValid'), type: 'success' });
        setStep(3);
      }
    } catch (err) {
      setError(err.response?.data?.message || t('forgotPw.invalidCode'));
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Set new password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 6) {
      setError(t('auth.passwordTooShort'));
      return;
    }

    if (newPassword !== confirmPassword) {
      setError(t('auth.passwordMismatch'));
      return;
    }

    setLoading(true);

    try {
      const response = await authAPI.resetPassword({ resetToken, newPassword });

      if (response.data.success) {
        setToast({ message: t('forgotPw.passwordChanged'), type: 'success' });
        setTimeout(() => navigate('/login'), 2000);
      }
    } catch (err) {
      setError(err.response?.data?.message || t('forgotPw.resetError'));
    } finally {
      setLoading(false);
    }
  };

  // Security question flow - Step 1: Fetch question by email
  const handleFetchSecurityQuestion = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authAPI.getSecurityQuestion({ email: securityEmail });

      if (response.data.success) {
        setSecurityQuestion(response.data.security_question);
        setSecurityStep(2);
      }
    } catch (err) {
      setError(err.response?.data?.message || t('forgotPw.userNotFound'));
    } finally {
      setLoading(false);
    }
  };

  // Security question flow - Step 2: Verify answer
  const handleVerifySecurityAnswer = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authAPI.verifySecurityAnswer({
        email: securityEmail,
        security_answer: securityAnswer
      });

      if (response.data.success) {
        setResetToken(response.data.resetToken);
        setToast({ message: t('forgotPw.answerCorrect'), type: 'success' });
        setSecurityStep(3);
      }
    } catch (err) {
      setError(err.response?.data?.message || t('forgotPw.invalidAnswer'));
    } finally {
      setLoading(false);
    }
  };

  // Security question flow - Step 3: Set new password
  const handleSecurityResetPassword = async (e) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 6) {
      setError(t('auth.passwordTooShort'));
      return;
    }

    if (newPassword !== confirmPassword) {
      setError(t('auth.passwordMismatch'));
      return;
    }

    setLoading(true);

    try {
      const response = await authAPI.resetPassword({ resetToken, newPassword });

      if (response.data.success) {
        setToast({ message: t('forgotPw.passwordChanged'), type: 'success' });
        setTimeout(() => navigate('/login'), 2000);
      }
    } catch (err) {
      setError(err.response?.data?.message || t('forgotPw.resetError'));
    } finally {
      setLoading(false);
    }
  };

  const getTitle = () => {
    if (step === 'security') {
      if (securityStep === 1) return t('forgotPw.securityQuestion');
      if (securityStep === 2) return t('forgotPw.answerQuestion');
      return t('forgotPw.newPassword');
    }
    if (step === 1) return t('forgotPw.title');
    if (step === 2) return t('forgotPw.enterCode');
    return t('forgotPw.newPassword');
  };

  return (
    <div className="auth-container">
      <div className="auth-card card">
        <h1 className="auth-title">🔐</h1>
        <h2>{getTitle()}</h2>

        {step !== 'security' && (
          <div className="step-progress" style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '20px' }}>
            {[1, 2, 3].map(s => (
              <div key={s} style={{
                width: '40px', height: '4px', borderRadius: '2px',
                background: s <= step ? 'var(--color-primary, #22c55e)' : 'var(--border-primary, #e2e8f0)',
                transition: 'background 0.3s'
              }} />
            ))}
          </div>
        )}

        {step === 'security' && (
          <div className="step-progress" style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '20px' }}>
            {[1, 2, 3].map(s => (
              <div key={s} style={{
                width: '40px', height: '4px', borderRadius: '2px',
                background: s <= securityStep ? 'var(--color-primary, #22c55e)' : 'var(--border-primary, #e2e8f0)',
                transition: 'background 0.3s'
              }} />
            ))}
          </div>
        )}

        {step === 1 && (
          <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: '20px' }}>
            {t('forgotPw.emailDesc')}
          </p>
        )}

        {step === 2 && (
          <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: '20px' }}>
            {t('forgotPw.codeDesc')} <strong>{email}</strong>
          </p>
        )}

        {step === 3 && (
          <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: '20px' }}>
            {t('forgotPw.newPasswordDesc')}
          </p>
        )}

        {step === 'security' && securityStep === 1 && (
          <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: '20px' }}>
            {t('forgotPw.securityEmailDesc')}
          </p>
        )}

        {step === 'security' && securityStep === 2 && (
          <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: '20px' }}>
            {t('forgotPw.securityAnswerDesc')} <strong>{securityEmail}</strong>
          </p>
        )}

        {step === 'security' && securityStep === 3 && (
          <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: '20px' }}>
            {t('forgotPw.newPasswordDesc')}
          </p>
        )}

        {error && <div className="error-message">{error}</div>}

        {/* Step 1: Email form */}
        {step === 1 && (
          <>
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
                {loading ? t('forgotPw.sending') : t('forgotPw.sendCode')}
              </button>
            </form>

            <p style={{ textAlign: 'center', marginTop: '10px', fontSize: '0.9rem' }}>
              <button
                type="button"
                onClick={() => { setStep('security'); setError(''); }}
                style={{ background: 'none', border: 'none', color: 'var(--color-primary)', cursor: 'pointer', textDecoration: 'underline' }}
              >
                {t('forgotPw.useSecurityQuestion')}
              </button>
            </p>
          </>
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
              {loading ? t('forgotPw.verifying') : t('forgotPw.verifyCode')}
            </button>

            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setStep(1)}
              style={{ marginTop: '10px' }}
            >
              {t('forgotPw.sendNewCode')}
            </button>
          </form>
        )}

        {/* Step 3: New password */}
        {step === 3 && (
          <form onSubmit={handleResetPassword}>
            <div className="form-group">
              <label>{t('forgotPw.newPassword')}</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimalno 6 znakova"
                required
                minLength={6}
              />
              {newPassword && (
                <div className="password-strength">
                  <div className="strength-bar">
                    <div 
                      className="strength-fill" 
                      style={{ 
                        width: `${Math.min(100, (newPassword.length / 12) * 50 + (/[A-Z]/.test(newPassword) ? 15 : 0) + (/[0-9]/.test(newPassword) ? 15 : 0) + (/[^A-Za-z0-9]/.test(newPassword) ? 20 : 0))}%`,
                        background: newPassword.length < 6 ? '#ef4444' : newPassword.length < 10 ? '#f59e0b' : '#22c55e'
                      }} 
                    />
                  </div>
                  <small style={{ color: newPassword.length < 6 ? '#ef4444' : newPassword.length < 10 ? '#f59e0b' : '#22c55e' }}>
                    {newPassword.length < 6 ? 'Preslaba' : newPassword.length < 10 ? 'Srednja jakost' : 'Jaka lozinka'}
                  </small>
                </div>
              )}
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
              {loading ? t('common.saving') : t('forgotPw.saveNewPassword')}
            </button>
          </form>
        )}

        {/* Security question flow - Step 1: Enter email */}
        {step === 'security' && securityStep === 1 && (
          <>
            <form onSubmit={handleFetchSecurityQuestion}>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={securityEmail}
                  onChange={(e) => setSecurityEmail(e.target.value)}
                  placeholder="vas@email.com"
                  required
                />
              </div>

              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? t('forgotPw.fetching') : t('forgotPw.fetchQuestion')}
              </button>
            </form>

            <p style={{ textAlign: 'center', marginTop: '10px', fontSize: '0.9rem' }}>
              <button
                type="button"
                onClick={() => { setStep(1); setError(''); }}
                style={{ background: 'none', border: 'none', color: 'var(--color-primary)', cursor: 'pointer', textDecoration: 'underline' }}
              >
                {t('forgotPw.useEmailCode')}
              </button>
            </p>
          </>
        )}

        {/* Security question flow - Step 2: Answer question */}
        {step === 'security' && securityStep === 2 && (
          <form onSubmit={handleVerifySecurityAnswer}>
            <div className="form-group">
              <label>{SECURITY_QUESTIONS[securityQuestion] || securityQuestion}</label>
              <input
                type="text"
                value={securityAnswer}
                onChange={(e) => setSecurityAnswer(e.target.value)}
                placeholder="Vaš odgovor..."
                required
              />
            </div>

            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? t('forgotPw.verifying') : t('forgotPw.confirmAnswer')}
            </button>

            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => { setSecurityStep(1); setError(''); }}
              style={{ marginTop: '10px' }}
            >
              {t('common.back')}
            </button>
          </form>
        )}

        {/* Security question flow - Step 3: New password */}
        {step === 'security' && securityStep === 3 && (
          <form onSubmit={handleSecurityResetPassword}>
            <div className="form-group">
              <label>{t('forgotPw.newPassword')}</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimalno 6 znakova"
                required
                minLength={6}
              />
              {newPassword && (
                <div className="password-strength">
                  <div className="strength-bar">
                    <div 
                      className="strength-fill" 
                      style={{ 
                        width: `${Math.min(100, (newPassword.length / 12) * 50 + (/[A-Z]/.test(newPassword) ? 15 : 0) + (/[0-9]/.test(newPassword) ? 15 : 0) + (/[^A-Za-z0-9]/.test(newPassword) ? 20 : 0))}%`,
                        background: newPassword.length < 6 ? '#ef4444' : newPassword.length < 10 ? '#f59e0b' : '#22c55e'
                      }} 
                    />
                  </div>
                  <small style={{ color: newPassword.length < 6 ? '#ef4444' : newPassword.length < 10 ? '#f59e0b' : '#22c55e' }}>
                    {newPassword.length < 6 ? 'Preslaba' : newPassword.length < 10 ? 'Srednja jakost' : 'Jaka lozinka'}
                  </small>
                </div>
              )}
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
              {loading ? t('common.saving') : t('forgotPw.saveNewPassword')}
            </button>
          </form>
        )}

        <p className="auth-link" style={{ marginTop: '20px' }}>
          <a href="/login">{t('forgotPw.backToLogin')}</a>
        </p>

        <div className="support-info">
          <p>{t('forgotPw.needHelp')}</p>
          <a href="mailto:teamconnect0102@gmail.com">teamconnect0102@gmail.com</a>
        </div>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

export default ForgotPassword;
