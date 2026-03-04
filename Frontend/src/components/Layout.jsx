import { Link, useNavigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Layout.css';

const Layout = () => {
  const { user, logout } = useAuth();
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
            📄 Documentor AI
          </Link>
          <nav className="nav">
            {user ? (
              <>
                <Link to="/dashboard" className="nav-link">Documents</Link>
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

