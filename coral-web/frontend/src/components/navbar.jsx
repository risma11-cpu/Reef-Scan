import { Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useState, useEffect, useRef } from 'react'
import './navbar.css'

const NAV_ITEMS = [
  { to: '/', label: 'Beranda' },
  { to: '/analyze', label: 'Analisis' },
]

const Navbar = ({ user, logout, dark = false }) => {
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const navRef = useRef(null)

  const closeMenu = () => setMenuOpen(false)

  // Klik di luar navbar -> tutup menu
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (navRef.current && !navRef.current.contains(e.target)) {
        closeMenu()
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Escape key -> tutup menu
  useEffect(() => {
    const handleEsc = (e) => e.key === 'Escape' && closeMenu()
    document.addEventListener('keydown', handleEsc)
    return () => document.removeEventListener('keydown', handleEsc)
  }, [])

  // Lock scroll body saat menu mobile terbuka
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [menuOpen])

  // Auto-close kalau layar dibesarkan ke desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) closeMenu()
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Tutup menu tiap ganti halaman
  useEffect(() => { closeMenu() }, [location.pathname])

  return (
    <motion.nav
      ref={navRef}
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
        onClick={() => setMenuOpen((prev) => !prev)}
        aria-expanded={menuOpen}
        aria-label={menuOpen ? 'Tutup menu' : 'Buka menu'}
      >
        {menuOpen ? '✕' : '☰'}
      </button>

      {/* Menu (nav-links + nav-right dalam satu wrapper) */}
      <div className={`nav-menu ${menuOpen ? 'open' : ''}`}>
        <ul className="nav-links">
          {NAV_ITEMS.map(({ to, label }) => (
            <li key={to}>
              <Link
                to={to}
                className={location.pathname === to ? 'active' : ''}
                aria-current={location.pathname === to ? 'page' : undefined}
                onClick={closeMenu}
              >
                {label}
              </Link>
            </li>
          ))}
          {user && (
            <li>
              <Link
                to="/riwayat"
                className={location.pathname === '/riwayat' ? 'active' : ''}
                aria-current={location.pathname === '/riwayat' ? 'page' : undefined}
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
              <Link to="/login" className="btn-nav btn-outline" onClick={closeMenu}>
                Masuk
              </Link>
              <Link to="/register" className="btn-nav btn-filled" onClick={closeMenu}>
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
