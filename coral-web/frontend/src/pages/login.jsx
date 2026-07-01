import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import axios from 'axios'
import './Auth.css'

const Login = ({ onLogin }) => {
  const [form, setForm] = useState({ username: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await axios.post('http://localhost:5000/api/login', form)
      onLogin(res.data.user)
      navigate('/analyze')
    } catch (err) {
      setError(err.response?.data?.error || 'Login gagal, coba lagi.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-bg">
        <img src="/images/foto-1.jpg" alt="" />
        <div className="auth-overlay" />
      </div>

      <motion.div
        className="auth-card"
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        <div className="auth-brand">
          <span>🪸</span>
          <Link to="/">Reef Scan</Link>
        </div>

        <div className="auth-eyebrow">Masuk Akun</div>
        <h1 className="auth-title">Halo,<br /><em>selamat datang kembali.</em></h1>
        <p className="auth-sub">Login untuk mulai menganalisis terumbu karang.</p>

        {error && <div className="auth-error">⚠️ {error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="auth-field">
            <label>Username</label>
            <input
              type="text"
              placeholder="Masukkan username"
              value={form.username}
              onChange={e => setForm({ ...form, username: e.target.value })}
              required
              autoFocus
            />
          </div>
          <div className="auth-field">
            <label>Password</label>
            <input
              type="password"
              placeholder="Masukkan password"
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              required
            />
          </div>
          <button type="submit" className="auth-btn" disabled={loading}>
            {loading ? 'Memproses...' : 'Masuk →'}
          </button>
        </form>

        <div className="auth-switch">
          Belum punya akun? <Link to="/register">Daftar sekarang</Link>
        </div>
      </motion.div>
    </div>
  )
}

export default Login