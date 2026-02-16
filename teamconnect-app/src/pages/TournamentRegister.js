import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Toast from '../components/Toast';
import { tournamentsAPI } from '../services/api';
import './TournamentRegister.css';

function TournamentRegister() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tournament, setTournament] = useState(null);
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    teamName: '',
    players: []
  });

  useEffect(() => {
    loadTournament();
  }, [id]);

  const loadTournament = async () => {
    try {
      const response = await tournamentsAPI.getOneTournament(id);
      const tournamentData = response.data || response;
      
      console.log('📋 Tournament loaded:', tournamentData);
      
      setTournament(tournamentData);
      
      // Initialize players array based on max players
      const maxPlayers = tournamentData.max_players_per_team || 7;
      const emptyPlayers = Array(maxPlayers).fill('');

      setFormData({
        teamName: '',
        players: emptyPlayers
      });
    } catch (error) {
      console.error('❌ Load tournament error:', error);
      setToast({ message: 'Greška pri učitavanju turnira', type: 'error' });
      setTimeout(() => navigate('/tournaments'), 2000);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePlayerChange = (index, value) => {
    const newPlayers = [...formData.players];
    newPlayers[index] = value;
    setFormData({ ...formData, players: newPlayers });
  };

  const addPlayerField = () => {
    const maxPlayers = tournament.max_players_per_team || 7;
    if (formData.players.length < maxPlayers) {
      setFormData({
        ...formData,
        players: [...formData.players, '']
      });
    }
  };

  const removePlayerField = (index) => {
    const newPlayers = formData.players.filter((_, i) => i !== index);
    setFormData({ ...formData, players: newPlayers });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.teamName) {
      setToast({ message: 'Unesite naziv tima!', type: 'error' });
      return;
    }

    const filledPlayers = formData.players.filter(p => p.trim() !== '');
    const minPlayers = tournament.min_players_per_team || 5;
    const maxPlayers = tournament.max_players_per_team || 7;

    if (filledPlayers.length < minPlayers) {
      setToast({ message: `Potrebno je minimalno ${minPlayers} natjecatelja!`, type: 'error' });
      return;
    }

    if (filledPlayers.length > maxPlayers) {
      setToast({ message: `Maksimalno ${maxPlayers} natjecatelja dozvoljeno!`, type: 'error' });
      return;
    }

    try {
      // Convert player names to objects for backend
      const playersData = filledPlayers.map(name => ({ name }));
      console.log('📤 Registering team:', { teamName: formData.teamName, players: playersData });

      const response = await tournamentsAPI.registerTeam(id, {
        teamName: formData.teamName,
        players: playersData
      });

      console.log('✅ Registration response:', response);

      if (response.data || response.status === 201) {
        setToast({ message: 'Tim uspješno registriran! 🎉', type: 'success' });
        setTimeout(() => navigate(`/tournament/${id}`), 2000);
      } else {
        setToast({ message: 'Greška pri registraciji tima', type: 'error' });
      }
    } catch (error) {
      console.error('❌ Register team error:', error);
      const errorMessage = error.response?.data?.message || 'Greška pri registraciji tima';
      setToast({ message: errorMessage, type: 'error' });
    }
  };

  if (loading) {
    return (
      <div className="tournament-register-page">
        <Navbar />
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Učitavanje turnira...</p>
        </div>
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="tournament-register-page">
        <Navbar />
        <div className="empty-state card">
          <h2>Turnir nije pronađen</h2>
          <button className="btn btn-primary" onClick={() => navigate('/tournaments')}>
            Povratak na turnire
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="tournament-register-page">
      <Navbar />
      
      <div className="register-container">
        <div className="register-card card">
          <div className="register-header">
            <h1>🏆 Registriraj tim</h1>
            <h2>{tournament.name}</h2>
            <p>{tournament.sport} • {tournament.city}</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-section">
              <h3>Informacije o timu</h3>

              <div className="form-group">
                <label>Naziv tima *</label>
                <input
                  type="text"
                  name="teamName"
                  value={formData.teamName}
                  onChange={handleChange}
                  placeholder="npr. Thunder Squad"
                  required
                />
              </div>
            </div>

            <div className="form-section">
              <h3>Natjecatelji ({formData.players.filter(p => p.trim()).length}/{tournament.max_players_per_team || 7})</h3>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '15px', fontSize: '0.95rem' }}>
                Minimalno <strong>{tournament.min_players_per_team || 5}</strong> natjecatelja,
                Maksimalno <strong>{tournament.max_players_per_team || 7}</strong> natjecatelja (uključujući rezerve)
              </p>

              {formData.players.map((playerName, index) => (
                <div key={index} className="player-field">
                  <input
                    type="text"
                    value={playerName}
                    onChange={(e) => handlePlayerChange(index, e.target.value)}
                    placeholder={`Natjecatelj ${index + 1}${index < (tournament.min_players_per_team || 5) ? ' *' : ' (rezerva)'}`}
                  />
                  {formData.players.length > 1 && (
                    <button
                      type="button"
                      className="btn-remove"
                      onClick={() => removePlayerField(index)}
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}

              {formData.players.length < (tournament.max_players_per_team || 7) && (
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={addPlayerField}
                >
                  + Dodaj natjecatelja
                </button>
              )}
            </div>

            {(tournament.entry_fee || 0) > 0 && (
              <div className="fee-notice">
                <p>💰 Kotizacija: <strong>€{(tournament.entry_fee || 0).toFixed(2)}</strong></p>
                <small>Plaćanje na dan turnira</small>
              </div>
            )}

            <div className="form-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => navigate(`/tournament/${id}`)}
              >
                Odustani
              </button>
              <button type="submit" className="btn btn-primary">
                Registriraj tim
              </button>
            </div>
          </form>
        </div>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

export default TournamentRegister;