import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const userTypeLabels = {
    standard: 'Standard',
    etudiant: 'Étudiant',
    mineur: 'Mineur',
    chomeur: 'Demandeur d\'emploi',
  };

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="navbar-brand">
          <span className="brand-icon">🎬</span>
          <span className="brand-text">MyCinema</span>
        </Link>

        <div className="navbar-links">
          <Link to="/" className="nav-link">Films</Link>
          {user && (
            <>
              <Link to="/reservations" className="nav-link">Mes Réservations</Link>
              <Link to="/profile" className="nav-link">Profil</Link>
            </>
          )}
        </div>

        <div className="navbar-actions">
          {user ? (
            <div className="user-menu">
              <span className="user-greeting">
                {user.full_name}
                <span className={`user-badge badge-${user.user_type}`}>
                  {userTypeLabels[user.user_type] || user.user_type}
                </span>
              </span>
              <button onClick={handleLogout} className="btn btn-ghost">Déconnexion</button>
            </div>
          ) : (
            <div className="auth-buttons">
              <Link to="/login" className="btn btn-ghost">Connexion</Link>
              <Link to="/register" className="btn btn-primary">Inscription</Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
