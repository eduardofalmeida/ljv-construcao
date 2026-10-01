import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import api from '../services/api'

export type ConfigSite = Record<string, string>

interface ConfigSiteContextType {
  config: ConfigSite
  carregando: boolean
  recarregar: () => Promise<void>
}

const ConfigSiteContext = createContext<ConfigSiteContextType | null>(null)

export function ConfigSiteProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<ConfigSite>({})
  const [carregando, setCarregando] = useState(true)

  const recarregar = useCallback(async () => {
    try {
      const { data } = await api.get<ConfigSite>('/config/site')
      if (data && typeof data === 'object' && !Array.isArray(data)) setConfig(data)
    } catch {
      /* público: se falhar, usa fallback visual */
    } finally {
      setCarregando(false)
    }
  }, [])

  useEffect(() => { recarregar() }, [recarregar])

  return (
    <ConfigSiteContext.Provider value={{ config, carregando, recarregar }}>
      {children}
    </ConfigSiteContext.Provider>
  )
}

export function useConfigSite() {
  const ctx = useContext(ConfigSiteContext)
  if (!ctx) throw new Error('useConfigSite deve ser usado dentro de ConfigSiteProvider')
  return ctx
}
