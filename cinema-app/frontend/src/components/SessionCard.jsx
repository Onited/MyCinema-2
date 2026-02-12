import { Link } from 'react-router-dom';

export default function SessionCard({ session }) {
  const date = new Date(session.date);
  const dateStr = date.toLocaleDateString('fr-FR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });

  const isFull = session.availableSeats <= 0;
  const isLow = session.availableSeats > 0 && session.availableSeats <= 5;

  return (
    <div className={`session-card ${isFull ? 'session-full' : ''}`}>
      <div className="session-card-header">
        <span className="session-date">{dateStr}</span>
        <span className="session-room">Salle {session.roomNumber}</span>
      </div>
      <div className="session-card-body">
        <div className="session-time">
          <span className="session-start">{session.startTime}</span>
          <span className="session-separator">→</span>
          <span className="session-end">{session.endTime}</span>
        </div>
        <div className="session-info">
          <span className="session-price">{session.basePrice?.toFixed(2)} €</span>
          <span className={`session-seats ${isLow ? 'seats-low' : ''}`}>
            {isFull ? 'Complet' : `${session.availableSeats} places`}
          </span>
        </div>
      </div>
      {!isFull && (
        <Link
          to={`/booking/${session._id}`}
          className="btn btn-primary btn-sm session-book-btn"
        >
          Réserver
        </Link>
      )}
    </div>
  );
}
