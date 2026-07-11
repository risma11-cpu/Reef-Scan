import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useState } from 'react'
import Home from './pages/home'
import Analyze from './pages/analyze'
import Login from './pages/login'
import Register from './pages/register'
import Riwayat from './pages/riwayat'
import Dashboard from './pages/dashboard'
import './App.css'

function App() {
  const location = useLocation()
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('reef_user')
      return saved ? JSON.parse(saved) : null
    } catch {
      return null
    }
  })
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
      <Route
        path="/analyze"
        element={
          user ? (
            <Analyze user={user} logout={logout} />
          ) : (
            <Navigate to="/login" state={{ from: location }} replace />
          )
        }
      />
      <Route
        path="/riwayat"
        element={
          user ? (
            <Riwayat user={user} logout={logout} />
          ) : (
            <Navigate to="/login" state={{ from: location }} replace />
          )
        }
      />
      <Route
        path="/dashboard"
        element={
          user ? (
            <Dashboard user={user} logout={logout} />
          ) : (
            <Navigate to="/login" state={{ from: location }} replace />
          )
        }
      />
      <Route path="/login" element={!user ? <Login onLogin={login} /> : <Navigate to="/analyze" />} />
      <Route path="/register" element={!user ? <Register onLogin={login} /> : <Navigate to="/analyze" />} />
    </Routes>
  )
}
export default App
