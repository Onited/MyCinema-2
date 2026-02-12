import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const USER_TYPES = [
  { value: 'standard', label: 'Standard', icon: '👤' },
  { value: 'etudiant', label: 'Étudiant', icon: '🎓' },
  { value: 'mineur', label: 'Mineur (-16 ans)', icon: '🧒' },
  { value: 'chomeur', label: 'Demandeur d\'emploi', icon: '📋' },
];

export default function RegisterPage() {
  const { register, login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    userType: 'standard',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (form.password !== form.confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }
    if (form.password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères');
      return;
    }

    setLoading(true);
    try {
      await register({
        fullName: form.fullName,
        email: form.email,
        password: form.password,
        userType: form.userType,
      });
      // Auto-login after register
      await login(form.email, form.password);
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card auth-card-wide">
        <div className="auth-header">
          <span className="auth-icon">🎬</span>
          <h1>Inscription</h1>
          <p>Créez votre compte MyCinema</p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="fullName">Nom complet</label>
            <input
              id="fullName"
              type="text"
              value={form.fullName}
              onChange={update('fullName')}
              placeholder="Jean Dupont"
              required
              autoFocus
            />
          </div>
          <div className="form-group">
            <label htmlFor="reg-email">Email</label>
            <input
              id="reg-email"
              type="email"
              value={form.email}
              onChange={update('email')}
              placeholder="jean@example.com"
              required
            />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="reg-password">Mot de passe</label>
              <input
                id="reg-password"
                type="password"
                value={form.password}
                onChange={update('password')}
                placeholder="Min. 8 caractères"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="confirmPassword">Confirmer</label>
              <input
                id="confirmPassword"
                type="password"
                value={form.confirmPassword}
                onChange={update('confirmPassword')}
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>Type de tarif</label>
            <div className="type-grid">
              {USER_TYPES.map((t) => (
                <label
                  key={t.value}
                  className={`type-option ${form.userType === t.value ? 'type-selected' : ''}`}
                >
                  <input
                    type="radio"
                    name="userType"
                    value={t.value}
                    checked={form.userType === t.value}
                    onChange={update('userType')}
                  />
                  <span className="type-icon">{t.icon}</span>
                  <span className="type-label">{t.label}</span>
                </label>
              ))}
            </div>
          </div>

          <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
            {loading ? 'Création…' : 'Créer mon compte'}
          </button>
        </form>

        <p className="auth-footer">
          Déjà un compte ? <Link to="/login">Se connecter</Link>
        </p>
      </div>
    </div>
  );
}
