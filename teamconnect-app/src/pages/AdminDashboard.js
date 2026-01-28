import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Toast from '../components/Toast';
import api from '../services/api';
import './AdminDashboard.css';

const ADMIN_EMAIL = 'teamconnect0102@gmail.com';

function AdminDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(null);
  const [newPassword, setNewPassword] = useState('');

  // Check if current user is admin
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user.email !== ADMIN_EMAIL) {
      setToast({ message: 'Pristup odbijen. Samo administrator može pristupiti.', type: 'error' });
      setTimeout(() => navigate('/dashboard'), 2000);
      return;
    }
    loadDashboardStats();
  }, []);

  useEffect(() => {
    if (activeTab === 'users') loadUsers();
    if (activeTab === 'teams') loadTeams();
    if (activeTab === 'tournaments') loadTournaments();
  }, [activeTab, currentPage, searchTerm]);

  const loadDashboardStats = async () => {
    try {
      const response = await api.get('/admin/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Load stats error:', error);
      if (error.response?.status === 403) {
        setToast({ message: 'Pristup odbijen', type: 'error' });
        setTimeout(() => navigate('/dashboard'), 2000);
      }
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/users', {
        params: { page: currentPage, limit: 20, search: searchTerm }
      });
      setUsers(response.data.users);
      setTotalPages(response.data.totalPages);
    } catch (error) {
      console.error('Load users error:', error);
      setToast({ message: 'Greška pri učitavanju korisnika', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const loadTeams = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/teams', {
        params: { page: currentPage, limit: 20, search: searchTerm }
      });
      setTeams(response.data.teams);
      setTotalPages(response.data.totalPages);
    } catch (error) {
      console.error('Load teams error:', error);
      setToast({ message: 'Greška pri učitavanju timova', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const loadTournaments = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/tournaments', {
        params: { page: currentPage, limit: 20, search: searchTerm }
      });
      setTournaments(response.data.tournaments);
      setTotalPages(response.data.totalPages);
    } catch (error) {
      console.error('Load tournaments error:', error);
      setToast({ message: 'Greška pri učitavanju turnira', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyUser = async (userId) => {
    try {
      await api.post(`/admin/users/${userId}/verify`);
      setToast({ message: 'Korisnik verificiran!', type: 'success' });
      loadUsers();
    } catch (error) {
      setToast({ message: 'Greška pri verifikaciji', type: 'error' });
    }
  };

  const handleDeleteUser = async (userId) => {
    try {
      await api.delete(`/admin/users/${userId}`);
      setToast({ message: 'Korisnik obrisan!', type: 'success' });
      setShowDeleteConfirm(null);
      loadUsers();
    } catch (error) {
      setToast({ message: error.response?.data?.message || 'Greška pri brisanju', type: 'error' });
    }
  };

  const handleResetPassword = async (userId) => {
    if (!newPassword || newPassword.length < 6) {
      setToast({ message: 'Lozinka mora imati najmanje 6 znakova', type: 'error' });
      return;
    }
    try {
      await api.post(`/admin/users/${userId}/reset-password`, { newPassword });
      setToast({ message: 'Lozinka resetirana!', type: 'success' });
      setShowResetPasswordModal(null);
      setNewPassword('');
    } catch (error) {
      setToast({ message: 'Greška pri resetiranju lozinke', type: 'error' });
    }
  };

  const handleDeleteTeam = async (teamId) => {
    try {
      await api.delete(`/admin/teams/${teamId}`);
      setToast({ message: 'Tim obrisan!', type: 'success' });
      setShowDeleteConfirm(null);
      loadTeams();
    } catch (error) {
      setToast({ message: 'Greška pri brisanju tima', type: 'error' });
    }
  };

  const handleDeleteTournament = async (tournamentId) => {
    try {
      await api.delete(`/admin/tournaments/${tournamentId}`);
      setToast({ message: 'Turnir obrisan!', type: 'success' });
      setShowDeleteConfirm(null);
      loadTournaments();
    } catch (error) {
      setToast({ message: 'Greška pri brisanju turnira', type: 'error' });
    }
  };

  const handleUpdateTournamentStatus = async (tournamentId, status) => {
    try {
      await api.put(`/admin/tournaments/${tournamentId}/status`, { status });
      setToast({ message: 'Status turnira ažuriran!', type: 'success' });
      loadTournaments();
    } catch (error) {
      setToast({ message: 'Greška pri ažuriranju statusa', type: 'error' });
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('hr-HR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading && !stats) {
    return (
      <div className="admin-page">
        <Navbar />
        <div className="admin-container">
          <div className="loading">Učitavanje...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <Navbar />

      <div className="admin-container">
        <div className="admin-header">
          <h1>Admin Panel</h1>
          <p>Upravljanje aplikacijom TeamConnect</p>
        </div>

        {/* Tabs */}
        <div className="admin-tabs">
          <button
            className={`admin-tab ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => { setActiveTab('dashboard'); setCurrentPage(1); }}
          >
            Dashboard
          </button>
          <button
            className={`admin-tab ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => { setActiveTab('users'); setCurrentPage(1); }}
          >
            Korisnici
          </button>
          <button
            className={`admin-tab ${activeTab === 'teams' ? 'active' : ''}`}
            onClick={() => { setActiveTab('teams'); setCurrentPage(1); }}
          >
            Timovi
          </button>
          <button
            className={`admin-tab ${activeTab === 'tournaments' ? 'active' : ''}`}
            onClick={() => { setActiveTab('tournaments'); setCurrentPage(1); }}
          >
            Turniri
          </button>
        </div>

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && stats && (
          <div className="dashboard-stats">
            <div className="stat-card">
              <div className="stat-icon">👥</div>
              <div className="stat-info">
                <h3>{stats.totalUsers}</h3>
                <p>Ukupno korisnika</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">⚽</div>
              <div className="stat-info">
                <h3>{stats.totalTeams}</h3>
                <p>Ukupno timova</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">🏆</div>
              <div className="stat-info">
                <h3>{stats.totalTournaments}</h3>
                <p>Ukupno turnira</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">📍</div>
              <div className="stat-info">
                <h3>{stats.totalFields}</h3>
                <p>Ukupno terena</p>
              </div>
            </div>
            <div className="stat-card highlight">
              <div className="stat-icon">📈</div>
              <div className="stat-info">
                <h3>{stats.recentRegistrations}</h3>
                <p>Novih korisnika (7 dana)</p>
              </div>
            </div>

            <div className="admin-support-section">
              <h3>Podrška korisnicima</h3>
              <p>Korisnici vas mogu kontaktirati na:</p>
              <a href="mailto:teamconnect0102@gmail.com" className="support-email">
                teamconnect0102@gmail.com
              </a>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="admin-section">
            <div className="section-header">
              <input
                type="text"
                placeholder="Pretraži korisnike..."
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                className="search-input"
              />
            </div>

            <div className="admin-table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Avatar</th>
                    <th>Korisnik</th>
                    <th>Email</th>
                    <th>Lokacija</th>
                    <th>Verificiran</th>
                    <th>Registriran</th>
                    <th>Akcije</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(user => (
                    <tr key={user.id}>
                      <td><span className="user-avatar-small">{user.avatar || '👤'}</span></td>
                      <td>
                        <strong>{user.username}</strong>
                        {user.first_name && <span className="user-fullname">{user.first_name} {user.last_name}</span>}
                      </td>
                      <td>{user.email}</td>
                      <td>{user.city ? `${user.city}, ${user.country}` : '-'}</td>
                      <td>
                        <span className={`badge ${user.is_verified ? 'badge-success' : 'badge-warning'}`}>
                          {user.is_verified ? 'Da' : 'Ne'}
                        </span>
                      </td>
                      <td>{formatDate(user.created_at)}</td>
                      <td className="action-buttons">
                        {!user.is_verified && (
                          <button
                            className="btn-action btn-verify"
                            onClick={() => handleVerifyUser(user.id)}
                            title="Verificiraj"
                          >
                            ✓
                          </button>
                        )}
                        <button
                          className="btn-action btn-password"
                          onClick={() => setShowResetPasswordModal(user)}
                          title="Reset lozinke"
                        >
                          🔑
                        </button>
                        {user.email !== ADMIN_EMAIL && (
                          <button
                            className="btn-action btn-delete"
                            onClick={() => setShowDeleteConfirm({ type: 'user', id: user.id, name: user.username })}
                            title="Obriši"
                          >
                            🗑️
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="pagination">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(p => p - 1)}
                >
                  Prethodna
                </button>
                <span>Stranica {currentPage} od {totalPages}</span>
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(p => p + 1)}
                >
                  Sljedeća
                </button>
              </div>
            )}
          </div>
        )}

        {/* Teams Tab */}
        {activeTab === 'teams' && (
          <div className="admin-section">
            <div className="section-header">
              <input
                type="text"
                placeholder="Pretraži timove..."
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                className="search-input"
              />
            </div>

            <div className="admin-table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Naziv</th>
                    <th>Sport</th>
                    <th>Lokacija</th>
                    <th>Datum</th>
                    <th>Igrači</th>
                    <th>Kreator</th>
                    <th>Akcije</th>
                  </tr>
                </thead>
                <tbody>
                  {teams.map(team => (
                    <tr key={team.id}>
                      <td><strong>{team.name}</strong></td>
                      <td>{team.sport}</td>
                      <td>{team.city}, {team.country}</td>
                      <td>{new Date(team.date).toLocaleDateString('hr-HR')} {team.time}</td>
                      <td>{team.current_players}/{team.max_players}</td>
                      <td>{team.creator?.username || 'Nepoznato'}</td>
                      <td className="action-buttons">
                        <button
                          className="btn-action btn-delete"
                          onClick={() => setShowDeleteConfirm({ type: 'team', id: team.id, name: team.name })}
                          title="Obriši"
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="pagination">
                <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>Prethodna</button>
                <span>Stranica {currentPage} od {totalPages}</span>
                <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}>Sljedeća</button>
              </div>
            )}
          </div>
        )}

        {/* Tournaments Tab */}
        {activeTab === 'tournaments' && (
          <div className="admin-section">
            <div className="section-header">
              <input
                type="text"
                placeholder="Pretraži turnire..."
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                className="search-input"
              />
            </div>

            <div className="admin-table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Naziv</th>
                    <th>Sport</th>
                    <th>Lokacija</th>
                    <th>Datum</th>
                    <th>Timovi</th>
                    <th>Status</th>
                    <th>Kreator</th>
                    <th>Akcije</th>
                  </tr>
                </thead>
                <tbody>
                  {tournaments.map(tournament => (
                    <tr key={tournament.id}>
                      <td><strong>{tournament.name}</strong></td>
                      <td>{tournament.sport}</td>
                      <td>{tournament.city}, {tournament.country}</td>
                      <td>{new Date(tournament.start_date).toLocaleDateString('hr-HR')}</td>
                      <td>{tournament.max_teams}</td>
                      <td>
                        <select
                          value={tournament.status}
                          onChange={(e) => handleUpdateTournamentStatus(tournament.id, e.target.value)}
                          className="status-select"
                        >
                          <option value="upcoming">Nadolazeći</option>
                          <option value="active">Aktivan</option>
                          <option value="finished">Završen</option>
                        </select>
                      </td>
                      <td>{tournament.creator?.username || 'Nepoznato'}</td>
                      <td className="action-buttons">
                        <button
                          className="btn-action btn-delete"
                          onClick={() => setShowDeleteConfirm({ type: 'tournament', id: tournament.id, name: tournament.name })}
                          title="Obriši"
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="pagination">
                <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>Prethodna</button>
                <span>Stranica {currentPage} od {totalPages}</span>
                <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}>Sljedeća</button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="modal-overlay" onClick={() => setShowDeleteConfirm(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3>Potvrda brisanja</h3>
            <p>Jeste li sigurni da želite obrisati <strong>{showDeleteConfirm.name}</strong>?</p>
            <p className="warning-text">Ova akcija se ne može poništiti!</p>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowDeleteConfirm(null)}>
                Odustani
              </button>
              <button
                className="btn btn-danger"
                onClick={() => {
                  if (showDeleteConfirm.type === 'user') handleDeleteUser(showDeleteConfirm.id);
                  if (showDeleteConfirm.type === 'team') handleDeleteTeam(showDeleteConfirm.id);
                  if (showDeleteConfirm.type === 'tournament') handleDeleteTournament(showDeleteConfirm.id);
                }}
              >
                Obriši
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {showResetPasswordModal && (
        <div className="modal-overlay" onClick={() => { setShowResetPasswordModal(null); setNewPassword(''); }}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3>Reset lozinke</h3>
            <p>Nova lozinka za <strong>{showResetPasswordModal.username}</strong></p>
            <input
              type="password"
              placeholder="Nova lozinka (min. 6 znakova)"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="modal-input"
            />
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => { setShowResetPasswordModal(null); setNewPassword(''); }}>
                Odustani
              </button>
              <button
                className="btn btn-primary"
                onClick={() => handleResetPassword(showResetPasswordModal.id)}
              >
                Spremi
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

export default AdminDashboard;
