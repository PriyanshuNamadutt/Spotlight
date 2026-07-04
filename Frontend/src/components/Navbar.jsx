import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import GlowButton from './GlowButton.jsx';

export default function Navbar() {
  const { token, username, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <nav className="navbar">
      <Link to="/" className="brand">SPOT<span>LIGHT</span></Link>
      {token && (
        <div className="nav-links">
          <Link to="/dashboard">Dashboard</Link>
          <Link to="/interview">Interview Round</Link>
          <Link to="/practice">English Practice</Link>
          <Link to="/history">History</Link>
          <span className="nav-user">@{username}</span>
          <GlowButton variant="ghost" onClick={() => { logout(); navigate('/login'); }}>Logout</GlowButton>
        </div>
      )}
    </nav>
  );
}
