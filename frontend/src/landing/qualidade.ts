export type Qualidade = 'cheia' | 'media' | 'estatica'

function temWebGL() {
  try {
    const c = document.createElement('canvas')
    return Boolean(c.getContext('webgl2') || c.getContext('webgl'))
  } catch {
    return false
  }
}

export function detectarQualidade(): Qualidade {
  if (typeof window === 'undefined') return 'estatica'
  const reduzido = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const salvar = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData
  const memoria = (navigator as Navigator & { deviceMemory?: number }).deviceMemory
  const nucleos = navigator.hardwareConcurrency || 8
  if (reduzido || salvar || !temWebGL() || (memoria !== undefined && memoria <= 2)) return 'estatica'
  const estreito = window.matchMedia('(max-width: 900px)').matches
  const toque = window.matchMedia('(pointer: coarse)').matches
  if (estreito || toque || (memoria !== undefined && memoria <= 4) || nucleos <= 4) return 'media'
  return 'cheia'
}
