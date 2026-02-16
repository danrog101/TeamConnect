import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Toast from '../components/Toast';
import { formatPrice } from '../utils/currency';
import { tournamentsAPI } from '../services/api';
import { getAllSports } from '../data/sports';
import { europeanCities } from '../data/cities';
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
    country: 'Hrvatska',
    startDate: '',
    endDate: '',
    maxTeams: 8,
    customMaxTeams: '',
    minPlayersPerTeam: 5,
    maxPlayersPerTeam: 7,
    teamSize: 5,
    format: 'knockout',
    entryFee: 0,
    extraPlayerFee: 0,
    prize: '',
    description: '',
    gender_category: 'mix',
    gender_preference: 'mix',
    min_skill_level: '',
    max_skill_level: '',
    amateur_only: false
  });

  const [showTeamsModal, setShowTeamsModal] = useState(false);
  const [selectedTeamsList, setSelectedTeamsList] = useState([]);
  const [citySearch, setCitySearch] = useState('');
  const [showCityDropdown, setShowCityDropdown] = useState(false);

  const sportPositions = {
    '⚽ Nogomet': [
      { value: '', label: 'Odaberi poziciju' },
      { value: 'GK', label: 'Golman (GK)' },
      { value: 'DEF', label: 'Branič (DEF)' },
      { value: 'MID', label: 'Vezni (MID)' },
      { value: 'FWD', label: 'Napadač (FWD)' },
      { value: 'SUB', label: 'Zamjena (SUB)' }
    ],
    '🏀 Košarka': [
      { value: '', label: 'Odaberi poziciju' },
      { value: 'PG', label: 'Razigravač (PG)' },
      { value: 'SG', label: 'Bek šuter (SG)' },
      { value: 'SF', label: 'Krilo (SF)' },
      { value: 'PF', label: 'Krilni centar (PF)' },
      { value: 'C', label: 'Centar (C)' },
      { value: 'SUB', label: 'Zamjena (SUB)' }
    ],
    '🏐 Odbojka': [
      { value: '', label: 'Odaberi poziciju' },
      { value: 'SET', label: 'Dizač (SET)' },
      { value: 'OH', label: 'Primač servisa (OH)' },
      { value: 'OPP', label: 'Dijagonala (OPP)' },
      { value: 'MB', label: 'Srednji blok (MB)' },
      { value: 'L', label: 'Libero (L)' },
      { value: 'SUB', label: 'Zamjena (SUB)' }
    ],
    '🤾 Rukomet': [
      { value: '', label: 'Odaberi poziciju' },
      { value: 'GK', label: 'Golman (GK)' },
      { value: 'LW', label: 'Lijevo krilo (LW)' },
      { value: 'RW', label: 'Desno krilo (RW)' },
      { value: 'LB', label: 'Lijevi bek (LB)' },
      { value: 'CB', label: 'Srednji bek (CB)' },
      { value: 'RB', label: 'Desni bek (RB)' },
      { value: 'PIV', label: 'Pivot (PIV)' },
      { value: 'SUB', label: 'Zamjena (SUB)' }
    ]
  };

  const defaultPositions = [
    { value: '', label: 'Odaberi poziciju' },
    { value: 'PLAYER', label: 'Natjecatelj' },
    { value: 'SUB', label: 'Zamjena' }
  ];

  const getPositionsForSport = (sportName) => {
    return sportPositions[sportName] || defaultPositions;
  };

  const [registerData, setRegisterData] = useState({
    teamName: '',
    players: []
  });

  const sportsList = getAllSports();
  const countries = Object.keys(europeanCities).sort((a, b) => a.localeCompare(b, 'hr'));

  useEffect(() => {
    loadTournaments();
  }, []);

  const loadTournaments = async () => {
    try {
      const response = await tournamentsAPI.getAllTournaments();
      
      // ✅ Handle axios response format
      const data = response.data || response || [];
      
      console.log('✅ Fetched tournaments:', data.length);
      setTournaments(data);
    } catch (error) {
      console.error('❌ Load tournaments error:', error);
      setToast({ message: 'Greška pri učitavanju turnira', type: 'error' });
      setTournaments([]); // Set empty array on error
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCitySearch = (value) => {
    setCitySearch(value);
    setFormData({ ...formData, city: value });
    setShowCityDropdown(true);
  };

  const handleCitySelect = (city) => {
    setFormData({ ...formData, city });
    setCitySearch(city);
    setShowCityDropdown(false);
  };

  const handleRegisterChange = (e) => {
    setRegisterData({ ...registerData, [e.target.name]: e.target.value });
  };

  const handlePlayerChange = (index, field, value) => {
    const newPlayers = [...registerData.players];
    newPlayers[index] = { ...newPlayers[index], [field]: value };
    setRegisterData({ ...registerData, players: newPlayers });
  };

  const handleViewTeams = (tournament) => {
    setSelectedTeamsList(tournament.registered_teams_list || []);
    setShowTeamsModal(true);
  };

  const getGenderCategoryLabel = (category) => {
    const labels = { male: 'Muški', female: 'Ženski', mix: 'Mješoviti' };
    return labels[category] || 'Mješoviti';
  };

  const handleCreateTournament = async () => {
    console.log('🚀 Creating tournament with data:', formData);

    if (!formData.name || !formData.sport || !formData.city || !formData.startDate || !formData.endDate || !formData.location) {
      setToast({ message: 'Molimo popunite sva obavezna polja!', type: 'error' });
      return;
    }

    if (new Date(formData.endDate) < new Date(formData.startDate)) {
      setToast({ message: 'Datum završetka ne može biti prije datuma početka!', type: 'error' });
      return;
    }

    // Validation min/max players
    if (parseInt(formData.maxPlayersPerTeam) < parseInt(formData.minPlayersPerTeam)) {
      setToast({ message: 'Maksimalan broj natjecatelja mora biti veći ili jednak minimumu!', type: 'error' });
      return;
    }

    try {
      const response = await tournamentsAPI.createTournament(formData);

      if (response.data) {
        setShowCreateModal(false);
        setCitySearch('');
        setFormData({
          name: '',
          sport: '',
          location: '',
          city: '',
          country: 'Hrvatska',
          startDate: '',
          endDate: '',
          maxTeams: 8,
          customMaxTeams: '',
          minPlayersPerTeam: 5,
          maxPlayersPerTeam: 7,
          teamSize: 5,
          format: 'knockout',
          entryFee: 0,
          extraPlayerFee: 0,
          prize: '',
          description: '',
          gender_category: 'mix',
          gender_preference: 'mix',
          min_skill_level: '',
          max_skill_level: '',
          amateur_only: false
        });
        setToast({ message: 'Turnir uspješno kreiran! 🏆', type: 'success' });
        loadTournaments();
      } else {
        console.error('Create tournament error:', response);
        setToast({ message: response.message || 'Greška pri kreiranju turnira', type: 'error' });
      }
    } catch (error) {
      console.error('Create tournament error:', error);
      setToast({ message: 'Greška pri kreiranju turnira', type: 'error' });
    }
  };

  const handleOpenRegister = (tournament) => {
    setSelectedTournament(tournament);
    
    const maxPlayers = tournament.max_players_per_team || tournament.maxPlayersPerTeam || tournament.teamSize || 5;
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
      setToast({ message: 'Molimo unesite naziv tima!', type: 'error' });
      return;
    }

    const filledPlayers = registerData.players.filter(p => p.name.trim() !== '');
    const minPlayers = selectedTournament.min_players_per_team || selectedTournament.minPlayersPerTeam || selectedTournament.teamSize || 5;
    const maxPlayers = selectedTournament.max_players_per_team || selectedTournament.maxPlayersPerTeam || selectedTournament.teamSize || 5;

    if (filledPlayers.length < minPlayers) {
      setToast({ message: `Minimalno natjecatelja: ${minPlayers}`, type: 'error' });
      return;
    }

    if (filledPlayers.length > maxPlayers) {
      setToast({ message: `Maksimalno natjecatelja (uključujući zamjene): ${maxPlayers}`, type: 'error' });
      return;
    }

    try {
      await tournamentsAPI.registerTeam(selectedTournament.id, {
        teamName: registerData.teamName,
        players: filledPlayers
      });

      setShowRegisterModal(false);
      setRegisterData({ teamName: '', players: [] });
      setToast({ message: 'Tim uspješno prijavljen! 🎉', type: 'success' });
      loadTournaments();
    } catch (error) {
      console.error('Register team error:', error);
      const errorMessage = error.response?.data?.message || 'Greška pri prijavi tima';
      setToast({ message: errorMessage, type: 'error' });
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
      active: { text: 'Aktivan', color: '#4caf50' },
      upcoming: { text: 'Nadolazeći', color: '#ff9800' },
      finished: { text: 'Završen', color: '#999' }
    };
    return badges[status] || badges.upcoming;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('hr-HR', {
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
            filteredTournaments.map(tournament => {
              const registeredCount = tournament.registered_teams || 0;
              const maxTeams = tournament.max_teams || tournament.maxTeams || 8;
              const isFull = registeredCount >= maxTeams;
              const waitlistCount = tournament.waitlist_count || 0;

              return (
                <div key={tournament.id} className="tournament-card card">
                  <div className="tournament-header-card">
                    <div className="tournament-sport">{tournament.sport}</div>
                    <div className="tournament-badges">
                      {tournament.gender_category && tournament.gender_category !== 'mix' && (
                        <div className="gender-badge" style={{ background: tournament.gender_category === 'male' ? '#2196f3' : '#e91e63' }}>
                          {getGenderCategoryLabel(tournament.gender_category)}
                        </div>
                      )}
                      <div
                        className="tournament-status"
                        style={{ background: getStatusBadge(tournament.status).color }}
                      >
                        {getStatusBadge(tournament.status).text}
                      </div>
                    </div>
                  </div>

                  <h3>{tournament.name}</h3>

                  <div className="tournament-info">
                    <p>📍 {tournament.city}, {tournament.country || 'Hrvatska'}</p>
                    <p>🏟️ {tournament.location}</p>
                    <p>📅 {formatDate(tournament.start_date || tournament.startDate)} - {formatDate(tournament.end_date || tournament.endDate)}</p>
                    <p>👥 Format: {tournament.format === 'knockout' ? 'Knockout' : 'Liga'}</p>
                    <p>
                      🎯 Timovi: <strong>{registeredCount}/{maxTeams}</strong>
                      {waitlistCount > 0 && <span className="waitlist-badge"> (+{waitlistCount} na listi čekanja)</span>}
                    </p>
                    <p>👤 Igrači po timu: {tournament.min_players_per_team || 5} - {tournament.max_players_per_team || 7}</p>
                    {tournament.prize && <p>🏆 Nagrada: {tournament.prize}</p>}
                    {(tournament.entry_fee || 0) > 0 && (
                      <p>💰 Kotizacija: {formatPrice(tournament.entry_fee * 7.5345)}</p>
                    )}
                  </div>

                  {tournament.description && (
                    <p className="tournament-description">{tournament.description}</p>
                  )}

                  {/* Registered Teams Preview */}
                  {tournament.registered_teams_list && tournament.registered_teams_list.length > 0 && (
                    <div className="registered-teams-preview">
                      <p><strong>Prijavljeni timovi:</strong></p>
                      <div className="teams-chips">
                        {tournament.registered_teams_list.slice(0, 3).map((team, idx) => (
                          <span key={idx} className="team-chip">{team.team_name}</span>
                        ))}
                        {tournament.registered_teams_list.length > 3 && (
                          <span className="team-chip more" onClick={() => handleViewTeams(tournament)}>
                            +{tournament.registered_teams_list.length - 3} više
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="tournament-progress">
                    <div className="progress-bar">
                      <div
                        className="progress-fill"
                        style={{ width: `${(registeredCount / maxTeams) * 100}%` }}
                      />
                    </div>
                  </div>

                  <div className="tournament-actions">
                    {!isFull ? (
                      <button
                        className="btn btn-primary"
                        onClick={() => handleOpenRegister(tournament)}
                      >
                        Prijavi tim
                      </button>
                    ) : (
                      <button
                        className="btn btn-warning"
                        onClick={() => handleOpenRegister(tournament)}
                      >
                        Lista čekanja
                      </button>
                    )}
                    <button
                      className="btn btn-secondary"
                      onClick={() => navigate(`/tournament/${tournament.id}`)}
                    >
                      Detalji
                    </button>
                  </div>

                  <div className="tournament-creator">
                    Organizator: {tournament.creator?.username || 'Unknown'}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Modal za kreiranje turnira */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => { setShowCreateModal(false); setCitySearch(''); }}>
          <div className="create-tournament-modal" onClick={(e) => e.stopPropagation()}>
            <h2>🏆 Kreiraj novi turnir</h2>
            
            <div className="modal-form">
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

              <div className="form-group">
                <label>Grad *</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    value={citySearch || formData.city}
                    onChange={(e) => handleCitySearch(e.target.value)}
                    onFocus={() => setShowCityDropdown(true)}
                    onBlur={() => setTimeout(() => setShowCityDropdown(false), 200)}
                    placeholder="Upiši ili odaberi grad..."
                  />
                  {showCityDropdown && (
                    <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'var(--card-bg, white)', border: '1px solid #ddd', borderRadius: '8px', maxHeight: '200px', overflowY: 'auto', zIndex: 10 }}>
                      {((formData.country && europeanCities[formData.country]) || [])
                        .filter(city => !citySearch || city.toLowerCase().includes(citySearch.toLowerCase()))
                        .slice(0, 10)
                        .map((city, index) => (
                          <div
                            key={index}
                            style={{ padding: '8px 12px', cursor: 'pointer' }}
                            onMouseDown={() => handleCitySelect(city)}
                          >
                            {city}
                          </div>
                        ))
                      }
                    </div>
                  )}
                </div>
              </div>

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

                <div className="form-group">
                  <label>Naknada za dodatnog igrača (€)</label>
                  <input
                    type="number"
                    name="extraPlayerFee"
                    value={formData.extraPlayerFee}
                    onChange={handleChange}
                    min={0}
                    step="0.01"
                    placeholder="0.00"
                  />
                  <small style={{ color: '#666', fontSize: '12px' }}>Naknada za svakog igrača iznad minimuma</small>
                </div>
              </div>

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

              {/* Tournament Category */}
              <div className="form-group">
                <label>Kategorija turnira *</label>
                <select
                  name="gender_category"
                  value={formData.gender_category}
                  onChange={handleChange}
                >
                  <option value="mix">Mješoviti turnir</option>
                  <option value="male">Muški turnir</option>
                  <option value="female">Ženski turnir</option>
                </select>
                <small style={{ color: '#666', fontSize: '12px' }}>
                  Tip turnira - muški, ženski ili mješoviti
                </small>
              </div>

              {/* Player Filtering Options */}
              <div className="filter-section">
                <h4>🎯 Filteri za igrače/timove</h4>

                <div className="form-row">
                  <div className="form-group">
                    <label>Spol igrača</label>
                    <select
                      name="gender_preference"
                      value={formData.gender_preference}
                      onChange={handleChange}
                    >
                      <option value="mix">Mješovito (svi)</option>
                      <option value="male">Samo muškarci</option>
                      <option value="female">Samo žene</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input
                        type="checkbox"
                        name="amateur_only"
                        checked={formData.amateur_only}
                        onChange={(e) => setFormData({ ...formData, amateur_only: e.target.checked })}
                        style={{ width: '18px', height: '18px' }}
                      />
                      Samo amateri
                    </label>
                    <small style={{ color: '#666', fontSize: '12px' }}>Igrači s ratingom manjim od 60%</small>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Min. razina vještine</label>
                    <select
                      name="min_skill_level"
                      value={formData.min_skill_level}
                      onChange={handleChange}
                    >
                      <option value="">Bez ograničenja</option>
                      <option value="1">1 - Početnik</option>
                      <option value="2">2 - Srednji</option>
                      <option value="3">3 - Napredni</option>
                      <option value="4">4 - Ekspert</option>
                      <option value="5">5 - Pro</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Max. razina vještine</label>
                    <select
                      name="max_skill_level"
                      value={formData.max_skill_level}
                      onChange={handleChange}
                    >
                      <option value="">Bez ograničenja</option>
                      <option value="1">1 - Početnik</option>
                      <option value="2">2 - Srednji</option>
                      <option value="3">3 - Napredni</option>
                      <option value="4">4 - Ekspert</option>
                      <option value="5">5 - Pro</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="modal-actions">
                <button className="btn btn-secondary" onClick={() => { setShowCreateModal(false); setCitySearch(''); }}>
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

              <p style={{ marginBottom: '10px', fontWeight: 'bold' }}>
                Natjecatelji (min {selectedTournament.min_players_per_team || 5}, max {selectedTournament.max_players_per_team || 7}):
              </p>

              {registerData.players.map((player, index) => (
                <div key={index} className="player-input-row">
                  <input
                    type="text"
                    value={player.name}
                    onChange={(e) => handlePlayerChange(index, 'name', e.target.value)}
                    placeholder={`Natjecatelj ${index + 1}${index < (selectedTournament.min_players_per_team || 5) ? ' *' : ' (zamjena)'}`}
                    className="player-name-input"
                  />
                  <select
                    value={player.position}
                    onChange={(e) => handlePlayerChange(index, 'position', e.target.value)}
                    className="player-position-select"
                  >
                    {(getPositionsForSport(selectedTournament?.sport) || defaultPositions).map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
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

      {/* Modal za prikaz svih timova */}
      {showTeamsModal && (
        <div className="modal-overlay" onClick={() => setShowTeamsModal(false)}>
          <div className="teams-modal" onClick={(e) => e.stopPropagation()}>
            <h2>👥 Prijavljeni timovi</h2>

            {selectedTeamsList.length === 0 ? (
              <p className="no-teams">Nema prijavljenih timova.</p>
            ) : (
              <div className="teams-list">
                {selectedTeamsList.map((team, idx) => (
                  <div key={team.id || idx} className={`team-card-item ${team.is_waitlist ? 'waitlist' : ''}`}>
                    <div className="team-card-header">
                      <h4>{team.team_name}</h4>
                      {team.is_waitlist && <span className="waitlist-tag">Lista čekanja</span>}
                    </div>
                    <div className="team-players">
                      {(team.players || []).map((player, pIdx) => (
                        <div key={pIdx} className="player-item">
                          <span className="player-name">{player.name || player}</span>
                          {player.position && (
                            <span className="player-position-tag">{player.position}</span>
                          )}
                        </div>
                      ))}
                    </div>
                    <div className="team-meta">
                      Prijavljeno: {new Date(team.registered_at).toLocaleDateString('hr-HR')}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowTeamsModal(false)}>
                Zatvori
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

export default Tournaments;