export type ConfigMap = Record<string, string>

export interface DadosRelatorio {
  nome: string
  slogan: string
  logo: string
  documentos: string[]
  contatoLinhas: string[]
  tituloDocumento: string
  responsavel: string
  cargoAssinatura: string
  assinaturaCliente: string
  assinaturaEmpresa: string
  rodape: string
}

function limpar(v?: string) {
  return (v || '').trim()
}

export function montarDadosRelatorio(cfg: ConfigMap = {}): DadosRelatorio {
  const nome = limpar(cfg.empresa_nome) || 'LJV Construção'
  const slogan = limpar(cfg.empresa_slogan)
  const cnpj = limpar(cfg.empresa_cnpj)
  const ie = limpar(cfg.empresa_ie)
  const crea = limpar(cfg.empresa_crea)
  const telefone = limpar(cfg.relatorio_telefone) || limpar(cfg.contato_telefone)
  const whatsapp = limpar(cfg.relatorio_whatsapp)
  const email = limpar(cfg.relatorio_email) || limpar(cfg.contato_email)
  const endereco = limpar(cfg.relatorio_endereco) || limpar(cfg.contato_endereco)
  const site = limpar(cfg.relatorio_site)
  const instagram = limpar(cfg.relatorio_instagram)
  const extra = limpar(cfg.relatorio_cabecalho_extra)

  const instaFmt = instagram
    ? (instagram.startsWith('@') || instagram.includes('instagram.com') ? instagram : `@${instagram}`)
    : ''

  const telLinha = [telefone, whatsapp && whatsapp !== telefone ? `WhatsApp ${whatsapp}` : '']
    .filter(Boolean)
    .join(' · ')

  const webLinha = [site, instaFmt].filter(Boolean).join(' · ')

  const rodapeCustom = limpar(cfg.relatorio_rodape)

  return {
    nome,
    slogan,
    logo: cfg.empresa_logo || '',
    documentos: [
      cnpj && `CNPJ ${cnpj}`,
      ie && `IE ${ie}`,
      crea && `CREA ${crea}`,
    ].filter(Boolean) as string[],
    contatoLinhas: [extra, email, telLinha, webLinha, endereco].filter(Boolean),
    tituloDocumento: limpar(cfg.relatorio_titulo) || 'Orçamento',
    responsavel: limpar(cfg.empresa_responsavel),
    cargoAssinatura: limpar(cfg.relatorio_cargo_assinatura) || 'Responsável técnico',
    assinaturaCliente: limpar(cfg.relatorio_assinatura_cliente) || 'Assinatura do cliente',
    assinaturaEmpresa: limpar(cfg.relatorio_assinatura_empresa) || nome,
    rodape: rodapeCustom || [nome, telefone, email, site].filter(Boolean).join(' · '),
  }
}
