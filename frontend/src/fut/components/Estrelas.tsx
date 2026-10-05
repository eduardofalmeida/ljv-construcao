import { useState } from 'react'
import type { Nivel } from '../types'

interface Props {
  valor: Nivel
  onChange?: (nivel: Nivel) => void
  leitura?: boolean
  rotulo?: string
}

export function Estrelas({ valor, onChange, leitura = false, rotulo }: Props) {
  const [pulso, setPulso] = useState<Nivel | null>(null)
  const niveis: Nivel[] = [1, 2, 3, 4, 5]

  if (leitura) {
    return (
      <span className="fut-estrelas fut-estrelas-leitura" aria-label={rotulo ?? `${valor} de 5 estrelas`}>
        {niveis.map(nivel => (
          <IconeEstrela key={nivel} ativa={nivel <= valor} />
        ))}
      </span>
    )
  }

  return (
    <div
      className="fut-estrelas"
      role="radiogroup"
      aria-label={rotulo ?? 'Nota do jogador'}
      onKeyDown={evento => {
        if (!onChange) return
        if (evento.key === 'ArrowRight' || evento.key === 'ArrowUp') {
          evento.preventDefault()
          onChange(Math.min(5, valor + 1) as Nivel)
        }
        if (evento.key === 'ArrowLeft' || evento.key === 'ArrowDown') {
          evento.preventDefault()
          onChange(Math.max(1, valor - 1) as Nivel)
        }
      }}
    >
      {niveis.map(nivel => (
        <button
          key={nivel}
          type="button"
          role="radio"
          aria-checked={valor === nivel}
          aria-label={`${nivel} ${nivel === 1 ? 'estrela' : 'estrelas'}`}
          className={`fut-estrela${nivel <= valor ? ' fut-estrela-ativa' : ''}${pulso === nivel ? ' fut-pop' : ''}`}
          onClick={() => {
            onChange?.(nivel)
            setPulso(nivel)
          }}
          onAnimationEnd={() => setPulso(atual => atual === nivel ? null : atual)}
        >
          <IconeEstrela ativa={nivel <= valor} />
        </button>
      ))}
    </div>
  )
}

function IconeEstrela({ ativa }: { ativa: boolean }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <path
        d="M12 2.6l2.7 5.7 6.3.9-4.6 4.4 1.1 6.3L12 17.8 6.5 20.9l1.1-6.3L3 10.2l6.3-.9L12 2.6z"
        fill={ativa ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  )
}
