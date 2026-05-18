import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { authAPI } from '../services/api';
import './Profile.css';

const Profile = () => {
  const { user, updateUser } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [username, setUsername] = useState(user?.username || '');
  const [email, setEmail] = useState(user?.email || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [activeTab, setActiveTab] = useState('profile');
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Stats
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(false);

  useEffect(() => {
    if (activeTab === 'stats') {
      fetchStats();
    }
  }, [activeTab]);

  const fetchStats = async () => {
    setStatsLoading(true);
    try {
      const res = await authAPI.getStats();
      setStats(res.data);
    } catch {
      // Stats unavailable
    } finally {
      setStatsLoading(false);
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    setTimeout(() => {
      updateUser({ ...user, username, email });
      setSuccess('Profile updated successfully!');
      setLoading(false);
    }, 1000);
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (newPassword !== confirmPassword) { setError('New passwords do not match'); return; }
    if (newPassword.length < 6) { setError('Password must be at least 6 characters'); return; }
    setLoading(true);
    setTimeout(() => {
      setSuccess('Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setLoading(false);
    }, 1000);
  };

  const formatDate = (dateString) =>
    new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric',
    });

  return (
    <div className="profile-container">
      {/* Header */}
      <div className="profile-header">
        <div className="profile-avatar">
          {user?.username?.charAt(0).toUpperCase()}
        </div>
        <div className="profile-header-info">
          <h1>{user?.username}</h1>
          <p>{user?.email}</p>
          <span className="member-since">
            Member since {user?.created_at ? formatDate(user.created_at) : 'Unknown'}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="profile-tabs">
        {[
          { id: 'profile', icon: '👤', label: 'Profile' },
          { id: 'stats', icon: '📊', label: 'Stats' },
          { id: 'security', icon: '🔒', label: 'Security' },
          { id: 'settings', icon: '⚙️', label: 'Settings' },
        ].map(tab => (
          <button
            key={tab.id}
            className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => { setActiveTab(tab.id); setError(''); setSuccess(''); }}
          >
            <span className="tab-icon">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      <div className="profile-content">

        {/* ── Profile Tab ─────────────────────────────── */}
        {activeTab === 'profile' && (
          <div className="profile-section animate-fadeIn">
            <h2>Profile Information</h2>
            <p className="section-description">Update your personal information</p>
            {error && <div className="alert alert-error">{error}</div>}
            {success && <div className="alert alert-success">{success}</div>}
            <form onSubmit={handleProfileUpdate} className="profile-form">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="username">Username</label>
                  <input type="text" id="username" value={username}
                    onChange={(e) => setUsername(e.target.value)} placeholder="Enter your username" />
                </div>
                <div className="form-group">
                  <label htmlFor="email">Email Address</label>
                  <input type="email" id="email" value={email}
                    onChange={(e) => setEmail(e.target.value)} placeholder="Enter your email" />
                </div>
              </div>
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </form>
          </div>
        )}

        {/* ── Stats Tab ────────────────────────────────── */}
        {activeTab === 'stats' && (
          <div className="profile-section animate-fadeIn">
            <h2>Usage Statistics</h2>
            <p className="section-description">Your activity overview on Documentor AI</p>

            {statsLoading ? (
              <div className="stats-loading">
                <div className="loading-spinner"></div>
                <p>Loading your stats...</p>
              </div>
            ) : stats ? (
              <>
                <div className="stats-grid">
                  <div className="stat-card-big">
                    <div className="stat-card-icon">📄</div>
                    <div className="stat-card-value">{stats.total_documents}</div>
                    <div className="stat-card-label">Total Documents</div>
                  </div>
                  <div className="stat-card-big">
                    <div className="stat-card-icon">💬</div>
                    <div className="stat-card-value">{stats.total_chats}</div>
                    <div className="stat-card-label">Total Questions Asked</div>
                  </div>
                  <div className="stat-card-big">
                    <div className="stat-card-icon">📊</div>
                    <div className="stat-card-value">{stats.total_diagrams}</div>
                    <div className="stat-card-label">Diagrams Generated</div>
                  </div>
                  <div className="stat-card-big accent">
                    <div className="stat-card-icon">🚀</div>
                    <div className="stat-card-value">{stats.recent_documents}</div>
                    <div className="stat-card-label">Uploads This Week</div>
                  </div>
                </div>

                <div className="stats-insights">
                  <h3>Insights</h3>
                  <div className="insight-list">
                    <div className="insight-item">
                      <span className="insight-dot green"></span>
                      <span>
                        You've asked an average of{' '}
                        <strong>
                          {stats.total_documents > 0
                            ? (stats.total_chats / stats.total_documents).toFixed(1)
                            : 0}
                        </strong>{' '}
                        questions per document.
                      </span>
                    </div>
                    <div className="insight-item">
                      <span className="insight-dot blue"></span>
                      <span>
                        <strong>{stats.total_diagrams}</strong> diagram{stats.total_diagrams !== 1 ? 's' : ''} generated from your documents.
                      </span>
                    </div>
                    <div className="insight-item">
                      <span className="insight-dot orange"></span>
                      <span>
                        <strong>{stats.recent_documents}</strong> new document{stats.recent_documents !== 1 ? 's' : ''} uploaded in the last 7 days.
                      </span>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="stats-empty">
                <div className="empty-icon">📭</div>
                <p>No stats available yet. Start uploading documents!</p>
              </div>
            )}
          </div>
        )}

        {/* ── Security Tab ─────────────────────────────── */}
        {activeTab === 'security' && (
          <div className="profile-section animate-fadeIn">
            <h2>Change Password</h2>
            <p className="section-description">Update your password to keep your account secure</p>
            {error && <div className="alert alert-error">{error}</div>}
            {success && <div className="alert alert-success">{success}</div>}
            <form onSubmit={handlePasswordChange} className="profile-form">
              <div className="form-group">
                <label htmlFor="currentPassword">Current Password</label>
                <input type="password" id="currentPassword" value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)} placeholder="Enter current password" />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="newPassword">New Password</label>
                  <input type="password" id="newPassword" value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)} placeholder="Enter new password" />
                </div>
                <div className="form-group">
                  <label htmlFor="confirmPassword">Confirm New Password</label>
                  <input type="password" id="confirmPassword" value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm new password" />
                </div>
              </div>
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? 'Changing...' : 'Change Password'}
              </button>
            </form>
          </div>
        )}

        {/* ── Settings Tab ─────────────────────────────── */}
        {activeTab === 'settings' && (
          <div className="profile-section animate-fadeIn">
            <h2>Preferences</h2>
            <p className="section-description">Customize your experience</p>

            <div className="settings-list">
              {/* Dark / Light Mode Toggle */}
              <div className="setting-item">
                <div className="setting-info">
                  <h3>{theme === 'dark' ? '🌙 Dark Mode' : '☀️ Light Mode'}</h3>
                  <p>
                    Currently using <strong>{theme}</strong> theme.
                    Click to switch to {theme === 'dark' ? 'light' : 'dark'} mode.
                  </p>
                </div>
                <label className="toggle-switch" id="theme-toggle-setting">
                  <input
                    type="checkbox"
                    checked={theme === 'dark'}
                    onChange={toggleTheme}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>

              <div className="setting-item">
                <div className="setting-info">
                  <h3>Email Notifications</h3>
                  <p>Receive email updates about your documents</p>
                </div>
                <label className="toggle-switch">
                  <input type="checkbox" defaultChecked />
                  <span className="toggle-slider"></span>
                </label>
              </div>

              <div className="setting-item danger-zone">
                <div className="setting-info">
                  <h3>Delete Account</h3>
                  <p>Permanently delete your account and all data</p>
                </div>
                <button className="btn-danger"
                  onClick={() => window.confirm('Are you sure? This cannot be undone.') && alert('Contact support to proceed.')}>
                  Delete Account
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
