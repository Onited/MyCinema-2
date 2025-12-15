import { useState, useEffect, useContext } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { moviesApi, sessionsApi, reservationsApi } from '../services/api'
import { AuthContext } from '../App'
import toast from 'react-hot-toast'

function MovieDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useContext(AuthContext)
  
  const [movie, setMovie] = useState(null)
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [selectedSession, setSelectedSession] = useState(null)
  const [seats, setSeats] = useState(1)
  const [booking, setBooking] = useState(false)

  useEffect(() => {
    loadMovieAndSessions()
  }, [id])

  const loadMovieAndSessions = async () => {
    try {
      setLoading(true)
      const [movieRes, sessionsRes] = await Promise.all([
        moviesApi.getById(id),
        sessionsApi.getByMovie(id)
      ])
      setMovie(movieRes.data)
      setSessions(sessionsRes.data)
    } catch (error) {
      console.error('Error loading movie:', error)
      toast.error('Erreur lors du chargement du film')
    } finally {
      setLoading(false)
    }
  }

  const handleBooking = (session) => {
    if (!user) {
      toast.error('Veuillez vous connecter pour réserver')
      navigate('/login')
      return
    }
    setSelectedSession(session)
    setSeats(1)
    setShowModal(true)
  }

  const confirmBooking = async () => {
    if (!selectedSession) return
    
    try {
      setBooking(true)
      const response = await reservationsApi.create({
        sessionId: selectedSession._id,
        numberOfSeats: seats,
        userId: user.id,
        userName: `${user.first_name || ''} ${user.last_name || user.username}`.trim(),
        userEmail: user.email,
        userType: user.user_type || 'regular'
      })
      
      toast.success(`Réservation confirmée! Code: ${response.data.reservation.reservationCode}`)
      setShowModal(false)
      loadMovieAndSessions()
    } catch (error) {
      console.error('Error booking:', error)
      toast.error(error.response?.data?.error || 'Erreur lors de la réservation')
    } finally {
      setBooking(false)
    }
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('fr-FR', { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long' 
    })
  }

  const getPriceMultiplier = () => {
    const multipliers = {
      regular: 1.0,
      student: 0.8,
      under16: 0.7,
      unemployed: 0.75
    }
    return multipliers[user?.user_type] || 1.0
  }

  if (loading) {
    return (
      <div className="container">
        <div className="skeleton" style={{ height: '400px', marginBottom: '2rem' }}></div>
      </div>
    )
  }

  if (!movie) {
    return (
      <div className="container">
        <div className="empty-state">
          <div className="empty-state-icon">🎬</div>
          <h3>Film non trouvé</h3>
          <button onClick={() => navigate('/movies')} className="btn btn-primary mt-2">
            Retour aux films
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="container">
      {/* Movie Header */}
      <div className="movie-detail-header animate-fade-in">
        <div className="grid" style={{ gridTemplateColumns: '300px 1fr', gap: '2rem' }}>
          <div>
            {movie.posterUrl ? (
              <img src={movie.posterUrl} alt={movie.name} className="movie-poster" style={{ borderRadius: 'var(--radius-lg)' }} />
            ) : (
              <div className="movie-poster-placeholder" style={{ borderRadius: 'var(--radius-lg)', height: '450px' }}>🎬</div>
            )}
          </div>
          <div>
            <h1 className="page-title">{movie.name}</h1>
            <div className="flex gap-2 mt-2" style={{ flexWrap: 'wrap' }}>
              <span className="badge badge-primary">{movie.genre}</span>
              <span className="badge badge-primary">{movie.year}</span>
              <span className="badge badge-primary">{movie.duration} min</span>
              {movie.rating > 0 && (
                <span className="badge badge-success">⭐ {movie.rating.toFixed(1)}</span>
              )}
            </div>
            <p className="text-secondary mt-2">
              <strong>Réalisateur:</strong> {movie.director}
            </p>
            {movie.description && (
              <p className="mt-2">{movie.description}</p>
            )}
          </div>
        </div>
      </div>

      {/* Sessions */}
      <div className="mt-3">
        <h2 className="mb-2">Séances disponibles</h2>
        
        {sessions.length > 0 ? (
          <div className="grid grid-3">
            {sessions.map((session, index) => (
              <div 
                key={session._id} 
                className="session-card animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="session-time">{session.startTime}</div>
                <div className="session-date">{formatDate(session.date)}</div>
                
                <div className="session-details">
                  <div className="session-detail">
                    <span>🚪</span>
                    <span>Salle {session.roomNumber}</span>
                  </div>
                  <div className="session-detail">
                    <span>💰</span>
                    <span>{session.basePrice.toFixed(2)}€</span>
                  </div>
                </div>

                <div className={`seats-available ${session.availableSeats < 10 ? 'low' : ''} ${session.availableSeats === 0 ? 'none' : ''}`}>
                  <span>🎟️</span>
                  <span>
                    {session.availableSeats === 0 
                      ? 'Complet' 
                      : `${session.availableSeats} places disponibles`}
                  </span>
                </div>

                <button 
                  onClick={() => handleBooking(session)}
                  disabled={session.availableSeats === 0}
                  className="btn btn-primary mt-2"
                  style={{ width: '100%' }}
                >
                  Réserver
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-state-icon">🎟️</div>
            <h3>Aucune séance disponible</h3>
            <p>Revenez plus tard pour voir les séances de ce film</p>
          </div>
        )}
      </div>

      {/* Booking Modal */}
      {showModal && selectedSession && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Réserver des places</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>

            <div className="mb-2">
              <p><strong>Film:</strong> {movie.name}</p>
              <p><strong>Date:</strong> {formatDate(selectedSession.date)}</p>
              <p><strong>Heure:</strong> {selectedSession.startTime}</p>
              <p><strong>Salle:</strong> {selectedSession.roomNumber}</p>
            </div>

            <div className="form-group">
              <label className="form-label">Nombre de places</label>
              <select 
                className="form-select"
                value={seats}
                onChange={(e) => setSeats(parseInt(e.target.value))}
              >
                {Array.from({ length: Math.min(10, selectedSession.availableSeats) }, (_, i) => (
                  <option key={i + 1} value={i + 1}>{i + 1}</option>
                ))}
              </select>
            </div>

            <div className="card mt-2">
              <div className="flex justify-between mb-1">
                <span>Prix unitaire:</span>
                <span>{selectedSession.basePrice.toFixed(2)}€</span>
              </div>
              {user?.user_type && user.user_type !== 'regular' && (
                <div className="flex justify-between mb-1 text-success">
                  <span>Réduction ({user.user_type}):</span>
                  <span>-{((1 - getPriceMultiplier()) * 100).toFixed(0)}%</span>
                </div>
              )}
              <div className="flex justify-between mb-1">
                <span>Prix après réduction:</span>
                <span>{(selectedSession.basePrice * getPriceMultiplier()).toFixed(2)}€</span>
              </div>
              <div className="flex justify-between font-bold" style={{ fontSize: '1.25rem', borderTop: '1px solid var(--border-color)', paddingTop: '0.5rem', marginTop: '0.5rem' }}>
                <span>Total:</span>
                <span className="text-success">
                  {(selectedSession.basePrice * getPriceMultiplier() * seats).toFixed(2)}€
                </span>
              </div>
            </div>

            <div className="flex gap-2 mt-2">
              <button 
                className="btn btn-secondary" 
                onClick={() => setShowModal(false)}
                style={{ flex: 1 }}
              >
                Annuler
              </button>
              <button 
                className="btn btn-primary" 
                onClick={confirmBooking}
                disabled={booking}
                style={{ flex: 1 }}
              >
                {booking ? 'Réservation...' : 'Confirmer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default MovieDetailPage
