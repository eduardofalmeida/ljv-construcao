import { ConteudoCena, type Progresso } from './Maquete'
import CenaTela from './CenaTela'
import type { Qualidade } from './qualidade'

export default function NarrativaCena({
  qualidade,
  compact,
  progressoRef,
}: {
  qualidade: Qualidade
  compact: boolean
  progressoRef: Progresso
}) {
  return (
    <CenaTela modo="narrativa" qualidade={qualidade} compact={compact}>
      <ConteudoCena modo="narrativa" progressoRef={progressoRef} qualidade={qualidade} compact={compact} />
    </CenaTela>
  )
}
