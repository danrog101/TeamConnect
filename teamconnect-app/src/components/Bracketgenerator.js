import React, { useState } from 'react';
import './BracketGenerator.css';

function BracketGenerator({ bracket, isOrganizer, tournamentId, onRefresh }) {
  const [scoreModal, setScoreModal] = useState(null);
  const [score1, setScore1] = useState('');
  const [score2, setScore2] = useState('');
  const [saving, setSaving] = useState(false);

  if (!bracket || bracket.length === 0) {
    return (
      <div className="bracket-empty">
        <p>Bracket još nije generiran</p>
      </div>
    );
  }

  // Grupiraj matches po rundama
  const rounds = {};
  bracket.forEach(match => {
    if (!rounds[match.round]) rounds[match.round] = [];
    rounds[match.round].push(match);
  });
  const roundNumbers = Object.keys(rounds).map(Number).sort((a, b) => a - b);
  const totalRounds = roundNumbers.length;

  const getRoundName = (round) => {
    const remaining = totalRounds - round;
    if (remaining === 0) return '🏆 Finale';
    if (remaining === 1) return '🥈 Polufinale';
    if (remaining === 2) return '🎯 Četvrtfinale';
    return `Runda ${round}`;
  };

  const handleSaveScore = async () => {
    if (score1 === '' || score2 === '') return;
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(
        `${process.env.REACT_APP_API_URL || 'https://teamconnect-cd34.onrender.com/api'}/tournaments/${tournamentId}/bracket/score`,
        {
          method: 'PUT',
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            round: scoreModal.round,
            matchNumber: scoreModal.matchNumber,
            score1: parseInt(score1),
            score2: parseInt(score2)
          })
        }
      );
      if (res.ok) {
        setScoreModal(null);
        setScore1('');
        setScore2('');
        onRefresh && onRefresh();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bracket-generator">
      <div className="bracket-scroll">
        <div className="bracket-container">
          {roundNumbers.map(roundNum => (
            <div key={roundNum} className="bracket-round">
              <h3 className="round-title">{getRoundName(roundNum)}</h3>
              <div className="round-matches">
                {rounds[roundNum].map((match, idx) => (
                  <div key={idx} className="bracket-match">
                    <div className={`match-team ${match.winner === match.team1 ? 'winner' : ''} ${!match.team1 ? 'tbd' : ''}`}>
                      <span className="team-name">{match.team1 || 'TBD'}</span>
                      <span className="team-score">{match.score1 !== null && match.score1 !== undefined ? match.score1 : '-'}</span>
                    </div>
                    <div className="match-vs">VS</div>
                    <div className={`match-team ${match.winner === match.team2 ? 'winner' : ''} ${!match.team2 ? 'tbd' : ''}`}>
                      <span className="team-name">{match.team2 || 'TBD'}</span>
                      <span className="team-score">{match.score2 !== null && match.score2 !== undefined ? match.score2 : '-'}</span>
                    </div>
                    {match.winner && (
                      <div className="match-winner-badge">🏆 {match.winner}</div>
                    )}
                    {isOrganizer && match.team1 && match.team2 && !match.winner && (
                      <button
                        className="btn-enter-score"
                        onClick={() => { setScoreModal(match); setScore1(''); setScore2(''); }}
                      >
                        ⚽ Unesi rezultat
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Score Modal */}
      {scoreModal && (
        <div className="score-modal-overlay" onClick={() => setScoreModal(null)}>
          <div className="score-modal" onClick={e => e.stopPropagation()}>
            <h3>⚽ Unesi rezultat</h3>
            <p className="score-match-title">{scoreModal.team1} vs {scoreModal.team2}</p>
            <div className="score-inputs">
              <div className="score-input-group">
                <label>{scoreModal.team1}</label>
                <input
                  type="number"
                  min="0"
                  value={score1}
                  onChange={e => setScore1(e.target.value)}
                  placeholder="0"
                />
              </div>
              <span className="score-separator">:</span>
              <div className="score-input-group">
                <label>{scoreModal.team2}</label>
                <input
                  type="number"
                  min="0"
                  value={score2}
                  onChange={e => setScore2(e.target.value)}
                  placeholder="0"
                />
              </div>
            </div>
            {score1 !== '' && score2 !== '' && parseInt(score1) === parseInt(score2) && (
              <p style={{ color: 'orange', fontSize: '13px', textAlign: 'center' }}>
                ⚠️ Rezultat mora imati pobjednika (bez neriješenog)
              </p>
            )}
            <div className="score-modal-actions">
              <button className="btn btn-secondary" onClick={() => setScoreModal(null)}>Odustani</button>
              <button
                className="btn btn-primary"
                onClick={handleSaveScore}
                disabled={saving || score1 === '' || score2 === '' || parseInt(score1) === parseInt(score2)}
              >
                {saving ? 'Spremanje...' : '✅ Spremi'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default BracketGenerator;