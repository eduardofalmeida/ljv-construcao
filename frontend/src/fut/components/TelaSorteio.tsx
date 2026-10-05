import { useEffect, useState } from 'react'
import { useFut } from '../estado/FutContext'

export function TelaSorteio() {
  const { jogadores, goleiros } = useFut()
  const nomes = [
    ...jogadores.map(jogador => jogador.nome),
    ...goleiros.map(goleiro => goleiro.nome.trim()).filter(Boolean),
  ]
  const quantidade = Math.min(8, Math.max(4, Math.min(nomes.length, 8)))
  const [quadro, setQuadro] = useState(() => amostra(nomes, quantidade))
  const [giro, setGiro] = useState(0)

  useEffect(() => {
    const id = window.setInterval(() => {
      setQuadro(amostra(nomes, quantidade))
      setGiro(valor => valor + 1)
    }, 130)
    return () => window.clearInterval(id)
  }, [nomes.join('|'), quantidade])

  return (
    <section className="fut-sorteio fut-painel fut-surgir" aria-busy="true">
      <p className="fut-kicker" role="status">Sorteando os times</p>
      <div className="fut-bola" aria-hidden>
        <svg viewBox="0 0 64 64">
          <circle cx="32" cy="32" r="28" fill="none" stroke="currentColor" strokeWidth="2" />
          <path d="M32 14l8 6-3 9H27l-3-9 8-6zM18 28l6 2 2 8-7 6-8-5 7-11zM46 28l-6 2-2 8 7 6 8-5-7-11zM24 48l8 4 8-4-2-8H26l-2 8z" fill="currentColor" />
        </svg>
      </div>
      <ul>
        {quadro.map((nome, indice) => (
          <li key={`${giro}-${indice}`} className="fut-nome-giro">{nome}</li>
        ))}
      </ul>
    </section>
  )
}

function amostra(nomes: string[], quantidade: number): string[] {
  if (nomes.length === 0) return Array.from({ length: quantidade }, () => '…')
  const copia = nomes.slice()
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const atual = copia[i]
    copia[i] = copia[j]
    copia[j] = atual
  }
  const saida: string[] = []
  for (let i = 0; i < quantidade; i++) saida.push(copia[i % copia.length])
  return saida
}
