import axios from 'axios'

/**
 * A API é sempre chamada no mesmo endereço do site (/api).
 * O servidor do frontend encaminha esse caminho ao backend.
 * Chamar o backend em outro domínio perde o cookie de sessão e as telas voltam 401.
 */
const baseURL = '/api'

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
      const paginaPublica = currentPath === '/' || currentPath.startsWith('/login') || currentPath.startsWith('/fut-vkk')
      if (!paginaPublica) {
        window.location.assign('/login')
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
