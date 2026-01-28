import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Toast from '../components/Toast';
import { API_URL } from '../config';
import './TournamentDetail.css';
import BracketGenerator from '../components/Bracketgenerator';

function TournamentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tournament, setTournament] = useState(null);
  const [activeTab, setActiveTab] = useState('info');
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [isUserRegistered, setIsUserRegistered] = useState(false);
  const [userTeamId, setUserTeamId] = useState(null);

  useEffect(() => {
    // Load current user
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    setCurrentUser(user);
    
    loadTournament();
  }, [id]);

  const loadTournament = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      // ✅ FIX: Dohvati sa backend-a, NE iz localStorage
      const response = await fetch(`${API_URL}/tournaments/${id}`, {
        headers: token ? {
          'Authorization': `Bearer ${token}`
        } : {}
      });

      if (response.ok) {
        const data = await response.json();
        setTournament(data);
        
        // Provjeri je li trenutni korisnik registriran
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const registered = data.registeredTeams?.some(
          team => team.captain && team.captain._id === user.id
        );
        setIsUserRegistered(registered);
        
        // Nađi team ID ako je registriran
        if (registered) {
          const userTeam = data.registeredTeams.find(
            team => team.captain && team.captain._id === user.id
          );
          setUserTeamId(userTeam?._id);
        }
        
        console.log('✅ Tournament loaded:', data);
      } else {
        setToast({ message: 'Turnir ne postoji!', type: 'error' });
        setTimeout(() => navigate('/tournaments'), 2000);
      }
    } catch (error) {
      console.error('❌ Load tournament error:', error);
      setToast({ message: 'Greška pri učitavanju turnira', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // ✅ NOVO - Odjavi tim sa turnira
  const handleUnregisterTeam = async () => {
    if (!window.confirm('Jesi li siguran/a da želiš odjaviti tim sa turnira?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/tournaments/${id}/unregister`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (response.ok) {
        setToast({ message: '✅ Tim uspješno odjavljen!', type: 'success' });
        loadTournament(); // Reload
      } else {
        setToast({ message: data.message || 'Greška pri odjavljivanju', type: 'error' });
      }
    } catch (error) {
      console.error('❌ Unregister error:', error);
      setToast({ message: 'Greška pri odjavljivanju', type: 'error' });
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('hr-HR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const getStatusBadge = (status) => {
    const badges = {
      active: { text: 'U tijeku', color: '#4caf50' },
      upcoming: { text: 'Uskoro', color: '#ff9800' },
      finished: { text: 'Završeno', color: '#999' }
    };
    return badges[status] || badges.upcoming;
  };

  if (loading) {
    return (
      <div className="tournament-detail-page">
        <Navbar />
        <div className="loading">Učitavanje turnira...</div>
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="tournament-detail-page">
        <Navbar />
        <div className="loading">Turnir ne postoji</div>
      </div>
    );
  }

  return (
    <div className="tournament-detail-page">
      <Navbar />
      
      <div className="tournament-detail-container">
        <div className="tournament-hero">
          <div className="hero-content">
            <div className="hero-badge">
              <span className="hero-sport">{tournament.sport}</span>
              <span 
                className="hero-status"
                style={{ background: getStatusBadge(tournament.status).color }}
              >
                {getStatusBadge(tournament.status).text}
              </span>
            </div>
            <h1>{tournament.name}</h1>
            <p className="hero-location">📍 {tournament.city}, {tournament.location}</p>
            <p className="hero-dates">
              📅 {formatDate(tournament.startDate)} - {formatDate(tournament.endDate)}
            </p>
          </div>
        </div>

        <div className="tournament-tabs">
          <button 
            className={`tab ${activeTab === 'info' ? 'active' : ''}`}
            onClick={() => setActiveTab('info')}
          >
            ℹ️ Informacije
          </button>
          <button 
            className={`tab ${activeTab === 'teams' ? 'active' : ''}`}
            onClick={() => setActiveTab('teams')}
          >
            👥 Timovi ({tournament.registeredTeams?.length || 0}/{tournament.maxTeams})
          </button>
          <button 
            className={`tab ${activeTab === 'bracket' ? 'active' : ''}`}
            onClick={() => setActiveTab('bracket')}
          >
            🏆 Raspored
          </button>
          <button 
            className={`tab ${activeTab === 'matches' ? 'active' : ''}`}
            onClick={() => setActiveTab('matches')}
          >
            ⚽ Utakmice
          </button>
        </div>

        <div className="tournament-content card">
          {/* INFO TAB */}
          {activeTab === 'info' && (
            <div className="tournament-info-tab">
              <h2>ℹ️ O turniru</h2>
              
              {tournament.description && (
                <div className="tournament-full-description">
                  <p>{tournament.description}</p>
                </div>
              )}

              <div className="info-grid">
                <div className="info-item">
                  <span className="info-label">Format:</span>
                  <span className="info-value">
                    {tournament.format === 'knockout' ? 'Knockout (Eliminacije)' : 'Liga'}
                  </span>
                </div>
                <div className="info-item">
                  <span className="info-label">Broj timova:</span>
                  <span className="info-value">{tournament.maxTeams}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Igrača po timu:</span>
                  <span className="info-value">
                    {tournament.minPlayersPerTeam || tournament.teamSize || 5} - {tournament.maxPlayersPerTeam || tournament.teamSize || 5}
                  </span>
                </div>
                <div className="info-item">
                  <span className="info-label">Kotizacija:</span>
                  <span className="info-value">
                    {tournament.entryFee > 0 ? `${tournament.entryFee} €` : 'Besplatno'}
                  </span>
                </div>
                {tournament.prize && (
                  <div className="info-item">
                    <span className="info-label">Nagrada:</span>
                    <span className="info-value">{tournament.prize}</span>
                  </div>
                )}
                <div className="info-item">
                  <span className="info-label">Organizator:</span>
                  <span className="info-value">{tournament.creator?.username || 'Unknown'}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Status:</span>
                  <span className="info-value">{getStatusBadge(tournament.status).text}</span>
                </div>
              </div>

              {/* ✅ NOVO - Dodaj button za odjavu */}
              <div className="tournament-register-section">
                {isUserRegistered ? (
                  <div className="user-registered-section">
                    <div className="registered-badge">
                      <span className="check-icon">✓</span>
                      <p>Tvoj tim je prijavljen!</p>
                    </div>
                    <button 
                      className="btn btn-danger btn-large"
                      onClick={handleUnregisterTeam}
                    >
                      ❌ Odjavi tim
                    </button>
                  </div>
                ) : (tournament.registeredTeams?.length || 0) < tournament.maxTeams ? (
                  <>
                    <p className="register-info">
                      Još uvijek ima mjesta! Prijavi svoj tim i sudjeluj u turniru.
                    </p>
                    <button 
                      className="btn btn-primary btn-large"
                      onClick={() => navigate('/tournaments')}
                    >
                      🏆 Prijavi tim
                    </button>
                  </>
                ) : (
                  <div className="register-full">
                    <span className="full-icon">✓</span>
                    <p>Turnir je popunjen. Svi timovi su prijavljeni!</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TEAMS TAB */}
          {activeTab === 'teams' && (
            <div className="teams-list-tab">
              <h2>👥 Prijavljeni timovi</h2>
              {tournament.registeredTeams && tournament.registeredTeams.length > 0 ? (
                <div className="registered-teams-list">
                  {tournament.registeredTeams.map((team, index) => (
                    <div key={team._id} className="registered-team-item">
                      <div className="team-number">#{index + 1}</div>
                      <div className="team-details">
                        <h4>{team.teamName}</h4>
                        <p>👤 Kapetan: {team.captain?.username || 'Unknown'}</p>
                        <p>👥 {team.players?.length || 0} igrača</p>
                        <p className="team-registered-date">
                          Prijavljen: {new Date(team.registeredAt).toLocaleDateString('hr-HR')}
                        </p>
                        {team.players && team.players.length > 0 && (
                          <div className="team-players-list">
                            <strong>Igrači:</strong>
                            <ul>
                              {team.players.map((player, idx) => (
                                <li key={idx}>
                                  {player.name} {player.position && `(${player.position})`}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="no-teams-registered">Još nema prijavljenih timova</p>
              )}
            </div>
          )}

          {/* BRACKET TAB */}
          {activeTab === 'bracket' && (
            <div className="bracket-tab">
              {tournament.bracket && tournament.bracket.length > 0 ? (
                <BracketGenerator 
                  teams={tournament.registeredTeams?.map(t => t.teamName) || []}
                  matches={tournament.bracket || []}
                  onUpdateMatch={(match) => console.log('Update match:', match)}
                />
              ) : tournament.registeredTeams && tournament.registeredTeams.length >= 2 ? (
                <div className="no-bracket-container">
                  <p className="no-bracket">Bracket će biti generiran od strane organizatora</p>
                </div>
              ) : (
                <div className="no-bracket-container">
                  <p className="no-bracket">Bracket će biti generiran kada se prijavi dovoljno timova (min 2)</p>
                </div>
              )}
            </div>
          )}

          {/* MATCHES TAB */}
          {activeTab === 'matches' && (
            <div className="matches-tab">
              <h2>⚽ Utakmice</h2>
              {tournament.bracket && tournament.bracket.length > 0 ? (
                <div className="matches-list">
                  {tournament.bracket
                    .filter(match => match.team1 && match.team2)
                    .map((match, index) => (
                      <div key={index} className="match-item card">
                        <div className="match-header">
                          <span className="match-round">Runda {match.round}</span>
                          <span className="match-number">Utakmica #{match.matchNumber}</span>
                        </div>
                        <div className="match-teams">
                          <div className="match-team">
                            <span className="team-name">{match.team1}</span>
                            {match.score1 !== null && (
                              <span className="team-score">{match.score1}</span>
                            )}
                          </div>
                          <span className="vs">VS</span>
                          <div className="match-team">
                            <span className="team-name">{match.team2}</span>
                            {match.score2 !== null && (
                              <span className="team-score">{match.score2}</span>
                            )}
                          </div>
                        </div>
                        {match.winner && (
                          <div className="match-winner">
                            🏆 Pobjednik: <strong>{match.winner}</strong>
                          </div>
                        )}
                        {match.playedDate && (
                          <div className="match-date">
                            Odigrano: {formatDate(match.playedDate)}
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              ) : (
                <p>Utakmice će biti prikazane ovdje kada turnir počne</p>
              )}
            </div>
          )}
        </div>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

export default TournamentDetail;