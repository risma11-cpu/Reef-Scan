import { Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import Home from './pages/home'
import Analyze from './pages/analyze'
import Login from './pages/login'
import Register from './pages/register'
import Riwayat from './pages/riwayat'
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
