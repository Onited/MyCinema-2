import { useState, useEffect, useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { reservationsApi } from '../services/api'
import { AuthContext } from '../App'
import toast from 'react-hot-toast'

function MyReservationsPage() {
  const navigate = useNavigate()
  const { user } = useContext(AuthContext)
  const [reservations, setReservations] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) { navigate('/login'); return }
    loadReservations()
  }, [user])

  const loadReservations = async () => {
    try {
      setLoading(true)
      const response = await reservationsApi.getByUser(user.id)
      setReservations(response.data)
    } catch (error) {
      toast.error('Erreur lors du chargement')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = async (id) => {
    if (!confirm('Annuler cette réservation?')) return
    try {
      await reservationsApi.cancel(id)
      toast.success('Réservation annulée')
      loadReservations()
    } catch (error) {
      toast.error('Erreur lors de l\'annulation')
    }
  }

  if (!user) return null

  return (
    <div className="container">
      <div className="page-header">
        <h1 className="page-title">Mes Réservations</h1>
      </div>
      {loading ? (
        <div className="flex flex-col gap-2">
          {[1, 2].map(i => <div key={i} className="skeleton" style={{ height: '100px' }}></div>)}
        </div>
      ) : reservations.length > 0 ? (
        <div className="flex flex-col gap-2">
          {reservations.map(r => (
            <div key={r._id} className="reservation-card">
              <div className="reservation-code">{r.reservationCode}</div>
              <div className="reservation-info">
                <h4>{r.sessionId?.movieName || 'Film'}</h4>
                <div className="reservation-meta">
                  <span>🎟️ {r.numberOfSeats} place(s)</span>
                  <span className={`badge ${r.status === 'confirmed' ? 'badge-success' : 'badge-error'}`}>
                    {r.status === 'confirmed' ? 'Confirmée' : 'Annulée'}
                  </span>
                </div>
              </div>
              <div>
                <div className="reservation-price">{r.totalPrice.toFixed(2)}€</div>
                {r.status === 'confirmed' && (
                  <button onClick={() => handleCancel(r._id)} className="btn btn-danger btn-sm mt-1">Annuler</button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <h3>Aucune réservation</h3>
          <button onClick={() => navigate('/movies')} className="btn btn-primary mt-2">Voir les films</button>
        </div>
      )}
    </div>
  )
}

export default MyReservationsPage
