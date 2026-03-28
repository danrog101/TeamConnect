import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { LanguageProvider } from './i18n/LanguageContext';
import LandingPage from './pages/LandingPage';
import Register from './pages/Register';
import VerifyEmail from './pages/VerifyEmail';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import AdminDashboard from './pages/AdminDashboard';
import ProfileSetup from './pages/ProfileSetup';
import Dashboard from './pages/Dashboard';
import CreateTeam from './pages/CreateTeam';
import MyTeams from './pages/MyTeams';
import EditTeam from './pages/EditTeam';
import Profile from './pages/Profile';
import ActivityFeed from './pages/ActivityFeed';
import Tournaments from './pages/Tournaments';
import TournamentDetail from './pages/TournamentDetail';
import TournamentRegister from './pages/TournamentRegister';
import RatingSystem from './pages/RatingSystem';
import TeamChat from './pages/TeamChat';
import FieldMap from './pages/FieldMap';
import MatchTracker from './pages/MatchTracker';
import Friends from './pages/Friends';
import Notifications from './pages/Notifications';
import PrivacyPolicy from './pages/PrivacyPolicy';
import Terms from './pages/Terms';
import Footer from './components/Footer';
import './App.css';
import MyStudio from './pages/MyStudio';
import DirectMessages from './pages/DirectMessages';
import Groups from './pages/Groups';
function PrivateRoute({ children }) {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" replace />;
}

function AdminRoute({ children }) {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isAdmin = token && user.is_admin;
  return isAdmin ? children : <Navigate to="/dashboard" replace />;
}

function App() {
  const [sessionExpired, setSessionExpired] = useState(false);

useEffect(() => {
  const handleExpired = () => setSessionExpired(true);
  window.addEventListener('session-expired', handleExpired);
  return () => window.removeEventListener('session-expired', handleExpired);
}, []);
  return (
    <LanguageProvider>
      <Router>
        <div className="app">
          {sessionExpired && (
  <div style={{
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    background: 'rgba(0,0,0,0.75)', display: 'flex',
    alignItems: 'center', justifyContent: 'center', zIndex: 9999
  }}>
    <div style={{
      background: 'white', borderRadius: '20px', padding: '40px',
      textAlign: 'center', maxWidth: '400px', width: '90%',
      boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
    }}>
      <div style={{ fontSize: '3.5rem', marginBottom: '16px' }}>⏰</div>
      <h2 style={{ margin: '0 0 12px', color: '#1e293b', fontSize: '1.5rem' }}>
        Sesija je istekla
      </h2>
      <p style={{ color: '#64748b', marginBottom: '28px', lineHeight: '1.6' }}>
        Zbog sigurnosti automatski se odjavljujemo nakon određenog vremena. Molimo prijavite se ponovo.
      </p>
      <button
        onClick={() => { setSessionExpired(false); window.location.href = '/login'; }}
        style={{
          background: 'linear-gradient(135deg, #1a73e8, #0ea5e9)',
          color: 'white', border: 'none', borderRadius: '12px',
          padding: '14px 32px', fontSize: '1rem', fontWeight: '700',
          cursor: 'pointer', width: '100%'
        }}
      >
        Prijavi se ponovo
      </button>
    </div>
  </div>
)}
          <Routes>
            {/* Javne rute */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/register" element={<Register />} />
            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/my-studio" element={<MyStudio />} />
            {/* Admin ruta */}
            <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />

            {/* Privatne rute */}
            <Route path="/profile-setup" element={<PrivateRoute><ProfileSetup /></PrivateRoute>} />
            <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
            <Route path="/create-team" element={<PrivateRoute><CreateTeam /></PrivateRoute>} />
            <Route path="/edit-team/:teamId" element={<PrivateRoute><EditTeam /></PrivateRoute>} />
            <Route path="/my-teams" element={<PrivateRoute><MyTeams /></PrivateRoute>} />
            <Route path="/notifications" element={<PrivateRoute><Notifications /></PrivateRoute>} />

            {/* Profil */}
            <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
            <Route path="/profile/:userId" element={<PrivateRoute><Profile /></PrivateRoute>} />

            <Route path="/activity" element={<AdminRoute><ActivityFeed /></AdminRoute>} />

            {/* Turniri */}
            <Route path="/tournaments" element={<PrivateRoute><Tournaments /></PrivateRoute>} />
            <Route path="/tournament/:id" element={<PrivateRoute><TournamentDetail /></PrivateRoute>} />
            <Route path="/tournament/:id/register" element={<PrivateRoute><TournamentRegister /></PrivateRoute>} />

            {/* Rating */}
            <Route path="/ratings" element={<PrivateRoute><RatingSystem /></PrivateRoute>} />

            {/* Chat */}
            <Route path="/team/:teamId/chat" element={<PrivateRoute><TeamChat /></PrivateRoute>} />

            {/* Fields */}
            <Route path="/fields" element={<PrivateRoute><FieldMap /></PrivateRoute>} />

            {/* Match */}
            <Route path="/match/:matchId" element={<PrivateRoute><MatchTracker /></PrivateRoute>} />

            {/* Friends */}
            <Route path="/friends" element={<PrivateRoute><Friends /></PrivateRoute>} />

            <Route path="/messages" element={<DirectMessages />} />
<Route path="/messages/:userId" element={<DirectMessages />} />

            {/* Video */}
            
            <Route path="/groups" element={<PrivateRoute><Groups /></PrivateRoute>} />
          </Routes>
          <Footer />
        </div>
      </Router>
    </LanguageProvider>
  );
}

export default App;