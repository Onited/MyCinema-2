import { Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { moviesApi } from '../services/api'

function HomePage() {
  const [featuredMovies, setFeaturedMovies] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadFeaturedMovies()
  }, [])

  const loadFeaturedMovies = async () => {
    try {
      const response = await moviesApi.getAll({ active: true })
      setFeaturedMovies(response.data.slice(0, 4))
    } catch (error) {
      console.error('Error loading movies:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero">
        <div className="container">
          <h1 className="hero-title">CinéBook</h1>
          <p className="hero-subtitle">
            Réservez vos places de cinéma en ligne. Découvrez les derniers films 
            et trouvez la séance parfaite pour vous.
          </p>
          <div className="hero-actions">
            <Link to="/movies" className="btn btn-primary btn-lg">
              <span>🎬</span> Voir les films
            </Link>
            <Link to="/sessions" className="btn btn-secondary btn-lg">
              <span>🎟️</span> Réserver une séance
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="container mt-3">
        <div className="stats-grid">
          <div className="stat-card glass">
            <div className="stat-value">🎬</div>
            <div className="stat-label">Films à l'affiche</div>
          </div>
          <div className="stat-card glass">
            <div className="stat-value">🎟️</div>
            <div className="stat-label">Réservation facile</div>
          </div>
          <div className="stat-card glass">
            <div className="stat-value">💰</div>
            <div className="stat-label">Tarifs réduits</div>
          </div>
          <div className="stat-card glass">
            <div className="stat-value">⭐</div>
            <div className="stat-label">Meilleure expérience</div>
          </div>
        </div>
      </section>

      {/* Featured Movies */}
      {featuredMovies.length > 0 && (
        <section className="container mt-3">
          <div className="page-header">
            <h2 className="page-title">Films à l'affiche</h2>
            <p className="page-subtitle">Les dernières sorties dans votre cinéma</p>
          </div>
          
          <div className="grid grid-4">
            {featuredMovies.map((movie, index) => (
              <Link 
                to={`/movies/${movie._id}`} 
                key={movie._id} 
                className="movie-card animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {movie.posterUrl ? (
                  <img src={movie.posterUrl} alt={movie.name} className="movie-poster" />
                ) : (
                  <div className="movie-poster-placeholder">🎬</div>
                )}
                {movie.rating > 0 && (
                  <div className={`movie-rating ${movie.rating >= 7 ? 'high' : 'medium'}`}>
                    ⭐ {movie.rating.toFixed(1)}
                  </div>
                )}
                <div className="movie-info">
                  <h3 className="movie-title">{movie.name}</h3>
                  <div className="movie-meta">
                    <span>{movie.genre}</span>
                    <span>•</span>
                    <span>{movie.duration} min</span>
                    <span>•</span>
                    <span>{movie.year}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          <div className="text-center mt-3">
            <Link to="/movies" className="btn btn-secondary">
              Voir tous les films →
            </Link>
          </div>
        </section>
      )}

      {/* Features Section */}
      <section className="container mt-3 mb-3">
        <div className="grid grid-3">
          <div className="card text-center">
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>👨‍🎓</div>
            <h3>Tarif Étudiant</h3>
            <p className="text-muted mt-1">
              -20% sur toutes vos réservations avec votre statut étudiant
            </p>
          </div>
          <div className="card text-center">
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>👶</div>
            <h3>Tarif -16 ans</h3>
            <p className="text-muted mt-1">
              -30% pour les moins de 16 ans sur toutes les séances
            </p>
          </div>
          <div className="card text-center">
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎫</div>
            <h3>Tarif Chômeur</h3>
            <p className="text-muted mt-1">
              -25% sur présentation d'un justificatif
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}

export default HomePage
