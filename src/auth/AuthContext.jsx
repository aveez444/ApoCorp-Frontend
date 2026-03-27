import { createContext, useContext, useState } from 'react'
import api from '../api/axios'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('user')
    return stored ? JSON.parse(stored) : null
  })

  const login = async (company_code, username, password) => {
    const res = await api.post('/accounts/login/', { company_code, username, password })
    const { access, refresh, tenant_id, role } = res.data

    localStorage.setItem('access_token', access)
    localStorage.setItem('refresh_token', refresh)
    localStorage.setItem('tenant_id', tenant_id)

    const userData = { username, role, tenant_id }
    localStorage.setItem('user', JSON.stringify(userData))
    setUser(userData)

    return role
  }

  const logout = async () => {
    try {
      const refresh = localStorage.getItem('refresh_token')
      await api.post('/accounts/logout/', { refresh })
    } catch (_) {}
    localStorage.clear()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
