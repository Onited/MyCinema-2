import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getReservationsByUser, cancelReservation } from '../api/sessions';
import { useAuth } from '../context/AuthContext';

const STATUS_MAP = {
  confirmed: { label: 'Confirmée', class: 'status-confirmed' },
  cancelled: { label: 'Annulée', class: 'status-cancelled' },
  pending: { label: 'En attente', class: 'status-pending' },
};

export default function ReservationsPage() {
  const { user } = useAuth();
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchReservations = async () => {
    try {
      const data = await getReservationsByUser(user.id);
      setReservations(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchReservations();
  }, [user]);

  const handleCancel = async (id) => {
    if (!confirm('Annuler cette réservation ?')) return;
    try {
      await cancelReservation(id);
      fetchReservations();
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) {
    return <div className="loading-screen"><div className="spinner" /></div>;
  }

  return (
    <div className="reservations-page">
      <h1>🎟️ Mes Réservations</h1>

      {error && <div className="alert alert-error">{error}</div>}

      {reservations.length === 0 ? (
        <div className="empty-state">
          <p>Vous n'avez aucune réservation</p>
          <Link to="/" className="btn btn-primary">Parcourir les films</Link>
        </div>
      ) : (
        <div className="reservations-list">
          {reservations.map((r) => {
            const status = STATUS_MAP[r.status] || STATUS_MAP.confirmed;
            const date = r.createdAt
              ? new Date(r.createdAt).toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })
              : '';

            return (
              <div key={r._id} className="reservation-card">
                <div className="reservation-header">
                  <span className="reservation-code">{r.reservationCode}</span>
                  <span className={`reservation-status ${status.class}`}>{status.label}</span>
                </div>
                <div className="reservation-body">
                  <div className="reservation-detail">
                    <span>👤</span> {r.userName}
                  </div>
                  <div className="reservation-detail">
                    <span>💺</span> {r.numberOfSeats} place{r.numberOfSeats > 1 ? 's' : ''}
                  </div>
                  <div className="reservation-detail">
                    <span>💰</span> {r.totalPrice?.toFixed(2)} €
                    {r.userType && r.userType !== 'standard' && (
                      <span className="discount-badge">Tarif {r.userType}</span>
                    )}
                  </div>
                  {date && (
                    <div className="reservation-detail">
                      <span>📅</span> {date}
                    </div>
                  )}
                </div>
                {r.status !== 'cancelled' && (
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => handleCancel(r._id)}
                  >
                    Annuler
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
