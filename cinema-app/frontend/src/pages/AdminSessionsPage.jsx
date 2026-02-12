import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getAllMovies } from '../api/movies';
import { getAllSessions, createSession } from '../api/sessions';

export default function AdminSessionsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [movies, setMovies] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [form, setForm] = useState({
    movieId: '',
    roomNumber: '',
    date: '',
    startTime: '',
    endTime: '',
    totalSeats: 100,
    basePrice: 10,
  });

  useEffect(() => {
    if (user?.user_type !== 'admin') {
      navigate('/');
      return;
    }
    Promise.all([getAllMovies(), getAllSessions({ upcoming: 'true' })])
      .then(([m, s]) => {
        setMovies(m);
        setSessions(s);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [user, navigate]);

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);

    try {
      const selectedMovie = movies.find((m) => String(m.id) === String(form.movieId));
      await createSession({
        movieId: form.movieId,
        movieName: selectedMovie?.name || '',
        roomNumber: form.roomNumber,
        date: new Date(form.date).toISOString(),
        startTime: form.startTime,
        endTime: form.endTime,
        totalSeats: parseInt(form.totalSeats, 10),
        basePrice: parseFloat(form.basePrice),
      });
      setSuccess('Séance créée avec succès !');
      setForm({ ...form, date: '', startTime: '', endTime: '' });
      // Refresh sessions list
      const updated = await getAllSessions({ upcoming: 'true' });
      setSessions(updated);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (user?.user_type !== 'admin') return null;

  if (loading) {
    return <div className="loading-screen"><div className="spinner" /></div>;
  }

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1>⚙️ Administration</h1>
        <p>Gestion des séances de cinéma</p>
      </div>

      <div className="admin-layout">
        {/* Create session form */}
        <div className="admin-card">
          <h2>Créer une séance</h2>

          {error && <div className="alert alert-error">{error}</div>}
          {success && <div className="alert alert-success">{success}</div>}

          <form onSubmit={handleSubmit} className="admin-form">
            <div className="form-group">
              <label htmlFor="movieId">Film</label>
              <select
                id="movieId"
                value={form.movieId}
                onChange={update('movieId')}
                required
              >
                <option value="">Sélectionner un film…</option>
                {movies.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} {m.durationMinutes ? `(${m.durationMinutes} min)` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="roomNumber">Salle</label>
              <select id="roomNumber" value={form.roomNumber} onChange={update('roomNumber')} required>
                <option value="">Choisir…</option>
                {[1, 2, 3, 4, 5].map((n) => (
                  <option key={n} value={n}>Salle {n}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="date">Date</label>
              <input
                id="date"
                type="date"
                value={form.date}
                onChange={update('date')}
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="startTime">Début</label>
                <input
                  id="startTime"
                  type="time"
                  value={form.startTime}
                  onChange={update('startTime')}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="endTime">Fin</label>
                <input
                  id="endTime"
                  type="time"
                  value={form.endTime}
                  onChange={update('endTime')}
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="totalSeats">Places</label>
                <input
                  id="totalSeats"
                  type="number"
                  min="1"
                  max="500"
                  value={form.totalSeats}
                  onChange={update('totalSeats')}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="basePrice">Prix (€)</label>
                <input
                  id="basePrice"
                  type="number"
                  min="0"
                  step="0.50"
                  value={form.basePrice}
                  onChange={update('basePrice')}
                  required
                />
              </div>
            </div>

            <button type="submit" className="btn btn-primary btn-full" disabled={submitting}>
              {submitting ? 'Création…' : 'Créer la séance'}
            </button>
          </form>
        </div>

        {/* Existing sessions */}
        <div className="admin-card">
          <h2>📅 Séances à venir ({sessions.length})</h2>
          {sessions.length === 0 ? (
            <p className="text-muted">Aucune séance programmée</p>
          ) : (
            <div className="admin-sessions-list">
              {sessions.map((s) => {
                const date = new Date(s.date).toLocaleDateString('fr-FR', {
                  weekday: 'short',
                  day: 'numeric',
                  month: 'short',
                });
                return (
                  <div key={s._id} className="admin-session-row">
                    <div className="admin-session-info">
                      <strong>{s.movieName}</strong>
                      <span className="text-muted">
                        {date} · {s.startTime}–{s.endTime} · Salle {s.roomNumber}
                      </span>
                    </div>
                    <div className="admin-session-meta">
                      <span className="session-seats">
                        {s.availableSeats}/{s.totalSeats} places
                      </span>
                      <span className="session-price">{s.basePrice?.toFixed(2)} €</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
