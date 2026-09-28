import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import api from '../services/api'
import type { AuthState, Usuario } from '../types'

interface AuthContextType extends AuthState {
  login: (username: string, password: string) => Promise<void>
  logout: () => Promise<void>
  atualizarUsuario: (dados: Partial<Usuario>) => void
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    autenticado: false,
    usuario: null,
    carregando: true,
  })

  const verificarSessao = useCallback(async () => {
    try {
      const { data } = await api.get('/auth/me')
      if (data.authenticated) {
        setState({ autenticado: true, usuario: data.usuario as Usuario, carregando: false })
      } else {
        setState({ autenticado: false, usuario: null, carregando: false })
      }
    } catch {
      setState({ autenticado: false, usuario: null, carregando: false })
    }
  }, [])

  useEffect(() => {
    verificarSessao()
  }, [verificarSessao])

  const login = async (username: string, password: string) => {
    const { data } = await api.post('/auth/login', { username, password })
    if (data.success) {
      setState({ autenticado: true, usuario: data.usuario as Usuario, carregando: false })
    } else {
      throw new Error(data.message || 'Falha no login')
    }
  }

  const logout = async () => {
    try {
      await api.post('/auth/logout')
    } finally {
      setState({ autenticado: false, usuario: null, carregando: false })
    }
  }

  const atualizarUsuario = (dados: Partial<Usuario>) => {
    setState(s => ({
      ...s,
      usuario: s.usuario ? { ...s.usuario, ...dados } : null,
    }))
  }

  return (
    <AuthContext.Provider value={{ ...state, login, logout, atualizarUsuario }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider')
  return ctx
}
