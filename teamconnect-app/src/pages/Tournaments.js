import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Toast from '../components/Toast';
import { formatPrice } from '../utils/currency';
import { tournamentsAPI } from '../services/api';
import './Tournaments.css';

function Tournaments() {
  const navigate = useNavigate();
  const [tournaments, setTournaments] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [selectedTournament, setSelectedTournament] = useState(null);
  const [toast, setToast] = useState(null);
  const [activeTab, setActiveTab] = useState('active');

  const [formData, setFormData] = useState({
    name: '',
    sport: '',
    location: '',
    city: '',
    country: 'Croatia',
    startDate: '',
    endDate: '',
    maxTeams: 8,
    customMaxTeams: '',
    minPlayersPerTeam: 5,
    maxPlayersPerTeam: 7,
    teamSize: 5,
    format: 'knockout',
    entryFee: 0,
    prize: '',
    description: ''
  });

  const [registerData, setRegisterData] = useState({
    teamName: '',
    players: []
  });

  const sportsList = [
    { id: 'football', name: 'Football' },
    { id: 'basketball', name: 'Basketball' },
    { id: 'volleyball', name: 'Volleyball' }
  ];

  const countries = [
    { id: 'hr', name: 'Croatia', cities: ['Zagreb', 'Split', 'Rijeka', 'Osijek', 'Zadar', 'Slavonski Brod', 'Pula', 'Šibenik', 'Karlovac', 'Rijeka', 'Dubrovnik', 'Varaždin'] },
    { id: 'rs', name: 'Serbia', cities: ['Belgrade', 'Novi Sad', 'Niš', 'Kragujevac', 'Kraljevo'] },
    { id: 'si', name: 'Slovenia', cities: ['Ljubljana', 'Maribor', 'Celje', 'Koper', 'Nova Gorica'] },
    { id: 'ba', name: 'Bosnia', cities: ['Sarajevo', 'Banja Luka', 'Tuzla', 'Zenica', 'Mostar'] },
    { id: 'me', name: 'Montenegro', cities: ['Podgorica', 'Nikšić', 'Budva', 'Bar'] },
    { id: 'mk', name: 'North Macedonia', cities: ['Skopje', 'Bitola', 'Kumanovo', 'Ohrid', 'Strumica', 'Tetovo', 'Veles', 'Štip', 'Prilep', 'Gostivar'] },
    { id: 'al', name: 'Albania', cities: ['Tirana', 'Durrës', 'Vlorë', 'Fier', 'Shkodër', 'Elbasan', 'Kavajë', 'Lezhë'] }
  ];

  const europeanCities = [
    'Zagreb', 'Split', 'Rijeka', 'Osijek', 'Zadar', 'Slavonski Brod', 'Pula', 'Šibenik', 'Karlovac', 'Rijeka', 'Dubrovnik', 'Varaždin',
    'Belgrade', 'Novi Sad', 'Niš', 'Kragujevac', 'Kraljevo',
    'Ljubljana', 'Maribor', 'Celje', 'Koper', 'Nova Gorica',
    'Sarajevo', 'Banja Luka', 'Tuzla', 'Zenica', 'Mostar',
    'Podgorica', 'Nikšić', 'Budva', 'Bar',
    'Skopje', 'Bitola', 'Kumanovo', 'Ohrid', 'Strumica', 'Tetovo', 'Veles', 'Štip', 'Prilep', 'Gostivar',
    'Tirana', 'Durrës', 'Vlorë', 'Fier', 'Shkodër', 'Elbasan', 'Kavajë', 'Lezhë'
  ];

  useEffect(() => {
    loadTournaments();
  }, []);

  const loadTournaments = async () => {
    try {
      const data = await tournamentsAPI.getAllTournaments();
      setTournaments(data);
      console.log(`Fetched ${data.length} tournaments`);
    } catch (error) {
      console.error('Load tournaments error:', error);
      setToast({ message: 'Failed to load tournaments', type: 'error' });
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegisterChange = (e) => {
    setRegisterData({ ...registerData, [e.target.name]: e.target.value });
  };

  const handlePlayerChange = (index, value) => {
    const newPlayers = [...registerData.players];
    newPlayers[index] = { name: value, position: '' };
    setRegisterData({ ...registerData, players: newPlayers });
  };

  const handleCreateTournament = async () => {
    console.log('🚀 Creating tournament with data:', formData);

    if (!formData.name || !formData.sport || !formData.city || !formData.startDate || !formData.endDate || !formData.location) {
      setToast({ message: 'Please fill all required fields!', type: 'error' });
      return;
    }

    // Validation min/max players
    if (parseInt(formData.maxPlayersPerTeam) < parseInt(formData.minPlayersPerTeam)) {
      setToast({ message: 'Maximum players must be greater than or equal to minimum!', type: 'error' });
      return;
    }

    try {
      const response = await tournamentsAPI.createTournament(formData);

      if (response.success) {
        setShowCreateModal(false);
        setFormData({
          name: '',
          sport: '',
          location: '',
          city: '',
          country: 'Croatia',
          startDate: '',
          endDate: '',
          maxTeams: 8,
          customMaxTeams: '',
          minPlayersPerTeam: 5,
          maxPlayersPerTeam: 7,
          teamSize: 5,
          format: 'knockout',
          entryFee: 0,
          prize: '',
          description: ''
        });
        setToast({ message: 'Tournament created successfully! 🏆', type: 'success' });
        loadTournaments();
      } else {
        console.error('Create tournament error:', response);
        setToast({ message: response.message || 'Failed to create tournament', type: 'error' });
      }
    } catch (error) {
      console.error('Create tournament error:', error);
      setToast({ message: 'Failed to create tournament', type: 'error' });
    }
  };

  const handleOpenRegister = (tournament) => {
    setSelectedTournament(tournament);
    
    // ✅ Inicijaliziraj sa maxPlayersPerTeam umjesto teamSize
    const maxPlayers = tournament.maxPlayersPerTeam || tournament.teamSize || 5;
    const emptyPlayers = Array(maxPlayers).fill('').map(() => ({ name: '', position: '' }));
    
    setRegisterData({
      teamName: '',
      players: emptyPlayers
    });
    
    setShowRegisterModal(true);
  };

  const handleRegisterTeam = async () => {
    console.log('🚀 Registering team:', registerData);

    if (!registerData.teamName) {
      setToast({ message: 'Please enter team name!', type: 'error' });
      return;
    }

    // Check min/max players
    const filledPlayers = registerData.players.filter(p => p.name.trim() !== '');
    const minPlayers = selectedTournament.minPlayersPerTeam || selectedTournament.teamSize || 5;
    const maxPlayers = selectedTournament.maxPlayersPerTeam || selectedTournament.teamSize || 5;

    if (filledPlayers.length < minPlayers) {
      setToast({ message: `Minimum players: ${minPlayers}`, type: 'error' });
      return;
    }

    if (filledPlayers.length > maxPlayers) {
      setToast({ message: `Maximum players (with substitutes): ${maxPlayers}`, type: 'error' });
      return;
    }

    try {
      const response = await tournamentsAPI.registerTeam(selectedTournament.id, {
        teamName: registerData.teamName,
        players: filledPlayers
      });

      if (response.success) {
        setShowRegisterModal(false);
        setRegisterData({ teamName: '', players: [] });
        setToast({ message: 'Team registered successfully! 🎉', type: 'success' });
        loadTournaments();
      } else {
        console.error('Register team error:', response);
        setToast({ message: response.message || 'Failed to register team', type: 'error' });
      }
    } catch (error) {
      console.error('Register team error:', error);
      setToast({ message: 'Failed to register team', type: 'error' });
    }
  };

  const filterTournaments = (status) => {
    if (status === 'active') {
      return tournaments.filter(t => t.status === 'active');
    } else if (status === 'upcoming') {
      return tournaments.filter(t => t.status === 'upcoming');
    } else {
      return tournaments.filter(t => t.status === 'finished');
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      active: { text: 'Active', color: '#4caf50' },
      upcoming: { text: 'Upcoming', color: '#ff9800' },
      finished: { text: 'Finished', color: '#999' }
    };
    return badges[status] || badges.upcoming;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const filteredTournaments = filterTournaments(activeTab);

  return (
    <div className="tournaments-page">
      <Navbar />
      
      <div className="tournaments-container">
        <div className="tournaments-header">
          <h1>🏆 Turniri</h1>
          <p>Natjecanja, pobjednici, slava!</p>
          <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
            + Kreiraj turnir
          </button>
        </div>

        <div className="tournaments-tabs">
          <button 
            className={`tab ${activeTab === 'active' ? 'active' : ''}`}
            onClick={() => setActiveTab('active')}
          >
            U tijeku ({filterTournaments('active').length})
          </button>
          <button 
            className={`tab ${activeTab === 'upcoming' ? 'active' : ''}`}
            onClick={() => setActiveTab('upcoming')}
          >
            Uskoro ({filterTournaments('upcoming').length})
          </button>
          <button 
            className={`tab ${activeTab === 'finished' ? 'active' : ''}`}
            onClick={() => setActiveTab('finished')}
          >
            Završeni ({filterTournaments('finished').length})
          </button>
        </div>

        <div className="tournaments-grid">
          {filteredTournaments.length === 0 ? (
            <div className="empty-tournaments card">
              <span className="empty-icon">🏆</span>
              <h2>Nema turnira</h2>
              <p>
                {activeTab === 'active' && 'Trenutno nema aktivnih turnira.'}
                {activeTab === 'upcoming' && 'Nema nadolazećih turnira.'}
                {activeTab === 'finished' && 'Nema završenih turnira.'}
              </p>
              <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
                Kreiraj prvi turnir
              </button>
            </div>
          ) : (
            filteredTournaments.map(tournament => (
              <div key={tournament._id} className="tournament-card card">
                <div className="tournament-header-card">
                  <div className="tournament-sport">{tournament.sport}</div>
                  <div 
                    className="tournament-status"
                    style={{ background: getStatusBadge(tournament.status).color }}
                  >
                    {getStatusBadge(tournament.status).text}
                  </div>
                </div>

                <h3>{tournament.name}</h3>
                
                <div className="tournament-info">
                  <p>📍 {tournament.city}, {tournament.country || 'Hrvatska'}</p>
                  <p>🏟️ {tournament.location}</p>
                  <p>📅 {formatDate(tournament.startDate)} - {formatDate(tournament.endDate)}</p>
                  <p>👥 Format: {tournament.format === 'knockout' ? 'Knockout' : 'Liga'}</p>
                  <p>🎯 Timovi: {tournament.registeredTeams?.length || 0}/{tournament.maxTeams}</p>
                  {/* ✅ NOVO - Prikaz min/max igrača */}
                  <p>👤 Igrači po timu: {tournament.minPlayersPerTeam || tournament.teamSize || 5} - {tournament.maxPlayersPerTeam || tournament.teamSize || 5}</p>
                  {tournament.prize && <p>🏆 Nagrada: {tournament.prize}</p>}
                  {tournament.entryFee > 0 && (
                    <p>💰 Kotizacija: {formatPrice(tournament.entryFee * 7.5345)}</p>
                  )}
                </div>

                {tournament.description && (
                  <p className="tournament-description">{tournament.description}</p>
                )}

                <div className="tournament-progress">
                  <div className="progress-bar">
                    <div 
                      className="progress-fill"
                      style={{ 
                        width: `${((tournament.registeredTeams?.length || 0) / tournament.maxTeams) * 100}%` 
                      }}
                    />
                  </div>
                </div>

                <div className="tournament-actions">
                  {(tournament.registeredTeams?.length || 0) < tournament.maxTeams ? (
                    <button 
                      className="btn btn-primary"
                      onClick={() => handleOpenRegister(tournament)}
                    >
                      Prijavi tim
                    </button>
                  ) : (
                    <button className="btn btn-disabled" disabled>
                      Popunjeno
                    </button>
                  )}
                  <button 
                    className="btn btn-secondary"
                    onClick={() => navigate(`/tournament/${tournament._id}`)}
                  >
                    Detalji
                  </button>
                </div>

                <div className="tournament-creator">
                  Organizator: {tournament.creator?.username || 'Unknown'}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modal za kreiranje turnira */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="create-tournament-modal" onClick={(e) => e.stopPropagation()}>
            <h2>🏆 Kreiraj novi turnir</h2>
            
            <div className="modal-form">
              {/* Naziv turnira */}
              <div className="form-group">
                <label>Naziv turnira *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="npr. Ljetni turnir u malom nogometu"
                  required
                />
              </div>

              {/* Sport i Država */}
              <div className="form-row">
                <div className="form-group">
                  <label>Sport *</label>
                  <select name="sport" value={formData.sport} onChange={handleChange}>
                    <option value="">Odaberi</option>
                    <optgroup label="Popularni">
                      {sportsList.filter(s => s.popular).map(sport => (
                        <option key={sport.id} value={sport.name}>{sport.name}</option>
                      ))}
                    </optgroup>
                    <optgroup label="Ostali">
                      {sportsList.filter(s => !s.popular).map(sport => (
                        <option key={sport.id} value={sport.name}>{sport.name}</option>
                      ))}
                    </optgroup>
                  </select>
                </div>

                <div className="form-group">
                  <label>Država *</label>
                  <select name="country" value={formData.country} onChange={handleChange}>
                    {countries.map(country => (
                      <option key={country} value={country}>{country}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Grad */}
              <div className="form-group">
                <label>Grad *</label>
                <select name="city" value={formData.city} onChange={handleChange}>
                  <option value="">Odaberi</option>
                  {formData.country && europeanCities[formData.country]?.map(city => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
              </div>

              {/* Lokacija/Teren */}
              <div className="form-group">
                <label>Lokacija/Teren *</label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="npr. Stadion Poljud"
                />
              </div>

              {/* Datumi */}
              <div className="form-row">
                <div className="form-group">
                  <label>Početak *</label>
                  <input
                    type="date"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleChange}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>

                <div className="form-group">
                  <label>Kraj *</label>
                  <input
                    type="date"
                    name="endDate"
                    value={formData.endDate}
                    onChange={handleChange}
                    min={formData.startDate}
                  />
                </div>
              </div>

              {/* Broj timova */}
              <div className="form-group">
                <label>Broj timova *</label>
                <select 
                  name="maxTeams" 
                  value={formData.maxTeams} 
                  onChange={handleChange}
                >
                  <option value={4}>4 tima</option>
                  <option value={8}>8 timova</option>
                  <option value={16}>16 timova</option>
                  <option value={32}>32 tima</option>
                  <option value="custom">Custom broj...</option>
                </select>
                {formData.maxTeams === 'custom' && (
                  <input
                    type="number"
                    name="customMaxTeams"
                    value={formData.customMaxTeams}
                    onChange={handleChange}
                    placeholder="Upiši broj timova"
                    min="2"
                    max="128"
                    style={{ marginTop: '10px' }}
                  />
                )}
              </div>

              {/* ✅ NOVO - Min i Max igrača po timu */}
              <div className="form-row">
                <div className="form-group">
                  <label>Min igrača (osnova) *</label>
                  <input
                    type="number"
                    name="minPlayersPerTeam"
                    value={formData.minPlayersPerTeam}
                    onChange={handleChange}
                    min={1}
                    max={22}
                    placeholder="5"
                  />
                  <small style={{ color: '#666', fontSize: '12px' }}>
                    Minimalni broj potreban za igru
                  </small>
                </div>

                <div className="form-group">
                  <label>Max igrača (+ zamjene) *</label>
                  <input
                    type="number"
                    name="maxPlayersPerTeam"
                    value={formData.maxPlayersPerTeam}
                    onChange={handleChange}
                    min={formData.minPlayersPerTeam || 1}
                    max={22}
                    placeholder="7"
                  />
                  <small style={{ color: '#666', fontSize: '12px' }}>
                    Maksimalno sa zamjenama
                  </small>
                </div>
              </div>

              {/* Format i Kotizacija */}
              <div className="form-row">
                <div className="form-group">
                  <label>Format</label>
                  <select name="format" value={formData.format} onChange={handleChange}>
                    <option value="knockout">Knockout (Eliminacije)</option>
                    <option value="league">Liga (Svi protiv svih)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Kotizacija (€)</label>
                  <input
                    type="number"
                    name="entryFee"
                    value={formData.entryFee}
                    onChange={handleChange}
                    min={0}
                    step="0.01"
                    placeholder="0.00"
                  />
                </div>
              </div>

              {/* Nagrada */}
              <div className="form-group">
                <label>Nagrada (opcionalno)</label>
                <input
                  type="text"
                  name="prize"
                  value={formData.prize}
                  onChange={handleChange}
                  placeholder="npr. 1,000 € + trofej"
                />
              </div>

              {/* Opis */}
              <div className="form-group">
                <label>Opis (opcionalno)</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows="3"
                  placeholder="Dodaj dodatne informacije o turniru..."
                />
              </div>

              {/* Buttons */}
              <div className="modal-actions">
                <button className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>
                  Odustani
                </button>
                <button className="btn btn-primary" onClick={handleCreateTournament}>
                  Kreiraj turnir
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal za prijavu tima */}
      {showRegisterModal && selectedTournament && (
        <div className="modal-overlay" onClick={() => setShowRegisterModal(false)}>
          <div className="create-tournament-modal" onClick={(e) => e.stopPropagation()}>
            <h2>🏆 Prijavi tim na {selectedTournament.name}</h2>
            
            <div className="modal-form">
              <div className="form-group">
                <label>Naziv tima *</label>
                <input
                  type="text"
                  name="teamName"
                  value={registerData.teamName}
                  onChange={handleRegisterChange}
                  placeholder="npr. Thunder Squad"
                  required
                />
              </div>

              {/* ✅ NOVO - Prikaz raspona igrača */}
              <p style={{ marginBottom: '10px', fontWeight: 'bold' }}>
                Igrači (min {selectedTournament.minPlayersPerTeam || selectedTournament.teamSize || 5}, max {selectedTournament.maxPlayersPerTeam || selectedTournament.teamSize || 5}):
              </p>

              {registerData.players.map((player, index) => (
                <div key={index} className="form-group">
                  <input
                    type="text"
                    value={player.name}
                    onChange={(e) => handlePlayerChange(index, e.target.value)}
                    placeholder={`Igrač ${index + 1}${index < (selectedTournament.minPlayersPerTeam || selectedTournament.teamSize || 5) ? ' *' : ' (zamjena)'}`}
                  />
                </div>
              ))}

              <div className="modal-actions">
                <button 
                  className="btn btn-secondary" 
                  onClick={() => setShowRegisterModal(false)}
                >
                  Odustani
                </button>
                <button 
                  className="btn btn-primary"
                  onClick={handleRegisterTeam}
                >
                  Prijavi tim
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

export default Tournaments;