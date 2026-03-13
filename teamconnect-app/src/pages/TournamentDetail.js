import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Toast from '../components/Toast';
import Modal from '../components/Modal';
import { API_URL } from '../config';
import './TournamentDetail.css';
import BracketGenerator from '../components/Bracketgenerator';
import { useLanguage } from '../i18n/LanguageContext';

function TournamentDetail() {
  const { id } = useParams();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [tournament, setTournament]             = useState(null);
  const [activeTab, setActiveTab]               = useState('info');
  const [toast, setToast]                       = useState(null);
  const [confirmUnregister, setConfirmUnregister] = useState(false);
  const [confirmResetBracket, setConfirmResetBracket] = useState(false);
  const [loading, setLoading]                   = useState(true);
  const [currentUser, setCurrentUser]           = useState(null);
  const [isUserRegistered, setIsUserRegistered] = useState(false);
  const [userTeamId, setUserTeamId]             = useState(null);
  const [registerLoading, setRegisterLoading]   = useState(false);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    setCurrentUser(user);
    loadTournament();
  }, [id]);
const location = useLocation(); // import { useLocation } from 'react-router-dom'

useEffect(() => {
  if (location.state?.successMessage) {
    setToast({ message: location.state.successMessage, type: 'success' });
  }
}, []);
  const loadTournament = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/tournaments/${id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });

      if (response.ok) {
        const data = await response.json();
        setTournament(data);

        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const registered =
          data.registeredTeams?.some(team => team.captain && team.captain._id === user.id) ||
          data.registered_teams_list?.some(team => team.user_id === user.id);
        setIsUserRegistered(registered);

        if (registered) {
          const userTeam =
            data.registeredTeams?.find(team => team.captain && team.captain._id === user.id) ||
            data.registered_teams_list?.find(team => team.user_id === user.id);
          setUserTeamId(userTeam?._id || userTeam?.id);
        }
      } else {
        setToast({ message: 'Turnir ne postoji!', type: 'error' });
        setTimeout(() => navigate('/tournaments'), 2000);
      }
    } catch (error) {
      console.error('Load tournament error:', error);
      setToast({ message: 'Greška pri učitavanju turnira', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleUnregisterTeam = () => setConfirmUnregister(true);

  const confirmUnregisterAction = async () => {
    setConfirmUnregister(false);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/tournaments/${id}/unregister`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
      });
      const data = await response.json();
      if (response.ok) {
        setToast({ message: '✅ Tim uspješno odjavljen!', type: 'success' });
        loadTournament();
      } else {
        setToast({ message: data.message || 'Greška pri odjavljivanju', type: 'error' });
      }
    } catch (error) {
      setToast({ message: 'Greška pri odjavljivanju', type: 'error' });
    }
  };

  // ── Generate bracket ────────────────────────────────────────────────────────
  const handleGenerateBracket = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/tournaments/${id}/bracket/generate`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setToast({ message: '✅ Bracket generiran!', type: 'success' });
        loadTournament();
      } else {
        const data = await res.json();
        setToast({ message: data.message || 'Greška pri generiranju', type: 'error' });
      }
    } catch (e) {
      setToast({ message: 'Greška', type: 'error' });
    }
  };

  // ── Reset bracket ────────────────────────────────────────────────────────────
  const handleResetBracket = async () => {
    setConfirmResetBracket(false);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/tournaments/${id}/bracket/reset`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setToast({ message: '🔄 Bracket resetiran! Možeš generirati novi.', type: 'success' });
        loadTournament();
      } else {
        const data = await res.json();
        setToast({ message: data.message || 'Greška pri resetiranju', type: 'error' });
      }
    } catch (e) {
      setToast({ message: 'Greška', type: 'error' });
    }
  };

  // ── Register team (FIX: first-click problem) ────────────────────────────────
  const handleRegisterClick = async () => {
    if (registerLoading) return; // prevent double-click
    setRegisterLoading(true);
    try {
      navigate(`/tournament/${id}/register`);
    } finally {
      // small delay so navigate has time to fire
      setTimeout(() => setRegisterLoading(false), 1000);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Datum nije postavljen';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Nevažeći datum';
      return date.toLocaleDateString('hr-HR', { day: 'numeric', month: 'long', year: 'numeric' });
    } catch { return 'Nevažeći datum'; }
  };

  const getStatusBadge = (status) => {
    const badges = {
      active:   { text: t('tournaments.active')   || 'Aktivno',     color: 'var(--color-primary)' },
      upcoming: { text: t('tournaments.upcoming') || 'Nadolazeći',  color: 'var(--color-warning)' },
      finished: { text: t('tournaments.finished') || 'Završeno',    color: 'var(--text-tertiary)' }
    };
    return badges[status] || badges.upcoming;
  };

  if (loading) return (
    <div className="tournament-detail-page">
      <Navbar />
      <div className="loading">{t('common.loading') || 'Učitavanje...'}</div>
    </div>
  );

  if (!tournament) return (
    <div className="tournament-detail-page">
      <Navbar />
      <div className="loading">Turnir ne postoji</div>
    </div>
  );

  const startDate       = tournament.start_date || tournament.startDate;
  const endDate         = tournament.end_date   || tournament.endDate;
  const registeredTeams = tournament.registered_teams_list || tournament.registeredTeams || [];
  const maxTeams        = tournament.max_teams  || tournament.maxTeams  || 8;
  const minPlayers      = tournament.min_players_per_team || tournament.minPlayersPerTeam || 5;
  const maxPlayers      = tournament.max_players_per_team || tournament.maxPlayersPerTeam || 7;
  const entryFee        = tournament.entry_fee  || tournament.entryFee  || 0;
  const isOrganizer     = currentUser?.id === (tournament.creator?.id || tournament.creator?._id);

  return (
    <div className="tournament-detail-page">
      <Navbar />

      <div className="tournament-detail-container">

        {/* HERO */}
        <div className="tournament-hero">
          <div className="hero-content">
            <div className="hero-badge">
              <span className="hero-sport">{tournament.sport}</span>
              <span className="hero-status" style={{ background: getStatusBadge(tournament.status).color }}>
                {getStatusBadge(tournament.status).text}
              </span>
            </div>
            <h1>{tournament.name}</h1>
            <p className="hero-location">📍 {tournament.city}, {tournament.location}</p>
            <p className="hero-dates">📅 {formatDate(startDate)} - {formatDate(endDate)}</p>
          </div>
        </div>

        {/* TABS — fiksirani, ne scrollaju */}
        <div className="tournament-tabs">
          {[
            { key: 'info',    label: `ℹ️ ${t('tournaments.tabInfo')    || 'Informacije'}` },
            { key: 'teams',   label: `👥 ${t('tournaments.tabTeams')   || 'Timovi'} (${registeredTeams.length}/${maxTeams})` },
            { key: 'bracket', label: `🏆 ${t('tournaments.tabBracket') || 'Raspored'}` },
            { key: 'matches', label: `⚽ ${t('tournaments.tabMatches') || 'Utakmice'}` },
          ].map(tab => (
            <button
              key={tab.key}
              className={`tab ${activeTab === tab.key ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="tournament-content card">

          {/* ── INFO TAB ── */}
          {activeTab === 'info' && (
            <div className="tournament-info-tab">
              <h2>ℹ️ {t('tournaments.aboutTournament') || 'O turniru'}</h2>

              {tournament.description && (
                <div className="tournament-full-description">
                  <p>{tournament.description}</p>
                </div>
              )}

              <div className="info-grid">
                <div className="info-item">
                  <span className="info-label">{t('tournaments.format') || 'Format'}:</span>
                  <span className="info-value">
                    {tournament.format === 'knockout' ? 'Knockout' : 'Liga'}
                  </span>
                </div>
                <div className="info-item">
                  <span className="info-label">{t('tournaments.maxTeams') || 'Broj timova'}:</span>
                  <span className="info-value">{maxTeams}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">{t('tournaments.playersPerTeam') || 'Igrača po timu'}:</span>
                  <span className="info-value">{minPlayers} - {maxPlayers}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">{t('tournaments.entryFee') || 'Kotizacija'}:</span>
                  <span className="info-value">{entryFee > 0 ? `${entryFee} €` : t('tournaments.free') || 'Besplatno'}</span>
                </div>
                {tournament.prize && (
                  <div className="info-item">
                    <span className="info-label">{t('tournaments.prize') || 'Nagrada'}:</span>
                    <span className="info-value">{tournament.prize}</span>
                  </div>
                )}
                <div className="info-item">
                  <span className="info-label">{t('tournaments.organizer') || 'Organizator'}:</span>
                  <span className="info-value">{tournament.creator?.username || 'Unknown'}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">{t('tournaments.status') || 'Status'}:</span>
                  <span className="info-value">{getStatusBadge(tournament.status).text}</span>
                </div>
              </div>

              {/* Register section */}
              <div className="tournament-register-section">
                {isUserRegistered ? (
                  <div className="user-registered-section">
                    <div className="registered-badge">
                      <span className="check-icon">✓</span>
                      <p>{t('tournaments.yourTeamRegistered') || 'Tvoj tim je prijavljen!'}</p>
                    </div>
                    <button className="btn btn-danger btn-large" onClick={handleUnregisterTeam}>
                      ❌ {t('tournaments.unregister') || 'Odjavi tim'}
                    </button>
                  </div>
                ) : registeredTeams.length < maxTeams ? (
                  <>
                    <p className="register-info">
                      {t('tournaments.spotsAvailable') || 'Još uvijek ima mjesta! Prijavi svoj tim i sudjeluj u turniru.'}
                    </p>
                    <button
                      className="btn btn-primary btn-large"
                      onClick={handleRegisterClick}
                      disabled={registerLoading}
                    >
                      🏆 {registerLoading ? 'Učitavanje...' : (t('tournaments.registerTeam') || 'Prijavi tim')}
                    </button>
                  </>
                ) : (
                  <div className="register-full">
                    <span className="full-icon">✓</span>
                    <p>{t('tournaments.tournamentFull') || 'Turnir je popunjen!'}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── TEAMS TAB ── */}
          {activeTab === 'teams' && (
            <div className="teams-list-tab">
              <h2>👥 {t('tournaments.registeredTeams') || 'Prijavljeni timovi'}</h2>
              {registeredTeams.length > 0 ? (
                <div className="registered-teams-list">
                  {registeredTeams.map((team, index) => (
                    <div key={team._id || team.id || index} className="registered-team-item">
                      <div className="team-number">#{index + 1}</div>
                      <div className="team-details">
                        <h4>{team.teamName || team.team_name}</h4>
                        <p>👤 Kapetan: {team.captain?.username || team.user?.username || 'Unknown'}</p>
                        <p>👥 {team.players?.length || 0} igrača</p>
                        <p className="team-registered-date">
                          Prijavljen: {formatDate(team.registeredAt || team.registered_at)}
                        </p>
                        {team.players?.length > 0 && (
                          <div className="team-players-list">
                            <strong>Igrači:</strong>
                            <ul>
                              {team.players.map((player, idx) => (
                                <li key={idx}>
                                  {typeof player === 'string' ? player : player.name}
                                  {player.position && ` (${player.position})`}
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
                <p className="no-teams-registered">{t('tournaments.noRegisteredTeams') || 'Još nema prijavljenih timova'}</p>
              )}
            </div>
          )}

          {/* ── BRACKET TAB ── */}
          {activeTab === 'bracket' && (
            <div className="bracket-tab">

              {/* Organizer controls */}
              {isOrganizer && (
                <div className="bracket-controls">
                  {!tournament.bracket_generated && registeredTeams.length >= 2 && (
                    <div className="bracket-generate-box">
                      <p>{t('tournaments.teamsReady') || `Prijavljeno ${registeredTeams.length} timova. Generiraj bracket!`}</p>
                      <button className="btn btn-primary" onClick={handleGenerateBracket}>
                        🏆 {t('tournaments.generateBracket') || 'Generiraj Bracket'}
                      </button>
                    </div>
                  )}

                  {tournament.bracket_generated && (
                    <div className="bracket-reset-box">
                      <p>⚠️ Bracket je već generiran. Možeš ga resetirati i generirati novi.</p>
                      <button
                        className="btn btn-danger"
                        onClick={() => setConfirmResetBracket(true)}
                      >
                        🔄 Resetiraj bracket
                      </button>
                    </div>
                  )}
                </div>
              )}

              {tournament.bracket && tournament.bracket.length > 0 ? (
                <BracketGenerator
                  bracket={tournament.bracket}
                  isOrganizer={isOrganizer}
                  tournamentId={id}
                  onRefresh={loadTournament}
                />
              ) : (
                <div className="no-bracket-container">
                  <div className="no-bracket-icon">🏆</div>
                  <p className="no-bracket">
                    {registeredTeams.length < 2
                      ? t('tournaments.notEnoughTeams') || 'Bracket će biti generiran kada se prijavi dovoljno timova (min 2)'
                      : t('tournaments.bracketNotGenerated') || 'Bracket još nije generiran'}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ── MATCHES TAB ── */}
          {activeTab === 'matches' && (
            <div className="matches-tab">
              <h2>⚽ {t('tournaments.tabMatches') || 'Utakmice'}</h2>
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
                          <div className={`match-team ${match.winner === match.team1 ? 'winner' : ''}`}>
                            <span className="team-name">{match.team1}</span>
                            {match.score1 !== null && match.score1 !== undefined && (
                              <span className="team-score">{match.score1}</span>
                            )}
                          </div>
                          <span className="vs">VS</span>
                          <div className={`match-team ${match.winner === match.team2 ? 'winner' : ''}`}>
                            <span className="team-name">{match.team2}</span>
                            {match.score2 !== null && match.score2 !== undefined && (
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
                          <div className="match-date">Odigrano: {formatDate(match.playedDate)}</div>
                        )}
                      </div>
                    ))}
                </div>
              ) : (
                <p style={{padding:'40px 20px',textAlign:'center',color:'var(--text-tertiary)'}}>
                  {t('tournaments.matchesWhenStarted') || 'Utakmice će biti prikazane ovdje kada turnir počne'}
                </p>
              )}
            </div>
          )}

        </div>
      </div>

      {/* Modals */}
      <Modal
        isOpen={confirmUnregister}
        onClose={() => setConfirmUnregister(false)}
        onConfirm={confirmUnregisterAction}
        title="Odjava s turnira"
        message="Jesi li siguran/a da želiš odjaviti tim sa turnira?"
      />

      <Modal
        isOpen={confirmResetBracket}
        onClose={() => setConfirmResetBracket(false)}
        onConfirm={handleResetBracket}
        title="⚠️ Resetiraj bracket"
        message="Jesi li siguran/a? Svi rezultati bit će izbrisani i bracket će se morati generirati iznova."
      />

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

export default TournamentDetail;