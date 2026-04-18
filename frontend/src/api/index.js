import axios from 'axios'
import { useToast } from '../composables/useToast.js'

const api = axios.create({ baseURL: `${import.meta.env.VITE_API_BASE_URL || ''}/api/v1` })

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
      return Promise.reject(error)
    }
    if (!error.response) {
      useToast().error('Network error — check your connection.')
    }
    return Promise.reject(error)
  }
)

export default api
