import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { updateProfile } from '../api/users';

const TYPE_INFO = {
  standard: { label: 'Standard', icon: '👤', color: '#888' },
  etudiant: { label: 'Étudiant', icon: '🎓', color: '#4ecdc4' },
  mineur: { label: 'Mineur', icon: '🧒', color: '#ffe66d' },
  chomeur: { label: 'Demandeur d\'emploi', icon: '📋', color: '#ff6b6b' },
};

export default function ProfilePage() {
  const { user, token, logout } = useAuth();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    full_name: user?.full_name || '',
    email: user?.email || '',
  });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  if (!user) return null;

  const typeInfo = TYPE_INFO[user.user_type] || TYPE_INFO.standard;

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setMessage('');
    try {
      await updateProfile(token, form);
      setMessage('Profil mis à jour !');
      setEditing(false);
      // Reload page to refresh user data
      window.location.reload();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="profile-page">
      <div className="profile-card">
        <div className="profile-header">
          <div className="profile-avatar">
            <span>{user.full_name?.charAt(0)?.toUpperCase()}</span>
          </div>
          <h1>{user.full_name}</h1>
          <span className={`user-badge badge-${user.user_type}`}>
            {typeInfo.icon} {typeInfo.label}
          </span>
        </div>

        {message && <div className="alert alert-success">{message}</div>}
        {error && <div className="alert alert-error">{error}</div>}

        <div className="profile-details">
          {editing ? (
            <>
              <div className="form-group">
                <label>Nom complet</label>
                <input
                  type="text"
                  value={form.full_name}
                  onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
              <div className="profile-actions">
                <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                  {saving ? 'Enregistrement…' : 'Enregistrer'}
                </button>
                <button className="btn btn-ghost" onClick={() => setEditing(false)}>
                  Annuler
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="detail-row">
                <span className="detail-label">Email</span>
                <span className="detail-value">{user.email}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Type</span>
                <span className="detail-value">{typeInfo.icon} {typeInfo.label}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Statut</span>
                <span className="detail-value">
                  {user.is_active ? '✅ Actif' : '❌ Inactif'}
                </span>
              </div>
              <div className="profile-actions">
                <button className="btn btn-primary" onClick={() => setEditing(true)}>
                  Modifier
                </button>
                <button className="btn btn-danger" onClick={logout}>
                  Déconnexion
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
