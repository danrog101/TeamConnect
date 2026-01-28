import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Toast from '../components/Toast';
import { authAPI } from '../services/api';
import './Profile.css';

function Profile() {
  const navigate = useNavigate();
  const { userId } = useParams(); // For viewing other profiles
  const [profile, setProfile] = useState(null);
  const [isOwnProfile, setIsOwnProfile] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('about');
  const [toast, setToast] = useState(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showAvatarModal, setShowAvatarModal] = useState(false);

  const [editForm, setEditForm] = useState({
    firstName: '',
    lastName: '',
    bio: '',
    dateOfBirth: '',
    gender: '',
    sport: '',
    favoriteSports: [],
    skillLevel: '',
    position: '',
    country: '',
    city: '',
    phone: '',
    instagram: '',
    twitter: '',
    facebook: '',
    profileVisibility: 'public',
    showEmail: false,
    showPhone: false,
    // Enhanced player statistics
    leagueLevel: '',
    yearsExperience: '',
    selfRating: 5
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const sportsList = [
    { id: 'football', name: 'Football' },
    { id: 'basketball', name: 'Basketball' },
    { id: 'volleyball', name: 'Volleyball' }
  ];

  const skillLevels = [
    { value: 'beginner', label: 'Beginner' },
    { value: 'intermediate', label: 'Intermediate' },
    { value: 'advanced', label: 'Advanced' },
    { value: 'professional', label: 'Professional' }
  ];

  const positions = {
    football: [
      { value: 'goalkeeper', label: 'Goalkeeper' },
      { value: 'defender', label: 'Defender' },
      { value: 'midfielder', label: 'Midfielder' },
      { value: 'forward', label: 'Forward' }
    ],
    basketball: [
      { value: 'point_guard', label: 'Point Guard' },
      { value: 'shooting_guard', label: 'Shooting Guard' },
      { value: 'small_forward', label: 'Small Forward' },
      { value: 'power_forward', label: 'Power Forward' },
      { value: 'center', label: 'Center' }
    ],
    volleyball: [
      { value: 'setter', label: 'Setter' },
      { value: 'outside_hitter', label: 'Outside Hitter' },
      { value: 'middle_blocker', label: 'Middle Blocker' },
      { value: 'libero', label: 'Libero' },
      { value: 'opposite', label: 'Opposite' }
    ]
  };

  const countries = [
    { id: 'hr', name: 'Croatia', cities: ['Zagreb', 'Split', 'Rijeka', 'Osijek', 'Zadar', 'Slavonski Brod', 'Pula', 'Šibenik', 'Karlovac', 'Rijeka', 'Dubrovnik', 'Varaždin'] },
    { id: 'rs', name: 'Serbia', cities: ['Belgrade', 'Novi Sad', 'Niš', 'Kragujevac', 'Kraljevo'] },
    { id: 'si', name: 'Slovenia', cities: ['Ljubljana', 'Maribor', 'Celje', 'Koper', 'Nova Gorica'] },
    { id: 'ba', name: 'Bosnia', cities: ['Sarajevo', 'Banja Luka', 'Tuzla', 'Zenica', 'Mostar'] },
    { id: 'me', name: 'Montenegro', cities: ['Podgorica', 'Nikšić', 'Budva', 'Bar'] },
    { id: 'mk', name: 'North Macedonia', cities: ['Skopje', 'Bitola', 'Kumanovo', 'Ohrid', 'Strumica', 'Tetovo', 'Veles', 'Štip', 'Prilep', 'Gostivar'] },
    { id: 'al', name: 'Albania', cities: ['Tirana', 'Durrës', 'Vlorë', 'Fier', 'Shkodër', 'Elbasan', 'Kavajë', 'Lezhë'] }
  ];

  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

  const availableAvatars = [
    '👤', '😀', '😎', '🤓', '🥳', '🤩', '😺', '🦁', '🐯', '🐻',
    '🦊', '🐼', '🐨', '🐸', '🦄', '🐲', '⚽', '🏀', '🎾', '🏐'
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
    loadProfile();
  }, [userId]);

  const loadProfile = async () => {
    try {
      const token = localStorage.getItem('token');

      if (!token) {
        navigate('/login');
        return;
      }

      const user = await authAPI.getCurrentUser();
      if (!user) return;

      // Load friends and stats separately with error handling
      let friends = [];
      let stats = {};

      try {
        friends = await authAPI.getFriends();
      } catch (e) {
        console.log('Could not load friends:', e.message);
      }

      try {
        stats = await authAPI.getUserStats();
      } catch (e) {
        console.log('Could not load stats:', e.message);
      }

      setProfile({
        ...user,
        friends: friends || [],
        stats: stats || {}
      });

      setIsOwnProfile(!userId || userId === currentUser.id);

      // Populate edit form - map snake_case from DB to camelCase
      setEditForm({
        firstName: user.first_name || user.firstName || '',
        lastName: user.last_name || user.lastName || '',
        bio: user.bio || '',
        dateOfBirth: user.date_of_birth ? new Date(user.date_of_birth).toISOString().split('T')[0] : '',
        gender: user.gender || '',
        sport: user.sport || '',
        favoriteSports: user.favorite_sports || user.favoriteSports || [],
        skillLevel: user.skill_level || user.skillLevel || '',
        position: user.position || '',
        country: user.country || '',
        city: user.city || '',
        phone: user.phone || '',
        instagram: user.instagram || '',
        twitter: user.twitter || '',
        facebook: user.facebook || '',
        profileVisibility: user.profile_visibility || user.profileVisibility || 'public',
        showEmail: user.show_email || user.showEmail || false,
        showPhone: user.show_phone || user.showPhone || false,
        leagueLevel: user.league_level || user.leagueLevel || '',
        yearsExperience: user.years_experience || user.yearsExperience || '',
        selfRating: user.self_rating || user.selfRating || 5
      });
    } catch (error) {
      console.error('Load profile error:', error);
      setToast({ message: 'Failed to load profile', type: 'error' });
    }
  };

  const handleSaveProfile = async () => {
    try {
      const token = localStorage.getItem('token');

      if (!token) {
        setToast({ message: 'Please login to save profile', type: 'error' });
        return;
      }

      const dbUpdateData = {};

      // Map frontend field names to database field names
      if (editForm.firstName) dbUpdateData.first_name = editForm.firstName;
      if (editForm.lastName) dbUpdateData.last_name = editForm.lastName;
      if (editForm.dateOfBirth) dbUpdateData.date_of_birth = editForm.dateOfBirth;
      if (editForm.gender) dbUpdateData.gender = editForm.gender;
      if (editForm.sport) dbUpdateData.sport = editForm.sport;
      if (editForm.favoriteSports) dbUpdateData.favorite_sports = editForm.favoriteSports;
      if (editForm.skillLevel) dbUpdateData.skill_level = editForm.skillLevel;
      if (editForm.position) dbUpdateData.position = editForm.position;
      if (editForm.country) dbUpdateData.country = editForm.country;
      if (editForm.city) dbUpdateData.city = editForm.city;
      if (editForm.phone) dbUpdateData.phone = editForm.phone;
      if (editForm.instagram) dbUpdateData.instagram = editForm.instagram;
      if (editForm.twitter) dbUpdateData.twitter = editForm.twitter;
      if (editForm.facebook) dbUpdateData.facebook = editForm.facebook;
      if (editForm.profileVisibility) dbUpdateData.profile_visibility = editForm.profileVisibility;
      if (editForm.showEmail !== undefined) dbUpdateData.show_email = editForm.showEmail;
      if (editForm.showPhone !== undefined) dbUpdateData.show_phone = editForm.showPhone;

      // Enhanced player statistics
      if (editForm.leagueLevel) dbUpdateData.league_level = editForm.leagueLevel;
      if (editForm.yearsExperience) dbUpdateData.years_experience = editForm.yearsExperience;
      if (editForm.selfRating) dbUpdateData.self_rating = editForm.selfRating;

      // Copy other fields directly
      if (editForm.bio) dbUpdateData.bio = editForm.bio;

      const response = await authAPI.updateProfile(dbUpdateData);
      const updatedUser = response.data;

      setProfile(prev => ({ ...prev, ...updatedUser }));
      setIsEditing(false);
      setToast({ message: 'Profile updated successfully!', type: 'success' });

      // Update localStorage
      const updatedCurrentUser = { ...currentUser, ...updatedUser };
      localStorage.setItem('user', JSON.stringify(updatedCurrentUser));
    } catch (error) {
      console.error('Save profile error:', error);
      setToast({ message: 'Failed to update profile', type: 'error' });
    }
  };

  const handleChangePassword = async () => {
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      setToast({ message: 'Please fill all password fields', type: 'error' });
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setToast({ message: 'New passwords do not match', type: 'error' });
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setToast({ message: 'New password must be at least 6 characters', type: 'error' });
      return;
    }

    try {
      const response = await authAPI.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });

      if (response.data) {
        setToast({ message: 'Password changed successfully!', type: 'success' });
        setShowPasswordModal(false);
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      }
    } catch (error) {
      console.error('Change password error:', error);
      const errorMsg = error.response?.data?.message || 'Failed to change password';
      setToast({ message: errorMsg, type: 'error' });
    }
  };

  const handleChangeAvatar = async (avatar) => {
    try {
      const response = await authAPI.updateProfile({ avatar });

      if (response.data) {
        const updatedUser = { ...currentUser, avatar };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setProfile(prev => ({ ...prev, avatar }));
        setShowAvatarModal(false);
        setToast({ message: 'Avatar updated successfully!', type: 'success' });
      } else {
        setToast({ message: 'Failed to update avatar', type: 'error' });
      }
    } catch (error) {
      console.error('Change avatar error:', error);
      setToast({ message: 'Failed to update avatar', type: 'error' });
    }
  };

  const handleUploadProfilePicture = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setToast({ message: 'Please select an image file', type: 'error' });
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setToast({ message: 'Image must be smaller than 2MB', type: 'error' });
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target.result;

      try {
        const response = await authAPI.updateProfile({ avatar: base64 });

        if (response.data) {
          const updatedUser = { ...currentUser, avatar: base64 };
          localStorage.setItem('user', JSON.stringify(updatedUser));
          setProfile(prev => ({ ...prev, avatar: base64 }));
          setShowAvatarModal(false);
          setToast({ message: 'Profile picture updated successfully!', type: 'success' });
        } else {
          setToast({ message: 'Failed to update profile picture', type: 'error' });
        }
      } catch (error) {
        console.error('Upload profile picture error:', error);
        setToast({ message: 'Failed to update profile picture', type: 'error' });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleToggleFavoriteSport = (sportId) => {
    // Update local state only - will be saved when user clicks Save
    const currentFavorites = editForm.favoriteSports || [];
    const newFavorites = currentFavorites.includes(sportId)
      ? currentFavorites.filter(id => id !== sportId)
      : [...currentFavorites, sportId];

    setEditForm({ ...editForm, favoriteSports: newFavorites });
  };

  const getSkillLevelLabel = (level) => {
    const labels = {
      beginner: 'Beginner',
      intermediate: 'Intermediate',
      advanced: 'Advanced',
      professional: 'Professional'
    };
    return labels[level] || level;
  };

  const getGenderLabel = (gender) => {
    const labels = {
      male: 'Male',
      female: 'Female',
      prefer_not_to_say: 'I don\'t want to say',
      other: 'Other'
    };
    return labels[gender] || gender;
  };

  const getPositionLabel = (position, sport) => {
    if (!position || !sport) return position;
    const sportPositions = positions[sport.toLowerCase()];
    if (!sportPositions) return position;
    const found = sportPositions.find(p => p.value === position);
    return found ? found.label : position;
  };

  if (!profile) {
    return (
      <div>
        <Navbar />
        <div className="loading">Loading profile...</div>
      </div>
    );
  }

  return (
    <div className="profile-container">
      {/* Cover Photo */}
      <div 
        className="profile-cover"
        style={{ 
          backgroundImage: profile.coverPhoto 
            ? `url(${profile.coverPhoto})` 
            : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
        }}
      >
        {isOwnProfile && (
          <button className="btn-edit-cover">
            📷 Change cover photo
          </button>
        )}
      </div>

      <div className="profile-container">
        {/* Profile Header */}
        <div className="profile-header card">
          <div className="profile-avatar-section">
            <div
              className="profile-avatar-large"
              onClick={() => isOwnProfile && setShowAvatarModal(true)}
              style={{
                cursor: isOwnProfile ? 'pointer' : 'default',
                backgroundImage: profile.avatar?.startsWith('data:image') ? `url(${profile.avatar})` : 'none',
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }}
            >
              {!profile.avatar?.startsWith('data:image') && (profile.avatar || '👤')}
              {isOwnProfile && (
                <div className="avatar-edit-overlay">
                  <span>✏️</span>
                </div>
              )}
            </div>
            
            <div className="profile-header-info">
              <h1>
                {profile.firstName && profile.lastName 
                  ? `${profile.firstName} ${profile.lastName}`
                  : profile.username
                }
              </h1>
              <p className="profile-username">@{profile.username}</p>
              
              {profile.bio && (
                <p className="profile-bio">{profile.bio}</p>
              )}

              <div className="profile-meta">
                {profile.city && profile.country && (
                  <span>📍 {profile.city}, {profile.country}</span>
                )}
                {profile.sport && (
                  <span>{profile.sport}</span>
                )}
                {profile.skillLevel && (
                  <span>⭐ {getSkillLevelLabel(profile.skillLevel)}</span>
                )}
              </div>

              <div className="profile-stats-mini">
                <div className="stat-mini">
                  <strong>{profile.friends?.length || 0}</strong>
                  <span>Friends</span>
                </div>
                <div className="stat-mini">
                  <strong>{profile.stats?.totalMatches || 0}</strong>
                  <span>Matches</span>
                </div>
                <div className="stat-mini">
                  <strong>{profile.stats?.totalWins || 0}</strong>
                  <span>Wins</span>
                </div>
              </div>
            </div>

            {isOwnProfile && (
              <div className="profile-actions-header">
                <button 
                  className="btn btn-primary"
                  onClick={() => setIsEditing(!isEditing)}
                >
                  {isEditing ? 'Cancel' : '✏️ Edit Profile'}
                </button>
                <button 
                  className="btn btn-secondary"
                  onClick={() => setShowPasswordModal(true)}
                >
                  🔒 Change Password
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Profile Tabs */}
        <div className="profile-tabs">
          <button 
            className={`tab ${activeTab === 'about' ? 'active' : ''}`}
            onClick={() => setActiveTab('about')}
          >
            About
          </button>
          <button 
            className={`tab ${activeTab === 'stats' ? 'active' : ''}`}
            onClick={() => setActiveTab('stats')}
          >
            Statistics
          </button>
          <button 
            className={`tab ${activeTab === 'activity' ? 'active' : ''}`}
            onClick={() => setActiveTab('activity')}
          >
            Activity
          </button>
          {isOwnProfile && (
            <button 
              className={`tab ${activeTab === 'settings' ? 'active' : ''}`}
              onClick={() => setActiveTab('settings')}
            >
              Settings
            </button>
          )}
        </div>

        {/* Profile Content */}
        <div className="profile-content">
          {activeTab === 'about' && (
            <div className="about-section">
              {isEditing ? (
                <div className="edit-profile-form card">
                  <h2>✏️ Edit Profile</h2>

                  <div className="form-row">
                    <div className="form-group">
                      <label>First Name</label>
                      <input
                        type="text"
                        value={editForm.firstName}
                        onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                        placeholder="First Name"
                      />
                    </div>
                    <div className="form-group">
                      <label>Last Name</label>
                      <input
                        type="text"
                        value={editForm.lastName}
                        onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                        placeholder="Last Name"
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Bio</label>
                    <textarea
                      value={editForm.bio}
                      onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                      placeholder="Tell us about yourself..."
                      rows="4"
                      maxLength="500"
                    />
                    <small>{editForm.bio.length}/500</small>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Date of Birth</label>
                      <input
                        type="date"
                        value={editForm.dateOfBirth}
                        onChange={(e) => setEditForm({ ...editForm, dateOfBirth: e.target.value })}
                        max={new Date().toISOString().split('T')[0]}
                      />
                    </div>
                    <div className="form-group">
                      <label>Gender</label>
                      <select
                        value={editForm.gender}
                        onChange={(e) => setEditForm({ ...editForm, gender: e.target.value })}
                      >
                        <option value="">Select</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="prefer_not_to_say">I don't want to say</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Main Sport</label>
                    <select
                      value={editForm.sport}
                      onChange={(e) => setEditForm({ ...editForm, sport: e.target.value, position: '' })}
                    >
                      <option value="">Select</option>
                      {sportsList.map(sport => (
                        <option key={sport.id} value={sport.name}>{sport.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Favorite Sports</label>
                    <div className="sports-checkboxes">
                      {sportsList.filter(s => s.popular).map(sport => (
                        <label key={sport.id} className="checkbox-label">
                          <input
                            type="checkbox"
                            checked={(editForm.favoriteSports || []).includes(sport.name)}
                            onChange={() => handleToggleFavoriteSport(sport.name)}
                          />
                          <span>{sport.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Skill Level</label>
                      <select
                        value={editForm.skillLevel}
                        onChange={(e) => setEditForm({ ...editForm, skillLevel: e.target.value })}
                      >
                        <option value="">Select</option>
                        {skillLevels.map(level => (
                          <option key={level.value} value={level.value}>{level.label}</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Position</label>
                      <select
                        value={editForm.position}
                        onChange={(e) => setEditForm({ ...editForm, position: e.target.value })}
                        disabled={!editForm.sport}
                      >
                        <option value="">{editForm.sport ? 'Select position' : 'Select sport first'}</option>
                        {editForm.sport && positions[editForm.sport.toLowerCase()]?.map(pos => (
                          <option key={pos.value} value={pos.value}>{pos.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Country</label>
                      <select
                        value={editForm.country}
                        onChange={(e) => setEditForm({ ...editForm, country: e.target.value, city: '' })}
                      >
                        <option value="">Select</option>
                        {countries.map(country => (
                          <option key={country.id} value={country}>{country}</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>City</label>
                      <select
                        value={editForm.city}
                        onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                        disabled={!editForm.country}
                      >
                        <option value="">Select</option>
                        {editForm.country && europeanCities[editForm.country]?.map(city => (
                          <option key={city} value={city}>{city}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Phone</label>
                    <input
                      type="tel"
                      value={editForm.phone}
                      onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                      placeholder="+385 91 234 5678"
                    />
                  </div>

                  <div className="form-group">
                    <label>Instagram</label>
                    <input
                      type="text"
                      value={editForm.instagram}
                      onChange={(e) => setEditForm({ ...editForm, instagram: e.target.value })}
                      placeholder="@username"
                    />
                  </div>

                  <div className="form-group">
                    <label>Twitter</label>
                    <input
                      type="text"
                      value={editForm.twitter}
                      onChange={(e) => setEditForm({ ...editForm, twitter: e.target.value })}
                      placeholder="@username"
                    />
                  </div>

                  <div className="form-group">
                    <label>Facebook</label>
                    <input
                      type="text"
                      value={editForm.facebook}
                      onChange={(e) => setEditForm({ ...editForm, facebook: e.target.value })}
                      placeholder="facebook.com/username"
                    />
                  </div>

                  <div className="form-actions">
                    <button 
                      className="btn btn-primary btn-large"
                      onClick={handleSaveProfile}
                    >
                      💾 Save Profile
                    </button>
                    <button 
                      className="btn btn-secondary"
                      onClick={() => setIsEditing(false)}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="about-info card">
                  <h2>📋 Profile Information</h2>
                  
                  <div className="info-grid">
                    {profile.email && (
                      <div className="info-item">
                        <span className="info-label">Email:</span>
                        <span className="info-value">{profile.email}</span>
                      </div>
                    )}
                    {profile.phone && (
                      <div className="info-item">
                        <span className="info-label">Phone:</span>
                        <span className="info-value">{profile.phone}</span>
                      </div>
                    )}
                    {profile.dateOfBirth && (
                      <div className="info-item">
                        <span className="info-label">Date of Birth:</span>
                        <span className="info-value">
                          {new Date(profile.dateOfBirth).toLocaleDateString('en-US')}
                        </span>
                      </div>
                    )}
                    {profile.gender && (
                      <div className="info-item">
                        <span className="info-label">Gender:</span>
                        <span className="info-value">{getGenderLabel(profile.gender)}</span>
                      </div>
                    )}
                    {profile.position && (
                      <div className="info-item">
                        <span className="info-label">Position:</span>
                        <span className="info-value">{getPositionLabel(profile.position, profile.sport)}</span>
                      </div>
                    )}
                  </div>

                  {profile.favoriteSports && profile.favoriteSports.length > 0 && (
                    <>
                      <h3 style={{ marginTop: '30px' }}>❤️ Favorite Sports</h3>
                      <div className="favorite-sports">
                        {profile.favoriteSports.map((sport, index) => (
                          <span key={index} className="sport-badge">{sport}</span>
                        ))}
                      </div>
                    </>
                  )}

                  {(profile.instagram || profile.twitter || profile.facebook) && (
                    <>
                      <h3 style={{ marginTop: '30px' }}>🔗 Social Media</h3>
                      <div className="social-links">
                        {profile.instagram && (
                          <a href={`https://instagram.com/${profile.instagram.replace('@', '')}`} target="_blank" rel="noopener noreferrer">
                            📷 Instagram
                          </a>
                        )}
                        {profile.twitter && (
                          <a href={`https://twitter.com/${profile.twitter.replace('@', '')}`} target="_blank" rel="noopener noreferrer">
                            🐦 Twitter
                          </a>
                        )}
                        {profile.facebook && (
                          <a href={profile.facebook.startsWith('http') ? profile.facebook : `https://facebook.com/${profile.facebook}`} target="_blank" rel="noopener noreferrer">
                            📘 Facebook
                          </a>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'stats' && (
            <div className="stats-tab card">
              <h2>📊 Statistics</h2>
              <p>View detailed statistics at <button className="link-btn" onClick={() => navigate('/statistics')}>Statistics</button></p>
            </div>
          )}

          {activeTab === 'activity' && (
            <div className="activity-tab card">
              <h2>📰 Recent Activity</h2>
              <p>Activity feed coming soon...</p>
            </div>
          )}

          {activeTab === 'settings' && isOwnProfile && (
            <div className="settings-tab card">
              <h2>⚙️ Privacy Settings</h2>
              
              <div className="settings-section">
                <h3>👁️ Profile Visibility</h3>
                <select
                  value={editForm.profileVisibility}
                  onChange={(e) => setEditForm({ ...editForm, profileVisibility: e.target.value })}
                >
                  <option value="public">Public - Everyone can see</option>
                  <option value="friends">Friends Only - Only friends can see</option>
                  <option value="private">Private - Only you can see</option>
                </select>
              </div>

              <div className="settings-section">
                <h3>📧 Show Contact Information</h3>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={editForm.showEmail}
                    onChange={(e) => setEditForm({ ...editForm, showEmail: e.target.checked })}
                  />
                  <span>Show email to other users</span>
                </label>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={editForm.showPhone}
                    onChange={(e) => setEditForm({ ...editForm, showPhone: e.target.checked })}
                  />
                  <span>Show phone to other users</span>
                </label>
              </div>

              <div className="form-actions">
                <button
                  className="btn btn-primary"
                  onClick={handleSaveProfile}
                >
                  💾 Save Settings
                </button>
              </div>

              <div className="settings-section support-section">
                <h3>📧 Podrška / Support</h3>
                <p>Imate pitanje ili problem? Kontaktirajte nas:</p>
                <a
                  href="mailto:teamconnect0102@gmail.com"
                  className="support-email-link"
                >
                  📩 teamconnect0102@gmail.com
                </a>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Password Modal */}
      {showPasswordModal && (
        <div className="modal-overlay" onClick={() => setShowPasswordModal(false)}>
          <div className="password-modal" onClick={(e) => e.stopPropagation()}>
            <h2>🔒 Change Password</h2>

            <div className="form-group">
              <label>Current Password</label>
              <input
                type="password"
                value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                placeholder="Enter current password"
              />
            </div>

            <div className="form-group">
              <label>New Password</label>
              <input
                type="password"
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                placeholder="Enter new password (min 6 characters)"
              />
            </div>

            <div className="form-group">
              <label>Confirm New Password</label>
              <input
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                placeholder="Confirm new password"
              />
            </div>

            <div className="modal-actions">
              <button 
                className="btn btn-secondary"
                onClick={() => setShowPasswordModal(false)}
              >
                Cancel
              </button>
              <button 
                className="btn btn-primary"
                onClick={handleChangePassword}
              >
                Change Password
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Avatar Modal */}
      {showAvatarModal && (
        <div className="modal-overlay" onClick={() => setShowAvatarModal(false)}>
          <div className="avatar-modal" onClick={(e) => e.stopPropagation()}>
            <h2>🎭 Change Avatar</h2>

            <div className="avatar-upload-section">
              <p>Upload a custom profile picture:</p>
              <label className="btn btn-primary upload-btn">
                📷 Upload Image
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleUploadProfilePicture}
                  style={{ display: 'none' }}
                />
              </label>
              <small>Max 2MB, JPG/PNG/GIF</small>
            </div>

            <div className="avatar-divider">
              <span>or choose an emoji</span>
            </div>

            <div className="avatar-grid">
              {availableAvatars.map((avatar, index) => (
                <button
                  key={index}
                  className={`avatar-option ${profile.avatar === avatar ? 'selected' : ''}`}
                  onClick={() => handleChangeAvatar(avatar)}
                >
                  {avatar}
                </button>
              ))}
            </div>

            <div className="modal-actions">
              <button
                className="btn btn-secondary"
                onClick={() => setShowAvatarModal(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

export default Profile;
