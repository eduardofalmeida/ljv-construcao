export function contagem(n: number, singular: string, plural: string): string {
  return `${n} ${n === 1 ? singular : plural}`
}

export function calcularFormacao(total: number, porTime: number): { times: number; usados: number; fora: number } | null {
  if (!Number.isInteger(porTime) || porTime < 1 || porTime > 30) return null
  if (!Number.isInteger(total) || total < 0) return null
  const times = Math.floor(total / porTime)
  const usados = times * porTime
  return { times, usados, fora: total - usados }
}

export function textoFaltaGoleiro(times: number, goleiros: number): string {
  const ladoTimes = times === 1 ? 'Existe 1 time' : `Existem ${times} times`
  const ladoGk = goleiros === 1 ? 'apenas 1 goleiro cadastrado' : `apenas ${goleiros} goleiros cadastrados`
  return `⚠️ ${ladoTimes} e ${ladoGk}.`
}

export function textoReservas(quantidade: number): string {
  if (quantidade === 1) {
    return '1 jogador ficou fora porque não há jogadores suficientes para formar outro time completo.'
  }
  return `${quantidade} jogadores ficaram fora porque não há jogadores suficientes para formar outro time completo.`
}

export function textoDiferenca(diferenca: number): string {
  return `Diferença entre o maior e menor time: ${contagem(diferenca, 'estrela', 'estrelas')}`
}

export function textoProximidade(diferenca: number): string | null {
  if (diferenca <= 0) return 'Os times ficaram com a mesma soma de estrelas.'
  if (diferenca <= 2) return 'Os times estão próximos.'
  return null
}

export function formatarMedia(forca: number, quantidade: number): string {
  if (quantidade <= 0) return '0'
  return (forca / quantidade).toLocaleString('pt-BR', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })
}

export interface DescricaoFormacao {
  valido: boolean
  mensagem: string | null
  linhas: string[]
  destaque: string | null
  fora: string | null
  avisoGoleiros: string | null
  complemento: string | null
}

export function descreverFormacao(total: number, porTime: number | null, goleiros: number): DescricaoFormacao {
  const vazio = (mensagem: string): DescricaoFormacao => ({
    valido: false,
    mensagem,
    linhas: [],
    destaque: null,
    fora: null,
    avisoGoleiros: null,
    complemento: null,
  })

  if (total <= 0) return vazio('Adicione os jogadores para começar.')
  if (porTime == null) return vazio('Informe uma quantidade válida de jogadores por time.')

  const formacao = calcularFormacao(total, porTime)
  if (!formacao || formacao.times < 1) {
    return vazio('Não há jogadores suficientes para formar um time completo.')
  }

  const linhas = goleiros > 0
    ? [
        contagem(total, 'jogador de linha', 'jogadores de linha'),
        contagem(goleiros, 'goleiro', 'goleiros'),
        contagem(porTime, 'jogador de linha por time', 'jogadores de linha por time'),
      ]
    : [
        contagem(total, 'jogador cadastrado', 'jogadores cadastrados'),
        contagem(porTime, 'jogador de linha por time', 'jogadores de linha por time'),
      ]

  const destaque = formacao.fora > 0
    ? `${contagem(formacao.times, 'time', 'times')} de ${contagem(porTime, 'jogador', 'jogadores')} = ${contagem(formacao.usados, 'jogador', 'jogadores')}`
    : `${contagem(formacao.times, 'time', 'times')} de ${contagem(porTime, 'jogador', 'jogadores')}`

  const fora = formacao.fora > 0
    ? (formacao.fora === 1 ? '1 jogador ficará fora' : `${formacao.fora} jogadores ficarão fora`)
    : null

  let avisoGoleiros: string | null = null
  let complemento: string | null = null
  if (goleiros > 0 && goleiros < formacao.times) {
    avisoGoleiros = textoFaltaGoleiro(formacao.times, goleiros)
  } else if (goleiros >= formacao.times && goleiros > 0) {
    const extra = goleiros - formacao.times
    const cada = `Cada time receberá ${contagem(porTime, 'jogador', 'jogadores')} de linha + 1 goleiro`
    complemento = extra === 0
      ? cada
      : `${cada}. ${extra === 1 ? '1 goleiro ficará de reserva' : `${extra} goleiros ficarão de reserva`}.`
  }

  return {
    valido: true,
    mensagem: null,
    linhas,
    destaque,
    fora,
    avisoGoleiros,
    complemento,
  }
}
