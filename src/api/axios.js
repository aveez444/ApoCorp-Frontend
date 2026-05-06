// axios.js
import axios from 'axios'

// Main API instance with authentication
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api',
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  const tenantId = localStorage.getItem('tenant_id')

  if (token) config.headers['Authorization'] = `Bearer ${token}`
  if (tenantId && !config.skipTenantHeader) config.headers['x-tenant-id'] = tenantId

  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.clear()
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// Public API instance for endpoints that don't require authentication/tenant
export const publicApi = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api',
})

export default api