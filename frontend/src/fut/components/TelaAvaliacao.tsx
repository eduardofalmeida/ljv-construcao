import { useState } from 'react'
import { MSG } from '../constantes'
import { useFut } from '../estado/FutContext'
import type { Nivel } from '../types'
import { EditorNome } from './EditorNome'
import { Estrelas } from './Estrelas'
import { Recado } from './Recado'

export function TelaAvaliacao() {
  const {
    jogadores,
    renomearJogador,
    removerJogador,
    definirEstrelas,
    resetarAvaliacoes,
    adicionarTexto,
    irPara,
  } = useFut()
  const [editando, setEditando] = useState<string | null>(null)
  const [avulso, setAvulso] = useState('')
  const concluidas = jogadores.filter(jogador => jogador.estrelas >= 1 && jogador.estrelas <= 5).length

  function continuar() {
    irPara('config')
  }

  return (
    <section className="fut-surgir">
      <div className="fut-stats">
        <p>Jogadores: <strong>{jogadores.length}</strong></p>
        <p>Avaliações concluídas: <strong>{concluidas}/{jogadores.length}</strong></p>
      </div>
      <p className="fut-ajuda">A nota inicial é 3. Toque nas estrelas para ajustar cada jogador.</p>
      <Recado />
      {concluidas < jogadores.length && <p className="fut-alerta">{MSG.semAvaliacao}</p>}

      {jogadores.length === 0 ? (
        <p className="fut-vazio">{MSG.semJogadores}</p>
      ) : (
        <ul className="fut-elenco">
          {jogadores.map((jogador, indice) => (
            <li key={jogador.id} className="fut-atleta fut-surgir" style={{ animationDelay: `${Math.min(indice, 14) * 40}ms` }}>
              <header>
                <span className="fut-numero">{String(indice + 1).padStart(2, '0')}</span>
                {editando === jogador.id ? (
                  <EditorNome
                    nome={jogador.nome}
                    onSalvar={nome => renomearJogador(jogador.id, nome)}
                    onFechar={() => setEditando(null)}
                  />
                ) : (
                  <h3 className="fut-nome">{jogador.nome}</h3>
                )}
                <span className="fut-acoes-icones">
                  <button type="button" className="fut-icone" aria-label={`Editar ${jogador.nome}`} onClick={() => setEditando(jogador.id)}>
                    <svg viewBox="0 0 24 24" aria-hidden><path d="M4 16.5V20h3.5L18.8 8.7l-3.5-3.5L4 16.5z" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" /></svg>
                  </button>
                  <button type="button" className="fut-icone fut-icone-perigo" aria-label={`Remover ${jogador.nome}`} onClick={() => removerJogador(jogador.id)}>
                    <svg viewBox="0 0 24 24" aria-hidden><path d="M5 7h14M9 7V5h6v2M8 7l1 13h6l1-13" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" /></svg>
                  </button>
                </span>
              </header>
              <Estrelas
                valor={jogador.estrelas}
                rotulo={`Estrelas de ${jogador.nome}`}
                onChange={nivel => definirEstrelas(jogador.id, nivel as Nivel)}
              />
              <p className="fut-nivel">Nível: {jogador.estrelas}</p>
            </li>
          ))}
        </ul>
      )}

      <form
        className="fut-add-um"
        onSubmit={evento => {
          evento.preventDefault()
          if (adicionarTexto(avulso) > 0) setAvulso('')
        }}
      >
        <input
          value={avulso}
          onChange={evento => setAvulso(evento.target.value)}
          placeholder="Nome do jogador"
          aria-label="Nome do jogador"
          maxLength={40}
          spellCheck={false}
          autoComplete="off"
        />
        <button type="submit" className="fut-btn fut-btn-linha">+ Adicionar jogador</button>
      </form>

      <div className="fut-rodape">
        <button type="button" className="fut-btn fut-btn-fantasma" onClick={resetarAvaliacoes}>
          Resetar avaliações
        </button>
        <div className="fut-acoes fut-acoes-dupla">
          <button type="button" className="fut-btn fut-btn-linha" onClick={() => irPara('jogadores')}>Voltar</button>
          <button type="button" className="fut-btn fut-btn-ouro" onClick={continuar}>Continuar →</button>
        </div>
      </div>
    </section>
  )
}
