import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';
import LanguageSelector from '../components/LanguageSelector';
import './LandingPage.css';

function LandingPage() {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const features = [
    { icon: '👥', title: t('landing.featureFindPlayers'), desc: t('landing.featureFindPlayersDesc') },
    { icon: '🏆', title: t('landing.featureTournaments'), desc: t('landing.featureTournamentsDesc') },
    { icon: '🏟️', title: t('landing.featureFields'),     desc: t('landing.featureFieldsDesc') },
    { icon: '💬', title: t('landing.featureChat'),        desc: t('landing.featureChatDesc') },
  ];

  return (
    <div className="landing-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="landing-language-selector">
          <LanguageSelector />
        </div>
        <div className="hero-content">
          <div className="hero-badge">{t('landing.badge')}</div>
          <h1>
            {t('landing.heroTitle1')}
            <br />
            <span className="hero-highlight">{t('landing.heroTitle2')}</span>
          </h1>
          <p className="hero-description">
            {t('landing.heroDesc')}
          </p>
          <div className="hero-actions">
            <button className="btn btn-primary btn-large" onClick={() => navigate('/register')}>
              {t('landing.startFree')}
            </button>
            <button className="btn btn-ghost btn-large" onClick={() => navigate('/login')}>
              {t('landing.haveAccount')}
            </button>
          </div>
          <div className="hero-stats">
            <div className="stat-item">
              <span className="stat-number">🏅</span>
              <span className="stat-label">{t('landing.teams')}</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">🏆</span>
              <span className="stat-label">{t('landing.tournaments')}</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">🏟️</span>
              <span className="stat-label">{t('landing.fields')}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <h2>{t('landing.featuresTitle')}</h2>
        <p className="section-subtitle">{t('landing.featuresSubtitle')}</p>
        <div className="features-grid">
          {features.map((feature, idx) => (
            <div key={idx} className="feature-card card">
              <span className="feature-icon">{feature.icon}</span>
              <h3>{feature.title}</h3>
              <p>{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="how-it-works-section">
        <h2>{t('landing.howItWorks')}</h2>
        <div className="steps-grid">
          <div className="step-card">
            <div className="step-number">1</div>
            <h3>{t('landing.step1Title')}</h3>
            <p>{t('landing.step1Desc')}</p>
          </div>
          <div className="step-card">
            <div className="step-number">2</div>
            <h3>{t('landing.step2Title')}</h3>
            <p>{t('landing.step2Desc')}</p>
          </div>
          <div className="step-card">
            <div className="step-number">3</div>
            <h3>{t('landing.step3Title')}</h3>
            <p>{t('landing.step3Desc')}</p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <h2>{t('landing.ctaTitle')}</h2>
        <p>{t('landing.ctaDesc')}</p>
        <button className="btn btn-primary btn-large" onClick={() => navigate('/register')}>
          {t('landing.ctaButton')}
        </button>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <p>{t('landing.copyright')}</p>
        <p>
          {t('landing.support')}: <a href="mailto:teamconnect0102@gmail.com">teamconnect0102@gmail.com</a>
        </p>
      </footer>
    </div>
  );
}

export default LandingPage;