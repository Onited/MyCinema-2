import { useState, useEffect, useMemo } from 'react';
import { getAllMovies } from '../api/movies';
import MovieCard from '../components/MovieCard';

export default function MoviesPage() {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [activeGenre, setActiveGenre] = useState('Tous');

  useEffect(() => {
    getAllMovies()
      .then(setMovies)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const genres = useMemo(() => {
    const set = new Set(movies.flatMap((m) => m.genres).filter(Boolean));
    return ['Tous', ...Array.from(set).sort()];
  }, [movies]);

  const filtered = useMemo(() => {
    return movies.filter((m) => {
      const matchGenre = activeGenre === 'Tous' || m.genres.includes(activeGenre);
      const matchSearch =
        !search ||
        m.name?.toLowerCase().includes(search.toLowerCase()) ||
        m.description?.toLowerCase().includes(search.toLowerCase());
      return matchGenre && matchSearch;
    });
  }, [movies, activeGenre, search]);

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
        <p>Chargement des films…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-screen">
        <h2>😕 Erreur</h2>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="movies-page">
      <div className="movies-hero">
        <h1>🎬 À l'affiche</h1>
        <p>Découvrez notre sélection de films et réservez vos places</p>
      </div>

      <div className="movies-toolbar">
        <div className="search-box">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Rechercher un film…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="genre-tabs">
          {genres.map((g) => (
            <button
              key={g}
              className={`genre-tab ${activeGenre === g ? 'genre-active' : ''}`}
              onClick={() => setActiveGenre(g)}
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <p>Aucun film trouvé</p>
        </div>
      ) : (
        <div className="movies-grid">
          {filtered.map((movie) => (
            <MovieCard key={movie.id} movie={movie} />
          ))}
        </div>
      )}
    </div>
  );
}
