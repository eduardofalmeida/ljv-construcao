import { useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'

/** Abre o cadastro quando o FAB (ou um link) vem com ?novo=1 */
export function useAbrirNovo(abrir: () => void) {
  const [params, setParams] = useSearchParams()
  const abrirRef = useRef(abrir)
  abrirRef.current = abrir

  useEffect(() => {
    if (params.get('novo') !== '1') return
    abrirRef.current()
    const next = new URLSearchParams(params)
    next.delete('novo')
    setParams(next, { replace: true })
  }, [params, setParams])
}
