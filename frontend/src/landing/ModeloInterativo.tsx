import { useRef } from 'react'
import { OrbitControls } from '@react-three/drei'
import { ConteudoCena } from './Maquete'
import CenaTela from './CenaTela'
import { HOTSPOTS } from './hotspots'
import type { Qualidade } from './qualidade'

export default function ModeloInterativo({
  qualidade,
  compact,
  ativo,
  onEscolher,
}: {
  qualidade: Qualidade
  compact: boolean
  ativo: string
  onEscolher: (id: string) => void
}) {
  const progresso = useRef(1)
  return (
    <CenaTela modo="interativo" qualidade={qualidade} compact={compact}>
      <ConteudoCena modo="interativo" progressoRef={progresso} qualidade={qualidade} compact={compact} />
      {HOTSPOTS.map(ponto => (
        <group key={ponto.id} position={ponto.pos}>
          <mesh
            onClick={e => {
              e.stopPropagation()
              onEscolher(ponto.id)
            }}
          >
            <sphereGeometry args={[0.18, 12, 12]} />
            <meshBasicMaterial transparent opacity={0} depthWrite={false} />
          </mesh>
          <mesh>
            <sphereGeometry args={[0.05, 18, 18]} />
            <meshStandardMaterial
              color={ativo === ponto.id ? '#e36a1e' : '#161616'}
              emissive={ativo === ponto.id ? '#e36a1e' : '#000000'}
              emissiveIntensity={ativo === ponto.id ? 0.85 : 0}
            />
          </mesh>
        </group>
      ))}
      <OrbitControls
        makeDefault
        enablePan={false}
        enableDamping
        dampingFactor={0.08}
        autoRotate
        autoRotateSpeed={0.4}
        enableZoom={!compact}
        minDistance={compact ? 6.2 : 5}
        maxDistance={12}
        minPolarAngle={0.45}
        maxPolarAngle={1.28}
        target={[0.45, 1.25, 0.05]}
      />
    </CenaTela>
  )
}
