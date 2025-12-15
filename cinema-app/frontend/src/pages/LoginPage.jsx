import { useState, useContext } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authApi } from '../services/api'
import { AuthContext } from '../App'
import toast from 'react-hot-toast'

function LoginPage() {
  const navigate = useNavigate()
  const { login, user } = useContext(AuthContext)
  
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [loading, setLoading] = useState(false)

  // Redirect if already logged in
  if (user) {
    navigate('/')
    return null
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    try {
      setLoading(true)
      const response = await authApi.login(formData)
      login(response.data.user, response.data.token)
      toast.success('Connexion réussie!')
      navigate('/')
    } catch (error) {
      console.error('Login error:', error)
      toast.error(error.response?.data?.error || 'Erreur de connexion')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-card animate-fade-in">
        <div className="auth-header">
          <h2>Connexion</h2>
          <p className="text-muted">Bienvenue sur CinéBook</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email</label>
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
            <label className="form-label">Mot de passe</label>
            <input
              type="password"
              className="form-input"
              placeholder="••••••••"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
            />
          </div>

          <button 
            type="submit" 
            className="btn btn-primary btn-lg"
            style={{ width: '100%' }}
            disabled={loading}
          >
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>

        <div className="auth-footer">
          Pas encore de compte?{' '}
          <Link to="/register">Inscrivez-vous</Link>
        </div>
      </div>
    </div>
  )
}

export default LoginPage
