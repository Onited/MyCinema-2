import { useState, useEffect, useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { sessionsApi, reservationsApi } from '../services/api'
import { AuthContext } from '../App'
import toast from 'react-hot-toast'

function SessionsPage() {
  const navigate = useNavigate()
  const { user } = useContext(AuthContext)
  
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [selectedSession, setSelectedSession] = useState(null)
  const [seats, setSeats] = useState(1)
  const [booking, setBooking] = useState(false)

  useEffect(() => {
    loadSessions()
  }, [])

  const loadSessions = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await sessionsApi.getAll({ upcoming: true, active: true })
      setSessions(response.data)
    } catch (error) {
      console.error('Error loading sessions:', error)
      const message = error.response?.data?.error || 'Erreur lors du chargement des séances'
      if (message.includes('Impossible de charger les films') || error.response?.status === 503) {
        setError('Impossible de charger les films')
        toast.error('Impossible de charger les films')
      } else {
        setError(message)
        toast.error(message)
      }
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
      loadSessions()
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

  // Group sessions by date
  const sessionsByDate = sessions.reduce((acc, session) => {
    const dateKey = new Date(session.date).toISOString().split('T')[0]
    if (!acc[dateKey]) acc[dateKey] = []
    acc[dateKey].push(session)
    return acc
  }, {})

  return (
    <div className="container">
      <div className="page-header">
        <h1 className="page-title">Séances</h1>
        <p className="page-subtitle">Toutes les séances à venir</p>
      </div>

      {loading ? (
        <div className="grid grid-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="skeleton" style={{ height: '200px' }}></div>
          ))}
        </div>
      ) : error ? (
        <div className="empty-state">
          <div className="empty-state-icon">⚠️</div>
          <h3>{error}</h3>
          <p>Veuillez réessayer ultérieurement</p>
          <button onClick={loadSessions} className="btn btn-primary mt-2">Réessayer</button>
        </div>
      ) : Object.keys(sessionsByDate).length > 0 ? (
        Object.entries(sessionsByDate).map(([date, dateSessions]) => (
          <div key={date} className="mb-3">
            <h3 className="mb-2" style={{ textTransform: 'capitalize' }}>
              {formatDate(date)}
            </h3>
            <div className="grid grid-3">
              {dateSessions.map((session, index) => (
                <div 
                  key={session._id} 
                  className="session-card animate-fade-in"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <h4 className="mb-1">{session.movieName}</h4>
                  <div className="session-time">{session.startTime}</div>
                  
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
                        : `${session.availableSeats} places`}
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
          </div>
        ))
      ) : (
        <div className="empty-state">
          <div className="empty-state-icon">🎟️</div>
          <h3>Aucune séance disponible</h3>
          <p>Revenez plus tard pour voir les prochaines séances</p>
        </div>
      )}

      {/* Booking Modal */}
      {showModal && selectedSession && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Réserver des places</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>

            <div className="mb-2">
              <p><strong>Film:</strong> {selectedSession.movieName}</p>
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

export default SessionsPage
