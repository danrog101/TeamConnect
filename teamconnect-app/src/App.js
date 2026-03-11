import React from 'react';
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
import Statistics from './pages/Statistics';
import VideoHighlights from './pages/VideoHighlights';
import Notifications from './pages/Notifications';
import PrivacyPolicy from './pages/PrivacyPolicy';
import Terms from './pages/Terms';
import Footer from './components/Footer';
import './App.css';
import MyStudio from './pages/MyStudio';

function PrivateRoute({ children }) {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" replace />;
}

const ADMIN_EMAIL = 'teamconnect0102@gmail.com';

function AdminRoute({ children }) {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isAdmin = token && user.email === ADMIN_EMAIL;
  return isAdmin ? children : <Navigate to="/dashboard" replace />;
}

function App() {
  return (
    <LanguageProvider>
      <Router>
        <div className="app">
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

            {/* Statistics */}
            <Route path="/statistics" element={<PrivateRoute><Statistics /></PrivateRoute>} />

            {/* Video */}
            <Route path="/highlights" element={<PrivateRoute><VideoHighlights /></PrivateRoute>} />
          </Routes>
          <Footer />
        </div>
      </Router>
    </LanguageProvider>
  );
}

export default App;