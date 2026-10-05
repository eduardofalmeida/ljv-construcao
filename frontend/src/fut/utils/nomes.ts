export function chaveNome(nome: string): string {
  return nome
    .trim()
    .replace(/\s+/g, ' ')
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLocaleLowerCase('pt-BR')
}

export function limparNome(bruto: string): string {
  let nome = bruto.replace(/\s+/g, ' ').trim()
  nome = nome.replace(/^[-*•]+\s*/, '')
  nome = nome.replace(/^\d+\s*[.)\-–—:]\s*/, '')
  nome = nome.trim()
  if (nome.length > 40) nome = nome.slice(0, 40).trim()
  return nome
}

/** Aceita um nome por linha, vírgula ou ponto e vírgula. Ignora vazios e repetições. */
export function interpretarNomes(texto: string): string[] {
  const partes = texto.replace(/\r/g, '').split(/[\n,;]+/)
  const vistos = new Set<string>()
  const nomes: string[] = []
  for (const parte of partes) {
    const nome = limparNome(parte)
    if (!nome) continue
    const chave = chaveNome(nome)
    if (vistos.has(chave)) continue
    vistos.add(chave)
    nomes.push(nome)
  }
  return nomes
}
