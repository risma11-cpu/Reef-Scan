import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import axios from 'axios'
import Navbar from '../components/navbar'
import './riwayat.css'

const CLASS_COLORS = {
  Healthy: '#2ecc8f',
  Bleached: '#f4c74e',
  Dead: '#8fa0ab',
  Algae: '#4aab5f',
}

const Riwayat = ({ user, logout }) => {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchData = async () => {
    try {
     const res = await axios.get('https://cimaiiyah.pythonanywhere.com/api/riwayat', {
  headers: { Authorization: `Bearer ${user?.token || ''}` }
})
      setData(res.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const hapus = async (id) => {
    if (!confirm('Hapus riwayat ini?')) return
    try {
      await axios.delete(`http://localhost:5000/api/riwayat/${id}`, {
        headers: { Authorization: `Bearer ${user?.token || ''}` }
      })
      setData(prev => prev.filter(d => d.id !== id))
    } catch (err) {
      console.error(err)
    }
  }

  const stats = {
    Healthy: data.filter(d => d.hasil_kelas === 'Healthy').length,
    Bleached: data.filter(d => d.hasil_kelas === 'Bleached').length,
    Dead: data.filter(d => d.hasil_kelas === 'Dead').length,
    Algae: data.filter(d => d.hasil_kelas === 'Algae').length,
  }

  return (
    <div className="riwayat-page">
      <Navbar user={user} logout={logout} dark />

      <div className="riwayat-wrap">
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6 }}
        >
          <div className="riwayat-eyebrow">Reef Scan · Riwayat</div>
          <h1 className="riwayat-title">Riwayat<br /><em>analisismu.</em></h1>
          <p className="riwayat-desc">Semua hasil analisis yang pernah kamu lakukan tersimpan di sini.</p>
        </motion.div>

        {/* STATS */}
        {data.length > 0 && (
          <div className="riwayat-stats">
            {Object.entries(stats).map(([kelas, jumlah]) => (
              <div key={kelas} className="rstat-card" style={{ '--c': CLASS_COLORS[kelas] }}>
                <span className="rstat-num">{jumlah}</span>
                <span className="rstat-lbl">
                  {{ Healthy: 'Sehat', Bleached: 'Memutih', Dead: 'Mati', Algae: 'Berlumut' }[kelas]}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* LIST */}
        {loading ? (
          <div className="riwayat-loading">Memuat data...</div>
        ) : data.length === 0 ? (
          <div className="riwayat-empty">
            <div className="empty-icon">🪸</div>
            <p>Kamu belum pernah melakukan analisis.<br />Yuk mulai analisis foto terumbu karangmu!</p>
            <Link to="/analyze" className="btn-empty">Analisis Sekarang →</Link>
          </div>
        ) : (
          <div className="riwayat-list">
            {data.map((item, i) => (
              <motion.div
                key={item.id}
                className="riwayat-card"
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.4, delay: i * 0.06 }}
              >
                <img
                  src={`https://cimaiiyah.pythonanywhere.com/static/uploads/${item.nama_file}`}
                  alt="karang"
                  className="riwayat-img"
                  onError={e => e.target.src = ''}
                />
                <div className="riwayat-info">
                  <div className="riwayat-kelas">
                    <span className="rdot" style={{ background: CLASS_COLORS[item.hasil_kelas] }} />
                    {item.hasil_kelas_id} ({item.hasil_kelas})
                  </div>
                  <div className="riwayat-conf">Keyakinan: {item.confidence.toFixed(1)}%</div>
                  <div className="riwayat-waktu">{new Date(item.waktu).toLocaleString('id-ID')}</div>
                </div>
                <button className="btn-hapus" onClick={() => hapus(item.id)}>Hapus</button>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default Riwayat
