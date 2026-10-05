import { MSG, identidadeDoTime } from '../constantes'
import { useFut } from '../estado/FutContext'
import { contagem, formatarMedia, textoDiferenca, textoFaltaGoleiro, textoProximidade, textoReservas } from '../utils/formacao'
import { Estrelas } from './Estrelas'
import { Recado } from './Recado'

export function TelaTimes() {
  const { resultado, irPara, sortear, pedirNovoRachao } = useFut()

  if (!resultado) {
    return (
      <section className="fut-painel">
        <p className="fut-vazio">Sorteie os times para ver o resultado.</p>
        <button type="button" className="fut-btn fut-btn-ouro" onClick={() => irPara('config')}>Ir para a configuração</button>
      </section>
    )
  }

  const maiorForca = Math.max(...resultado.times.map(time => time.forca), 1)
  const proximidade = textoProximidade(resultado.diferenca)
  const goleirosUsados = resultado.times.filter(time => time.goleiro).length + resultado.goleirosReserva.length
  const mostraGoleiro = goleirosUsados > 0
  const faltaGoleiro = goleirosUsados > 0 && goleirosUsados < resultado.times.length
  const temReserva = resultado.reservas.length > 0 || resultado.goleirosReserva.length > 0

  return (
    <section className="fut-surgir">
      <header className="fut-titulo-bloco">
        <h2>🏆 Times sorteados</h2>
      </header>
      <Recado />
      {resultado.usouNivelPadrao && <p className="fut-alerta">{MSG.semAvaliacao}</p>}

      <section className="fut-equilibrio" aria-labelledby="equilibrio-times">
        <h3 id="equilibrio-times">⚖️ Equilíbrio dos times</h3>
        <ul>
          {resultado.times.map(time => {
            const identidade = identidadeDoTime(time.indice)
            const largura = Math.max(8, Math.round((time.forca / maiorForca) * 100))
            return (
              <li key={time.indice} className="fut-equilibrio-linha">
                <span className="fut-equilibrio-nome">
                  <i style={{ background: identidade.cor }} />
                  Time {time.indice + 1}: ⭐ {time.forca}
                </span>
                <span className="fut-trilho" aria-hidden>
                  <span className="fut-trilho-valor" style={{ width: `${largura}%`, background: identidade.cor }} />
                </span>
              </li>
            )
          })}
        </ul>
        <p className="fut-diferenca">{textoDiferenca(resultado.diferenca)}</p>
        {proximidade && <p className="fut-proximo">{proximidade}</p>}
      </section>

      {faltaGoleiro && (
        <div className="fut-alerta">
          <p>{textoFaltaGoleiro(resultado.times.length, goleirosUsados)}</p>
          <p>{MSG.goleirosMenor}</p>
        </div>
      )}

      <div className="fut-times">
        {resultado.times.map((time, indice) => {
          const identidade = identidadeDoTime(time.indice)
          return (
            <article
              key={time.indice}
              className="fut-time fut-surgir"
              style={{ animationDelay: `${indice * 70}ms`, background: identidade.tinta }}
            >
              <span className="fut-time-faixa" style={{ background: identidade.cor }} />
              <header className="fut-time-topo">
                <Camisa cor={identidade.cor} />
                <div>
                  <h3>{identidade.marca} {identidade.rotulo}</h3>
                  <p className="fut-meta">
                    {contagem(time.jogadores.length, 'jogador', 'jogadores')}
                    {time.goleiro ? ' + goleiro' : ''}
                    {' · '}Média {formatarMedia(time.forca, time.jogadores.length)}
                  </p>
                </div>
              </header>

              {mostraGoleiro && (
                <div className="fut-fila fut-fila-gk">
                  <span>🧤 {time.goleiro ? time.goleiro.nome : 'Sem goleiro'}</span>
                  <small>{time.goleiro ? 'Goleiro' : 'Vaga em aberto'}</small>
                </div>
              )}

              <ul>
                {time.jogadores.map(jogador => (
                  <li key={jogador.id} className="fut-fila">
                    <span className="fut-nome">{jogador.nome}</span>
                    <Estrelas valor={jogador.estrelas} leitura rotulo={`${jogador.nome}, nível ${jogador.estrelas}`} />
                  </li>
                ))}
              </ul>

              <footer className="fut-forca" style={{ borderColor: identidade.cor }}>
                Força do time: {time.forca} ⭐
              </footer>
            </article>
          )
        })}
      </div>

      {temReserva && (
        <section className="fut-reservas">
          <h3>🔄 Jogadores reservas</h3>
          {resultado.reservas.length > 0 && <p>{textoReservas(resultado.reservas.length)}</p>}
          {resultado.goleirosReserva.length > 0 && (
            <p>
              {resultado.goleirosReserva.length === 1
                ? '1 goleiro ficou de fora porque há mais goleiros do que times.'
                : `${resultado.goleirosReserva.length} goleiros ficaram de fora porque há mais goleiros do que times.`}
            </p>
          )}
          <ul>
            {resultado.reservas.map(jogador => (
              <li key={jogador.id}>
                <span>{jogador.nome}</span>
                <Estrelas valor={jogador.estrelas} leitura />
              </li>
            ))}
            {resultado.goleirosReserva.map(goleiro => (
              <li key={goleiro.id}>
                <span>🧤 {goleiro.nome}</span>
                <small>Goleiro</small>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="fut-rodape">
        <div className="fut-acoes">
          <button type="button" className="fut-btn fut-btn-ouro" onClick={sortear}>🔄 Sortear novamente</button>
          <div className="fut-acoes fut-acoes-dupla">
            <button type="button" className="fut-btn fut-btn-linha" onClick={() => irPara('avaliacao')}>Alterar avaliações</button>
            <button type="button" className="fut-btn fut-btn-linha" onClick={() => irPara('jogadores')}>Editar jogadores</button>
          </div>
          <button type="button" className="fut-btn fut-btn-fantasma" onClick={() => irPara('config')}>Ajustar configuração</button>
          <button type="button" className="fut-btn fut-btn-fantasma fut-btn-perigo" onClick={pedirNovoRachao}>Novo rachão</button>
        </div>
      </div>
    </section>
  )
}

function Camisa({ cor }: { cor: string }) {
  return (
    <svg className="fut-camisa" viewBox="0 0 64 64" aria-hidden>
      <path fill={cor} d="M18 16l8 6 6-8 6 8 8-6 8 10-8 6v26H18V32l-8-6 8-10z" />
      <path fill="rgba(0,0,0,.2)" d="M26 22l6-8 6 8v8H26z" />
    </svg>
  )
}
