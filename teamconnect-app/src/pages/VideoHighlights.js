import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Toast from '../components/Toast';
import { API_URL } from '../config';
import './VideoHighlights.css';

function VideoHighlights() {
  const navigate = useNavigate();
  const [highlights, setHighlights] = useState([]);
  const [filter, setFilter] = useState('all');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [toast, setToast] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  
  const [uploadForm, setUploadForm] = useState({
    title: '',
    description: '',
    category: 'goal',
    file: null
  });

  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    loadHighlights();
  }, [filter]);

  const loadHighlights = async () => {
    try {
      const token = localStorage.getItem('token');
      let url = `${API_URL}/videos`;
      
      if (filter === 'myVideos') {
        url += `?author=${currentUser._id || currentUser.id}`;
      } else if (filter !== 'all') {
        url += `?category=${filter}`;
      }

      const response = await fetch(url, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });

      if (response.ok) {
        const data = await response.json();
        setHighlights(data);
      }
    } catch (error) {
      console.error('Load videos error:', error);
    }
  };

  const handleFileChange = (e) => {
  const file = e.target.files[0];
  if (file) {
    // Provjeri tip
    const allowedTypes = ['video/mp4', 'video/mov', 'video/avi', 'video/mkv', 'video/webm'];
    if (!allowedTypes.includes(file.type)) {
      setToast({ 
        message: 'Nedozvoljen format! Koristi: MP4, MOV, AVI, MKV ili WEBM', 
        type: 'error' 
      });
      return;
    }
     const maxSize = 100 * 1024 * 1024; // 100MB u bytes
    if (file.size > maxSize) {
      setToast({ 
        message: `Video je prevelik! Maksimalno 100MB. Tvoj video: ${formatFileSize(file.size)}`, 
        type: 'error' 
      });
      return;
    }

    // Provjeri je li stvarno video
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.onloadedmetadata = function() {
      window.URL.revokeObjectURL(video.src);
      const duration = video.duration;
      if (duration > 600) { // 600 sekundi = 10 minuta
        setToast({ 
          message: 'Video je predug! Maksimalna dužina: 10 minuta', 
          type: 'error' 
        });
        return;
      }
      
      setUploadForm({ ...uploadForm, file });
      setToast({ 
        message: '✅ Video odabran! Spreman za upload.', 
        type: 'success' 
      });
    }; 
     video.onerror = function() {
      setToast({ 
        message: 'Datoteka nije valjan video!', 
        type: 'error' 
      });
    };
    video.src = URL.createObjectURL(file);
  }
};

  const handleUpload = async () => {
    if (!uploadForm.title || !uploadForm.category || !uploadForm.file) {
      setToast({ message: 'Popuni sva obavezna polja i odaberi video!', type: 'error' });
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('video', uploadForm.file);
      formData.append('title', uploadForm.title);
      formData.append('description', uploadForm.description);
      formData.append('category', uploadForm.category);

      const xhr = new XMLHttpRequest();

      // Progress tracking
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const percentComplete = (e.loaded / e.total) * 100;
          setUploadProgress(Math.round(percentComplete));
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
          setToast({ message: '🎉 Video uspješno uploadan!', type: 'success' });
          setShowUploadModal(false);
          setUploadForm({
            title: '',
            description: '',
            category: 'goal',
            file: null
          });
          setUploadProgress(0);
          setIsUploading(false);
          loadHighlights();
        } else {
          const error = JSON.parse(xhr.responseText);
          setToast({ message: error.message || 'Greška pri uploadu', type: 'error' });
          setIsUploading(false);
        }
      });

      xhr.addEventListener('error', () => {
        setToast({ message: 'Greška pri uploadu videa', type: 'error' });
        setIsUploading(false);
      });

      xhr.open('POST', `${API_URL}/videos/upload`);
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      xhr.send(formData);

    } catch (error) {
      console.error('Upload error:', error);
      setToast({ message: 'Greška pri uploadu videa', type: 'error' });
      setIsUploading(false);
    }
  };

  const handleLike = async (videoId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/videos/${videoId}/like`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        loadHighlights();
        setToast({ message: '❤️', type: 'success' });
      }
    } catch (error) {
      console.error('Like error:', error);
    }
  };

  const handleDelete = async (videoId) => {
    if (!window.confirm('Jesi li siguran da želiš obrisati ovaj video?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/videos/${videoId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setToast({ message: 'Video obrisan!', type: 'info' });
        loadHighlights();
      }
    } catch (error) {
      console.error('Delete error:', error);
      setToast({ message: 'Greška pri brisanju videa', type: 'error' });
    }
  };

  const getCategoryLabel = (category) => {
    const labels = {
      goal: '⚽ Gol',
      save: '🥅 Obrana',
      skill: '⭐ Skill',
      compilation: '🎬 Kompilacija',
      fail: '😅 Fail',
      other: '📹 Ostalo'
    };
    return labels[category] || labels.other;
  };

  const formatViews = (views) => {
    if (views >= 1000) {
      return (views / 1000).toFixed(1) + 'K';
    }
    return views.toString();
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffDays === 0) return 'Danas';
    if (diffDays === 1) return 'Jučer';
    if (diffDays < 7) return `Prije ${diffDays} dana`;
    if (diffDays < 30) return `Prije ${Math.floor(diffDays / 7)} tjedana`;
    return date.toLocaleDateString('hr-HR');
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="video-highlights-page">
      <Navbar />
      
      <div className="highlights-container">
        <div className="highlights-header">
          <h1>📹 Video Highlights</h1>
          <p>Podijeli najbolje trenutke s utakmica</p>
          <button 
            className="btn btn-primary btn-large"
            onClick={() => setShowUploadModal(true)}
          >
            + Upload Video
          </button>
        </div>

        <div className="highlights-filters">
          <button 
            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            Svi videi
          </button>
          <button 
            className={`filter-btn ${filter === 'goal' ? 'active' : ''}`}
            onClick={() => setFilter('goal')}
          >
            ⚽ Golovi
          </button>
          <button 
            className={`filter-btn ${filter === 'save' ? 'active' : ''}`}
            onClick={() => setFilter('save')}
          >
            🥅 Obrane
          </button>
          <button 
            className={`filter-btn ${filter === 'skill' ? 'active' : ''}`}
            onClick={() => setFilter('skill')}
          >
            ⭐ Skills
          </button>
          <button 
            className={`filter-btn ${filter === 'myVideos' ? 'active' : ''}`}
            onClick={() => setFilter('myVideos')}
          >
            Moji videi
          </button>
        </div>

        {highlights.length === 0 ? (
          <div className="empty-highlights card">
            <span className="empty-icon">📹</span>
            <h3>Nema videa</h3>
            <p>
              {filter === 'myVideos' 
                ? 'Uploadaj svoj prvi video highlight!' 
                : 'Trenutno nema videa u ovoj kategoriji'}
            </p>
            {filter === 'myVideos' && (
              <button 
                className="btn btn-primary"
                onClick={() => setShowUploadModal(true)}
              >
                Upload Video
              </button>
            )}
          </div>
        ) : (
          <div className="highlights-grid">
            {highlights.map(highlight => (
              <div key={highlight._id} className="highlight-card card">
                <div className="highlight-video-container">
                  <video 
                    controls
                    poster={highlight.thumbnail}
                    className="highlight-video"
                  >
                    <source 
                      src={`${API_URL}/videos/${highlight._id}/stream`}
                      type={highlight.mimeType || 'video/mp4'}
                    />
                    Your browser does not support the video tag.
                  </video>
                </div>

                <div className="highlight-content">
                  <div className="highlight-category">
                    {getCategoryLabel(highlight.category)}
                  </div>

                  <h3>{highlight.title}</h3>
                  
                  {highlight.description && (
                    <p className="highlight-description">{highlight.description}</p>
                  )}

                  <div className="highlight-author">
                    <div className="author-avatar">{highlight.author.avatar}</div>
                    <span className="author-name">{highlight.author.username}</span>
                    <span className="upload-date">{formatDate(highlight.createdAt)}</span>
                  </div>

                  <div className="highlight-stats">
                    <div className="stat-item">
                      <span className="stat-icon">👁️</span>
                      <span className="stat-value">{formatViews(highlight.views)}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-icon">❤️</span>
                      <span className="stat-value">{highlight.likes.length}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-icon">💬</span>
                      <span className="stat-value">{highlight.comments.length}</span>
                    </div>
                    {highlight.fileSize && (
                      <div className="stat-item">
                        <span className="stat-icon">📦</span>
                        <span className="stat-value">{formatFileSize(highlight.fileSize)}</span>
                      </div>
                    )}
                  </div>

                  <div className="highlight-actions">
                    <button 
                      className="btn btn-secondary btn-small"
                      onClick={() => handleLike(highlight._id)}
                    >
                      ❤️ Like
                    </button>
                    {(highlight.author._id === currentUser._id || highlight.author._id === currentUser.id) && (
                      <button 
                        className="btn btn-danger btn-small"
                        onClick={() => handleDelete(highlight._id)}
                      >
                        🗑️ Obriši
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal za upload */}
      {showUploadModal && (
        <div className="modal-overlay" onClick={() => !isUploading && setShowUploadModal(false)}>
          <div className="upload-modal" onClick={(e) => e.stopPropagation()}>
            <h2>📹 Upload Video Highlight</h2>

            <div className="form-group">
              <label>Naslov videa *</label>
              <input
                type="text"
                value={uploadForm.title}
                onChange={(e) => setUploadForm({ ...uploadForm, title: e.target.value })}
                placeholder="npr. Nevjerovatan gol s polovice terena"
                disabled={isUploading}
              />
            </div>

            <div className="form-group">
              <label>Kategorija *</label>
              <select 
                value={uploadForm.category}
                onChange={(e) => setUploadForm({ ...uploadForm, category: e.target.value })}
                disabled={isUploading}
              >
                <option value="goal">⚽ Gol</option>
                <option value="save">🥅 Obrana</option>
                <option value="skill">⭐ Skill</option>
                <option value="compilation">🎬 Kompilacija</option>
                <option value="fail">😅 Fail</option>
                <option value="other">📹 Ostalo</option>
              </select>
            </div>

            <div className="form-group">
              <label>Opis (opcionalno)</label>
              <textarea
                value={uploadForm.description}
                onChange={(e) => setUploadForm({ ...uploadForm, description: e.target.value })}
                placeholder="Dodaj kratak opis videa..."
                rows="3"
                disabled={isUploading}
              />
            </div>

            <div className="form-group">
              <label>Video datoteka *</label>
              <div className="file-upload-area">
                <input
                  type="file"
                  accept="video/*"
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                  id="video-upload"
                  disabled={isUploading}
                />
                <label htmlFor="video-upload" className={`file-upload-label ${isUploading ? 'disabled' : ''}`}>
                  <div className="upload-icon">📁</div>
                  <p>{uploadForm.file ? uploadForm.file.name : 'Klikni za odabir videa'}</p>
                  <small>Podržani formati: MP4, MOV, AVI, MKV, WEBM (max 100MB)</small>
                  {uploadForm.file && (
                    <p className="file-size">{formatFileSize(uploadForm.file.size)}</p>
                  )}
                </label>
              </div>
            </div>

            {isUploading && (
              <div className="upload-progress">
                <div className="progress-bar-upload">
                  <div 
                    className="progress-fill-upload"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <p className="progress-text">{uploadProgress}% uploadano...</p>
              </div>
            )}

            <div className="modal-actions">
              <button 
                className="btn btn-secondary"
                onClick={() => setShowUploadModal(false)}
                disabled={isUploading}
              >
                Odustani
              </button>
              <button 
                className="btn btn-primary"
                onClick={handleUpload}
                disabled={isUploading}
              >
                {isUploading ? 'Uploading...' : 'Upload Video'}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

export default VideoHighlights;