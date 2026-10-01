import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Environment, Lightformer } from '@react-three/drei'
import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { PECAS, type MatNome } from './pecas'
import { ponteiro } from './ponteiro'
import type { Qualidade } from './qualidade'

export type ModoCena = 'hero' | 'narrativa' | 'interativo' | 'cta'
export type Progresso = { current: number }

const SEM_GIRO: [number, number, number] = [0, 0, 0]
const caixas = new Map<string, THREE.BoxGeometry>()

function caixa(w: number, h: number, d: number) {
  const chave = `${w}x${h}x${d}`
  let geo = caixas.get(chave)
  if (!geo) {
    geo = new THREE.BoxGeometry(w, h, d)
    caixas.set(chave, geo)
  }
  return geo
}

export function ajustarGl(gl: THREE.WebGLRenderer) {
  gl.toneMapping = THREE.ACESFilmicToneMapping
  gl.toneMappingExposure = 1.12
  gl.outputColorSpace = THREE.SRGBColorSpace
}

function useMateriais(qualidade: Qualidade) {
  const materiais = useMemo(() => {
    const vidro: THREE.Material = qualidade === 'cheia'
      ? new THREE.MeshPhysicalMaterial({
          color: '#e4eef4',
          roughness: 0.05,
          metalness: 0,
          transmission: 0.86,
          thickness: 0.35,
          ior: 1.45,
          transparent: true,
          envMapIntensity: 1.15,
        })
      : new THREE.MeshStandardMaterial({
          color: '#d5e3ec',
          roughness: 0.08,
          metalness: 0.04,
          transparent: true,
          opacity: 0.42,
        })
    const mapa: Record<MatNome, THREE.Material> = {
      concreto: new THREE.MeshStandardMaterial({ color: '#d2cdc3', roughness: 0.9, metalness: 0.03 }),
      concretoEscuro: new THREE.MeshStandardMaterial({ color: '#b3aea4', roughness: 0.94, metalness: 0.04 }),
      aco: new THREE.MeshStandardMaterial({ color: '#8e949b', roughness: 0.32, metalness: 0.88, envMapIntensity: 1.1 }),
      madeira: new THREE.MeshStandardMaterial({ color: '#8a5a3a', roughness: 0.74, metalness: 0.02 }),
      pedra: new THREE.MeshStandardMaterial({ color: '#b9b3a8', roughness: 0.98, metalness: 0.01 }),
      luz: new THREE.MeshStandardMaterial({
        color: '#e36a1e',
        emissive: '#e36a1e',
        emissiveIntensity: 1.6,
        roughness: 0.35,
      }),
      vidro,
    }
    return mapa
  }, [qualidade])

  useEffect(() => () => {
    Object.values(materiais).forEach(m => m.dispose())
  }, [materiais])

  return materiais
}

function Solidos({
  progressoRef,
  qualidade,
  materiais,
}: {
  progressoRef: Progresso
  qualidade: Qualidade
  materiais: Record<MatNome, THREE.Material>
}) {
  const grupos = useRef<Array<THREE.Group | null>>([])
  const sombra = qualidade === 'cheia'

  useFrame(() => {
    const p = progressoRef.current
    for (let i = 0; i < PECAS.length; i++) {
      const g = grupos.current[i]
      const peca = PECAS[i]
      if (!g) continue
      const vis = THREE.MathUtils.smoothstep(p, peca.fase, peca.fase + 0.11)
      const h = peca.s[1]
      g.scale.y = Math.max(vis, 0.0008)
      g.position.y = peca.p[1] - (h / 2) * (1 - vis)
    }
  })

  return (
    <>
      {PECAS.map((peca, i) => (
        <group
          key={peca.id}
          ref={el => { grupos.current[i] = el }}
          position={peca.p}
          scale={[1, 0.0008, 1]}
        >
          <mesh
            geometry={caixa(peca.s[0], peca.s[1], peca.s[2])}
            material={materiais[peca.mat]}
            rotation={peca.r ?? SEM_GIRO}
            castShadow={sombra && peca.mat !== 'vidro' && peca.mat !== 'luz'}
            receiveShadow={sombra && peca.mat !== 'vidro'}
          />
        </group>
      ))}
    </>
  )
}

function Arames({ progressoRef, modo }: { progressoRef: Progresso; modo: ModoCena }) {
  const geo = useMemo(() => {
    const partes: THREE.BufferGeometry[] = []
    for (const peca of PECAS) {
      const edges = new THREE.EdgesGeometry(caixa(peca.s[0], peca.s[1], peca.s[2]), 18)
      const q = new THREE.Quaternion()
      if (peca.r) q.setFromEuler(new THREE.Euler(peca.r[0], peca.r[1], peca.r[2]))
      edges.applyMatrix4(new THREE.Matrix4().compose(new THREE.Vector3(...peca.p), q, new THREE.Vector3(1, 1, 1)))
      partes.push(edges)
    }
    const fundido = mergeGeometries(partes)
    partes.forEach(g => g.dispose())
    return fundido
  }, [])
  const mat = useMemo(() => new THREE.LineBasicMaterial({ color: '#1c1c1c', transparent: true, opacity: 0.75 }), [])

  useEffect(() => () => {
    geo?.dispose()
    mat.dispose()
  }, [geo, mat])

  useFrame(() => {
    const p = progressoRef.current
    mat.opacity = modo === 'cta'
      ? 0.28
      : 0.14 + 0.72 * (1 - THREE.MathUtils.smoothstep(p, 0.06, 0.78))
  })

  if (!geo) return null
  return <lineSegments geometry={geo} material={mat} />
}

function Cotas({ progressoRef, modo }: { progressoRef: Progresso; modo: ModoCena }) {
  const geo = useMemo(() => {
    const pares: Array<[number, number, number, number, number, number]> = [
      [-3.5, 0.42, 2.7, 4.35, 0.42, 2.7],
      [-3.55, 0.28, -2.45, -3.55, 0.28, 2.55],
      [4.35, 0.34, 2.55, 4.35, 3.05, 2.55],
    ]
    const arr = new Float32Array(pares.length * 6)
    pares.forEach((linha, i) => arr.set(linha, i * 6))
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(arr, 3))
    return g
  }, [])
  const mat = useMemo(() => new THREE.LineBasicMaterial({ color: '#e36a1e', transparent: true, opacity: 0.8 }), [])
  useEffect(() => () => { geo.dispose(); mat.dispose() }, [geo, mat])
  useFrame(() => {
    if (modo === 'cta') {
      mat.opacity = 0.45
      return
    }
    mat.opacity = 0.85 * (1 - THREE.MathUtils.smoothstep(progressoRef.current, 0.12, 0.58))
  })
  return <lineSegments geometry={geo} material={mat} />
}

function Grade({ progressoRef, modo }: { progressoRef: Progresso; modo: ModoCena }) {
  const grade = useMemo(() => {
    const g = new THREE.GridHelper(16, 32, '#e36a1e', '#ddd8d0')
    g.position.y = 0.004
    const lista = Array.isArray(g.material) ? g.material : [g.material]
    lista.forEach(m => { m.transparent = true; m.opacity = 0.35 })
    return g
  }, [])
  useEffect(() => () => {
    grade.geometry.dispose()
    const lista = Array.isArray(grade.material) ? grade.material : [grade.material]
    lista.forEach(m => m.dispose())
  }, [grade])
  useFrame(() => {
    const o = modo === 'cta'
      ? 0.16
      : 0.42 * (1 - THREE.MathUtils.smoothstep(progressoRef.current, 0.1, 0.66))
    const lista = Array.isArray(grade.material) ? grade.material : [grade.material]
    lista.forEach(m => { m.opacity = o })
  })
  return <primitive object={grade} />
}

function Particulas({ qualidade, modo }: { qualidade: Qualidade; modo: ModoCena }) {
  const ref = useRef<THREE.Points>(null)
  const n = qualidade === 'cheia' ? 90 : 36
  const geo = useMemo(() => {
    const arr = new Float32Array(n * 3)
    for (let i = 0; i < n; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 11
      arr[i * 3 + 1] = Math.random() * 4.8
      arr[i * 3 + 2] = (Math.random() - 0.5) * 8
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(arr, 3))
    return g
  }, [n])
  const mat = useMemo(() => new THREE.PointsMaterial({
    color: modo === 'cta' ? '#c8c4bc' : '#8a8a8a',
    size: 0.028,
    transparent: true,
    opacity: modo === 'cta' ? 0.45 : 0.55,
    depthWrite: false,
    sizeAttenuation: true,
  }), [modo])
  useEffect(() => () => { geo.dispose(); mat.dispose() }, [geo, mat])
  useFrame(({ clock }) => {
    if (!ref.current) return
    ref.current.rotation.y = clock.elapsedTime * 0.015
    ref.current.position.x = ponteiro.x * 0.18
    ref.current.position.y = ponteiro.y * 0.08
  })
  return <points ref={ref} geometry={geo} material={mat} />
}

function Iluminacao({
  modo,
  progressoRef,
  qualidade,
}: {
  modo: ModoCena
  progressoRef: Progresso
  qualidade: Qualidade
}) {
  const chave = useRef<THREE.DirectionalLight>(null)
  const tecnica = useRef<THREE.PointLight>(null)
  const sombra = qualidade === 'cheia' && modo !== 'cta'

  useFrame(() => {
    const p = progressoRef.current
    const ganho = modo === 'cta' || modo === 'interativo' ? 1 : THREE.MathUtils.smoothstep(p, 0.18, 0.88)
    if (chave.current) chave.current.intensity = (modo === 'cta' ? 1.6 : 0.85) + ganho * 2.4
    if (tecnica.current) tecnica.current.intensity = 0.15 + ganho * (modo === 'cta' ? 8 : 3.2)
  })

  return (
    <>
      <hemisphereLight args={[modo === 'cta' ? '#2a2a2a' : '#f6f3ee', modo === 'cta' ? '#111111' : '#d9d3c8', modo === 'cta' ? 0.25 : 0.38]} />
      <ambientLight intensity={modo === 'cta' ? 0.12 : 0.42} color="#f4f1eb" />
      <directionalLight
        ref={chave}
        position={[7.5, 11, 5.5]}
        color="#fff9f3"
        castShadow={sombra}
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0006}
        shadow-normalBias={0.04}
        shadow-camera-near={0.5}
        shadow-camera-far={30}
        shadow-camera-left={-9}
        shadow-camera-right={9}
        shadow-camera-top={9}
        shadow-camera-bottom={-9}
      />
      <directionalLight position={[-7, 3.5, -5]} intensity={modo === 'cta' ? 1.8 : 0.65} color="#d7e0ea" />
      <pointLight ref={tecnica} position={[1.4, 2.5, 2.3]} color="#e36a1e" distance={9} decay={2} />
    </>
  )
}

function Rig({
  modo,
  progressoRef,
  compact,
}: {
  modo: ModoCena
  progressoRef: Progresso
  compact: boolean
}) {
  const { camera } = useThree()
  const olhar = useMemo(() => new THREE.Vector3(), [])
  useFrame((_, dt) => {
    if (modo === 'interativo') return
    const p = progressoRef.current
    const mx = compact ? ponteiro.x * 0.35 : ponteiro.x
    const my = compact ? ponteiro.y * 0.25 : ponteiro.y
    let x = 0
    let y = 0
    let z = 0
    let lx = 0.35
    let ly = 1.25
    let lz = 0
    if (modo === 'hero') {
      if (compact) {
        x = 0.5 + mx * 0.2
        y = 3.1 + my * 0.1
        z = 12.5
        lx = 0.45
        ly = 1.15
      } else {
        x = 6.6 + mx * 1.2
        y = 2.85 + my * 0.48
        z = 8.4 - mx * 0.3
        lx = -0.15
      }
    } else if (modo === 'narrativa') {
      const a = THREE.MathUtils.smoothstep(p, 0, 1)
      x = THREE.MathUtils.lerp(compact ? 0.4 : 0.2, compact ? 1.6 : 6.2, a) + mx * 0.5
      y = THREE.MathUtils.lerp(compact ? 6.4 : 10.8, compact ? 2.5 : 2.7, a) + my * 0.28
      z = THREE.MathUtils.lerp(compact ? 4.8 : 0.15, compact ? 7.6 : 7.8, a)
      ly = THREE.MathUtils.lerp(compact ? 1.5 : 0.35, compact ? 1.35 : 1.3, a)
    } else {
      const perto = ponteiro.hoverCta
      x = 5.4 + mx * 0.7
      y = 2.5 + my * 0.35
      z = 6.6 - perto * 1.15
      ly = 1.15
    }
    camera.position.x = THREE.MathUtils.damp(camera.position.x, x, 2.5, dt)
    camera.position.y = THREE.MathUtils.damp(camera.position.y, y, 2.5, dt)
    camera.position.z = THREE.MathUtils.damp(camera.position.z, z, 2.5, dt)
    olhar.set(lx, ly, lz)
    camera.lookAt(olhar)
  })
  return null
}

function Movimento({
  modo,
  compact,
  children,
}: {
  modo: ModoCena
  compact: boolean
  children: React.ReactNode
}) {
  const ref = useRef<THREE.Group>(null)
  useFrame((_, dt) => {
    const g = ref.current
    if (!g) return
    if (modo === 'interativo') {
      g.rotation.x = 0
      g.rotation.y = 0
      return
    }
    if (modo === 'cta') {
      const alvo = Math.sin(performance.now() * 0.00018) * 0.38 + ponteiro.x * 0.22
      g.rotation.y = THREE.MathUtils.damp(g.rotation.y, alvo, 2, dt)
      return
    }
    g.rotation.y = THREE.MathUtils.damp(g.rotation.y, ponteiro.x * (modo === 'hero' ? 0.08 : 0.045), 2.2, dt)
    g.rotation.x = THREE.MathUtils.damp(g.rotation.x, ponteiro.y * -0.03, 2.2, dt)
  })
  const x = modo === 'cta' || modo === 'interativo' || compact ? 0 : modo === 'hero' ? 1.35 : 0.45
  return <group ref={ref} position={[x, 0, 0]}>{children}</group>
}

function Chão({ modo, qualidade }: { modo: ModoCena; qualidade: Qualidade }) {
  const tex = useMemo(() => {
    if (qualidade === 'cheia' || modo === 'cta') return null
    const c = document.createElement('canvas')
    c.width = 128
    c.height = 128
    const ctx = c.getContext('2d')
    if (!ctx) return null
    const g = ctx.createRadialGradient(64, 64, 8, 64, 64, 62)
    g.addColorStop(0, 'rgba(17,17,17,0.2)')
    g.addColorStop(1, 'rgba(17,17,17,0)')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, 128, 128)
    const t = new THREE.CanvasTexture(c)
    return t
  }, [qualidade, modo])
  useEffect(() => () => tex?.dispose(), [tex])
  if (modo === 'cta') return null
  if (qualidade === 'cheia') {
    return (
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0.4, 0.008, 0.05]} receiveShadow>
        <planeGeometry args={[22, 22]} />
        <shadowMaterial transparent opacity={0.2} />
      </mesh>
    )
  }
  if (!tex) return null
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0.4, 0.01, 0.05]}>
      <planeGeometry args={[10.5, 7]} />
      <meshBasicMaterial map={tex} transparent depthWrite={false} />
    </mesh>
  )
}

export function ConteudoCena({
  modo,
  progressoRef,
  qualidade,
  compact,
}: {
  modo: ModoCena
  progressoRef: Progresso
  qualidade: Qualidade
  compact: boolean
}) {
  const materiais = useMateriais(qualidade)
  const escuro = modo === 'cta'
  return (
    <>
      <color attach="background" args={[escuro ? '#111111' : '#f7f7f5']} />
      <fog attach="fog" args={[escuro ? '#111111' : '#f7f7f5', escuro ? 7 : 14, escuro ? 18 : 28]} />
      <Rig modo={modo} progressoRef={progressoRef} compact={compact} />
      <Iluminacao modo={modo} progressoRef={progressoRef} qualidade={qualidade} />
      {qualidade === 'cheia' && (
        <Environment resolution={128} frames={1}>
          <Lightformer form="rect" intensity={2.2} color="#ffffff" position={[0, 5, 2]} scale={[10, 5, 1]} />
          <Lightformer form="rect" intensity={1} color="#f3eee6" position={[-5, 2, -3]} scale={[5, 6, 1]} />
          <Lightformer form="rect" intensity={escuro ? 2.4 : 0.7} color="#e36a1e" position={[4, 1.4, 4]} scale={[0.6, 5, 1]} />
        </Environment>
      )}
      <Chão modo={modo} qualidade={qualidade} />
      <Grade progressoRef={progressoRef} modo={modo} />
      <Movimento modo={modo} compact={compact}>
        <Arames progressoRef={progressoRef} modo={modo} />
        <Cotas progressoRef={progressoRef} modo={modo} />
        <Solidos progressoRef={progressoRef} qualidade={qualidade} materiais={materiais} />
      </Movimento>
      <Particulas qualidade={qualidade} modo={modo} />
    </>
  )
}
