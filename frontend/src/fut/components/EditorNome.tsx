import { useRef, useState } from 'react'

interface Props {
  nome: string
  onSalvar: (nome: string) => boolean
  onFechar: () => void
}

export function EditorNome({ nome, onSalvar, onFechar }: Props) {
  const [valor, setValor] = useState(nome)
  const fechou = useRef(false)

  function concluir() {
    if (fechou.current) return
    if (valor.trim() === nome) {
      fechou.current = true
      onFechar()
      return
    }
    if (onSalvar(valor)) {
      fechou.current = true
      onFechar()
    }
  }

  return (
    <input
      className="fut-input-nome"
      autoFocus
      value={valor}
      maxLength={40}
      aria-label="Nome do jogador"
      spellCheck={false}
      autoComplete="off"
      onChange={evento => setValor(evento.target.value)}
      onKeyDown={evento => {
        if (evento.key === 'Enter') {
          evento.preventDefault()
          concluir()
        }
        if (evento.key === 'Escape') onFechar()
      }}
      onBlur={concluir}
    />
  )
}
