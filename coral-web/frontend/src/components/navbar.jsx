import { Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useState } from 'react'
import './navbar.css'

const Navbar = ({ user, logout, dark = false }) => {
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)

  const closeMenu = () => setMenuOpen(false)

  return (
    <motion.nav
      className={`navbar ${dark ? 'navbar-dark' : ''}`}
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.7, ease: 'easeOut' }}
    >
      {/* Logo */}
      <div className="nav-brand">
        <Link to="/" onClick={closeMenu}>
          <span className="brand-icon">🪸</span>
          <span className="brand-name">Reef Scan</span>
        </Link>
      </div>

      {/* Hamburger */}
      <button
        className="hamburger"
        onClick={() => setMenuOpen(!menuOpen)}
      >
        {menuOpen ? "✕" : "☰"}
      </button>

      {/* Menu */}
      <div className={`mobile-menu ${menuOpen ? 'open' : ''}`}>

        <ul className="nav-links">
          <li>
            <Link
              to="/"
              className={location.pathname === '/' ? 'active' : ''}
              onClick={closeMenu}
            >
              Beranda
            </Link>
          </li>

          <li>
            <Link
              to="/analyze"
              className={location.pathname === '/analyze' ? 'active' : ''}
              onClick={closeMenu}
            >
              Analisis
            </Link>
          </li>

          {user && (
            <li>
              <Link
                to="/riwayat"
                className={location.pathname === '/riwayat' ? 'active' : ''}
                onClick={closeMenu}
              >
                Riwayat
              </Link>
            </li>
          )}
        </ul>

        <div className="nav-right">
          {user ? (
            <>
              <span className="nav-username">👤 {user.username}</span>
              <button
                className="btn-nav btn-outline"
                onClick={() => {
                  logout()
                  closeMenu()
                }}
              >
                Keluar
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="btn-nav btn-outline"
                onClick={closeMenu}
              >
                Masuk
              </Link>

              <Link
                to="/register"
                className="btn-nav btn-filled"
                onClick={closeMenu}
              >
                Daftar
              </Link>
            </>
          )}
        </div>

      </div>
    </motion.nav>
  )
}

export default Navbar
