export type Etapa = 'jogadores' | 'avaliacao' | 'config' | 'sorteio' | 'times'

export type Nivel = 1 | 2 | 3 | 4 | 5

export interface Jogador {
  id: string
  nome: string
  estrelas: Nivel
}

export interface Goleiro {
  id: string
  nome: string
}

export interface TimeVisual {
  indice: number
  jogadores: Jogador[]
  goleiro: Goleiro | null
  forca: number
}

export interface ResultadoSorteio {
  times: TimeVisual[]
  reservas: Jogador[]
  goleirosReserva: Goleiro[]
  diferenca: number
  porTime: number
  usouNivelPadrao: boolean
}

export interface Recado {
  tipo: 'ok' | 'alerta'
  texto: string
}
