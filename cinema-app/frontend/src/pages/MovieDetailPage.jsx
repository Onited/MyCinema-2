import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getMovieById } from '../api/movies';
import { getSessionsByMovie } from '../api/sessions';
import SessionCard from '../components/SessionCard';

export default function MovieDetailPage() {
  const { id } = useParams();
  const [movie, setMovie] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      getMovieById(id),
      getSessionsByMovie(id),
    ])
      .then(([m, s]) => {
        setMovie(m);
        setSessions(s);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
      </div>
    );
  }

  if (error || !movie) {
    return (
      <div className="error-screen">
        <h2>Film introuvable</h2>
        <Link to="/" className="btn btn-primary">Retour aux films</Link>
      </div>
    );
  }

  return (
    <div className="movie-detail-page">
      <div className="movie-detail-hero">
        <div className="movie-detail-backdrop">
          {movie.posterUrl ? (
            <img src={movie.posterUrl} alt={movie.name} />
          ) : (
            <div className="movie-detail-placeholder">🎞️</div>
          )}
          <div className="movie-detail-gradient" />
        </div>

        <div className="movie-detail-info">
          <Link to="/" className="back-link">← Retour</Link>
          <h1>{movie.name}</h1>
          <div className="movie-detail-meta">
            {movie.genre && <span className="movie-genre-tag">{movie.genre}</span>}
            {movie.durationMinutes && (
              <span className="movie-duration">⏱ {movie.durationMinutes} min</span>
            )}
          </div>
          {movie.description && (
            <p className="movie-detail-description">{movie.description}</p>
          )}
        </div>
      </div>

      <div className="movie-detail-sessions">
        <h2>📅 Séances disponibles</h2>
        {sessions.length === 0 ? (
          <div className="empty-state">
            <p>Aucune séance programmée pour le moment</p>
          </div>
        ) : (
          <div className="sessions-grid">
            {sessions.map((s) => (
              <SessionCard key={s._id} session={s} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
