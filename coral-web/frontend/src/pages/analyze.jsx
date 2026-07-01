import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import axios from 'axios'
import Navbar from '../components/Navbar'
import './Analyze.css'

const CLASS_COLORS = {
  Healthy: '#2ecc8f',
  Bleached: '#f4c74e',
  Dead: '#8fa0ab',
  Algae: '#4aab5f',
}

const Analyze = ({ user, logout }) => {
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const inputRef = useRef(null)

  const handleFile = (f) => {
    if (!f) return
    setFile(f)
    setPreview(URL.createObjectURL(f))
    setResult(null)
    setError('')
  }

  const handleDrop = (e) => {
    e.preventDefault()
    handleFile(e.dataTransfer.files[0])
  }

  const handleSubmit = async () => {
    if (!file) return
    setLoading(true)
    setError('')
    const formData = new FormData()
    formData.append('image', file)
    try {
      const token = user?.token || ''
      const res = await axios.post('http://localhost:5000/api/analyze', formData, {
        headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${token}` }
      })
      setResult(res.data)
    } catch (err) {
      setError(err.response?.data?.error || 'Gagal memproses gambar.')
    } finally {
      setLoading(false)
    }
  }

  const reset = () => {
    setFile(null)
    setPreview(null)
    setResult(null)
    setError('')
  }

  const top = result?.prediction?.[0]
  const circumference = 2 * Math.PI * 54

  return (
    <div className="analyze-page">
      <Navbar user={user} logout={logout} dark />

      <div className="analyze-wrap">
        <motion.div
          className="analyze-header"
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6 }}
        >
          <div className="analyze-eyebrow">Reef Scan · Klasifikasi Visual</div>
          <h1 className="analyze-title">Apa kabar karang<br /><em>di foto ini?</em></h1>
          <p className="analyze-desc">Upload foto terumbu karang dan model AI akan membaca kondisinya secara otomatis.</p>
        </motion.div>

        {/* UPLOAD ZONE */}
        {!result && (
          <motion.div
            className="upload-zone"
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            onDrop={handleDrop}
            onDragOver={e => e.preventDefault()}
            onClick={() => !preview && inputRef.current?.click()}
            style={{ cursor: preview ? 'default' : 'pointer' }}
          >
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={e => handleFile(e.target.files[0])}
            />

            {preview ? (
              <div className="preview-wrap">
                <img src={preview} alt="preview" className="preview-img" />
                <button className="btn-change" onClick={e => { e.stopPropagation(); inputRef.current?.click() }}>
                  Ganti Foto
                </button>
              </div>
            ) : (
              <div className="upload-placeholder">
                <div className="upload-icon">🪸</div>
                <div className="upload-label">Pilih atau drag foto karang</div>
                <div className="upload-sub">PNG, JPG, JPEG, WEBP</div>
                <button className="btn-browse" onClick={e => { e.stopPropagation(); inputRef.current?.click() }}>
                  📁 Cari di Komputer
                </button>
              </div>
            )}
          </motion.div>
        )}

        {error && <div className="analyze-error">⚠️ {error}</div>}

        {/* SUBMIT */}
        {file && !result && (
          <motion.button
            className="btn-analyze"
            onClick={handleSubmit}
            disabled={loading}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.4 }}
          >
            {loading ? (
              <span className="loading-dots">Menganalisis<span>...</span></span>
            ) : 'Analisis Gambar →'}
          </motion.button>
        )}

        {/* RESULT */}
        <AnimatePresence>
          {result && (
            <motion.div
              className="result-section"
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6 }}
            >
              <div className="result-label">Hasil Analisis</div>
              <div className="result-grid">
                {/* Foto */}
                <div className="result-photo">
                  <img src={preview} alt="hasil" />
                </div>

                {/* Gauge + bars */}
                <div className="result-data">
                  {/* Gauge */}
                  <div className="gauge-wrap">
                    <svg width="130" height="130" viewBox="0 0 130 130">
                      <circle cx="65" cy="65" r="54" fill="none" stroke="rgba(240,236,228,0.08)" strokeWidth="10" />
                      <circle
                        cx="65" cy="65" r="54"
                        fill="none"
                        stroke={CLASS_COLORS[top?.label] || '#e8604c'}
                        strokeWidth="10"
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        strokeDashoffset={circumference * (1 - (top?.prob || 0) / 100)}
                        transform="rotate(-90 65 65)"
                        style={{ transition: 'stroke-dashoffset 1s cubic-bezier(.2,.8,.2,1)' }}
                      />
                    </svg>
                    <div className="gauge-center">
                      <div className="gauge-pct" style={{ color: CLASS_COLORS[top?.label] }}>
                        {Math.round(top?.prob || 0)}%
                      </div>
                      <div className="gauge-lbl">{top?.label_id}</div>
                    </div>
                  </div>

                  {/* Bars */}
                  <div className="bars">
                    {result.prediction.map((p) => (
                      <div key={p.label} className="bar-row">
                        <span className="bar-name">{p.label_id}</span>
                        <div className="bar-track">
                          <motion.div
                            className="bar-fill"
                            style={{ background: CLASS_COLORS[p.label] }}
                            initial={{ width: 0 }}
                            animate={{ width: `${p.prob}%` }}
                            transition={{ duration: 0.9, ease: [0.2, 0.8, 0.2, 1] }}
                          />
                        </div>
                        <span className="bar-pct">{p.prob.toFixed(1)}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <button className="btn-reset" onClick={reset}>← Analisis Foto Lain</button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

export default Analyze