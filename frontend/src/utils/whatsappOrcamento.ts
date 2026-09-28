import type { Orcamento, OrcamentoCliente } from '../types'
import type { ConfigMap } from './dadosRelatorio'
import { montarDadosRelatorio } from './dadosRelatorio'
import { gerarArquivoPdfOrcamento } from './orcamentoPDF'
import { enviarArquivoWhatsApp, telefoneWhatsApp } from './whatsapp'

export { telefoneWhatsApp }

export function montarMensagemWhatsApp(orc: Orcamento, empresa: ConfigMap = {}) {
  const d = montarDadosRelatorio(empresa)
  const total = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(orc.valorFinal || orc.valorTotal || 0)
  const validade = orc.dataValidade
    ? new Date(orc.dataValidade + 'T00:00:00').toLocaleDateString('pt-BR')
    : ''
  const nome = orc.cliente?.nome ? `Olá, ${orc.cliente.nome}!` : 'Olá!'
  return [
    `${nome} Tudo bem?`,
    '',
    `Segue o orçamento ${orc.numero || ''} — ${orc.titulo}.`.replace(/\s+/g, ' ').trim(),
    `Valor: ${total}`,
    validade ? `Validade: ${validade}` : '',
    '',
    'O PDF vai em anexo nesta conversa.',
    'Qualquer dúvida, estou à disposição.',
    '',
    d.nome,
    d.contatoLinhas[0] || '',
  ].filter(linha => linha !== undefined).join('\n').replace(/\n{3,}/g, '\n\n')
}

export async function enviarOrcamentoWhatsApp(orc: Orcamento, empresa: ConfigMap = {}) {
  const tel = telefoneWhatsApp(orc.cliente as OrcamentoCliente)
  if (!tel) {
    throw new Error('Cadastre o celular ou telefone do cliente para enviar no WhatsApp.')
  }
  const file = await gerarArquivoPdfOrcamento(orc, empresa)
  return enviarArquivoWhatsApp({
    pessoa: orc.cliente,
    file,
    texto: montarMensagemWhatsApp(orc, empresa),
    titulo: `${orc.numero || 'Orçamento'} — ${orc.titulo}`,
  })
}
