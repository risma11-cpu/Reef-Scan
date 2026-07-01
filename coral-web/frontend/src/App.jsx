import { Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import Home from './pages/Home'
import Analyze from './pages/Analyze'
import Login from './pages/Login'
import Register from './pages/Register'
import Riwayat from './pages/Riwayat'
import './App.css'

function App() {
  const [user, setUser] = useState(null)

  useEffect(() => {
    const saved = localStorage.getItem('reef_user')
    if (saved) setUser(JSON.parse(saved))
  }, [])

  const login = (userData) => {
    setUser(userData)
    localStorage.setItem('reef_user', JSON.stringify(userData))
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('reef_user')
  }

  return (
    <Routes>
      <Route path="/" element={<Home user={user} logout={logout} />} />
      <Route path="/analyze" element={user ? <Analyze user={user} logout={logout} /> : <Navigate to="/login" />} />
      <Route path="/riwayat" element={user ? <Riwayat user={user} logout={logout} /> : <Navigate to="/login" />} />
      <Route path="/login" element={!user ? <Login onLogin={login} /> : <Navigate to="/analyze" />} />
      <Route path="/register" element={!user ? <Register onLogin={login} /> : <Navigate to="/analyze" />} />
    </Routes>
  )
}

export default App