import { Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useState } from 'react'
import './navbar.css'

const Navbar = ({ user, logout, dark = false }) => {
  const location = useLocation()

  return (
    <motion.nav
      className={`navbar ${dark ? 'navbar-dark' : ''}`}
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.7, ease: 'easeOut' }}
    >
      <div className="nav-brand">
        <Link to="/">
          <span className="brand-icon">🪸</span>
          <span className="brand-name">Reef Scan</span>
        </Link>
      </div>

      <ul className="nav-links">
        <li><Link to="/" className={location.pathname === '/' ? 'active' : ''}>Beranda</Link></li>
        <li><Link to="/analyze" className={location.pathname === '/analyze' ? 'active' : ''}>Analisis</Link></li>
        {user && <li><Link to="/riwayat" className={location.pathname === '/riwayat' ? 'active' : ''}>Riwayat</Link></li>}
      </ul>

      <div className="nav-right">
        {user ? (
          <>
            <span className="nav-username">👤 {user.username}</span>
            <button className="btn-nav btn-outline" onClick={logout}>Keluar</button>
          </>
        ) : (
          <>
            <Link to="/login" className="btn-nav btn-outline">Masuk</Link>
            <Link to="/register" className="btn-nav btn-filled">Daftar</Link>
          </>
        )}
      </div>
    </motion.nav>
  )
}

export default Navbar
