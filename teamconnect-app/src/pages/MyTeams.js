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
  const { t } = useLanguage();
  
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
      setToast({ message: t('myTeams.loadError'), type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleLeaveTeam = async (teamId) => {
    if (!window.confirm(t('myTeams.leaveConfirm'))) {
      return;
    }

    try {
      await teamsAPI.leave(teamId);
      setToast({ message: t('myTeams.leftTeam'), type: 'info' });
      fetchMyTeams();
    } catch (error) {
      console.error('Leave team error:', error);
      setToast({ message: t('myTeams.leaveError'), type: 'error' });
    }
  };

  const handleDeleteTeam = async (teamId) => {
    if (!window.confirm(t('myTeams.deleteConfirm'))) {
      return;
    }

    try {
      await teamsAPI.delete(teamId);
      setToast({ message: t('myTeams.deleted'), type: 'success' });
      fetchMyTeams();
    } catch (error) {
      console.error('Delete team error:', error);
      setToast({ message: t('myTeams.deleteError'), type: 'error' });
    }
  };

  const myCreatedTeams = teams.filter(team =>
    team.creator?.id === currentUser.id || team.creator_id === currentUser.id
  );

  const myJoinedTeams = teams.filter(team =>
    team.creator?.id !== currentUser.id && team.creator_id !== currentUser.id
  );

  if (loading) {
    return (
      <div className="my-teams-page">
        <Navbar />
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="my-teams-page">
      <Navbar />

      <div className="my-teams-container">
        <div className="my-teams-header">
          <h1>{t('myTeams.title')}</h1>
          <p>{t('myTeams.subtitle')}</p>
          <button className="btn btn-primary btn-large" onClick={() => navigate('/create-team')}>
            {t('myTeams.createNew')}
          </button>
        </div>

        {teams.length === 0 ? (
          <div className="no-teams card">
            <span className="empty-icon">⚽</span>
            <h2>{t('myTeams.noTeams')}</h2>
            <p>{t('myTeams.noTeamsDesc')}</p>
            <div className="empty-actions">
              <button className="btn btn-primary" onClick={() => navigate('/create-team')}>
                {t('nav.createTeam')}
              </button>
              <button className="btn btn-secondary" onClick={() => navigate('/dashboard')}>
                {t('myTeams.browseTeams')}
              </button>
            </div>
          </div>
        ) : (
          <>
            {myCreatedTeams.length > 0 && (
              <div className="teams-section">
                <h2 className="section-title">{t('teams.createdTeams')} ({myCreatedTeams.length})</h2>
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
                <h2 className="section-title">{t('teams.joinedTeams')} ({myJoinedTeams.length})</h2>
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
