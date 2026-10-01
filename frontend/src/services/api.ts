import axios from 'axios'

/**
 * Em produção (Railway), defina no BUILD:
 * VITE_API_URL=https://seu-backend.up.railway.app/api
 * Sem https:// o navegador trata o host como caminho do próprio frontend.
 */
function normalizeApiBase(raw: string | undefined): string {
  const value = raw?.trim().replace(/\/$/, '') ?? ''
  if (!value) return '/api'

  const withProtocol = /^https?:\/\//i.test(value) ? value : `https://${value}`
  try {
    const url = new URL(withProtocol)
    if (url.pathname === '/' || url.pathname === '') url.pathname = '/api'
    return url.toString().replace(/\/$/, '')
  } catch {
    return '/api'
  }
}

const baseURL = normalizeApiBase(import.meta.env.VITE_API_URL as string | undefined)

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
