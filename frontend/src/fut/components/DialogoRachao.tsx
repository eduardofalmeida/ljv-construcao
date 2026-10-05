import { useEffect } from 'react'
import { useFut } from '../estado/FutContext'

export function DialogoRachao() {
  const { confirmarRachao, cancelarNovoRachao, confirmarNovoRachao } = useFut()

  useEffect(() => {
    if (!confirmarRachao) return
    const aoTeclar = (evento: KeyboardEvent) => {
      if (evento.key === 'Escape') cancelarNovoRachao()
    }
    window.addEventListener('keydown', aoTeclar)
    return () => window.removeEventListener('keydown', aoTeclar)
  }, [cancelarNovoRachao, confirmarRachao])

  if (!confirmarRachao) return null

  return (
    <div className="fut-modal-fundo" role="presentation" onClick={cancelarNovoRachao}>
      <div
        className="fut-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-rachao"
        onClick={evento => evento.stopPropagation()}
      >
        <h2 id="titulo-rachao">Novo rachão?</h2>
        <p>Isso apaga a lista, as estrelas e os times deste sorteio.</p>
        <div className="fut-acoes">
          <button type="button" className="fut-btn fut-btn-ouro" onClick={confirmarNovoRachao}>Apagar tudo</button>
          <button type="button" className="fut-btn fut-btn-linha" onClick={cancelarNovoRachao}>Continuar neste sorteio</button>
        </div>
      </div>
    </div>
  )
}
