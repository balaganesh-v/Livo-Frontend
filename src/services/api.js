import axios from 'axios'

export const TOKEN_KEY = 'livo_access_token'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000',
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY)
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

export function getApiError(error) {
  const detail = error.response?.data?.detail || error.response?.data?.message
  if (Array.isArray(detail)) return detail.map((item) => item.msg).join(' ')
  return detail || 'Something went wrong. Please try again.'
}

export default api
