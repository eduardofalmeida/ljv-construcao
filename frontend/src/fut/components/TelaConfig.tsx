import { useState } from 'react'
import { MSG } from '../constantes'
import { useFut } from '../estado/FutContext'
import { descreverFormacao } from '../utils/formacao'
import { Recado } from './Recado'

export function TelaConfig() {
  const {
    jogadores,
    goleiros,
    goleirosNomeados,
    porTime,
    definirPorTime,
    definirQuantidadeGoleiros,
    renomearGoleiro,
    irPara,
    sortear,
  } = useFut()
  const [rascunho, setRascunho] = useState(porTime == null ? '' : String(porTime))
  const descricao = descreverFormacao(jogadores.length, porTime, goleirosNomeados.length)

  function analisar(texto: string): number | null {
    if (!/^\d+$/.test(texto)) return null
    const n = Number(texto)
    if (n < 1 || n > 30) return null
    return n
  }

  function alterar(texto: string) {
    setRascunho(texto)
    const proximo = analisar(texto)
    if (proximo !== porTime) definirPorTime(proximo)
  }

  function passo(delta: number) {
    const base = porTime ?? (delta > 0 ? 0 : 2)
    const proximo = Math.min(30, Math.max(1, base + delta))
    setRascunho(String(proximo))
    if (proximo !== porTime) definirPorTime(proximo)
  }

  return (
    <section className="fut-surgir">
      <div className="fut-config-grade">
        <div className="fut-painel">
          <h2>⚙️ Configuração dos times</h2>
          <p className="fut-ajuda">Só entram times completos. Quem sobrar fica na reserva.</p>

          <label className="fut-label" htmlFor="por-time">Jogadores de linha por time</label>
          <div className="fut-stepper">
            <button type="button" aria-label="Diminuir jogadores por time" onClick={() => passo(-1)}>−</button>
            <input
              id="por-time"
              inputMode="numeric"
              value={rascunho}
              aria-invalid={porTime == null}
              onChange={evento => alterar(evento.target.value)}
            />
            <button type="button" aria-label="Aumentar jogadores por time" onClick={() => passo(1)}>+</button>
          </div>
          {porTime == null && <p className="fut-ajuda-erro">{MSG.porTimeInvalido}</p>}

          <div className="fut-divisor" />

          <label className="fut-label" htmlFor="qtd-goleiros">Quantidade de goleiros</label>
          <p className="fut-ajuda">Opcional. Os goleiros não entram na conta dos jogadores de linha.</p>
          <div className="fut-stepper">
            <button type="button" aria-label="Diminuir goleiros" onClick={() => definirQuantidadeGoleiros(goleiros.length - 1)}>−</button>
            <input
              id="qtd-goleiros"
              inputMode="numeric"
              value={String(goleiros.length)}
              onChange={evento => {
                const texto = evento.target.value
                if (texto === '') {
                  definirQuantidadeGoleiros(0)
                  return
                }
                if (/^\d+$/.test(texto)) definirQuantidadeGoleiros(Number(texto))
              }}
            />
            <button type="button" aria-label="Aumentar goleiros" onClick={() => definirQuantidadeGoleiros(goleiros.length + 1)}>+</button>
          </div>

          {goleiros.length > 0 && (
            <ul className="fut-lista fut-lista-goleiros">
              {goleiros.map((goleiro, indice) => (
                <li key={goleiro.id} className="fut-linha">
                  <span className="fut-numero">{String(indice + 1).padStart(2, '0')}</span>
                  <input
                    value={goleiro.nome}
                    maxLength={40}
                    placeholder="Nome do goleiro"
                    aria-label={`Goleiro ${indice + 1}`}
                    spellCheck={false}
                    autoComplete="off"
                    onChange={evento => renomearGoleiro(goleiro.id, evento.target.value)}
                  />
                </li>
              ))}
            </ul>
          )}
          {goleiros.length > 0 && goleirosNomeados.length < goleiros.length && (
            <p className="fut-ajuda">Preencha o nome de cada goleiro. Vaga em branco não entra no sorteio.</p>
          )}
        </div>

        <aside className="fut-placar" aria-live="polite">
          <p className="fut-kicker">Placar da formação</p>
          <Recado />
          {descricao.mensagem && <p className="fut-alerta">{descricao.mensagem}</p>}
          {descricao.valido && (
            <>
              <ul>
                {descricao.linhas.map(linha => <li key={linha}>{linha}</li>)}
              </ul>
              <p className="fut-placar-destaque">{descricao.destaque}</p>
              {descricao.fora && <p className="fut-placar-fora">{descricao.fora}</p>}
              {descricao.complemento && <p>{descricao.complemento}</p>}
              {descricao.avisoGoleiros && (
                <>
                  <p className="fut-alerta">{descricao.avisoGoleiros}</p>
                  <p className="fut-ajuda">{MSG.goleirosMenor}</p>
                </>
              )}
            </>
          )}
        </aside>
      </div>

      <div className="fut-rodape">
        <div className="fut-acoes fut-acoes-dupla">
          <button type="button" className="fut-btn fut-btn-linha" onClick={() => irPara('avaliacao')}>Voltar</button>
          <button type="button" className="fut-btn fut-btn-ouro" onClick={sortear}>🎲 Sortear times</button>
        </div>
      </div>
    </section>
  )
}
