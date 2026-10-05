import type { Etapa } from './types'

export const ETAPAS: { id: Etapa; numero: string; nome: string }[] = [
  { id: 'jogadores', numero: '①', nome: 'Jogadores' },
  { id: 'avaliacao', numero: '②', nome: 'Avaliação' },
  { id: 'config', numero: '③', nome: 'Configuração' },
  { id: 'sorteio', numero: '④', nome: 'Sorteio' },
  { id: 'times', numero: '⑤', nome: 'Times' },
]

export interface IdentidadeTime {
  rotulo: string
  marca: string
  cor: string
  tinta: string
}

const CORES: Omit<IdentidadeTime, 'rotulo'>[] = [
  { marca: '🔴', cor: '#ef4456', tinta: '#2a1216' },
  { marca: '🔵', cor: '#3d8bfd', tinta: '#102033' },
  { marca: '🟡', cor: '#f0c14b', tinta: '#2c250c' },
  { marca: '⚪', cor: '#f4f4f5', tinta: '#222428' },
  { marca: '🟣', cor: '#b06bff', tinta: '#241433' },
  { marca: '🟠', cor: '#ff8a3d', tinta: '#2e1a0e' },
  { marca: '🟩', cor: '#3ddec8', tinta: '#0d2624' },
  { marca: '🟤', cor: '#d7a16a', tinta: '#2a1d12' },
]

export function identidadeDoTime(indice: number): IdentidadeTime {
  const base = CORES[indice % CORES.length]
  return {
    rotulo: `TIME ${indice + 1}`,
    marca: base.marca,
    cor: base.cor,
    tinta: base.tinta,
  }
}

export const EXEMPLO_JOGADORES = ['Eduardo', 'Felipe', 'Dener', 'João', 'Pedro', 'Lucas', 'Rafael', 'Marcos']

export const MSG = {
  semJogadores: 'Adicione os jogadores para começar.',
  poucosJogadores: 'Não há jogadores suficientes para formar um time completo.',
  semAvaliacao: 'Alguns jogadores ainda não foram avaliados. Eles serão considerados como nível 3.',
  porTimeInvalido: 'Informe uma quantidade válida de jogadores por time.',
  goleirosMenor: 'A quantidade de goleiros é menor que a quantidade de times.',
  falhaSorteio: 'Não foi possível montar os times. Tente sortear novamente.',
} as const
