import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { moviesApi } from '../services/api'
import toast from 'react-hot-toast'

function MoviesPage() {
  const [movies, setMovies] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    genre: '',
    year: ''
  })

  useEffect(() => {
    loadMovies()
  }, [filters])

  const loadMovies = async () => {
    try {
      setLoading(true)
      const params = { active: true }
      if (filters.genre) params.genre = filters.genre
      if (filters.year) params.year = filters.year
      
      const response = await moviesApi.getAll(params)
      setMovies(response.data)
    } catch (error) {
      console.error('Error loading movies:', error)
      toast.error('Erreur lors du chargement des films')
    } finally {
      setLoading(false)
    }
  }

  const genres = ['Action', 'Comédie', 'Drame', 'Horreur', 'Science-Fiction', 'Animation', 'Thriller']
  const years = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i)

  return (
    <div className="container">
      <div className="page-header">
        <h1 className="page-title">Films à l'affiche</h1>
        <p className="page-subtitle">Découvrez notre sélection de films</p>
      </div>

      {/* Filters */}
      <div className="filters">
        <div className="filter-group">
          <select 
            className="form-select"
            value={filters.genre}
            onChange={(e) => setFilters({ ...filters, genre: e.target.value })}
          >
            <option value="">Tous les genres</option>
            {genres.map(genre => (
              <option key={genre} value={genre}>{genre}</option>
            ))}
          </select>
        </div>
        <div className="filter-group">
          <select 
            className="form-select"
            value={filters.year}
            onChange={(e) => setFilters({ ...filters, year: e.target.value })}
          >
            <option value="">Toutes les années</option>
            {years.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Movies Grid */}
      {loading ? (
        <div className="grid grid-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="movie-card">
              <div className="skeleton" style={{ aspectRatio: '2/3' }}></div>
              <div className="movie-info">
                <div className="skeleton" style={{ height: '1.5rem', marginBottom: '0.5rem' }}></div>
                <div className="skeleton" style={{ height: '1rem', width: '60%' }}></div>
              </div>
            </div>
          ))}
        </div>
      ) : movies.length > 0 ? (
        <div className="grid grid-4">
          {movies.map((movie, index) => (
            <Link 
              to={`/movies/${movie._id}`} 
              key={movie._id} 
              className="movie-card animate-fade-in"
              style={{ animationDelay: `${index * 0.05}s` }}
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
      ) : (
        <div className="empty-state">
          <div className="empty-state-icon">🎬</div>
          <h3>Aucun film trouvé</h3>
          <p>Essayez de modifier vos filtres</p>
        </div>
      )}
    </div>
  )
}

export default MoviesPage
