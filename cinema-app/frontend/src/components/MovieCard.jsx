import { Link } from 'react-router-dom';

export default function MovieCard({ movie }) {
  const poster = movie.posterUrl;

  return (
    <Link to={`/movies/${movie.id}`} className="movie-card">
      <div className="movie-card-poster">
        {poster ? (
          <img src={poster} alt={movie.name} loading="lazy" />
        ) : (
          <div className="movie-card-placeholder">
            <span>🎞️</span>
          </div>
        )}
        <div className="movie-card-overlay">
          <span className="movie-card-play">▶</span>
        </div>
      </div>
      <div className="movie-card-info">
        <h3 className="movie-card-title">{movie.name}</h3>
        <div className="movie-card-meta">
          {movie.genres?.map((g) => (
            <span key={g} className="movie-genre-tag">{g}</span>
          ))}
          {movie.durationMinutes && (
            <span className="movie-duration">{movie.durationMinutes} min</span>
          )}
        </div>
      </div>
    </Link>
  );
}
