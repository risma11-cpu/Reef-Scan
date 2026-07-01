import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import axios from 'axios'
import './Auth.css'

const Register = ({ onLogin }) => {
  const [form, setForm] = useState({ username: '', email: '', password: '', confirm: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (form.password !== form.confirm) {
      setError('Konfirmasi password tidak cocok.')
      return
    }
    setLoading(true)
    try {
      const res = await axios.post('http://localhost:5000/api/register', form)
      onLogin(res.data.user)
      navigate('/analyze')
    } catch (err) {
      setError(err.response?.data?.error || 'Registrasi gagal, coba lagi.')
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

        <div className="auth-eyebrow">Buat Akun</div>
        <h1 className="auth-title">Bergabung dan<br /><em>mulai jaga karang.</em></h1>
        <p className="auth-sub">Buat akun gratis untuk menyimpan riwayat analisismu.</p>

        {error && <div className="auth-error">⚠️ {error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="auth-field">
            <label>Username</label>
            <input
              type="text"
              placeholder="Minimal 3 karakter"
              value={form.username}
              onChange={e => setForm({ ...form, username: e.target.value })}
              required autoFocus
            />
          </div>
          <div className="auth-field">
            <label>Email</label>
            <input
              type="email"
              placeholder="contoh@email.com"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              required
            />
          </div>
          <div className="auth-field">
            <label>Password</label>
            <input
              type="password"
              placeholder="Minimal 6 karakter"
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              required
            />
          </div>
          <div className="auth-field">
            <label>Konfirmasi Password</label>
            <input
              type="password"
              placeholder="Ulangi password"
              value={form.confirm}
              onChange={e => setForm({ ...form, confirm: e.target.value })}
              required
            />
          </div>
          <button type="submit" className="auth-btn" disabled={loading}>
            {loading ? 'Memproses...' : 'Buat Akun →'}
          </button>
        </form>

        <div className="auth-switch">
          Sudah punya akun? <Link to="/login">Login di sini</Link>
        </div>
      </motion.div>
    </div>
  )
}

export default Register