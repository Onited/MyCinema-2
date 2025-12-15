import { useState, useContext } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authApi } from '../services/api'
import { AuthContext } from '../App'
import toast from 'react-hot-toast'

function RegisterPage() {
  const navigate = useNavigate()
  const { login, user } = useContext(AuthContext)
  
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
    first_name: '',
    last_name: '',
    user_type: 'regular'
  })
  const [loading, setLoading] = useState(false)

  // Redirect if already logged in
  if (user) {
    navigate('/')
    return null
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (formData.password !== formData.confirmPassword) {
      toast.error('Les mots de passe ne correspondent pas')
      return
    }
    
    try {
      setLoading(true)
      const { confirmPassword, ...registerData } = formData
      const response = await authApi.register(registerData)
      login(response.data.user, response.data.token)
      toast.success('Inscription réussie!')
      navigate('/')
    } catch (error) {
      console.error('Register error:', error)
      toast.error(error.response?.data?.error || 'Erreur lors de l\'inscription')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-card animate-fade-in">
        <div className="auth-header">
          <h2>Inscription</h2>
          <p className="text-muted">Créez votre compte CinéBook</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-2" style={{ gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Prénom</label>
              <input
                type="text"
                className="form-input"
                placeholder="Jean"
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Nom</label>
              <input
                type="text"
                className="form-input"
                placeholder="Dupont"
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Nom d'utilisateur *</label>
            <input
              type="text"
              className="form-input"
              placeholder="jeandupont"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Email *</label>
            <input
              type="email"
              className="form-input"
              placeholder="votre@email.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Type de compte</label>
            <select
              className="form-select"
              value={formData.user_type}
              onChange={(e) => setFormData({ ...formData, user_type: e.target.value })}
            >
              <option value="regular">Standard</option>
              <option value="student">Étudiant (-20%)</option>
              <option value="under16">Moins de 16 ans (-30%)</option>
              <option value="unemployed">Demandeur d'emploi (-25%)</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Mot de passe *</label>
            <input
              type="password"
              className="form-input"
              placeholder="••••••••"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
              minLength={6}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Confirmer le mot de passe *</label>
            <input
              type="password"
              className="form-input"
              placeholder="••••••••"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              required
            />
          </div>

          <button 
            type="submit" 
            className="btn btn-primary btn-lg"
            style={{ width: '100%' }}
            disabled={loading}
          >
            {loading ? 'Inscription...' : 'S\'inscrire'}
          </button>
        </form>

        <div className="auth-footer">
          Déjà un compte?{' '}
          <Link to="/login">Connectez-vous</Link>
        </div>
      </div>
    </div>
  )
}

export default RegisterPage
