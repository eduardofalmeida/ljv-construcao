import type { Goleiro, Jogador, Nivel, ResultadoSorteio, TimeVisual } from '../types'
import { calcularFormacao } from '../utils/formacao'

/**
 * Monta apenas times completos e equilibra a soma das estrelas.
 * A aleatoriedade fica nos empates, na ordem de quem tem o mesmo nível
 * e na escolha entre as melhores tentativas — não na divisão em si.
 */
export function montarSorteio(
  jogadores: readonly Jogador[],
  goleiros: readonly Goleiro[],
  porTime: number,
  rng: () => number = Math.random,
): ResultadoSorteio | null {
  const formacao = calcularFormacao(jogadores.length, porTime)
  if (!formacao || formacao.times < 1) return null

  let usouNivelPadrao = false
  const linha = jogadores.map(jogador => {
    const estrelas = nivelSeguro(jogador.estrelas)
    if (estrelas !== jogador.estrelas) usouNivelPadrao = true
    return { ...jogador, estrelas }
  })

  const gkLimpos = goleiros
    .map(goleiro => ({ ...goleiro, nome: goleiro.nome.trim() }))
    .filter(goleiro => goleiro.nome.length > 0)

  const nTimes = formacao.times
  const grande = linha.length > 70 || nTimes > 10
  const rodadas = grande ? 10 : 24
  const tentativas: Tentativa[] = []

  for (let rodada = 0; rodada < rodadas; rodada++) {
    const misturados = embaralhar(linha, rng)
    const reservas = formacao.fora > 0 ? misturados.slice(0, formacao.fora) : []
    const pool = formacao.fora > 0 ? misturados.slice(formacao.fora) : misturados
    let times = distribuir(pool, nTimes, porTime, rng)
    if (!times.every(time => time.length === porTime)) continue
    times = grande ? otimizarAleatorio(times, rng) : otimizarBusca(times)
    if (!times.every(time => time.length === porTime)) continue
    tentativas.push({ times, reservas, nota: avaliar(times) })
  }

  if (tentativas.length === 0) return null

  const melhorNota = tentativas.reduce((menor, tentativa) => Math.min(menor, tentativa.nota), Infinity)
  const melhores = tentativas.filter(tentativa => tentativa.nota === melhorNota)
  const escolhida = melhores[Math.floor(rng() * melhores.length)]
  const giro = Math.floor(rng() * escolhida.times.length)
  const girados = escolhida.times.map((_, indice) => escolhida.times[(indice + giro) % escolhida.times.length])

  const gkBaralho = embaralhar(gkLimpos, rng)
  const destinos = embaralhar(girados.map((_, indice) => indice), rng)
  const goleiroDoTime: (Goleiro | null)[] = girados.map(() => null)
  destinos.forEach((indice, ordem) => {
    if (ordem < gkBaralho.length && ordem < nTimes) goleiroDoTime[indice] = gkBaralho[ordem]
  })

  const timesVisuais: TimeVisual[] = girados.map((jogadoresTime, indice) => ({
    indice,
    jogadores: [...jogadoresTime].sort(compararJogadores),
    goleiro: goleiroDoTime[indice],
    forca: soma(jogadoresTime),
  }))

  const forcas = timesVisuais.map(time => time.forca)
  const ids = new Set<string>()
  for (const time of timesVisuais) {
    for (const jogador of time.jogadores) {
      if (ids.has(jogador.id)) return null
      ids.add(jogador.id)
    }
  }

  return {
    times: timesVisuais,
    reservas: [...escolhida.reservas].sort(compararJogadores),
    goleirosReserva: gkBaralho.slice(nTimes),
    diferenca: Math.max(...forcas) - Math.min(...forcas),
    porTime,
    usouNivelPadrao,
  }
}

interface Tentativa {
  times: Jogador[][]
  reservas: Jogador[]
  nota: number
}

function nivelSeguro(estrelas: number): Nivel {
  const inteiro = Math.round(estrelas)
  if (inteiro >= 1 && inteiro <= 5) return inteiro as Nivel
  return 3
}

function compararJogadores(a: Jogador, b: Jogador): number {
  return b.estrelas - a.estrelas || a.nome.localeCompare(b.nome, 'pt-BR')
}

function embaralhar<T>(lista: readonly T[], rng: () => number): T[] {
  const copia = lista.slice()
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    const atual = copia[i]
    copia[i] = copia[j]
    copia[j] = atual
  }
  return copia
}

function soma(time: readonly Jogador[]): number {
  let total = 0
  for (const jogador of time) total += jogador.estrelas
  return total
}

function avaliar(times: readonly (readonly Jogador[])[]): number {
  const forcas = times.map(soma)
  const maior = Math.max(...forcas)
  const menor = Math.min(...forcas)
  const media = forcas.reduce((acumulado, forca) => acumulado + forca, 0) / forcas.length
  let variancia = 0
  for (const forca of forcas) {
    const delta = forca - media
    variancia += delta * delta
  }
  return (maior - menor) * 10000 + Math.round(variancia * 100)
}

function distribuir(pool: readonly Jogador[], nTimes: number, porTime: number, rng: () => number): Jogador[][] {
  const grupos = new Map<number, Jogador[]>()
  for (const jogador of pool) {
    const grupo = grupos.get(jogador.estrelas)
    if (grupo) grupo.push(jogador)
    else grupos.set(jogador.estrelas, [jogador])
  }

  const fila: Jogador[] = []
  const niveis = [...grupos.keys()].sort((a, b) => b - a)
  for (const nivel of niveis) fila.push(...embaralhar(grupos.get(nivel) ?? [], rng))

  const times: Jogador[][] = Array.from({ length: nTimes }, () => [])
  const forcas = Array.from({ length: nTimes }, () => 0)
  const elite = Math.min(fila.length, nTimes * Math.min(porTime, 2))
  let cursor = 0
  let direcao = 1

  for (let k = 0; k < elite; k++) {
    times[cursor].push(fila[k])
    forcas[cursor] += fila[k].estrelas
    const proximo = cursor + direcao
    if (proximo >= nTimes || proximo < 0) direcao *= -1
    else cursor = proximo
  }

  for (let k = elite; k < fila.length; k++) {
    const jogador = fila[k]
    let menor = Infinity
    const empatados: number[] = []
    for (let t = 0; t < nTimes; t++) {
      if (times[t].length >= porTime) continue
      if (forcas[t] < menor) {
        menor = forcas[t]
        empatados.length = 0
        empatados.push(t)
      } else if (forcas[t] === menor) {
        empatados.push(t)
      }
    }
    if (empatados.length === 0) break

    let escolhido = empatados[Math.floor(rng() * empatados.length)]
    if (rng() < 0.3) {
      const flexiveis: number[] = []
      for (let t = 0; t < nTimes; t++) {
        if (times[t].length >= porTime) continue
        if (forcas[t] <= menor + 1) flexiveis.push(t)
      }
      if (flexiveis.length > 0) escolhido = flexiveis[Math.floor(rng() * flexiveis.length)]
    }

    times[escolhido].push(jogador)
    forcas[escolhido] += jogador.estrelas
  }

  return times
}

function otimizarBusca(times: Jogador[][]): Jogador[][] {
  const clone = times.map(time => time.slice())
  let atual = avaliar(clone)

  for (let rodada = 0; rodada < 6 && atual > 0; rodada++) {
    let melhor = atual
    let movimento: [number, number, number, number] | null = null

    for (let a = 0; a < clone.length; a++) {
      for (let b = a + 1; b < clone.length; b++) {
        for (let i = 0; i < clone[a].length; i++) {
          for (let j = 0; j < clone[b].length; j++) {
            if (clone[a][i].estrelas === clone[b][j].estrelas) continue
            const ja = clone[a][i]
            const jb = clone[b][j]
            clone[a][i] = jb
            clone[b][j] = ja
            const nota = avaliar(clone)
            if (nota < melhor) {
              melhor = nota
              movimento = [a, b, i, j]
            }
            clone[a][i] = ja
            clone[b][j] = jb
          }
        }
      }
    }

    if (!movimento || melhor >= atual) break
    const [a, b, i, j] = movimento
    const ja = clone[a][i]
    clone[a][i] = clone[b][j]
    clone[b][j] = ja
    atual = melhor
  }

  return clone
}

function otimizarAleatorio(times: Jogador[][], rng: () => number): Jogador[][] {
  const clone = times.map(time => time.slice())
  let atual = avaliar(clone)
  const n = clone.length

  for (let k = 0; k < 80 && atual > 0; k++) {
    const a = Math.floor(rng() * n)
    let b = Math.floor(rng() * (n - 1))
    if (b >= a) b += 1
    if (clone[a].length === 0 || clone[b].length === 0) continue
    const i = Math.floor(rng() * clone[a].length)
    const j = Math.floor(rng() * clone[b].length)
    if (clone[a][i].estrelas === clone[b][j].estrelas) continue
    const ja = clone[a][i]
    const jb = clone[b][j]
    clone[a][i] = jb
    clone[b][j] = ja
    const nota = avaliar(clone)
    if (nota < atual) atual = nota
    else {
      clone[a][i] = ja
      clone[b][j] = jb
    }
  }

  return clone
}
