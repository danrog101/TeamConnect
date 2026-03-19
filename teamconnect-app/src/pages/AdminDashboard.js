import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Toast from '../components/Toast';
import api from '../services/api';
import './AdminDashboard.css';
import { useLanguage } from '../i18n/LanguageContext';

const ADMIN_EMAIL = 'teamconnect0102@gmail.com';

function AdminDashboard() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [tournaments, setTournaments] = useState([]);
  const [fields, setFields] = useState([]);
  const [studios, setStudios] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(null);
  const [newPassword, setNewPassword] = useState('');

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
    if (activeTab === 'fields') loadFields();
    if (activeTab === 'studios') loadStudios();
    if (activeTab === 'groups') loadGroups();
  }, [activeTab, currentPage, searchTerm]);

  const loadDashboardStats = async () => {
    try {
      const response = await api.get('/admin/stats');
      setStats(response.data);
    } catch (error) {
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
      const response = await api.get('/admin/users', { params: { page: currentPage, limit: 20, search: searchTerm } });
      setUsers(response.data.users);
      setTotalPages(response.data.totalPages);
    } catch (error) {
      setToast({ message: 'Greška pri učitavanju korisnika', type: 'error' });
    } finally { setLoading(false); }
  };

  const loadTeams = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/teams', { params: { page: currentPage, limit: 20, search: searchTerm } });
      setTeams(response.data.teams);
      setTotalPages(response.data.totalPages);
    } catch (error) {
      setToast({ message: 'Greška pri učitavanju timova', type: 'error' });
    } finally { setLoading(false); }
  };

  const loadTournaments = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/tournaments', { params: { page: currentPage, limit: 20, search: searchTerm } });
      setTournaments(response.data.tournaments);
      setTotalPages(response.data.totalPages);
    } catch (error) {
      setToast({ message: 'Greška pri učitavanju turnira', type: 'error' });
    } finally { setLoading(false); }
  };

  const loadFields = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/fields', { params: { page: currentPage, limit: 20, search: searchTerm } });
      setFields(response.data.fields || response.data);
      setTotalPages(response.data.totalPages || 1);
    } catch (error) {
      setToast({ message: 'Greška pri učitavanju terena', type: 'error' });
    } finally { setLoading(false); }
  };

  const loadStudios = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/studios', { params: { page: currentPage, limit: 20, search: searchTerm } });
      setStudios(response.data.studios || response.data);
      setTotalPages(response.data.totalPages || 1);
    } catch (error) {
      setToast({ message: 'Greška pri učitavanju studija', type: 'error' });
    } finally { setLoading(false); }
  };

  const loadGroups = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/groups', { params: { page: currentPage, limit: 20, search: searchTerm } });
      setGroups(response.data.groups || response.data);
      setTotalPages(response.data.totalPages || 1);
    } catch (error) {
      setToast({ message: 'Greška pri učitavanju grupa', type: 'error' });
    } finally { setLoading(false); }
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

  const handleDeleteField = async (fieldId) => {
    try {
      await api.delete(`/admin/fields/${fieldId}`);
      setToast({ message: 'Teren obrisan!', type: 'success' });
      setShowDeleteConfirm(null);
      loadFields();
    } catch (error) {
      setToast({ message: 'Greška pri brisanju terena', type: 'error' });
    }
  };

  const handleDeleteStudio = async (studioId) => {
    try {
      await api.delete(`/admin/studios/${studioId}`);
      setToast({ message: 'Studio obrisan!', type: 'success' });
      setShowDeleteConfirm(null);
      loadStudios();
    } catch (error) {
      setToast({ message: 'Greška pri brisanju studija', type: 'error' });
    }
  };

  const handleDeleteGroup = async (groupId) => {
    try {
      await api.delete(`/admin/groups/${groupId}`);
      setToast({ message: 'Grupa obrisana!', type: 'success' });
      setShowDeleteConfirm(null);
      loadGroups();
    } catch (error) {
      setToast({ message: 'Greška pri brisanju grupe', type: 'error' });
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

  const confirmDelete = () => {
    if (!showDeleteConfirm) return;
    const { type, id } = showDeleteConfirm;
    if (type === 'user') handleDeleteUser(id);
    else if (type === 'team') handleDeleteTeam(id);
    else if (type === 'tournament') handleDeleteTournament(id);
    else if (type === 'field') handleDeleteField(id);
    else if (type === 'studio') handleDeleteStudio(id);
    else if (type === 'group') handleDeleteGroup(id);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('hr-HR', {
      day: '2-digit', month: '2-digit', year: 'numeric'
    });
  };

  const switchTab = (tab) => {
    setActiveTab(tab);
    setCurrentPage(1);
    setSearchTerm('');
  };

  const Pagination = () => totalPages > 1 ? (
    <div className="pagination">
      <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>Prethodna</button>
      <span>Stranica {currentPage} od {totalPages}</span>
      <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}>Sljedeća</button>
    </div>
  ) : null;

  const SearchBar = ({ placeholder }) => (
    <div className="section-header">
      <input
        type="text"
        placeholder={placeholder}
        value={searchTerm}
        onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
        className="search-input"
      />
    </div>
  );

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
          <h1>🛡️ Admin Panel</h1>
          <p>Upravljanje aplikacijom TeamConnects</p>
        </div>

        {/* Tabs */}
        <div className="admin-tabs">
          {[
            { key: 'dashboard', label: '📊 Dashboard' },
            { key: 'users', label: '👥 Korisnici' },
            { key: 'teams', label: '⚽ Timovi' },
            { key: 'tournaments', label: '🏆 Turniri' },
            { key: 'fields', label: '🏟️ Tereni' },
            { key: 'studios', label: '🏋️ Studiji' },
            { key: 'groups', label: '👥 Grupe' },
          ].map(tab => (
            <button
              key={tab.key}
              className={`admin-tab ${activeTab === tab.key ? 'active' : ''}`}
              onClick={() => switchTab(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── DASHBOARD ── */}
        {activeTab === 'dashboard' && stats && (
          <div className="dashboard-stats">
            {[
              { icon: '👥', value: stats.totalUsers, label: 'Ukupno korisnika' },
              { icon: '⚽', value: stats.totalTeams, label: 'Ukupno timova' },
              { icon: '🏆', value: stats.totalTournaments, label: 'Ukupno turnira' },
              { icon: '🏟️', value: stats.totalFields, label: 'Ukupno terena' },
              { icon: '📈', value: stats.recentRegistrations, label: 'Novih korisnika (7 dana)', highlight: true },
            ].map((s, i) => (
              <div key={i} className={`stat-card ${s.highlight ? 'highlight' : ''}`}>
                <div className="stat-icon">{s.icon}</div>
                <div className="stat-info">
                  <h3>{s.value}</h3>
                  <p>{s.label}</p>
                </div>
              </div>
            ))}
            <div className="admin-support-section">
              <h3>Podrška korisnicima</h3>
              <p>Korisnici vas mogu kontaktirati na:</p>
              <a href="mailto:teamconnect0102@gmail.com" className="support-email">
                teamconnect0102@gmail.com
              </a>
            </div>
          </div>
        )}

        {/* ── USERS ── */}
        {activeTab === 'users' && (
          <div className="admin-section">
            <SearchBar placeholder="Pretraži korisnike..." />
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
                          <button className="btn-action btn-verify" onClick={() => handleVerifyUser(user.id)} title="Verificiraj">✓</button>
                        )}
                        <button className="btn-action btn-password" onClick={() => setShowResetPasswordModal(user)} title="Reset lozinke">🔑</button>
                        {user.email !== ADMIN_EMAIL && (
                          <button className="btn-action btn-delete" onClick={() => setShowDeleteConfirm({ type: 'user', id: user.id, name: user.username })} title="Obriši">🗑️</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination />
          </div>
        )}

        {/* ── TEAMS ── */}
        {activeTab === 'teams' && (
          <div className="admin-section">
            <SearchBar placeholder="Pretraži timove..." />
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
                      <td>{formatDate(team.date)} {team.time}</td>
                      <td>{team.current_players}/{team.max_players}</td>
                      <td>{team.creator?.username || '-'}</td>
                      <td className="action-buttons">
                        <button className="btn-action btn-delete" onClick={() => setShowDeleteConfirm({ type: 'team', id: team.id, name: team.name })}>🗑️</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination />
          </div>
        )}

        {/* ── TOURNAMENTS ── */}
        {activeTab === 'tournaments' && (
          <div className="admin-section">
            <SearchBar placeholder="Pretraži turnire..." />
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
                      <td>{formatDate(tournament.start_date)}</td>
                      <td>{tournament.max_teams}</td>
                      <td>
                        <select value={tournament.status} onChange={(e) => handleUpdateTournamentStatus(tournament.id, e.target.value)} className="status-select">
                          <option value="upcoming">Nadolazeći</option>
                          <option value="active">Aktivan</option>
                          <option value="finished">Završen</option>
                        </select>
                      </td>
                      <td>{tournament.creator?.username || '-'}</td>
                      <td className="action-buttons">
                        <button className="btn-action btn-delete" onClick={() => setShowDeleteConfirm({ type: 'tournament', id: tournament.id, name: tournament.name })}>🗑️</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination />
          </div>
        )}

        {/* ── FIELDS ── */}
        {activeTab === 'fields' && (
          <div className="admin-section">
            <SearchBar placeholder="Pretraži terene..." />
            <div className="admin-table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Naziv</th>
                    <th>Sport</th>
                    <th>Grad</th>
                    <th>Adresa</th>
                    <th>Cijena</th>
                    <th>Dostupnost</th>
                    <th>Dodao</th>
                    <th>Akcije</th>
                  </tr>
                </thead>
                <tbody>
                  {fields.map(field => (
                    <tr key={field.id}>
                      <td><strong>{field.name}</strong></td>
                      <td>{field.sport}</td>
                      <td>{field.city}, {field.country}</td>
                      <td>{field.address || '-'}</td>
                      <td>{field.price ? `${field.price} €/h` : 'Na upit'}</td>
                      <td>
                        <span className={`badge ${field.availability === 'Dostupno' ? 'badge-success' : 'badge-warning'}`}>
                          {field.availability || 'Dostupno'}
                        </span>
                      </td>
                      <td>{field.users?.username || '-'}</td>
                      <td className="action-buttons">
                        <button className="btn-action btn-delete" onClick={() => setShowDeleteConfirm({ type: 'field', id: field.id, name: field.name })}>🗑️</button>
                      </td>
                    </tr>
                  ))}
                  {fields.length === 0 && (
                    <tr><td colSpan="8" style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>Nema terena</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            <Pagination />
          </div>
        )}

        {/* ── STUDIOS ── */}
        {activeTab === 'studios' && (
          <div className="admin-section">
            <SearchBar placeholder="Pretraži studije..." />
            <div className="admin-table-container">
              <table className="admin-table">
                <thead>
  <tr>
    <th>Naziv</th>
    <th>Opis</th>
    <th>Trener</th>
    <th>Kreiran</th>
    <th>Akcije</th>
  </tr>
</thead>
<tbody>
  {studios.map(studio => (
    <tr key={studio.id}>
      <td><strong>{studio.name}</strong></td>
      <td>{studio.description ? studio.description.substring(0, 50) + '...' : '-'}</td>
      <td>{studio.trainer?.username || '-'}</td>
      <td>{formatDate(studio.created_at)}</td>
      <td className="action-buttons">
        <button className="btn-action btn-delete" onClick={() => setShowDeleteConfirm({ type: 'studio', id: studio.id, name: studio.name })}>🗑️</button>
      </td>
    </tr>
  ))}
  {studios.length === 0 && (
    <tr><td colSpan="5" style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>Nema studija</td></tr>
  )}
</tbody>
            
              </table>
            </div>
            <Pagination />
          </div>
        )}

        {/* ── GROUPS ── */}
        {activeTab === 'groups' && (
          <div className="admin-section">
            <SearchBar placeholder="Pretraži grupe..." />
            <div className="admin-table-container">
              <table className="admin-table">
         <thead>
  <tr>
    <th>Naziv</th>
    <th>Sport</th>
    <th>Organizator</th>
    <th>Kreirana</th>
    <th>Akcije</th>
  </tr>
</thead>
<tbody>
  {groups.map(group => (
    <tr key={group.id}>
      <td><strong>{group.name}</strong></td>
      <td>{group.sport || '-'}</td>
      <td>{group.creator?.username || '-'}</td>
      <td>{formatDate(group.created_at)}</td>
      <td className="action-buttons">
        <button className="btn-action btn-delete" onClick={() => setShowDeleteConfirm({ type: 'group', id: group.id, name: group.name })}>🗑️</button>
      </td>
    </tr>
  ))}
  {groups.length === 0 && (
    <tr><td colSpan="5" style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>Nema grupa</td></tr>
  )}
</tbody>
              </table>
            </div>
            <Pagination />
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
              <button className="btn btn-secondary" onClick={() => setShowDeleteConfirm(null)}>Odustani</button>
              <button className="btn btn-danger" onClick={confirmDelete}>Obriši</button>
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
              <button className="btn btn-secondary" onClick={() => { setShowResetPasswordModal(null); setNewPassword(''); }}>Odustani</button>
              <button className="btn btn-primary" onClick={() => handleResetPassword(showResetPasswordModal.id)}>Spremi</button>
            </div>
          </div>
        </div>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

export default AdminDashboard;