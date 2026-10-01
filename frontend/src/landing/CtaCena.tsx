import { useRef } from 'react'
import { ConteudoCena } from './Maquete'
import CenaTela from './CenaTela'
import type { Qualidade } from './qualidade'

export default function CtaCena({ qualidade, compact }: { qualidade: Qualidade; compact: boolean }) {
  const progresso = useRef(1)
  return (
    <CenaTela modo="cta" qualidade={qualidade} compact={compact}>
      <ConteudoCena modo="cta" progressoRef={progresso} qualidade={qualidade} compact={compact} />
    </CenaTela>
  )
}
