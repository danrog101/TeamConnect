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
      const emptyPlayers = Array(maxPlayers).fill('').map(() => ({ name: '', position: '' }));
      
      setFormData({
        teamName: '',
        players: emptyPlayers
      });
    } catch (error) {
      console.error('❌ Load tournament error:', error);
      setToast({ message: 'Failed to load tournament', type: 'error' });
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
    newPlayers[index] = { name: value, position: '' };
    setFormData({ ...formData, players: newPlayers });
  };

  const addPlayerField = () => {
    const maxPlayers = tournament.max_players_per_team || 7;
    if (formData.players.length < maxPlayers) {
      setFormData({ 
        ...formData, 
        players: [...formData.players, { name: '', position: '' }] 
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
      setToast({ message: 'Please enter team name!', type: 'error' });
      return;
    }

    const filledPlayers = formData.players.filter(p => p.name.trim() !== '');
    const minPlayers = tournament.min_players_per_team || 5;
    const maxPlayers = tournament.max_players_per_team || 7;

    if (filledPlayers.length < minPlayers) {
      setToast({ message: `Minimum ${minPlayers} players required!`, type: 'error' });
      return;
    }

    if (filledPlayers.length > maxPlayers) {
      setToast({ message: `Maximum ${maxPlayers} players allowed!`, type: 'error' });
      return;
    }

    try {
      console.log('📤 Registering team:', { teamName: formData.teamName, players: filledPlayers });
      
      const response = await tournamentsAPI.registerTeam(id, {
        teamName: formData.teamName,
        players: filledPlayers
      });

      console.log('✅ Registration response:', response);

      if (response.data || response.status === 201) {
        setToast({ message: 'Team registered successfully! 🎉', type: 'success' });
        setTimeout(() => navigate(`/tournament/${id}`), 2000);
      } else {
        setToast({ message: 'Failed to register team', type: 'error' });
      }
    } catch (error) {
      console.error('❌ Register team error:', error);
      const errorMessage = error.response?.data?.message || 'Failed to register team';
      setToast({ message: errorMessage, type: 'error' });
    }
  };

  if (loading) {
    return (
      <div className="tournament-register-page">
        <Navbar />
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading tournament...</p>
        </div>
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="tournament-register-page">
        <Navbar />
        <div className="empty-state card">
          <h2>Tournament not found</h2>
          <button className="btn btn-primary" onClick={() => navigate('/tournaments')}>
            Back to Tournaments
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
            <h1>🏆 Register Team</h1>
            <h2>{tournament.name}</h2>
            <p>{tournament.sport} • {tournament.city}</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-section">
              <h3>Team Information</h3>
              
              <div className="form-group">
                <label>Team Name *</label>
                <input
                  type="text"
                  name="teamName"
                  value={formData.teamName}
                  onChange={handleChange}
                  placeholder="e.g. Thunder Squad"
                  required
                />
              </div>
            </div>

            <div className="form-section">
              <h3>Players ({formData.players.filter(p => p.name.trim()).length}/{tournament.max_players_per_team || 7})</h3>
              <p style={{ color: '#666', marginBottom: '15px', fontSize: '0.95rem' }}>
                Minimum <strong>{tournament.min_players_per_team || 5}</strong> players, 
                Maximum <strong>{tournament.max_players_per_team || 7}</strong> players (including substitutes)
              </p>
              
              {formData.players.map((player, index) => (
                <div key={index} className="player-field">
                  <input
                    type="text"
                    value={player.name}
                    onChange={(e) => handlePlayerChange(index, e.target.value)}
                    placeholder={`Player ${index + 1}${index < (tournament.min_players_per_team || 5) ? ' *' : ' (substitute)'}`}
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
                  + Add Player
                </button>
              )}
            </div>

            {(tournament.entry_fee || 0) > 0 && (
              <div className="fee-notice">
                <p>💰 Entry Fee: <strong>€{(tournament.entry_fee || 0).toFixed(2)}</strong></p>
                <small>Payment on tournament day</small>
              </div>
            )}

            <div className="form-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => navigate(`/tournament/${id}`)}
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                Register Team
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