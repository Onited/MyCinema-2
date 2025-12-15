import { useState, useEffect, useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { moviesApi, sessionsApi, usersApi, reservationsApi } from '../services/api'
import { AuthContext } from '../App'
import toast from 'react-hot-toast'

function AdminPage() {
  const navigate = useNavigate()
  const { user } = useContext(AuthContext)
  const [activeTab, setActiveTab] = useState('movies')
  const [movies, setMovies] = useState([])
  const [sessions, setSessions] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [modalType, setModalType] = useState('')
  const [editItem, setEditItem] = useState(null)

  useEffect(() => {
    if (!user?.is_admin) { navigate('/'); return }
    loadData()
  }, [user, activeTab])

  const loadData = async () => {
    setLoading(true)
    try {
      if (activeTab === 'movies') {
        const res = await moviesApi.getAll()
        setMovies(res.data)
      } else if (activeTab === 'sessions') {
        const res = await sessionsApi.getAll()
        setSessions(res.data)
      } else if (activeTab === 'users') {
        const res = await usersApi.getAll()
        setUsers(res.data)
      }
    } catch (error) {
      toast.error('Erreur de chargement')
    }
    setLoading(false)
  }

  const openModal = (type, item = null) => {
    setModalType(type)
    setEditItem(item)
    setShowModal(true)
  }

  const handleDelete = async (type, id) => {
    if (!confirm('Supprimer cet élément?')) return
    try {
      if (type === 'movie') await moviesApi.delete(id)
      else if (type === 'session') await sessionsApi.delete(id)
      else if (type === 'user') await usersApi.delete(id)
      toast.success('Supprimé')
      loadData()
    } catch (error) {
      toast.error('Erreur')
    }
  }

  if (!user?.is_admin) return null

  return (
    <div className="container">
      <div className="page-header">
        <h1 className="page-title">Administration</h1>
      </div>

      <div className="admin-tabs">
        {['movies', 'sessions', 'users'].map(tab => (
          <button key={tab} className={`admin-tab ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}>
            {tab === 'movies' ? '🎬 Films' : tab === 'sessions' ? '🎟️ Séances' : '👥 Utilisateurs'}
          </button>
        ))}
      </div>

      <div className="mb-2">
        {activeTab !== 'users' && (
          <button className="btn btn-primary" onClick={() => openModal(activeTab === 'movies' ? 'movie' : 'session')}>
            + Ajouter
          </button>
        )}
      </div>

      {loading ? (
        <div className="skeleton" style={{ height: '200px' }}></div>
      ) : (
        <div className="table-container">
          <table className="table">
            {activeTab === 'movies' && (
              <>
                <thead><tr><th>Nom</th><th>Genre</th><th>Année</th><th>Durée</th><th>Actions</th></tr></thead>
                <tbody>
                  {movies.map(m => (
                    <tr key={m._id}>
                      <td>{m.name}</td><td>{m.genre}</td><td>{m.year}</td><td>{m.duration}min</td>
                      <td className="table-actions">
                        <button className="btn btn-secondary btn-sm" onClick={() => openModal('movie', m)}>Modifier</button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete('movie', m._id)}>Supprimer</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </>
            )}
            {activeTab === 'sessions' && (
              <>
                <thead><tr><th>Film</th><th>Date</th><th>Heure</th><th>Salle</th><th>Places</th><th>Actions</th></tr></thead>
                <tbody>
                  {sessions.map(s => (
                    <tr key={s._id}>
                      <td>{s.movieName}</td>
                      <td>{new Date(s.date).toLocaleDateString('fr-FR')}</td>
                      <td>{s.startTime}</td><td>{s.roomNumber}</td>
                      <td>{s.availableSeats}/{s.totalSeats}</td>
                      <td className="table-actions">
                        <button className="btn btn-secondary btn-sm" onClick={() => openModal('session', s)}>Modifier</button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete('session', s._id)}>Supprimer</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </>
            )}
            {activeTab === 'users' && (
              <>
                <thead><tr><th>Username</th><th>Email</th><th>Type</th><th>Admin</th><th>Actions</th></tr></thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id}>
                      <td>{u.username}</td><td>{u.email}</td>
                      <td><span className="badge badge-primary">{u.user_type}</span></td>
                      <td>{u.is_admin ? '✓' : ''}</td>
                      <td><button className="btn btn-danger btn-sm" onClick={() => handleDelete('user', u.id)}>Supprimer</button></td>
                    </tr>
                  ))}
                </tbody>
              </>
            )}
          </table>
        </div>
      )}

      {showModal && <AdminModal type={modalType} item={editItem} onClose={() => setShowModal(false)} onSave={() => { setShowModal(false); loadData() }} movies={movies} />}
    </div>
  )
}

function AdminModal({ type, item, onClose, onSave, movies }) {
  const isEdit = !!item
  const [form, setForm] = useState(item || (type === 'movie' 
    ? { name: '', genre: '', duration: 120, year: 2024, director: '', description: '', posterUrl: '', rating: 0 }
    : { movieId: '', movieName: '', roomNumber: '', date: '', startTime: '', endTime: '', totalSeats: 100, basePrice: 10 }
  ))
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      if (type === 'movie') {
        if (isEdit) await moviesApi.update(item._id, form)
        else await moviesApi.create(form)
      } else {
        if (isEdit) await sessionsApi.update(item._id, form)
        else await sessionsApi.create(form)
      }
      toast.success(isEdit ? 'Modifié' : 'Créé')
      onSave()
    } catch (error) {
      toast.error('Erreur')
    }
    setSaving(false)
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{isEdit ? 'Modifier' : 'Ajouter'} {type === 'movie' ? 'un film' : 'une séance'}</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit}>
          {type === 'movie' ? (
            <>
              <div className="form-group">
                <label className="form-label">Nom *</label>
                <input className="form-input" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
              </div>
              <div className="grid grid-2" style={{gap:'1rem'}}>
                <div className="form-group">
                  <label className="form-label">Genre *</label>
                  <input className="form-input" value={form.genre} onChange={e => setForm({...form, genre: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Année *</label>
                  <input type="number" className="form-input" value={form.year} onChange={e => setForm({...form, year: parseInt(e.target.value)})} required />
                </div>
              </div>
              <div className="grid grid-2" style={{gap:'1rem'}}>
                <div className="form-group">
                  <label className="form-label">Durée (min) *</label>
                  <input type="number" className="form-input" value={form.duration} onChange={e => setForm({...form, duration: parseInt(e.target.value)})} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Note</label>
                  <input type="number" step="0.1" className="form-input" value={form.rating} onChange={e => setForm({...form, rating: parseFloat(e.target.value)})} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Réalisateur *</label>
                <input className="form-input" value={form.director} onChange={e => setForm({...form, director: e.target.value})} required />
              </div>
              <div className="form-group">
                <label className="form-label">URL Affiche</label>
                <input className="form-input" value={form.posterUrl} onChange={e => setForm({...form, posterUrl: e.target.value})} />
              </div>
            </>
          ) : (
            <>
              <div className="form-group">
                <label className="form-label">Film *</label>
                <select className="form-select" value={form.movieId} onChange={e => {
                  const m = movies.find(x => x._id === e.target.value)
                  setForm({...form, movieId: e.target.value, movieName: m?.name || ''})
                }} required>
                  <option value="">Sélectionner</option>
                  {movies.map(m => <option key={m._id} value={m._id}>{m.name}</option>)}
                </select>
              </div>
              <div className="grid grid-2" style={{gap:'1rem'}}>
                <div className="form-group">
                  <label className="form-label">Date *</label>
                  <input type="date" className="form-input" value={form.date?.split('T')[0] || form.date} onChange={e => setForm({...form, date: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Salle *</label>
                  <input className="form-input" value={form.roomNumber} onChange={e => setForm({...form, roomNumber: e.target.value})} required />
                </div>
              </div>
              <div className="grid grid-2" style={{gap:'1rem'}}>
                <div className="form-group">
                  <label className="form-label">Début *</label>
                  <input type="time" className="form-input" value={form.startTime} onChange={e => setForm({...form, startTime: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Fin *</label>
                  <input type="time" className="form-input" value={form.endTime} onChange={e => setForm({...form, endTime: e.target.value})} required />
                </div>
              </div>
              <div className="grid grid-2" style={{gap:'1rem'}}>
                <div className="form-group">
                  <label className="form-label">Places *</label>
                  <input type="number" className="form-input" value={form.totalSeats} onChange={e => setForm({...form, totalSeats: parseInt(e.target.value)})} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Prix (€) *</label>
                  <input type="number" step="0.01" className="form-input" value={form.basePrice} onChange={e => setForm({...form, basePrice: parseFloat(e.target.value)})} required />
                </div>
              </div>
            </>
          )}
          <div className="flex gap-2 mt-2">
            <button type="button" className="btn btn-secondary" style={{flex:1}} onClick={onClose}>Annuler</button>
            <button type="submit" className="btn btn-primary" style={{flex:1}} disabled={saving}>{saving ? 'Sauvegarde...' : 'Sauvegarder'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AdminPage
