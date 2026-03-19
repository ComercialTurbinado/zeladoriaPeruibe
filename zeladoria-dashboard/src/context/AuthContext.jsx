import { createContext, useContext, useState, useEffect } from 'react'
import { authAPI } from '../api/zeladoria.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [admin, setAdmin] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const storedAdmin = localStorage.getItem('zeladoria_admin')
    const token = localStorage.getItem('zeladoria_token')
    if (storedAdmin && token) {
      try {
        setAdmin(JSON.parse(storedAdmin))
      } catch {
        localStorage.removeItem('zeladoria_admin')
        localStorage.removeItem('zeladoria_token')
      }
    }
    setLoading(false)
  }, [])

  async function login(email, senha) {
    const { token, admin: adminData } = await authAPI.login(email, senha)
    localStorage.setItem('zeladoria_token', token)
    localStorage.setItem('zeladoria_admin', JSON.stringify(adminData))
    setAdmin(adminData)
    return adminData
  }

  async function logout() {
    await authAPI.logout()
    setAdmin(null)
  }

  return (
    <AuthContext.Provider value={{ admin, loading, login, logout, isAuthenticated: !!admin }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider')
  return ctx
}
