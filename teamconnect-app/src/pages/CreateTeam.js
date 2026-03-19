import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';
import Navbar from '../components/Navbar';
import Toast from '../components/Toast';
import { getAllSports, addCustomSport } from '../data/sports';
import { europeanCities, searchCities, addCustomCity } from '../data/cities';
import './CreateTeam.css';
 const { language } = useLanguage(); // dodaj import useLanguage ako već nije
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

function CreateTeam() {
  
  const navigate = useNavigate();
 
  const [toast, setToast] = useState(null);
  const [showCustomSportModal, setShowCustomSportModal] = useState(false);
  const [customSportName, setCustomSportName] = useState('');
  const [citySearch, setCitySearch] = useState('');
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    sport: '',
    country: 'Hrvatska',
    city: '',
    location: '',
    date: '',
    time: '',
    maxPlayers: 10,
    description: '',
    gender_preference: 'mix',
    min_skill_level: '',
    max_skill_level: '',
    amateur_only: false,
    join_as_player: false,
    position: ''
  });

  const sportsList = getAllSports();
  const countries = Object.keys(europeanCities).sort((a, b) => a.localeCompare(b, 'hr'));

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    
    // Reset city when country changes
    if (name === 'country') {
      setFormData({ ...formData, country: value, city: '' });
      setCitySearch('');
    }
  };

  const handleCitySearch = (value) => {
    setCitySearch(value);
    setShowCityDropdown(true);
  };

  const handleCitySelect = (city, country) => {
    setFormData({ ...formData, city, country });
    setCitySearch(city);
    setShowCityDropdown(false);
  };

  const handleAddCustomSport = () => {
    if (!customSportName.trim()) {
      setToast({ message: 'Upiši naziv sporta!', type: 'error' });
      return;
    }

    const newSport = addCustomSport(customSportName);
    setFormData({ ...formData, sport: newSport.name });
    setCustomSportName('');
    setShowCustomSportModal(false);
    setToast({ message: `Sport "${customSportName}" dodan! 🎉`, type: 'success' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.sport || !formData.city || !formData.date || !formData.time) {
      setToast({ message: 'Popuni sva obavezna polja!', type: 'error' });
      return;
    }

    // Prepare data for backend
    const submitData = {
      name: formData.name,
      sport: formData.sport,
      country: formData.country,
      city: formData.city,
      location: formData.location,
      date: formData.date,
      time: formData.time,
      max_players: formData.maxPlayers,
      description: formData.description,
      gender_preference: formData.gender_preference,
      min_skill_level: formData.min_skill_level ? parseInt(formData.min_skill_level) : null,
      max_skill_level: formData.max_skill_level ? parseInt(formData.max_skill_level) : null,
      amateur_only: formData.amateur_only,
      join_as_player: formData.join_as_player,
      position: formData.join_as_player ? formData.position : null
    };

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/teams`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(submitData)
      });

      const data = await response.json();

      if (response.ok) {
        setToast({ message: 'Tim uspješno kreiran! 🎉', type: 'success' });
        setTimeout(() => navigate('/my-teams'), 2000);
      } else {
        setToast({ message: data.message || 'Greška pri kreiranju tima', type: 'error' });
      }
    } catch (error) {
      console.error('Create team error:', error);
      setToast({ message: 'Greška pri kreiranju tima', type: 'error' });
    }
  };
  const [showCustomCityModal, setShowCustomCityModal] = useState(false);
const [customCityData, setCustomCityData] = useState({
  cityName: '',
  countryName: ''
});

const handleAddCustomCity = () => {
  if (!customCityData.cityName.trim() || !customCityData.countryName.trim()) {
    setToast({ message: 'Popuni naziv grada i države!', type: 'error' });
    return;
  }

  const newCity = addCustomCity(customCityData.cityName, customCityData.countryName);
  setFormData({ 
    ...formData, 
    city: newCity.city, 
    country: newCity.country 
  });
  setCitySearch(newCity.city);
  setCustomCityData({ cityName: '', countryName: '' });
  setShowCustomCityModal(false);
  setToast({ message: `Grad "${customCityData.cityName}" dodan! 🎉`, type: 'success' });
};
  const filteredCities = citySearch 
    ? searchCities(citySearch).slice(0, 10)
    : [];

  return (
    <div className="create-team-page">
      <Navbar />
      
      <div className="create-team-container">
        <div className="create-team-card card">
          <h1>⚽ {language === 'en' ? 'Create New Team' : 'Kreiraj novi tim'}</h1>
<p className="subtitle">{language === 'en' ? 'Organize a match and invite players' : 'Organiziraj utakmicu i pozovi igrače'}</p>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>{t('createTeam.teamNameLabel')}</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="npr. Večernja utakmica na Poljudu"
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
               <label>{t('createTeam.sportLabel')}</label>
                <div className="sport-select-wrapper">
                  <select name="sport" value={formData.sport} onChange={handleChange} required>
                    <option value="">Odaberi sport</option>
                    <optgroup label="Popularni sportovi">
                      {sportsList.filter(s => s.popular).map(sport => (
                        <option key={sport.id} value={sport.name}>{sport.name}</option>
                      ))}
                    </optgroup>
                    <optgroup label="Ostali sportovi">
                      {sportsList.filter(s => !s.popular).map(sport => (
                        <option key={sport.id} value={sport.name}>{sport.name}</option>
                      ))}
                    </optgroup>
                  </select>
                  <button 
                    type="button"
                    className="btn btn-secondary btn-small"
                    onClick={() => setShowCustomSportModal(true)}
                    style={{ marginTop: '10px' }}
                  >
                    + Dodaj novi sport
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label>{t('createTeam.countryLabel')}</label>
                <select name="country" value={formData.country} onChange={handleChange} required>
                  {countries.map(country => (
                    <option key={country} value={country}>{country}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>{t('createTeam.cityLabel')}</label>
              <div className="city-search-wrapper">
                <input
                  type="text"
                  value={citySearch}
                  onChange={(e) => handleCitySearch(e.target.value)}
                  onFocus={() => setShowCityDropdown(true)}
                  placeholder="Pretraži grad..."
                  required
                />
                {showCityDropdown && filteredCities.length > 0 && (
                  <div className="city-dropdown">
                    {filteredCities.map((item, index) => (
                      <div 
                        key={index}
                        className="city-item"
                        onClick={() => handleCitySelect(item.city, item.country)}
                      >
                        <span className="city-name">{item.city}</span>
                        <span className="city-country">{item.country}</span>
                      </div>
                    ))}
                     <button 
    type="button"
    className="btn btn-secondary btn-small"
    onClick={() => setShowCustomCityModal(true)}
    style={{ marginTop: '10px' }}
  >
    + Dodaj novi grad
  </button>
                  </div>
                )}
                {formData.country && !citySearch && (
                  <div className="city-dropdown">
                    {europeanCities[formData.country]?.slice(0, 10).map((city, index) => (
                      <div 
                        key={index}
                        className="city-item"
                        onClick={() => handleCitySelect(city, formData.country)}
                      >
                        <span className="city-name">{city}</span>
                        <span className="city-country">{formData.country}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="form-group">
              <label>{t('createTeam.locationLabel')}</label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="npr. Stadion Poljud, Ulica Vice Vukova 6"
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Datum *</label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  min={new Date().toISOString().split('T')[0]}
                  required
                />
              </div>

              <div className="form-group">
                <label>Vrijeme *</label>
                <input
                  type="time"
                  name="time"
                  value={formData.time}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>{t('createTeam.maxPlayersLabel')}</label>
              <input
                type="number"
                name="maxPlayers"
                value={formData.maxPlayers}
                onChange={handleChange}
                min="2"
                max="50"
              />
            </div>

            <div className="form-group join-as-player-option">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="join_as_player"
                  checked={formData.join_as_player}
                  onChange={(e) => setFormData({ ...formData, join_as_player: e.target.checked, position: '' })}
                />
                <span className="checkbox-text">Pridruži se kao igrač</span>
              </label>
              <small>Ako označiš ovu opciju, bit ćeš registriran kao igrač u timu. Inače ćeš biti samo kreator/organizator.</small>
            </div>

            {formData.join_as_player && (
              <div className="form-group position-select">
                <label>Tvoja pozicija u timu</label>
                <input
                  type="text"
                  name="position"
                  value={formData.position}
                  onChange={handleChange}
                  placeholder="npr. Napadač, Vratar, Centar, Playmaker..."
                />
                <small>Upiši poziciju na kojoj želiš igrati (opcionalno)</small>
              </div>
            )}

            {/* Player Filtering Options */}
            <div className="filter-section">
              <h3>🎯 Filteri za igrače</h3>
              <p className="filter-description">Postavi uvjete tko se može pridružiti timu</p>

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
                  <label>
                    <input
                      type="checkbox"
                      name="amateur_only"
                      checked={formData.amateur_only}
                      onChange={(e) => setFormData({ ...formData, amateur_only: e.target.checked })}
                    />
                    {' '}Samo amateri
                  </label>
                  <small>Igrači s ratingom manjim od 60%</small>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>{t('createTeam.minPlayersLabel')}</label>
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

            <div className="form-group">
              <label>{t('createTeam.descriptionLabel')}</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows="4"
                placeholder="Dodaj dodatne informacije o utakmici..."
              />
            </div>

            <div className="form-actions">
              <button type="button" className="btn btn-secondary" onClick={() => navigate('/dashboard')}>
                Odustani
              </button>
              <button type="submit" className="btn btn-primary">
                Kreiraj tim
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Modal za custom sport */}
      {showCustomSportModal && (
        <div className="modal-overlay" onClick={() => setShowCustomSportModal(false)}>
          <div className="custom-sport-modal" onClick={(e) => e.stopPropagation()}>
            <h2>➕ Dodaj novi sport</h2>
            <p>Ne vidiš svoj sport na listi? Dodaj ga!</p>
            
            <div className="form-group">
              <label>Naziv sporta</label>
              <input
                type="text"
                value={customSportName}
                onChange={(e) => setCustomSportName(e.target.value)}
                placeholder="npr. Padel, Squash, Paintball..."
                autoFocus
              />
            </div>

            <div className="modal-actions">
              <button 
                className="btn btn-secondary"
                onClick={() => setShowCustomSportModal(false)}
              >
                Odustani
              </button>
              <button 
                className="btn btn-primary"
                onClick={handleAddCustomSport}
              >
                Dodaj sport
              </button>
            </div>
          </div>
        </div>
      )}
      {showCustomCityModal && (
  <div className="modal-overlay" onClick={() => setShowCustomCityModal(false)}>
    <div className="custom-sport-modal" onClick={(e) => e.stopPropagation()}>
      <h2>🏙️ Dodaj novi grad</h2>
      <p>Ne vidiš svoj grad na listi? Dodaj ga!</p>
      
      <div className="form-group">
        <label>Naziv grada</label>
        <input
          type="text"
          value={customCityData.cityName}
          onChange={(e) => setCustomCityData({ ...customCityData, cityName: e.target.value })}
          placeholder="npr. Mostar, Luxembourg..."
          autoFocus
        />
      </div>

      <div className="form-group">
        <label>Država</label>
        <input
          type="text"
          value={customCityData.countryName}
          onChange={(e) => setCustomCityData({ ...customCityData, countryName: e.target.value })}
          placeholder="npr. Bosna i Hercegovina"
        />
      </div>

      <div className="modal-actions">
        <button 
          className="btn btn-secondary"
          onClick={() => setShowCustomCityModal(false)}
        >
          Odustani
        </button>
        <button 
          className="btn btn-primary"
          onClick={handleAddCustomCity}
        >
          Dodaj grad
        </button>
      </div>
    </div>
  </div>
)}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

export default CreateTeam;