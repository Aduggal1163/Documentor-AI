import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { adminAPI } from '../services/api';
import './Admin.css';

const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const adminToken = localStorage.getItem('adminToken');
    if (!adminToken) {
      navigate('/admin/login');
      return;
    }

    fetchUsers();
  }, [navigate]);

  const fetchUsers = async () => {
    try {
      const response = await adminAPI.getUsers();
      setUsers(response.data);
    } catch (err) {
      setError('Failed to load users');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    navigate('/admin/login');
  };

  if (loading) {
    return (
      <div className="admin-dashboard">
        <div className="admin-loading">
          <div className="spinner"></div>
          <p>Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <header className="admin-header">
        <div className="admin-header-content">
          <div className="admin-header-left">
            <h1>🔧 Admin Dashboard</h1>
          </div>
          <div className="admin-header-right">
            <Link to="/" className="admin-link">View Site</Link>
            <button onClick={handleLogout} className="admin-btn-logout">
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="admin-main">
        <div className="admin-stats">
          <div className="admin-stat-card">
            <div className="stat-icon">👥</div>
            <div className="stat-content">
              <span className="stat-value">{users.length}</span>
              <span className="stat-label">Total Users</span>
            </div>
          </div>
          <div className="admin-stat-card">
            <div className="stat-icon">📄</div>
            <div className="stat-content">
              <span className="stat-value">
                {users.reduce((acc, user) => acc + (user.documents?.length || 0), 0)}
              </span>
              <span className="stat-label">Total Documents</span>
            </div>
          </div>
          <div className="admin-stat-card">
            <div className="stat-icon">💬</div>
            <div className="stat-content">
              <span className="stat-value">
                {users.reduce((acc, user) => acc + (user.chats?.length || 0), 0)}
              </span>
              <span className="stat-label">Total Chats</span>
            </div>
          </div>
        </div>

        {error && <div className="admin-error">{error}</div>}

        <div className="admin-section">
          <h2>All Users</h2>
          {users.length === 0 ? (
            <div className="admin-empty">
              <p>No users found</p>
            </div>
          ) : (
            <div className="users-table">
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Username</th>
                    <th>Email</th>
                    <th>Documents</th>
                    <th>Chats</th>
                    <th>Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td>{user.id}</td>
                      <td className="user-username">{user.username}</td>
                      <td>{user.email}</td>
                      <td>{user.documents?.length || 0}</td>
                      <td>{user.chats?.length || 0}</td>
                      <td>{new Date(user.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {users.map((user) => (
          user.documents && user.documents.length > 0 && (
            <div className="admin-section" key={`docs-${user.id}`}>
              <h3>Documents by {user.username}</h3>
              <div className="documents-list">
                {user.documents.map((doc) => (
                  <div className="admin-document-card" key={doc.id}>
                    <div className="doc-icon">📄</div>
                    <div className="doc-info">
                      <span className="doc-name">{doc.file_name}</span>
                      <span className="doc-date">
                        {new Date(doc.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="doc-summary">
                      {doc.summary_text ? doc.summary_text.substring(0, 100) + '...' : 'No summary'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        ))}
      </main>
    </div>
  );
};

export default AdminDashboard;

