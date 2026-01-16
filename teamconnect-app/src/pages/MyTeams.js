import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
      const token = localStorage.getItem('token');
      const data = await teamsAPI.getMyTeams();

      setTeams(data);
    } catch (error) {
      console.error('Fetch teams error:', error);
      setToast({ message: 'Failed to load teams', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleLeaveTeam = async (teamId) => {
    if (!window.confirm('Are you sure you want to leave this team?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await teamsAPI.leaveTeam(teamId);

      if (response.success) {
        setToast({ message: 'You left the team', type: 'info' });
        fetchMyTeams(); // Refresh
      } else {
        setToast({ message: response.message || 'Failed to leave team', type: 'error' });
      }
    } catch (error) {
      console.error('Leave team error:', error);
      setToast({ message: 'Failed to leave team', type: 'error' });
    }
  };

  const handleDeleteTeam = async (teamId) => {
    if (!window.confirm('Are you sure you want to delete this team? This action cannot be undone!')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await teamsAPI.deleteTeam(teamId);

      if (response.success) {
        setToast({ message: 'Team deleted', type: 'success' });
        fetchMyTeams(); // Refresh
      } else {
        setToast({ message: response.message || 'Failed to delete team', type: 'error' });
      }
    } catch (error) {
      console.error('Delete team error:', error);
      setToast({ message: 'Failed to delete team', type: 'error' });
    }
  };

  const myCreatedTeams = teams.filter(t => 
    t.creator.id === currentUser.id
  );
  
  const myJoinedTeams = teams.filter(t => 
    t.creator.id !== currentUser.id
  );

  if (loading) {
    return (
      <div className="my-teams-page">
        <Navbar />
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading teams...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="my-teams-page">
      <Navbar />
      
      <div className="my-teams-container">
        <div className="my-teams-header">
          <h1>👥 My Teams</h1>
          <p>Manage your teams</p>
          <button className="btn btn-primary btn-large" onClick={() => navigate('/create-team')}>
            + Create New Team
          </button>
        </div>

        {teams.length === 0 ? (
          <div className="no-teams card">
            <span className="empty-icon">⚽</span>
            <h2>You have no teams</h2>
            <p>Create a new team or browse existing teams on the Dashboard</p>
            <div className="empty-actions">
              <button className="btn btn-primary" onClick={() => navigate('/create-team')}>
                Create Team
              </button>
              <button className="btn btn-secondary" onClick={() => navigate('/dashboard')}>
                Browse Teams
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Teams I Created */}
            {myCreatedTeams.length > 0 && (
              <div className="teams-section">
                <h2 className="section-title">🎯 Teams I Created ({myCreatedTeams.length})</h2>
                <div className="teams-grid">
                  {myCreatedTeams.map(team => (
                    <TeamCard 
                      key={team.id} 
                      team={team}
                      onDelete={handleDeleteTeam}
                      showActions={true}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Teams I Joined */}
            {myJoinedTeams.length > 0 && (
              <div className="teams-section">
                <h2 className="section-title">🤝 Teams I Joined ({myJoinedTeams.length})</h2>
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