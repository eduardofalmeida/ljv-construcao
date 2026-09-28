import axios from 'axios'

/** Em produção (Railway), defina VITE_API_URL=https://seu-backend.up.railway.app/api no build. */
const rawBase = (import.meta.env.VITE_API_URL as string | undefined)?.trim()
const baseURL = rawBase && rawBase.length > 0
  ? rawBase.replace(/\/$/, '')
  : '/api'

const api = axios.create({
  baseURL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Interceptor de resposta — redireciona para login em caso de 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const currentPath = window.location.pathname
      if (!currentPath.startsWith('/login') && !currentPath.startsWith('/')) {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export default api

/** Base da API para chamadas fora do cliente axios (ex.: landing com axios direto). */
export function apiBaseUrl() {
  return baseURL
}
