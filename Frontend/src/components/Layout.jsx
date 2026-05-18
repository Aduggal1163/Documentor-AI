import { Link, useNavigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import './Layout.css';

const Layout = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="layout">
      <header className="header">
        <div className="header-content">
          <Link to="/dashboard" className="logo">
            <img src="/favicon.svg" alt="Documentor AI Logo" className="logo-img" />
            <span>Documentor AI</span>
          </Link>
          <nav className="nav">
            {user ? (
              <>
                <Link to="/dashboard" className="nav-link">Documents</Link>

                {/* Theme Toggle */}
                <button
                  id="theme-toggle-btn"
                  className="theme-toggle"
                  onClick={toggleTheme}
                  title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
                  aria-label="Toggle theme"
                >
                  {theme === 'dark' ? '☀️' : '🌙'}
                </button>

                <Link to="/dashboard/profile" className="nav-link profile-link">
                  <div className="nav-avatar">
                    {user.username?.charAt(0).toUpperCase()}
                  </div>
                  <span>{user.username}</span>
                </Link>
                <button onClick={handleLogout} className="btn-logout">
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/" className="nav-link">Home</Link>
                <Link to="/signin" className="nav-link">Sign In</Link>
                <Link to="/signup" className="nav-cta">Get Started</Link>
              </>
            )}
          </nav>
        </div>
      </header>
      <main className="main">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
