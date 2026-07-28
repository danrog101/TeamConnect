import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';
import Navbar from '../components/Navbar';
import Toast from '../components/Toast';
import { getAllSports, addCustomSport } from '../data/sports';
import { europeanCities, searchCities, addCustomCity } from '../data/cities';
import { teamsAPI } from '../services/api';
import './CreateTeam.css';

function EditTeam() {
  const { teamId } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();

  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCustomSportModal, setShowCustomSportModal] = useState(false);
  const [showCustomCityModal, setShowCustomCityModal] = useState(false);
  const [customSportName, setCustomSportName] = useState('');
  const [citySearch, setCitySearch] = useState('');
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [customCityData, setCustomCityData] = useState({ cityName: '', countryName: '' });

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
  });

  const sportsList = getAllSports();
  const countries = Object.keys(europeanCities).sort((a, b) => a.localeCompare(b, 'hr'));

  useEffect(() => {
    const fetchTeam = async () => {
      try {
        const response = await teamsAPI.getOne(teamId);
        const team = response.data;
        setFormData({
          name: team.name || '',
          sport: team.sport || '',
          country: team.country || 'Hrvatska',
          city: team.city || '',
          location: team.location || '',
          date: team.date ? new Date(team.date).toISOString().split('T')[0] : '',
          time: team.time || '',
          maxPlayers: team.max_players || 10,
          description: team.description || '',
          gender_preference: team.gender_preference || 'mix',
          min_skill_level: team.min_skill_level || '',
          max_skill_level: team.max_skill_level || '',
          amateur_only: team.amateur_only || false,
        });
        setCitySearch(team.city || '');
      } catch (error) {
        console.error('Fetch team error:', error);
        setToast({ message: 'Greška pri učitavanju tima', type: 'error' });
      } finally {
        setLoading(false);
      }
    };
    fetchTeam();
  }, [teamId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'country') {
      setFormData({ ...formData, country: value, city: '' });
      setCitySearch('');
    } else {
      setFormData({ ...formData, [name]: value });
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

  const handleAddCustomCity = () => {
    if (!customCityData.cityName.trim() || !customCityData.countryName.trim()) {
      setToast({ message: 'Popuni naziv grada i države!', type: 'error' });
      return;
    }
    const newCity = addCustomCity(customCityData.cityName, customCityData.countryName);
    setFormData({ ...formData, city: newCity.city, country: newCity.country });
    setCitySearch(newCity.city);
    setCustomCityData({ cityName: '', countryName: '' });
    setShowCustomCityModal(false);
    setToast({ message: `Grad "${customCityData.cityName}" dodan! 🎉`, type: 'success' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.sport || !formData.city || !formData.date || !formData.time) {
      setToast({ message: 'Popuni sva obavezna polja!', type: 'error' });
      return;
    }

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
    };

    try {
      await teamsAPI.update(teamId, submitData);
      setToast({ message: 'Tim uspješno ažuriran! ✅', type: 'success' });
      setTimeout(() => navigate('/my-teams'), 2000);
    } catch (error) {
      console.error('Update team error:', error);
      setToast({ message: 'Greška pri ažuriranju tima', type: 'error' });
    }
  };

  const filteredCities = citySearch ? searchCities(citySearch).slice(0, 10) : [];

  if (loading) {
    return (
      <div className="create-team-page">
        <Navbar />
        <div style={{ display: 'flex', justifyContent: 'center', padding: '80px' }}>
          <div className="loading-spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="create-team-page">
      <Navbar />

      <div className="create-team-container">
        <div className="create-team-card card">
          <h1>✏️ Uredi tim</h1>
          <p className="subtitle">Ažuriraj informacije o svom timu</p>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Naziv tima *</label>
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
                <label>Sport *</label>
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
                <label>Država *</label>
                <select name="country" value={formData.country} onChange={handleChange} required>
                  {countries.map(country => (
                    <option key={country} value={country}>{country}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Grad *</label>
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
              <label>Maksimalan broj igrača</label>
              <input
                type="number"
                name="maxPlayers"
                value={formData.maxPlayers}
                onChange={handleChange}
                min="2"
                max="50"
              />
            </div>

            <div className="filter-section">
              <h3>🎯 Filteri za igrače</h3>
              <p className="filter-description">Postavi uvjete tko se može pridružiti timu</p>

              <div className="form-row">
                <div className="form-group">
                  <label>Spol igrača</label>
                  <select name="gender_preference" value={formData.gender_preference} onChange={handleChange}>
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
                  <label>Min. razina vještine</label>
                  <select name="min_skill_level" value={formData.min_skill_level} onChange={handleChange}>
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
                  <select name="max_skill_level" value={formData.max_skill_level} onChange={handleChange}>
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
              <label>Opis (opcionalno)</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows="4"
                placeholder="Dodaj dodatne informacije o utakmici..."
              />
            </div>

            <div className="form-actions">
              <button type="button" className="btn btn-secondary" onClick={() => navigate('/my-teams')}>
                Odustani
              </button>
              <button type="submit" className="btn btn-primary">
                ✅ Spremi promjene
              </button>
            </div>
          </form>
        </div>
      </div>

      {showCustomSportModal && (
        <div className="modal-overlay" onClick={() => setShowCustomSportModal(false)}>
          <div className="custom-sport-modal" onClick={(e) => e.stopPropagation()}>
            <h2>➕ Dodaj novi sport</h2>
            <div className="form-group">
              <label>Naziv sporta</label>
              <input
                type="text"
                value={customSportName}
                onChange={(e) => setCustomSportName(e.target.value)}
                placeholder="npr. Padel, Squash..."
                autoFocus
              />
            </div>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowCustomSportModal(false)}>Odustani</button>
              <button className="btn btn-primary" onClick={handleAddCustomSport}>Dodaj sport</button>
            </div>
          </div>
        </div>
      )}

      {showCustomCityModal && (
        <div className="modal-overlay" onClick={() => setShowCustomCityModal(false)}>
          <div className="custom-sport-modal" onClick={(e) => e.stopPropagation()}>
            <h2>🏙️ Dodaj novi grad</h2>
            <div className="form-group">
              <label>Naziv grada</label>
              <input
                type="text"
                value={customCityData.cityName}
                onChange={(e) => setCustomCityData({ ...customCityData, cityName: e.target.value })}
                placeholder="npr. Mostar..."
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
              <button className="btn btn-secondary" onClick={() => setShowCustomCityModal(false)}>Odustani</button>
              <button className="btn btn-primary" onClick={handleAddCustomCity}>Dodaj grad</button>
            </div>
          </div>
        </div>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

export default EditTeam;