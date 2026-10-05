import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { MSG } from '../constantes'
import { montarSorteio } from '../services/sorteio'
import type { Etapa, Goleiro, Jogador, Nivel, Recado, ResultadoSorteio } from '../types'
import { calcularFormacao } from '../utils/formacao'
import { criarId } from '../utils/id'
import { chaveNome, interpretarNomes, limparNome } from '../utils/nomes'

interface FutContexto {
  etapa: Etapa
  jogadores: Jogador[]
  goleiros: Goleiro[]
  goleirosNomeados: Goleiro[]
  porTime: number | null
  recado: Recado | null
  resultado: ResultadoSorteio | null
  confirmarRachao: boolean
  adicionarTexto: (texto: string) => number
  renomearJogador: (id: string, nome: string) => boolean
  removerJogador: (id: string) => void
  definirEstrelas: (id: string, estrelas: Nivel) => void
  resetarAvaliacoes: () => void
  definirPorTime: (valor: number | null) => void
  definirQuantidadeGoleiros: (quantidade: number) => void
  renomearGoleiro: (id: string, nome: string) => void
  irPara: (etapa: Etapa) => boolean
  sortear: () => void
  pedirNovoRachao: () => void
  cancelarNovoRachao: () => void
  confirmarNovoRachao: () => void
}

const Contexto = createContext<FutContexto | null>(null)

export function FutProvider({ children }: { children: ReactNode }) {
  const [etapa, setEtapa] = useState<Etapa>('jogadores')
  const [jogadores, setJogadores] = useState<Jogador[]>([])
  const [goleiros, setGoleiros] = useState<Goleiro[]>([])
  const [porTime, setPorTime] = useState<number | null>(5)
  const [recado, setRecado] = useState<Recado | null>(null)
  const [resultado, setResultado] = useState<ResultadoSorteio | null>(null)
  const [confirmarRachao, setConfirmarRachao] = useState(false)
  const emCurso = useRef(false)
  const esperaRef = useRef<number | null>(null)

  useEffect(() => () => {
    if (esperaRef.current != null) window.clearTimeout(esperaRef.current)
  }, [])

  const goleirosNomeados = useMemo(
    () => goleiros.map(goleiro => ({ ...goleiro, nome: goleiro.nome.trim() })).filter(goleiro => goleiro.nome),
    [goleiros],
  )

  const adicionarTexto = useCallback((texto: string) => {
    const nomes = interpretarNomes(texto)
    if (nomes.length === 0) {
      setRecado({ tipo: 'alerta', texto: MSG.semJogadores })
      return 0
    }

    const existentes = new Set(jogadores.map(jogador => chaveNome(jogador.nome)))
    const novos: Jogador[] = []
    let repetidos = 0
    for (const nome of nomes) {
      const chave = chaveNome(nome)
      if (existentes.has(chave)) {
        repetidos += 1
        continue
      }
      existentes.add(chave)
      novos.push({ id: criarId(), nome, estrelas: 3 })
    }

    if (novos.length === 0) {
      setRecado({ tipo: 'alerta', texto: 'Nenhum jogador novo. Esses nomes já estão na lista.' })
      return 0
    }

    setJogadores(lista => [...lista, ...novos])
    setResultado(null)
    const principal = novos.length === 1 ? '1 jogador adicionado' : `${novos.length} jogadores adicionados`
    const mensagem = repetidos === 0
      ? principal
      : `${principal}. ${repetidos === 1 ? '1 nome repetido foi ignorado.' : `${repetidos} nomes repetidos foram ignorados.`}`
    setRecado({ tipo: 'ok', texto: mensagem })
    return novos.length
  }, [jogadores])

  const renomearJogador = useCallback((id: string, nome: string) => {
    const limpo = limparNome(nome)
    if (!limpo) {
      setRecado({ tipo: 'alerta', texto: 'Informe o nome do jogador.' })
      return false
    }
    const repetido = jogadores.some(jogador => jogador.id !== id && chaveNome(jogador.nome) === chaveNome(limpo))
    if (repetido) {
      setRecado({ tipo: 'alerta', texto: 'Esse jogador já está na lista.' })
      return false
    }
    setJogadores(lista => lista.map(jogador => jogador.id === id ? { ...jogador, nome: limpo } : jogador))
    setResultado(atual => {
      if (!atual) return atual
      const trocar = (jogador: Jogador) => jogador.id === id ? { ...jogador, nome: limpo } : jogador
      return {
        ...atual,
        times: atual.times.map(time => ({ ...time, jogadores: time.jogadores.map(trocar) })),
        reservas: atual.reservas.map(trocar),
      }
    })
    setRecado(null)
    return true
  }, [jogadores])

  const removerJogador = useCallback((id: string) => {
    setJogadores(lista => lista.filter(jogador => jogador.id !== id))
    setResultado(null)
    setRecado(null)
  }, [])

  const definirEstrelas = useCallback((id: string, estrelas: Nivel) => {
    setJogadores(lista => lista.map(jogador => jogador.id === id ? { ...jogador, estrelas } : jogador))
    setResultado(atual => {
      if (!atual) return atual
      const trocar = (jogador: Jogador) => jogador.id === id ? { ...jogador, estrelas } : jogador
      const times = atual.times.map(time => {
        const elenco = time.jogadores.map(trocar)
        return {
          ...time,
          jogadores: elenco,
          forca: elenco.reduce((total, jogador) => total + jogador.estrelas, 0),
        }
      })
      const forcas = times.map(time => time.forca)
      return {
        ...atual,
        times,
        reservas: atual.reservas.map(trocar),
        diferenca: forcas.length > 0 ? Math.max(...forcas) - Math.min(...forcas) : 0,
      }
    })
  }, [])

  const resetarAvaliacoes = useCallback(() => {
    setJogadores(lista => lista.map(jogador => ({ ...jogador, estrelas: 3 as Nivel })))
    setResultado(atual => {
      if (!atual) return atual
      const times = atual.times.map(time => {
        const elenco = time.jogadores.map(jogador => ({ ...jogador, estrelas: 3 as Nivel }))
        return {
          ...time,
          jogadores: elenco,
          forca: elenco.reduce((total, jogador) => total + jogador.estrelas, 0),
        }
      })
      const forcas = times.map(time => time.forca)
      return {
        ...atual,
        times,
        reservas: atual.reservas.map(jogador => ({ ...jogador, estrelas: 3 as Nivel })),
        diferenca: forcas.length > 0 ? Math.max(...forcas) - Math.min(...forcas) : 0,
      }
    })
    setRecado({ tipo: 'ok', texto: 'Avaliações voltaram para 3 estrelas.' })
  }, [])

  const definirPorTime = useCallback((valor: number | null) => {
    setPorTime(valor)
    setResultado(null)
  }, [])

  const definirQuantidadeGoleiros = useCallback((quantidade: number) => {
    const n = Number.isInteger(quantidade) ? Math.min(20, Math.max(0, quantidade)) : 0
    setGoleiros(atual => {
      if (n === atual.length) return atual
      if (n < atual.length) return atual.slice(0, n)
      const extras = Array.from({ length: n - atual.length }, () => ({ id: criarId(), nome: '' }))
      return [...atual, ...extras]
    })
    setResultado(null)
  }, [])

  const renomearGoleiro = useCallback((id: string, nome: string) => {
    setGoleiros(lista => lista.map(goleiro => goleiro.id === id ? { ...goleiro, nome: nome.slice(0, 40) } : goleiro))
    setResultado(null)
  }, [])

  const irPara = useCallback((destino: Etapa) => {
    if (emCurso.current || destino === 'sorteio') return false
    if ((destino === 'avaliacao' || destino === 'config') && jogadores.length === 0) {
      setRecado({ tipo: 'alerta', texto: MSG.semJogadores })
      setEtapa('jogadores')
      return false
    }
    if (destino === 'times' && !resultado) return false
    setRecado(null)
    setEtapa(destino)
    return true
  }, [jogadores.length, resultado])

  const sortear = useCallback(() => {
    if (emCurso.current) return
    if (jogadores.length === 0) {
      setRecado({ tipo: 'alerta', texto: MSG.semJogadores })
      setEtapa('jogadores')
      return
    }
    if (porTime == null) {
      setRecado({ tipo: 'alerta', texto: MSG.porTimeInvalido })
      setEtapa('config')
      return
    }
    const formacao = calcularFormacao(jogadores.length, porTime)
    if (!formacao || formacao.times < 1) {
      setRecado({ tipo: 'alerta', texto: MSG.poucosJogadores })
      setEtapa('config')
      return
    }

    const pronto = montarSorteio(jogadores, goleiros, porTime)
    if (!pronto) {
      setRecado({ tipo: 'alerta', texto: MSG.falhaSorteio })
      return
    }

    setResultado(pronto)
    setRecado(pronto.usouNivelPadrao ? { tipo: 'alerta', texto: MSG.semAvaliacao } : null)
    emCurso.current = true
    setEtapa('sorteio')
    if (esperaRef.current != null) window.clearTimeout(esperaRef.current)
    const reduzir = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    esperaRef.current = window.setTimeout(() => {
      emCurso.current = false
      esperaRef.current = null
      setEtapa('times')
    }, reduzir ? 180 : 1450)
  }, [goleiros, jogadores, porTime])

  const pedirNovoRachao = useCallback(() => setConfirmarRachao(true), [])
  const cancelarNovoRachao = useCallback(() => setConfirmarRachao(false), [])

  const confirmarNovoRachao = useCallback(() => {
    if (esperaRef.current != null) {
      window.clearTimeout(esperaRef.current)
      esperaRef.current = null
    }
    emCurso.current = false
    setJogadores([])
    setGoleiros([])
    setPorTime(5)
    setResultado(null)
    setRecado(null)
    setConfirmarRachao(false)
    setEtapa('jogadores')
  }, [])

  const valor = useMemo<FutContexto>(() => ({
    etapa,
    jogadores,
    goleiros,
    goleirosNomeados,
    porTime,
    recado,
    resultado,
    confirmarRachao,
    adicionarTexto,
    renomearJogador,
    removerJogador,
    definirEstrelas,
    resetarAvaliacoes,
    definirPorTime,
    definirQuantidadeGoleiros,
    renomearGoleiro,
    irPara,
    sortear,
    pedirNovoRachao,
    cancelarNovoRachao,
    confirmarNovoRachao,
  }), [
    etapa,
    jogadores,
    goleiros,
    goleirosNomeados,
    porTime,
    recado,
    resultado,
    confirmarRachao,
    adicionarTexto,
    renomearJogador,
    removerJogador,
    definirEstrelas,
    resetarAvaliacoes,
    definirPorTime,
    definirQuantidadeGoleiros,
    renomearGoleiro,
    irPara,
    sortear,
    pedirNovoRachao,
    cancelarNovoRachao,
    confirmarNovoRachao,
  ])

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>
}

export function useFut(): FutContexto {
  const ctx = useContext(Contexto)
  if (!ctx) throw new Error('useFut deve ser usado dentro de FutProvider')
  return ctx
}
