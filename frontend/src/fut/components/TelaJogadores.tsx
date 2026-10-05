import { useState, type FormEvent } from 'react'
import { EXEMPLO_JOGADORES, MSG } from '../constantes'
import { useFut } from '../estado/FutContext'
import { EditorNome } from './EditorNome'
import { Recado } from './Recado'

export function TelaJogadores() {
  const { jogadores, adicionarTexto, renomearJogador, removerJogador, irPara } = useFut()
  const [texto, setTexto] = useState('')
  const [avulso, setAvulso] = useState('')
  const [editando, setEditando] = useState<string | null>(null)

  function adicionarLista() {
    const adicionados = adicionarTexto(texto)
    if (adicionados > 0) setTexto('')
  }

  function adicionarUm(evento: FormEvent) {
    evento.preventDefault()
    const adicionados = adicionarTexto(avulso)
    if (adicionados > 0) setAvulso('')
  }

  function continuar() {
    if (jogadores.length === 0) {
      adicionarTexto('')
      return
    }
    irPara('avaliacao')
  }

  return (
    <section className="fut-painel fut-surgir">
      <ol className="fut-guia">
        <li><b>1</b> Cole os jogadores</li>
        <li><b>2</b> Dê as estrelas</li>
        <li><b>3</b> Escolha quantos jogadores por time</li>
        <li><b>4</b> Sorteie</li>
      </ol>

      <label className="fut-label" htmlFor="lista-jogadores">Cole a lista de jogadores aqui</label>
      <div className="fut-caixa">
        <textarea
          id="lista-jogadores"
          value={texto}
          onChange={evento => setTexto(evento.target.value)}
          aria-label="Cole a lista de jogadores aqui"
          spellCheck={false}
        />
        {texto.length === 0 && (
          <pre className="fut-exemplo" aria-hidden>{EXEMPLO_JOGADORES.join('\n')}</pre>
        )}
      </div>
      <p className="fut-ajuda">Um jogador por linha, ou nomes separados por vírgula ou ponto e vírgula.</p>

      <div className="fut-acoes">
        <button type="button" className="fut-btn fut-btn-ouro" onClick={adicionarLista}>
          Adicionar jogadores
        </button>
      </div>

      <Recado />

      <form className="fut-add-um" onSubmit={adicionarUm}>
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

      {jogadores.length === 0 ? (
        <p className="fut-vazio">{MSG.semJogadores}</p>
      ) : (
        <div className="fut-bloco">
          <p className="fut-kicker">Na lista · {jogadores.length}</p>
          <ul className="fut-lista">
            {jogadores.map((jogador, indice) => (
              <li key={jogador.id} className="fut-linha fut-surgir" style={{ animationDelay: `${Math.min(indice, 12) * 35}ms` }}>
                <span className="fut-numero">{String(indice + 1).padStart(2, '0')}</span>
                {editando === jogador.id ? (
                  <EditorNome
                    nome={jogador.nome}
                    onSalvar={nome => renomearJogador(jogador.id, nome)}
                    onFechar={() => setEditando(null)}
                  />
                ) : (
                  <span className="fut-nome">{jogador.nome}</span>
                )}
                <span className="fut-acoes-icones">
                  <button type="button" className="fut-icone" aria-label={`Editar ${jogador.nome}`} onClick={() => setEditando(jogador.id)}>
                    <IconeLapis />
                  </button>
                  <button type="button" className="fut-icone fut-icone-perigo" aria-label={`Remover ${jogador.nome}`} onClick={() => removerJogador(jogador.id)}>
                    <IconeLixo />
                  </button>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="fut-rodape">
        <button type="button" className="fut-btn fut-btn-ouro" onClick={continuar}>
          Continuar →
        </button>
      </div>
    </section>
  )
}

function IconeLapis() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <path d="M4 16.5V20h3.5L18.8 8.7l-3.5-3.5L4 16.5z" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M13.8 6.7l3.5 3.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  )
}

function IconeLixo() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <path d="M5 7h14M9 7V5h6v2M8 7l1 13h6l1-13" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  )
}
