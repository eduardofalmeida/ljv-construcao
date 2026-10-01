import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { ajustarGl, type ModoCena } from './Maquete'
import type { Qualidade } from './qualidade'

function posicao(modo: ModoCena, compact: boolean): [number, number, number] {
  if (modo === 'narrativa') return compact ? [0.4, 6.4, 4.8] : [0.15, 10.6, 0.2]
  if (modo === 'cta') return [5.4, 2.55, 6.7]
  if (modo === 'interativo') return compact ? [3.6, 3.3, 7.6] : [6.3, 3.15, 7.5]
  return compact ? [0.5, 3.1, 12.5] : [6.6, 2.9, 8.4]
}

export default function CenaTela({
  modo,
  qualidade,
  compact,
  onReady,
  children,
}: {
  modo: ModoCena
  qualidade: Qualidade
  compact: boolean
  onReady?: () => void
  children: React.ReactNode
}) {
  return (
    <Canvas
      className="lp-gl"
      dpr={qualidade === 'cheia' ? [1, 1.5] : [1, 1.1]}
      shadows={qualidade === 'cheia' && modo !== 'cta'}
      gl={{ antialias: qualidade === 'cheia', alpha: false, powerPreference: 'high-performance' }}
      camera={{ position: posicao(modo, compact), fov: compact ? 46 : 28, near: 0.1, far: 55 }}
      onCreated={({ gl }) => {
        ajustarGl(gl)
        onReady?.()
      }}
    >
      <Suspense fallback={null}>{children}</Suspense>
    </Canvas>
  )
}
