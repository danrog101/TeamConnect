import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';
import Navbar from '../components/Navbar';
import TeamCard from '../components/TeamCard';
import Toast from '../components/Toast';
import { teamsAPI } from '../services/api';
import './MyTeams.css';

function MyTeams() {
  const navigate = useNavigate();
  
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    fetchMyTeams();
  }, []);

  const fetchMyTeams = async () => {
    try {
      setLoading(true);
      const response = await teamsAPI.getMy();
      setTeams(response.data || []);
    } catch (error) {
      console.error('Fetch teams error:', error);
      setToast({ message: 'Greška pri učitavanju timova', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleLeaveTeam = async (teamId) => {
    if (!window.confirm('Jeste li sigurni da želite napustiti ovaj tim?')) {
      return;
    }

    try {
      await teamsAPI.leave(teamId);
      setToast({ message: 'Napustili ste tim', type: 'info' });
      fetchMyTeams();
    } catch (error) {
      console.error('Leave team error:', error);
      setToast({ message: 'Greška pri napuštanju tima', type: 'error' });
    }
  };

  const handleDeleteTeam = async (teamId) => {
    if (!window.confirm('Jeste li sigurni da želite obrisati ovaj tim? Ova radnja se ne može poništiti!')) {
      return;
    }

    try {
      await teamsAPI.delete(teamId);
      setToast({ message: 'Tim je obrisan', type: 'success' });
      fetchMyTeams();
    } catch (error) {
      console.error('Delete team error:', error);
      setToast({ message: 'Greška pri brisanju tima', type: 'error' });
    }
  };

  const myCreatedTeams = teams.filter(t =>
    t.creator?.id === currentUser.id || t.creator_id === currentUser.id
  );

  const myJoinedTeams = teams.filter(t =>
    t.creator?.id !== currentUser.id && t.creator_id !== currentUser.id
  );

  if (loading) {
    return (
      <div className="my-teams-page">
        <Navbar />
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Učitavanje timova...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="my-teams-page">
      <Navbar />

      <div className="my-teams-container">
        <div className="my-teams-header">
          <h1>Moji Timovi</h1>
          <p>Upravljaj svojim timovima</p>
          <button className="btn btn-primary btn-large" onClick={() => navigate('/create-team')}>
            + Kreiraj Novi Tim
          </button>
        </div>

        {teams.length === 0 ? (
          <div className="no-teams card">
            <span className="empty-icon">⚽</span>
            <h2>Nemate timova</h2>
            <p>Kreirajte novi tim ili pregledajte postojeće timove na Dashboardu</p>
            <div className="empty-actions">
              <button className="btn btn-primary" onClick={() => navigate('/create-team')}>
                Kreiraj Tim
              </button>
              <button className="btn btn-secondary" onClick={() => navigate('/dashboard')}>
                Pregledaj Timove
              </button>
            </div>
          </div>
        ) : (
          <>
            {myCreatedTeams.length > 0 && (
              <div className="teams-section">
                <h2 className="section-title">Timovi koje sam kreirao ({myCreatedTeams.length})</h2>
                <div className="teams-grid">
                  {myCreatedTeams.map(team => (
                    <TeamCard
                      key={team.id}
                      team={team}
                      onDelete={handleDeleteTeam}
                      showActions={true}
                      autoExpandMembers={true}
                    />
                  ))}
                </div>
              </div>
            )}

            {myJoinedTeams.length > 0 && (
              <div className="teams-section">
                <h2 className="section-title">Timovi kojima sam se pridružio ({myJoinedTeams.length})</h2>
                <div className="teams-grid">
                  {myJoinedTeams.map(team => (
                    <TeamCard
                      key={team.id}
                      team={team}
                      onLeave={handleLeaveTeam}
                      showActions={true}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

export default MyTeams;
