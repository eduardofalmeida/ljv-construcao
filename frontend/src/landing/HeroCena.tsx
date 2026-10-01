import { useEffect, useRef, useState } from 'react'
import { ConteudoCena } from './Maquete'
import CenaTela from './CenaTela'
import type { Qualidade } from './qualidade'

export default function HeroCena({
  qualidade,
  compact,
  jaViu,
  onReady,
  onTerminou,
}: {
  qualidade: Qualidade
  compact: boolean
  jaViu: boolean
  onReady?: () => void
  onTerminou?: () => void
}) {
  const progresso = useRef(jaViu ? 1 : 0)
  const [viva, setViva] = useState(false)
  const readyRef = useRef(onReady)
  const fimRef = useRef(onTerminou)
  readyRef.current = onReady
  fimRef.current = onTerminou
  const avisou = useRef(false)

  useEffect(() => {
    if (!viva) return
    if (!avisou.current) {
      avisou.current = true
      readyRef.current?.()
    }
    if (jaViu) {
      progresso.current = 1
      return
    }
    const inicio = performance.now()
    let id = 0
    const tick = (agora: number) => {
      const t = Math.min(1, (agora - inicio) / 2200)
      progresso.current = 1 - (1 - t) ** 3
      if (t < 1) id = requestAnimationFrame(tick)
      else fimRef.current?.()
    }
    id = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(id)
  }, [viva, jaViu])

  return (
    <CenaTela modo="hero" qualidade={qualidade} compact={compact} onReady={() => setViva(true)}>
      <ConteudoCena modo="hero" progressoRef={progresso} qualidade={qualidade} compact={compact} />
    </CenaTela>
  )
}
