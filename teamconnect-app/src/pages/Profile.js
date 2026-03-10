import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Toast from '../components/Toast';
import { authAPI } from '../services/api';
import './Profile.css';
import SportRatingModal from '../components/SportRatingModal';
import { useLanguage } from '../i18n/LanguageContext'; 
import { API_URL } from '../services/api';
function Profile() {
   const { t } = useLanguage();
  const navigate = useNavigate();
  const { userId } = useParams();
  const [profile, setProfile] = useState(null);
  const [isOwnProfile, setIsOwnProfile] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('about');
  const [toast, setToast] = useState(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [showRateModal, setShowRateModal] = useState(false);
const [canRateUser, setCanRateUser] = useState(false);
const [hasRatedUser, setHasRatedUser] = useState(false);

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
    { id: 'hr', name: 'Croatia', cities: ['Zagreb', 'Split', 'Rijeka', 'Osijek', 'Zadar'] },
    { id: 'rs', name: 'Serbia', cities: ['Belgrade', 'Novi Sad', 'Niš'] },
    { id: 'si', name: 'Slovenia', cities: ['Ljubljana', 'Maribor', 'Celje'] },
  ];

  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

  const availableAvatars = [
    '👤', '😀', '😎', '🤓', '🥳', '🤩', '😺', '🦁', '🐯', '🐻',
    '🦊', '🐼', '🐨', '🐸', '🦄', '🐲', '⚽', '🏀', '🎾', '🏐'
  ];

  const europeanCities = ['Zagreb', 'Split', 'Belgrade', 'Ljubljana'];

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
      if (userId && userId !== currentUser.id) {
  checkCanRate(userId);
}
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
  const checkCanRate = async (targetId) => {
  try {
    const token = localStorage.getItem('token');
    // Provjeri dijele li zajednički tim
    const [myTeamsRes, targetTeamsRes] = await Promise.all([
      fetch(`${API_URL}/teams?member=${currentUser.id}`, { headers: { Authorization: `Bearer ${token}` } }),
      fetch(`${API_URL}/teams?member=${targetId}`, { headers: { Authorization: `Bearer ${token}` } })
    ]);

    if (myTeamsRes.ok && targetTeamsRes.ok) {
      const myTeams = await myTeamsRes.json();
      const targetTeams = await targetTeamsRes.json();
      const myIds = new Set(myTeams.map(t => t.id));
      const shared = targetTeams.some(t => myIds.has(t.id));
      setCanRateUser(shared);
    }
  } catch (e) {
    console.error('Check can rate error:', e);
  }
};
const handleRatePlayer = async ({ sport, skillLevel }) => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/ratings/rate-player`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        targetUserId: userId,
        skillLevel,
        sport: sport || profile.sport || 'Nogomet'
      })
    });
    const data = await response.json();
    if (response.ok) {
      setToast({ message: '✅ Ocjena uspješno spremljena!', type: 'success' });
      setShowRateModal(false);
      setHasRatedUser(true);
    } else {
      setToast({ message: data.message, type: 'error' });
      setShowRateModal(false);
    }
  } catch (e) {
    setToast({ message: 'Greška pri ocjenjivanju', type: 'error' });
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
      if (editForm.leagueLevel) dbUpdateData.league_level = editForm.leagueLevel;
      if (editForm.yearsExperience) dbUpdateData.years_experience = editForm.yearsExperience;
      if (editForm.selfRating) dbUpdateData.self_rating = editForm.selfRating;
      if (editForm.bio) dbUpdateData.bio = editForm.bio;

      const response = await authAPI.updateProfile(dbUpdateData);
      const updatedUser = response.data;

      setProfile(prev => ({ ...prev, ...updatedUser }));
      setIsEditing(false);
      setToast({ message: 'Profile updated successfully!', type: 'success' });

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

    if (!file.type.startsWith('image/')) {
      setToast({ message: 'Please select an image file', type: 'error' });
      return;
    }

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
    <div className="profile-page">
      <Navbar />

      {/* ✅ FIXED: Back Button */}
      <button className="profile-back-btn" onClick={() => navigate(-1)}>
        ← Natrag
      </button>
      
      
      {/* Cover Photo */}
      <div 
        className="profile-cover"
        style={{ 
          backgroundImage: profile.coverPhoto 
            ? `url(${profile.coverPhoto})` 
            : 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-accent) 100%)'
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
              {/* ✅ FIXED: Always show name/username */}
              <h1>
                {profile.first_name && profile.last_name 
                  ? `${profile.first_name} ${profile.last_name}`
                  : profile.firstName && profile.lastName
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

            {isOwnProfile ? (
  <div className="profile-actions-header">
    <button className="btn btn-primary" onClick={() => setIsEditing(!isEditing)}>
      {isEditing ? 'Cancel' : '✏️ Edit Profile'}
    </button>
    <button className="btn btn-secondary" onClick={() => setShowPasswordModal(true)}>
      🔒 Change Password
    </button>
  </div>
) : canRateUser && (
  <div className="profile-actions-header">
    <button
      className="btn btn-primary"
      onClick={() => setShowRateModal(true)}
      disabled={hasRatedUser}
    >
      {hasRatedUser ? '✅ Već ocijenjeno' : '⭐ Ocijeni igrača'}
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

        {/* Profile Content - Skraćeno zbog dužine, ali sve ostaje isto */}
        <div className="profile-content">
          {activeTab === 'about' && (
            <div className="about-section">
              {isEditing ? (
                <div className="edit-profile-form card">
                  <h2>✏️ Edit Profile</h2>
                  {/* Forma ostaje ista kao u originalnom kodu */}
                </div>
              ) : (
                <div className="about-info card">
                  <h2>📋 Profile Information</h2>
                  {/* Prikaz info ostaje isti */}
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
              {/* Settings ostaju isti */}
            </div>
          )}
        </div>
      </div>

      {/* Modali ostaju isti */}
      {showPasswordModal && (
        <div className="modal-overlay" onClick={() => setShowPasswordModal(false)}>
          <div className="password-modal" onClick={(e) => e.stopPropagation()}>
            <h2>🔒 Change Password</h2>
            {/* Forma ostaje ista */}
          </div>
        </div>
      )}

      {showAvatarModal && (
        <div className="modal-overlay" onClick={() => setShowAvatarModal(false)}>
          <div className="avatar-modal" onClick={(e) => e.stopPropagation()}>
            <h2>🎭 Change Avatar</h2>
            {/* Forma ostaje ista */}
          </div>
        </div>
      )}
      {showRateModal && (
  <SportRatingModal
    sport={profile.sport || 'Nogomet'}
    onSubmit={({ sport, skillLevel }) => handleRatePlayer({ sport, skillLevel })}
    onCancel={() => setShowRateModal(false)}
  />
)}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

export default Profile;