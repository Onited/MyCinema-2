import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getSessionById, createReservation } from '../api/sessions';
import { useAuth } from '../context/AuthContext';

const PRICE_MULTIPLIERS = {
  standard: 1.0,
  etudiant: 0.8,
  mineur: 0.7,
  chomeur: 0.75,
};

const TYPE_LABELS = {
  standard: 'Standard',
  etudiant: 'Étudiant (-20%)',
  mineur: 'Mineur (-30%)',
  chomeur: 'Demandeur d\'emploi (-25%)',
};

export default function BookingPage() {
  const { sessionId } = useParams();
  const { user, token } = useAuth();
  const navigate = useNavigate();

  const [session, setSession] = useState(null);
  const [seats, setSeats] = useState(1);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    getSessionById(sessionId)
      .then(setSession)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [sessionId]);

  if (!user) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <h2>Connexion requise</h2>
          <p>Vous devez être connecté pour réserver.</p>
          <Link to="/login" className="btn btn-primary btn-full">Se connecter</Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return <div className="loading-screen"><div className="spinner" /></div>;
  }

  if (error || !session) {
    return (
      <div className="error-screen">
        <h2>Séance introuvable</h2>
        <Link to="/" className="btn btn-primary">Retour</Link>
      </div>
    );
  }

  const multiplier = PRICE_MULTIPLIERS[user.user_type] || 1;
  const unitPrice = session.basePrice * multiplier;
  const totalPrice = unitPrice * seats;
  const date = new Date(session.date).toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const handleBook = async () => {
    setSubmitting(true);
    setError('');
    try {
      const result = await createReservation(
        {
          sessionId: session._id,
          userId: user.id,
          userName: user.full_name,
          userEmail: user.email,
          numberOfSeats: seats,
          userType: user.user_type,
        },
        token
      );
      setSuccess(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    const reservation = success.reservation;
    const pricing = success.pricingDetails;
    return (
      <div className="booking-page">
        <div className="booking-success">
          <div className="success-icon">✅</div>
          <h2>Réservation confirmée !</h2>
          <div className="booking-ticket">
            <div className="ticket-row">
              <span>Code</span>
              <strong>{reservation.reservationCode}</strong>
            </div>
            <div className="ticket-row">
              <span>Film</span>
              <strong>{session.movieName}</strong>
            </div>
            <div className="ticket-row">
              <span>Places</span>
              <strong>{pricing.numberOfSeats}</strong>
            </div>
            <div className="ticket-row">
              <span>Total</span>
              <strong>{pricing.totalPrice?.toFixed(2)} €</strong>
            </div>
          </div>
          <div className="booking-actions">
            <Link to="/reservations" className="btn btn-primary">Mes réservations</Link>
            <Link to="/" className="btn btn-ghost">Retour aux films</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="booking-page">
      <div className="booking-card">
        <Link to={`/movies/${session.movieId}`} className="back-link">← Retour au film</Link>
        <h1>Réserver</h1>

        <div className="booking-summary">
          <div className="summary-row">
            <span className="summary-label">🎬 Film</span>
            <span className="summary-value">{session.movieName}</span>
          </div>
          <div className="summary-row">
            <span className="summary-label">📅 Date</span>
            <span className="summary-value">{date}</span>
          </div>
          <div className="summary-row">
            <span className="summary-label">🕐 Horaire</span>
            <span className="summary-value">{session.startTime} → {session.endTime}</span>
          </div>
          <div className="summary-row">
            <span className="summary-label">🏠 Salle</span>
            <span className="summary-value">Salle {session.roomNumber}</span>
          </div>
          <div className="summary-row">
            <span className="summary-label">💺 Disponibles</span>
            <span className="summary-value">{session.availableSeats} places</span>
          </div>
        </div>

        <div className="booking-controls">
          <div className="form-group">
            <label>Nombre de places</label>
            <div className="seat-selector">
              <button
                className="btn btn-ghost"
                onClick={() => setSeats(Math.max(1, seats - 1))}
                disabled={seats <= 1}
              >
                −
              </button>
              <span className="seat-count">{seats}</span>
              <button
                className="btn btn-ghost"
                onClick={() => setSeats(Math.min(session.availableSeats, seats + 1))}
                disabled={seats >= session.availableSeats}
              >
                +
              </button>
            </div>
          </div>

          <div className="pricing-breakdown">
            <div className="price-row">
              <span>Tarif {TYPE_LABELS[user.user_type]}</span>
              <span>{unitPrice.toFixed(2)} € / place</span>
            </div>
            <div className="price-row price-total">
              <span>Total</span>
              <span>{totalPrice.toFixed(2)} €</span>
            </div>
          </div>

          {error && <div className="alert alert-error">{error}</div>}

          <button
            className="btn btn-primary btn-full btn-lg"
            onClick={handleBook}
            disabled={submitting}
          >
            {submitting ? 'Réservation…' : `Confirmer — ${totalPrice.toFixed(2)} €`}
          </button>
        </div>
      </div>
    </div>
  );
}
