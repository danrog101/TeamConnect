import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';
import './LandingPage.css';

function LandingPage() {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const features = [
    { icon: '👥', title: 'Pronađi Suigrače', desc: 'Povezuj se s igračima u svom gradu koji dijele tvoju strast za sportom.' },
    { icon: '🏆', title: 'Turniri', desc: 'Kreiraj ili se prijavi na turnire. Natječi se i osvoji nagrade!' },
    { icon: '🏟️', title: 'Sportski Tereni', desc: 'Pronađi savršen teren za svoju utakmicu s detaljnim informacijama.' },
    { icon: '📊', title: 'Statistika', desc: 'Prati svoju statistiku, ocjene i napredak kroz vrijeme.' },
    { icon: '💬', title: 'Tim Chat', desc: 'Komuniciraj s timom u realnom vremenu i organiziraj utakmice.' },
    { icon: '🎬', title: 'Video Isječci', desc: 'Dijeli najbolje trenutke sa svojih utakmica.' },
  ];

  return (
    <div className="landing-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-badge">🏀 Sportska platforma #1</div>
          <h1>
            Pronađi svoj tim.
            <br />
            <span className="hero-highlight">Igraj. Pobijedi.</span>
          </h1>
          <p className="hero-description">
            TeamConnect povezuje sportaše i rekreativce po lokaciji i sportu.
            Pronađi suigrače, pridruži se timovima ili organiziraj vlastite sportske događaje.
          </p>
          <div className="hero-actions">
            <button className="btn btn-primary btn-large" onClick={() => navigate('/register')}>
              Započni besplatno
            </button>
            <button className="btn btn-ghost btn-large" onClick={() => navigate('/login')}>
              Već imam račun
            </button>
          </div>
          <div className="hero-stats">
            <div className="stat-item">
              <span className="stat-number">🏅</span>
              <span className="stat-label">Timovi</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">🏆</span>
              <span className="stat-label">Turniri</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">🏟️</span>
              <span className="stat-label">Tereni</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <h2>Sve što trebaš na jednom mjestu</h2>
        <p className="section-subtitle">TeamConnect ti pomaže pronaći igrače, organizirati utakmice i pratiti svoj napredak.</p>
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
        <h2>Kako funkcionira?</h2>
        <div className="steps-grid">
          <div className="step-card">
            <div className="step-number">1</div>
            <h3>Registriraj se</h3>
            <p>Kreiraj besplatan račun u samo par sekundi.</p>
          </div>
          <div className="step-card">
            <div className="step-number">2</div>
            <h3>Odaberi sport</h3>
            <p>Odaberi svoj omiljeni sport i lokaciju.</p>
          </div>
          <div className="step-card">
            <div className="step-number">3</div>
            <h3>Pronađi tim</h3>
            <p>Pridruži se postojećem timu ili kreiraj svoj vlastiti!</p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <h2>Spreman za igru?</h2>
        <p>Pridruži se TeamConnect zajednici i pronađi svoje suigrače već danas!</p>
        <button className="btn btn-primary btn-large" onClick={() => navigate('/register')}>
          Kreiraj račun besplatno
        </button>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <p>© 2025 TeamConnect. Sva prava pridržana.</p>
        <p>
          Podrška: <a href="mailto:teamconnect0102@gmail.com">teamconnect0102@gmail.com</a>
        </p>
      </footer>
    </div>
  );
}

export default LandingPage;
