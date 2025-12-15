import { useContext } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AuthContext } from '../App'
import './Navbar.css'

function Navbar() {
  const { user, logout } = useContext(AuthContext)
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <nav className="navbar">
      <div className="container navbar-container">
        <Link to="/" className="navbar-brand">
          <span className="brand-icon">🎬</span>
          <span className="brand-text">CinéBook</span>
        </Link>

        <div className="navbar-links">
          <Link to="/movies" className="nav-link">Films</Link>
          <Link to="/sessions" className="nav-link">Séances</Link>
          
          {user ? (
            <>
              <Link to="/my-reservations" className="nav-link">Mes Réservations</Link>
              {user.is_admin && (
                <Link to="/admin" className="nav-link nav-link-admin">Admin</Link>
              )}
              <div className="nav-user">
                <span className="nav-user-name">{user.username}</span>
                <span className="nav-user-type badge badge-primary">{user.user_type}</span>
                <button onClick={handleLogout} className="btn btn-secondary btn-sm">
                  Déconnexion
                </button>
              </div>
            </>
          ) : (
            <div className="nav-auth">
              <Link to="/login" className="btn btn-secondary btn-sm">Connexion</Link>
              <Link to="/register" className="btn btn-primary btn-sm">Inscription</Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}

export default Navbar
