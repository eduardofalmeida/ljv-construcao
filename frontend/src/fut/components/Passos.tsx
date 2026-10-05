import { ETAPAS } from '../constantes'
import { useFut } from '../estado/FutContext'
import type { Etapa } from '../types'

export function Passos() {
  const { etapa, jogadores, resultado, irPara } = useFut()
  const atual = ETAPAS.findIndex(item => item.id === etapa)

  return (
    <nav className="fut-passos" aria-label="Etapas do sorteio">
      <ol>
        {ETAPAS.map((item, indice) => {
          const liberado = etapa !== 'sorteio' && podeAbrir(item.id, jogadores.length > 0, resultado != null)
          const classe = indice === atual ? 'fut-passo-atual' : indice < atual ? 'fut-passo-feito' : ''
          return (
            <li key={item.id}>
              {indice > 0 && <span className="fut-passo-seta" aria-hidden>→</span>}
              <button
                type="button"
                className={`fut-passo ${classe}`}
                aria-current={indice === atual ? 'step' : undefined}
                disabled={!liberado && item.id !== etapa}
                onClick={() => irPara(item.id)}
              >
                <span aria-hidden>{item.numero}</span>
                <span>{item.nome}</span>
              </button>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

function podeAbrir(etapa: Etapa, temJogadores: boolean, temResultado: boolean): boolean {
  if (etapa === 'jogadores') return true
  if (etapa === 'avaliacao' || etapa === 'config') return temJogadores
  if (etapa === 'times') return temResultado
  return false
}
