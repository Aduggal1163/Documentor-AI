import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { adminAPI } from '../services/api';
import './Admin.css';

const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedUser, setExpandedUser] = useState(null);
  const [expandedDocument, setExpandedDocument] = useState(null);
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

  const toggleUser = (userId) => {
    setExpandedUser(expandedUser === userId ? null : userId);
  };

  const toggleDocument = (docId) => {
    setExpandedDocument(expandedDocument === docId ? null : docId);
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
            <div className="users-list">
              {users.map((user) => (
                <div className="user-card" key={user.id}>
                  <div 
                    className="user-header" 
                    onClick={() => toggleUser(user.id)}
                  >
                    <div className="user-info">
                      <span className="user-avatar">{user.username?.charAt(0).toUpperCase()}</span>
                      <div className="user-details">
                        <span className="user-name">{user.username}</span>
                        <span className="user-email">{user.email}</span>
                      </div>
                    </div>
                    <div className="user-stats">
                      <span className="badge badge-docs">{user.documents?.length || 0} Documents</span>
                      <span className="badge badge-chats">{user.chats?.length || 0} Chats</span>
                      <span className="user-date">{new Date(user.created_at).toLocaleDateString()}</span>
                    </div>
                    <span className="expand-icon">{expandedUser === user.id ? '▼' : '▶'}</span>
                  </div>

                  {expandedUser === user.id && (
                    <div className="user-content">
                      {/* Documents Section */}
                      {user.documents && user.documents.length > 0 && (
                        <div className="content-section">
                          <h4>📄 Documents</h4>
                          <div className="documents-list">
                            {user.documents.map((doc) => (
                              <div className="document-item" key={doc.id}>
                                <div 
                                  className="document-header"
                                  onClick={() => toggleDocument(doc.id)}
                                >
                                  <span className="doc-icon">📄</span>
                                  <span className="doc-name">{doc.file_name}</span>
                                  <span className="doc-date">{new Date(doc.created_at).toLocaleDateString()}</span>
                                  <span className="expand-icon">{expandedDocument === doc.id ? '▼' : '▶'}</span>
                                </div>
                                
                                {expandedDocument === doc.id && (
                                  <div className="document-details">
                                    <div className="detail-section">
                                      <h5>Summary:</h5>
                                      <p>{doc.summary_text || 'No summary available'}</p>
                                    </div>
                                    {doc.extracted_text && (
                                      <div className="detail-section">
                                        <h5>Extracted Text (first 500 chars):</h5>
                                        <p className="extracted-text">{doc.extracted_text}</p>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Chats Section */}
                      {user.chats && user.chats.length > 0 && (
                        <div className="content-section">
                          <h4>💬 Chat History</h4>
                          <div className="chats-list">
                            {user.chats.map((chat) => (
                              <div className="chat-item" key={chat.id}>
                                <div className="chat-header">
                                  <span className="chat-id">#{chat.id}</span>
                                  <span className="chat-date">{new Date(chat.created_at).toLocaleString()}</span>
                                </div>
                                <div className="chat-content">
                                  <div className="chat-question">
                                    <span className="chat-label">Q:</span>
                                    <span className="chat-text">{chat.question}</span>
                                  </div>
                                  <div className="chat-answer">
                                    <span className="chat-label">A:</span>
                                    <span className="chat-text">{chat.answer}</span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {(!user.documents || user.documents.length === 0) && 
                       (!user.chats || user.chats.length === 0) && (
                        <div className="no-data">
                          <p>No documents or chats yet</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;

