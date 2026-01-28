import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Toast from '../components/Toast';
import { getAllSports } from '../data/sports';
import { europeanCities } from '../data/cities';
import './FieldMap.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

function FieldMap() {
  // ============ STATE ============
  const [fields, setFields] = useState([]);
  const [selectedField, setSelectedField] = useState(null);
  const [filter, setFilter] = useState({ sport: '', city: '' });
  const [toast, setToast] = useState(null);
  const [showAddFieldModal, setShowAddFieldModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formStep, setFormStep] = useState(1);

  // Upload state
  const [selectedImages, setSelectedImages] = useState([]);
  const [selectedImageFiles, setSelectedImageFiles] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  // Form state
  const [fieldForm, setFieldForm] = useState({
    name: '',
    sport: '',
    city: '',
    country: 'Hrvatska',
    address: '',
    price: '',
    facilities: [],
    description: '',
    availability: 'Dostupno',
    phone: '',
    email: '',
    website: '',
    openingHours: ''
  });

  // ============ CONSTANTS ============
  const sportsList = getAllSports();
  const countries = Object.keys(europeanCities).sort((a, b) => a.localeCompare(b, 'hr'));

  const availableFacilities = [
    { id: 'parking', name: 'Parking', icon: '🅿️' },
    { id: 'shower', name: 'Tuš', icon: '🚿' },
    { id: 'locker', name: 'Svlačionice', icon: '🚪' },
    { id: 'lighting', name: 'Rasvjeta', icon: '💡' },
    { id: 'wifi', name: 'WiFi', icon: '📶' },
    { id: 'ac', name: 'Klima', icon: '❄️' },
    { id: 'cafe', name: 'Kafić', icon: '☕' },
    { id: 'restaurant', name: 'Restoran', icon: '🍽️' },
    { id: 'stands', name: 'Tribine', icon: '🏟️' },
    { id: 'sound', name: 'Ozvučenje', icon: '🔊' },
    { id: 'equipment', name: 'Oprema za najam', icon: '🎽' },
    { id: 'firstaid', name: 'Prva pomoć', icon: '🏥' }
  ];

  // ============ EFFECTS ============
  useEffect(() => {
    loadFields();
  }, []);

  // ============ API FUNCTIONS ============
  const loadFields = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/fields`);

      if (response.ok) {
        const data = await response.json();
        // Transform data to include facilities array properly
        const transformedData = data.map(field => ({
          ...field,
          facilities: field.field_facilities?.map(f => f.facility) || field.facilities || [],
          images: field.field_images || field.images || []
        }));
        setFields(transformedData);
      } else {
        console.error('Failed to load fields');
      }
    } catch (error) {
      console.error('Load fields error:', error);
    } finally {
      setLoading(false);
    }
  };

  // ============ HANDLER FUNCTIONS ============
  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);

    if (files.length === 0) return;

    const totalImages = selectedImages.length + files.length;
    if (totalImages > 5) {
      setToast({ message: 'Maksimalno 5 slika!', type: 'error' });
      return;
    }

    const validFiles = [];
    const validFileObjects = [];

    files.forEach(file => {
      if (!file.type.startsWith('image/')) {
        setToast({ message: `${file.name} nije slika!`, type: 'error' });
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        setToast({ message: `${file.name} je prevelika! Max 10MB`, type: 'error' });
        return;
      }

      validFiles.push(URL.createObjectURL(file));
      validFileObjects.push(file);
    });

    setSelectedImages([...selectedImages, ...validFiles]);
    setSelectedImageFiles([...selectedImageFiles, ...validFileObjects]);
  };

  const handleRemoveImage = (index) => {
    setSelectedImages(selectedImages.filter((_, i) => i !== index));
    setSelectedImageFiles(selectedImageFiles.filter((_, i) => i !== index));
  };

  const handleToggleFacility = (facilityId) => {
    const facilities = fieldForm.facilities || [];
    if (facilities.includes(facilityId)) {
      setFieldForm({ ...fieldForm, facilities: facilities.filter(f => f !== facilityId) });
    } else {
      setFieldForm({ ...fieldForm, facilities: [...facilities, facilityId] });
    }
  };

  const resetForm = () => {
    setFieldForm({
      name: '',
      sport: '',
      city: '',
      country: 'Hrvatska',
      address: '',
      price: '',
      facilities: [],
      description: '',
      availability: 'Dostupno',
      phone: '',
      email: '',
      website: '',
      openingHours: ''
    });
    setSelectedImages([]);
    setSelectedImageFiles([]);
    setFormStep(1);
    setUploadProgress(0);
  };

  const handleCloseModal = () => {
    setShowAddFieldModal(false);
    resetForm();
  };

  const validateStep = (step) => {
    if (step === 1) {
      if (!fieldForm.name.trim()) {
        setToast({ message: 'Unesite naziv terena!', type: 'error' });
        return false;
      }
      if (!fieldForm.sport) {
        setToast({ message: 'Odaberite sport!', type: 'error' });
        return false;
      }
    }
    if (step === 2) {
      if (!fieldForm.city) {
        setToast({ message: 'Odaberite grad!', type: 'error' });
        return false;
      }
      if (!fieldForm.address.trim()) {
        setToast({ message: 'Unesite adresu!', type: 'error' });
        return false;
      }
    }
    if (step === 3) {
      if (selectedImages.length === 0) {
        setToast({ message: 'Dodajte barem jednu sliku terena!', type: 'error' });
        return false;
      }
    }
    return true;
  };

  const handleNextStep = () => {
    if (validateStep(formStep)) {
      setFormStep(formStep + 1);
    }
  };

  const handlePrevStep = () => {
    setFormStep(formStep - 1);
  };

  const handleAddField = async () => {
    if (!validateStep(3)) return;

    try {
      setIsUploading(true);
      const token = localStorage.getItem('token');

      if (!token) {
        setToast({ message: 'Morate biti prijavljeni!', type: 'error' });
        setIsUploading(false);
        return;
      }

      const formData = new FormData();

      // Get facility names instead of IDs
      const facilityNames = fieldForm.facilities.map(id => {
        const facility = availableFacilities.find(f => f.id === id);
        return facility ? facility.name : id;
      });

      formData.append('data', JSON.stringify({
        name: fieldForm.name,
        sport: fieldForm.sport,
        city: fieldForm.city,
        country: fieldForm.country,
        address: fieldForm.address,
        price: fieldForm.price || 0,
        facilities: facilityNames,
        description: fieldForm.description || '',
        availability: fieldForm.availability,
        phone: fieldForm.phone,
        email: fieldForm.email,
        website: fieldForm.website,
        opening_hours: fieldForm.openingHours,
        coordinates_lat: 45.8150,
        coordinates_lng: 15.9819
      }));

      for (let i = 0; i < selectedImageFiles.length; i++) {
        formData.append('images', selectedImageFiles[i]);
      }

      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const percentComplete = (e.loaded / e.total) * 100;
          setUploadProgress(Math.round(percentComplete));
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status === 201) {
          setToast({ message: 'Teren uspješno dodan!', type: 'success' });
          handleCloseModal();
          loadFields();
        } else {
          try {
            const error = JSON.parse(xhr.responseText);
            setToast({ message: error.message || 'Greška pri dodavanju terena', type: 'error' });
          } catch {
            setToast({ message: 'Greška pri dodavanju terena', type: 'error' });
          }
        }
        setIsUploading(false);
      });

      xhr.addEventListener('error', () => {
        setToast({ message: 'Greška pri uploadu. Provjerite internet vezu.', type: 'error' });
        setIsUploading(false);
      });

      xhr.open('POST', 'http://localhost:5000/api/fields');
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      xhr.send(formData);

    } catch (error) {
      console.error('Add field error:', error);
      setToast({ message: 'Greška pri dodavanju terena', type: 'error' });
      setIsUploading(false);
    }
  };

  // ============ HELPER FUNCTIONS ============
  const filterFields = () => {
    return fields.filter(field => {
      const sportMatch = !filter.sport || field.sport === filter.sport;
      const cityMatch = !filter.city || field.city === filter.city;
      return sportMatch && cityMatch;
    });
  };

  const getAvailabilityColor = (availability) => {
    return availability === 'Dostupno' ? '#4caf50' : '#f44336';
  };

  const getFieldImage = (field) => {
    // Check for field_images from database relation
    if (field.field_images && field.field_images.length > 0) {
      const img = field.field_images[0];
      const filepath = img.filepath || '';
      // Handle both Windows and Unix paths, and remove leading ./ or .\
      const cleanPath = filepath.replace(/\\/g, '/').replace(/^\.\//, '').replace(/^\.\\/, '');
      return `http://localhost:5000/${cleanPath}`;
    }
    // Fallback to images array
    if (field.images && field.images.length > 0) {
      const img = field.images[0];
      const filepath = typeof img === 'string' ? img : (img.filepath || '');
      const cleanPath = filepath.replace(/\\/g, '/').replace(/^\.\//, '').replace(/^\.\\/, '');
      return `http://localhost:5000/${cleanPath}`;
    }
    return 'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=800';
  };

  const getUniqueCities = () => {
    const cities = new Set(fields.map(f => f.city));
    return Array.from(cities).sort();
  };

  const getUniqueSports = () => {
    const sports = new Set(fields.map(f => f.sport));
    return Array.from(sports).sort();
  };

  const filteredFields = filterFields();

  // ============ RENDER ============
  return (
    <div className="field-map-page">
      <Navbar />

      <div className="field-map-container">
        {/* HEADER */}
        <div className="map-header">
          <h1>Mapa Terena</h1>
          <p>Pronadi savrseni teren za svoju utakmicu</p>
          <button
            className="btn btn-primary btn-large"
            onClick={() => setShowAddFieldModal(true)}
          >
            + Dodaj novi teren
          </button>
        </div>

        {/* ADD FIELD MODAL */}
        {showAddFieldModal && (
          <div className="modal-overlay" onClick={handleCloseModal}>
            <div className="add-field-modal" onClick={(e) => e.stopPropagation()}>
              {/* Modal Header */}
              <div className="modal-header">
                <h2>Dodaj novi teren</h2>
                <button className="modal-close" onClick={handleCloseModal}>&times;</button>
              </div>

              {/* Progress Steps */}
              <div className="form-steps">
                <div className={`step ${formStep >= 1 ? 'active' : ''} ${formStep > 1 ? 'completed' : ''}`}>
                  <div className="step-number">1</div>
                  <span>Osnovne informacije</span>
                </div>
                <div className="step-line"></div>
                <div className={`step ${formStep >= 2 ? 'active' : ''} ${formStep > 2 ? 'completed' : ''}`}>
                  <div className="step-number">2</div>
                  <span>Lokacija</span>
                </div>
                <div className="step-line"></div>
                <div className={`step ${formStep >= 3 ? 'active' : ''} ${formStep > 3 ? 'completed' : ''}`}>
                  <div className="step-number">3</div>
                  <span>Slike i sadrzaji</span>
                </div>
                <div className="step-line"></div>
                <div className={`step ${formStep >= 4 ? 'active' : ''}`}>
                  <div className="step-number">4</div>
                  <span>Pregled</span>
                </div>
              </div>

              {/* Step 1: Basic Info */}
              {formStep === 1 && (
                <div className="form-step-content">
                  <h3>Osnovne informacije o terenu</h3>

                  <div className="form-group">
                    <label>Naziv terena *</label>
                    <input
                      type="text"
                      value={fieldForm.name}
                      onChange={(e) => setFieldForm({ ...fieldForm, name: e.target.value })}
                      placeholder="npr. Sportski centar Arena"
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label>Sport *</label>
                    <select
                      value={fieldForm.sport}
                      onChange={(e) => setFieldForm({ ...fieldForm, sport: e.target.value })}
                      className="form-select"
                    >
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
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Cijena (EUR/h)</label>
                      <input
                        type="number"
                        value={fieldForm.price}
                        onChange={(e) => setFieldForm({ ...fieldForm, price: e.target.value })}
                        placeholder="0.00"
                        step="0.01"
                        min="0"
                        className="form-input"
                      />
                    </div>

                    <div className="form-group">
                      <label>Dostupnost</label>
                      <select
                        value={fieldForm.availability}
                        onChange={(e) => setFieldForm({ ...fieldForm, availability: e.target.value })}
                        className="form-select"
                      >
                        <option value="Dostupno">Dostupno</option>
                        <option value="Zauzeto">Zauzeto</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Opis terena</label>
                    <textarea
                      value={fieldForm.description}
                      onChange={(e) => setFieldForm({ ...fieldForm, description: e.target.value })}
                      rows="3"
                      placeholder="Opisite teren, velicinu, podlogu..."
                      className="form-textarea"
                    />
                  </div>
                </div>
              )}

              {/* Step 2: Location */}
              {formStep === 2 && (
                <div className="form-step-content">
                  <h3>Lokacija terena</h3>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Drzava *</label>
                      <select
                        value={fieldForm.country}
                        onChange={(e) => setFieldForm({ ...fieldForm, country: e.target.value, city: '' })}
                        className="form-select"
                      >
                        {countries.map(country => (
                          <option key={country} value={country}>{country}</option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Grad *</label>
                      <select
                        value={fieldForm.city}
                        onChange={(e) => setFieldForm({ ...fieldForm, city: e.target.value })}
                        className="form-select"
                      >
                        <option value="">Odaberi grad</option>
                        {fieldForm.country && europeanCities[fieldForm.country]?.map(city => (
                          <option key={city} value={city}>{city}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Adresa *</label>
                    <input
                      type="text"
                      value={fieldForm.address}
                      onChange={(e) => setFieldForm({ ...fieldForm, address: e.target.value })}
                      placeholder="npr. Ulica grada Vukovara 269"
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label>Radno vrijeme</label>
                    <input
                      type="text"
                      value={fieldForm.openingHours}
                      onChange={(e) => setFieldForm({ ...fieldForm, openingHours: e.target.value })}
                      placeholder="npr. Pon-Pet 08:00-22:00, Sub-Ned 09:00-20:00"
                      className="form-input"
                    />
                  </div>

                  <h4 style={{ marginTop: '25px', marginBottom: '15px' }}>Kontakt informacije (opcionalno)</h4>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Telefon</label>
                      <input
                        type="tel"
                        value={fieldForm.phone}
                        onChange={(e) => setFieldForm({ ...fieldForm, phone: e.target.value })}
                        placeholder="+385 1 234 5678"
                        className="form-input"
                      />
                    </div>

                    <div className="form-group">
                      <label>Email</label>
                      <input
                        type="email"
                        value={fieldForm.email}
                        onChange={(e) => setFieldForm({ ...fieldForm, email: e.target.value })}
                        placeholder="info@teren.hr"
                        className="form-input"
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Web stranica</label>
                    <input
                      type="url"
                      value={fieldForm.website}
                      onChange={(e) => setFieldForm({ ...fieldForm, website: e.target.value })}
                      placeholder="https://www.teren.hr"
                      className="form-input"
                    />
                  </div>
                </div>
              )}

              {/* Step 3: Images & Facilities */}
              {formStep === 3 && (
                <div className="form-step-content">
                  <h3>Slike i sadrzaji</h3>

                  <div className="form-group">
                    <label>Slike terena * (max 5)</label>
                    <div className="image-upload-zone">
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleImageUpload}
                        style={{ display: 'none' }}
                        id="field-images"
                      />
                      <label htmlFor="field-images" className="upload-zone-label">
                        <div className="upload-zone-icon">📷</div>
                        <p>Klikni ili povuci slike ovdje</p>
                        <small>JPG, PNG do 10MB ({selectedImages.length}/5 uploadano)</small>
                      </label>
                    </div>

                    {selectedImages.length > 0 && (
                      <div className="image-preview-grid">
                        {selectedImages.map((img, index) => (
                          <div key={index} className="image-preview-item">
                            <img src={img} alt={`Preview ${index + 1}`} />
                            <button
                              className="remove-image-btn"
                              onClick={() => handleRemoveImage(index)}
                              type="button"
                            >
                              &times;
                            </button>
                            {index === 0 && <span className="primary-badge">Glavna</span>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="form-group">
                    <label>Dostupni sadrzaji</label>
                    <div className="facilities-grid">
                      {availableFacilities.map(facility => (
                        <div
                          key={facility.id}
                          className={`facility-card ${fieldForm.facilities.includes(facility.id) ? 'selected' : ''}`}
                          onClick={() => handleToggleFacility(facility.id)}
                        >
                          <span className="facility-icon">{facility.icon}</span>
                          <span className="facility-name">{facility.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 4: Review */}
              {formStep === 4 && (
                <div className="form-step-content">
                  <h3>Pregled i potvrda</h3>

                  <div className="review-section">
                    <div className="review-card">
                      <h4>Osnovne informacije</h4>
                      <div className="review-row">
                        <span>Naziv:</span>
                        <strong>{fieldForm.name}</strong>
                      </div>
                      <div className="review-row">
                        <span>Sport:</span>
                        <strong>{fieldForm.sport}</strong>
                      </div>
                      <div className="review-row">
                        <span>Cijena:</span>
                        <strong>{fieldForm.price ? `${fieldForm.price} EUR/h` : 'Nije navedeno'}</strong>
                      </div>
                      <div className="review-row">
                        <span>Dostupnost:</span>
                        <strong style={{ color: fieldForm.availability === 'Dostupno' ? '#4caf50' : '#f44336' }}>
                          {fieldForm.availability}
                        </strong>
                      </div>
                    </div>

                    <div className="review-card">
                      <h4>Lokacija</h4>
                      <div className="review-row">
                        <span>Adresa:</span>
                        <strong>{fieldForm.address}, {fieldForm.city}, {fieldForm.country}</strong>
                      </div>
                      {fieldForm.openingHours && (
                        <div className="review-row">
                          <span>Radno vrijeme:</span>
                          <strong>{fieldForm.openingHours}</strong>
                        </div>
                      )}
                    </div>

                    <div className="review-card">
                      <h4>Slike ({selectedImages.length})</h4>
                      <div className="review-images">
                        {selectedImages.map((img, idx) => (
                          <img key={idx} src={img} alt={`Preview ${idx + 1}`} />
                        ))}
                      </div>
                    </div>

                    {fieldForm.facilities.length > 0 && (
                      <div className="review-card">
                        <h4>Sadrzaji ({fieldForm.facilities.length})</h4>
                        <div className="review-facilities">
                          {fieldForm.facilities.map(id => {
                            const facility = availableFacilities.find(f => f.id === id);
                            return facility ? (
                              <span key={id} className="review-facility-tag">
                                {facility.icon} {facility.name}
                              </span>
                            ) : null;
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {isUploading && (
                    <div className="upload-progress">
                      <div className="progress-bar-container">
                        <div
                          className="progress-bar-fill"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                      <p>Dodavanje terena... {uploadProgress}%</p>
                    </div>
                  )}
                </div>
              )}

              {/* Modal Actions */}
              <div className="modal-actions">
                {formStep > 1 && (
                  <button
                    className="btn btn-secondary"
                    onClick={handlePrevStep}
                    disabled={isUploading}
                  >
                    Natrag
                  </button>
                )}

                <div className="modal-actions-right">
                  <button
                    className="btn btn-ghost"
                    onClick={handleCloseModal}
                    disabled={isUploading}
                  >
                    Odustani
                  </button>

                  {formStep < 4 ? (
                    <button
                      className="btn btn-primary"
                      onClick={handleNextStep}
                    >
                      Dalje
                    </button>
                  ) : (
                    <button
                      className="btn btn-success"
                      onClick={handleAddField}
                      disabled={isUploading}
                    >
                      {isUploading ? 'Dodavanje...' : 'Dodaj teren'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MAIN LAYOUT */}
        <div className="map-layout">
          {/* SIDEBAR */}
          <div className="fields-sidebar">
            <div className="sidebar-filters card">
              <h3>Filtriraj terene</h3>

              <div className="form-group">
                <label>Sport</label>
                <select
                  value={filter.sport}
                  onChange={(e) => setFilter({ ...filter, sport: e.target.value })}
                  className="form-select"
                >
                  <option value="">Svi sportovi</option>
                  {getUniqueSports().map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div className="form-group">
                <label>Grad</label>
                <select
                  value={filter.city}
                  onChange={(e) => setFilter({ ...filter, city: e.target.value })}
                  className="form-select"
                >
                  <option value="">Svi gradovi</option>
                  {getUniqueCities().map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>

              {(filter.sport || filter.city) && (
                <button
                  className="btn btn-secondary btn-block"
                  onClick={() => setFilter({ sport: '', city: '' })}
                >
                  Resetiraj filtere
                </button>
              )}

              <div className="filter-results">
                <span>{filteredFields.length} terena pronadeno</span>
              </div>
            </div>

            {/* FIELDS LIST */}
            <div className="fields-list">
              {loading ? (
                <div className="loading-state">
                  <div className="spinner"></div>
                  <p>Ucitavanje terena...</p>
                </div>
              ) : filteredFields.length === 0 ? (
                <div className="no-fields">
                  <span className="empty-icon">🏟️</span>
                  <h4>Nema terena</h4>
                  <p>Nema terena s ovim filterima ili jos nema dodanih terena.</p>
                  <button
                    className="btn btn-primary"
                    onClick={() => setShowAddFieldModal(true)}
                  >
                    Dodaj prvi teren
                  </button>
                </div>
              ) : (
                filteredFields.map(field => (
                  <div
                    key={field.id}
                    className={`field-card card ${selectedField?.id === field.id ? 'selected' : ''}`}
                    onClick={() => setSelectedField(field)}
                  >
                    <div
                      className="field-image"
                      style={{ backgroundImage: `url(${getFieldImage(field)})` }}
                    >
                      <div
                        className="field-availability"
                        style={{ background: getAvailabilityColor(field.availability) }}
                      >
                        {field.availability || 'Dostupno'}
                      </div>
                    </div>

                    <div className="field-info">
                      <div className="field-header-info">
                        <h4>{field.name}</h4>
                        <div className="field-rating">
                          <span>⭐</span> {field.rating || '0'} ({field.reviews_count || 0})
                        </div>
                      </div>

                      <p className="field-sport">{field.sport}</p>
                      <p className="field-location">📍 {field.city}{field.address ? `, ${field.address}` : ''}</p>
                      <p className="field-price">💰 {field.price ? `${field.price} EUR/h` : 'Cijena na upit'}</p>

                      {field.facilities && field.facilities.length > 0 && (
                        <div className="field-facilities">
                          {field.facilities.slice(0, 3).map((facility, idx) => (
                            <span key={idx} className="facility-badge">
                              {facility}
                            </span>
                          ))}
                          {field.facilities.length > 3 && (
                            <span className="facility-more">+{field.facilities.length - 3}</span>
                          )}
                        </div>
                      )}

                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* MAP VIEW / DETAIL VIEW */}
          <div className="map-view card">
            {selectedField ? (
              <div className="selected-field-details">
                <div
                  className="selected-field-image"
                  style={{ backgroundImage: `url(${getFieldImage(selectedField)})` }}
                >
                  <button
                    className="close-detail-btn"
                    onClick={() => setSelectedField(null)}
                  >
                    &times;
                  </button>
                </div>

                <div className="selected-field-content">
                  <h2>{selectedField.name}</h2>
                  <div className="detail-meta">
                    <span className="detail-sport">{selectedField.sport}</span>
                    <span className="detail-rating">⭐ {selectedField.rating || '0'}</span>
                    <span
                      className="detail-availability"
                      style={{ background: getAvailabilityColor(selectedField.availability) }}
                    >
                      {selectedField.availability || 'Dostupno'}
                    </span>
                  </div>

                  {selectedField.description && (
                    <p className="detail-description">{selectedField.description}</p>
                  )}

                  <div className="detail-info">
                    <div className="detail-info-item">
                      <span className="detail-icon">📍</span>
                      <div>
                        <strong>Adresa</strong>
                        <p>{selectedField.address}, {selectedField.city}</p>
                      </div>
                    </div>
                    <div className="detail-info-item">
                      <span className="detail-icon">💰</span>
                      <div>
                        <strong>Cijena</strong>
                        <p>{selectedField.price ? `${selectedField.price} EUR/h` : 'Na upit'}</p>
                      </div>
                    </div>
                    <div className="detail-info-item">
                      <span className="detail-icon">⭐</span>
                      <div>
                        <strong>Ocjena</strong>
                        <p>{selectedField.rating || '0'}/5 ({selectedField.reviews_count || 0} recenzija)</p>
                      </div>
                    </div>
                  </div>

                  {selectedField.facilities && selectedField.facilities.length > 0 && (
                    <div className="detail-facilities">
                      <h4>Sadrzaji</h4>
                      <div className="facilities-list">
                        {selectedField.facilities.map((facility, idx) => (
                          <div key={idx} className="facility-item">
                            <span>✓</span> {facility}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="detail-actions">
                    <button
                      className="btn btn-primary btn-large"
                      onClick={() => {
                        const destination = selectedField.coordinates_lat && selectedField.coordinates_lng
                          ? `${selectedField.coordinates_lat},${selectedField.coordinates_lng}`
                          : `${selectedField.address}, ${selectedField.city}`;
                        window.open(
                          `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`,
                          '_blank'
                        );
                      }}
                    >
                      Navigiraj do terena
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="map-placeholder">
                <div className="map-icon">🏟️</div>
                <h3>Odaberi teren</h3>
                <p>Klikni na teren s liste za prikaz detalja</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

export default FieldMap;
