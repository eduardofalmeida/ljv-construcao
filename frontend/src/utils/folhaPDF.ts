import { jsPDF } from 'jspdf'
import type { RelatorioFuncionarioLinha, RelatorioFolha } from '../types'
import { montarDadosRelatorio, type ConfigMap } from './dadosRelatorio'
import { abrirWhatsApp, enviarArquivoWhatsApp, telefoneWhatsApp } from './whatsapp'

function fmt(v?: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(v) || 0)
}

function fmtData(d?: string) {
  if (!d) return '—'
  return new Date(d + 'T00:00:00').toLocaleDateString('pt-BR')
}

const STATUS_TXT: Record<string, string> = {
  TRABALHADO: 'Trabalhado',
  FALTA: 'Falta',
  FALTA_JUSTIFICADA: 'Justificada',
  FOLGA: 'Folga',
}

export interface FolhaIndividualOpts {
  linha: RelatorioFuncionarioLinha
  relatorio: RelatorioFolha
  empresa?: ConfigMap
  cargoLabel: string
  tipoLabel: string
}

function periodoTxt(relatorio: RelatorioFolha) {
  return `${fmtData(relatorio.periodo.inicio)} a ${fmtData(relatorio.periodo.fim)}`
}

export function resumoDescontos(linha: Pick<RelatorioFuncionarioLinha, 'descontos' | 'descontosAvulsos' | 'faltasADescontar'>) {
  const faltas = linha.descontos || 0
  const outros = linha.descontosAvulsos || 0
  const total = faltas + outros
  if (total <= 0) {
    return { houve: false, faltas, outros, total, texto: 'Não houve descontos neste período.' }
  }
  const partes = [
    faltas > 0 ? `desconto por faltas de ${fmt(faltas)} (${linha.faltasADescontar} dia${linha.faltasADescontar === 1 ? '' : 's'})` : '',
    outros > 0 ? `outros descontos de ${fmt(outros)}` : '',
  ].filter(Boolean)
  return {
    houve: true,
    faltas,
    outros,
    total,
    texto: `Houve desconto: ${partes.join(' e ')}. Total descontado: ${fmt(total)}.`,
  }
}

function nomeArquivo(linha: RelatorioFuncionarioLinha, relatorio: RelatorioFolha) {
  const nome = (linha.funcionario.nome || 'funcionario').replace(/[^\w.-]+/g, '_').slice(0, 40)
  const ini = (relatorio.periodo.inicio || '').replace(/-/g, '')
  const fim = (relatorio.periodo.fim || '').replace(/-/g, '')
  return `folha-${nome}-${ini}-${fim}.pdf`
}

function htmlCabecalho(empresa: ConfigMap = {}) {
  const d = montarDadosRelatorio(empresa)
  const contato = [d.documentos.join(' · '), ...d.contatoLinhas].filter(Boolean).join('<br/>')
  const logo = d.logo
    ? `<img src="${d.logo}" alt="" style="width:52px;height:52px;object-fit:cover;border-radius:10px;border:1px solid #e5e7eb"/>`
    : `<div style="width:52px;height:52px;border-radius:10px;background:#1a1c22;color:#d4891a;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:20px">${(d.nome || 'L').charAt(0)}</div>`
  return { d, contato, logo }
}

export function imprimirFolhaIndividual(opts: FolhaIndividualOpts) {
  const win = window.open('', '_blank')
  if (!win) return
  const { linha, relatorio, empresa = {}, cargoLabel, tipoLabel } = opts
  const { d, contato, logo } = htmlCabecalho(empresa)
  const desconto = resumoDescontos(linha)
  const f = linha.funcionario
  const regs = (linha.registros || []).map(r => {
    const semDesc = r.descontar === false && r.status !== 'TRABALHADO'
    return `<tr>
      <td style="padding:8px 10px">${fmtData(r.data)}</td>
      <td style="padding:8px 10px">${STATUS_TXT[r.status] || r.status}</td>
      <td style="padding:8px 10px">${r.motivo || '—'}${semDesc ? ' <span style="color:#888">(sem desconto)</span>' : ''}</td>
    </tr>`
  }).join('')

  win.document.write(`<!DOCTYPE html><html lang="pt-BR"><head>
    <meta charset="UTF-8"/>
    <title>Folha — ${f.nome}</title>
    <style>
      *{box-sizing:border-box;margin:0;padding:0}
      body{font-family:-apple-system,sans-serif;font-size:13px;color:#111;padding:32px}
      table{width:100%;border-collapse:collapse}
      thead tr{background:#1a1c22;color:#d4891a}
      thead th{padding:8px 10px;text-align:left;font-size:10px;text-transform:uppercase}
      .rodape{margin-top:40px;padding-top:16px;border-top:1px solid #e5e7eb;text-align:center;font-size:11px;color:#9ca3af}
      @media print{button{display:none}}
    </style>
  </head><body>
    <div style="display:flex;justify-content:space-between;gap:24px;margin-bottom:24px;padding-bottom:18px;border-bottom:2px solid #1a1c22">
      <div style="display:flex;gap:12px">
        ${logo}
        <div>
          <div style="font-size:20px;font-weight:900">${d.nome}</div>
          ${d.slogan ? `<div style="font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#9ca3af;margin-top:2px">${d.slogan}</div>` : ''}
          ${contato ? `<div style="margin-top:8px;font-size:12px;color:#6b7280;line-height:1.55">${contato}</div>` : ''}
        </div>
      </div>
      <div style="text-align:right">
        <div style="font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#9ca3af">Relatório individual</div>
        <div style="font-size:15px;font-weight:900;color:#d4891a;margin-top:4px">Folha de pagamento</div>
      </div>
    </div>
    <h1 style="font-size:22px;font-weight:900;margin-bottom:4px">${f.nome}</h1>
    <p style="color:#666;font-size:12px;margin-bottom:20px">
      ${cargoLabel} · ${tipoLabel}<br/>
      Período: ${periodoTxt(relatorio)} · ${relatorio.diasUteisNoPeriodo} dias úteis
    </p>
    <div style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:24px">
      ${[
        ['Trabalhados', String(linha.diasTrabalhados) + 'd'],
        ['Extras (FdS)', linha.diasExtras > 0 ? '+' + linha.diasExtras : '—'],
        ['Faltas', String(linha.faltasTotal)],
        ['Valor do dia', fmt(linha.valorDia || f.valorDiaria)],
        ['Bruto', fmt(linha.valorBruto)],
        ['Desconto por faltas', desconto.faltas > 0 ? '− ' + fmt(desconto.faltas) : 'Não houve'],
        ['Outros descontos', desconto.outros > 0 ? '− ' + fmt(desconto.outros) : 'Não houve'],
        ['Vale (adiant.)', (linha.valesPendentes || 0) > 0 ? '− ' + fmt(linha.valesPendentes) : '—'],
        ['A receber', fmt(linha.aReceber ?? Math.max(0, linha.valorLiquido - (linha.valesPendentes || 0) - (linha.descontosAvulsos || 0) - (linha.pagamentosJaFeitos || 0)))],
      ].map(([l, v]) => `<div style="background:#f9f9f7;border:1px solid #e8e8e0;border-radius:12px;padding:12px 16px;min-width:120px">
        <div style="font-size:10px;color:#888;text-transform:uppercase;margin-bottom:4px">${l}</div>
        <div style="font-size:16px;font-weight:900">${v}</div>
      </div>`).join('')}
    </div>
    <p style="font-size:12px;color:#666;margin-bottom:16px">
      ${linha.diasTrabalhados} dias × ${fmt(linha.valorDia || f.valorDiaria)} = ${fmt(linha.valorBruto)}
      ${(linha.valesPendentes || 0) > 0 ? ` · vale (adiantamento já recebido) − ${fmt(linha.valesPendentes)}` : ''}
    </p>
    <div style="background:${desconto.houve ? '#fef2f2' : '#f0fdf4'};border:1px solid ${desconto.houve ? '#fecaca' : '#bbf7d0'};border-radius:12px;padding:12px 16px;margin-bottom:20px;font-size:13px;color:${desconto.houve ? '#991b1b' : '#166534'}">
      <strong>${desconto.houve ? 'Descontos deste período' : 'Descontos'}:</strong> ${desconto.texto}
    </div>
    ${(linha.valesPendentes || linha.valesNoPeriodo || 0) > 0 ? `
    <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:12px;padding:12px 16px;margin-bottom:20px;font-size:12px;color:#9a3412">
      <strong>Vale = adiantamento:</strong> parte do pagamento (${tipoLabel.toLowerCase()}) já entregue ao funcionário antes do fechamento do ciclo.
      Esse valor reduz o que ainda falta pagar neste período.
    </div>` : ''}
    <h2 style="font-size:13px;margin-bottom:8px">Registros do período</h2>
    ${regs
      ? `<table><thead><tr><th>Data</th><th>Status</th><th>Obs.</th></tr></thead><tbody>${regs}</tbody></table>`
      : '<p style="color:#888;font-size:12px">Nenhum registro manual — dias úteis até hoje foram contados automaticamente.</p>'}
    <div style="margin-top:48px;display:grid;grid-template-columns:1fr 1fr;gap:40px">
      <div style="text-align:center;border-top:1px solid #d1d5db;padding-top:8px;font-size:12px;color:#9ca3af">Assinatura do funcionário</div>
      <div style="text-align:center;border-top:1px solid #d1d5db;padding-top:8px;font-size:12px;color:#9ca3af">${d.assinaturaEmpresa}</div>
    </div>
    <div class="rodape">${d.rodape}</div>
    <div style="position:fixed;bottom:24px;right:24px">
      <button onclick="window.print()" style="background:#d4891a;color:#fff;border:none;padding:12px 24px;border-radius:12px;font-weight:700;cursor:pointer">Imprimir / Salvar PDF</button>
    </div>
  </body></html>`)
  win.document.close()
}

export async function gerarPdfFolhaIndividual(opts: FolhaIndividualOpts): Promise<File> {
  const { linha, relatorio, empresa = {}, cargoLabel, tipoLabel } = opts
  const d = montarDadosRelatorio(empresa)
  const f = linha.funcionario
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const pageW = doc.internal.pageSize.getWidth()
  const pageH = doc.internal.pageSize.getHeight()
  const m = 16
  let y = m

  const garantir = (h: number) => {
    if (y + h > pageH - 18) {
      doc.addPage()
      y = m
    }
  }

  if (d.logo && d.logo.startsWith('data:image')) {
    try {
      doc.addImage(d.logo, d.logo.includes('png') ? 'PNG' : 'JPEG', m, y, 16, 16)
    } catch { /* ignore */ }
  }
  const tx = d.logo ? m + 20 : m
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.setTextColor(26, 28, 34)
  doc.text(d.nome, tx, y + 6)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(107, 114, 128)
  const cab = [d.slogan, d.documentos.join(' · '), ...d.contatoLinhas].filter(Boolean)
  if (cab.length) doc.text(cab.join('\n'), tx, y + 11)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(156, 163, 175)
  doc.text('RELATÓRIO INDIVIDUAL', pageW - m, y + 5, { align: 'right' })
  doc.setFontSize(12)
  doc.setTextColor(212, 137, 26)
  doc.text('Folha de pagamento', pageW - m, y + 12, { align: 'right' })
  y += 26
  doc.setDrawColor(26, 28, 34)
  doc.setLineWidth(0.6)
  doc.line(m, y, pageW - m, y)
  y += 10

  doc.setFontSize(16)
  doc.setTextColor(17, 24, 39)
  doc.text(f.nome, m, y)
  y += 6
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(107, 114, 128)
  doc.text(`${cargoLabel}  ·  ${tipoLabel}`, m, y)
  y += 5
  doc.text(`Período: ${periodoTxt(relatorio)}  ·  ${relatorio.diasUteisNoPeriodo} dias úteis`, m, y)
  y += 10

  const aReceber = linha.aReceber ?? Math.max(0,
    linha.valorLiquido - (linha.valesPendentes || 0) - (linha.descontosAvulsos || 0) - (linha.pagamentosJaFeitos || 0)
  )
  const desconto = resumoDescontos(linha)

  const cards: [string, string][] = [
    ['Trabalhados', `${linha.diasTrabalhados}d`],
    ['Extras', linha.diasExtras > 0 ? `+${linha.diasExtras}` : '—'],
    ['Faltas', String(linha.faltasTotal)],
    ['Valor do dia', fmt(linha.valorDia || f.valorDiaria)],
    ['Bruto', fmt(linha.valorBruto)],
    ['Desconto por faltas', desconto.faltas > 0 ? `− ${fmt(desconto.faltas)}` : 'Não houve'],
    ['Outros descontos', desconto.outros > 0 ? `− ${fmt(desconto.outros)}` : 'Não houve'],
    ['Vale (adiant.)', (linha.valesPendentes || 0) > 0 ? `− ${fmt(linha.valesPendentes)}` : '—'],
    ['A receber', fmt(aReceber)],
  ]
  const cardW = (pageW - m * 2 - 12) / 4
  cards.forEach((c, i) => {
    const col = i % 4
    const row = Math.floor(i / 4)
    const x = m + col * (cardW + 4)
    const cy = y + row * 18
    doc.setFillColor(249, 249, 247)
    doc.roundedRect(x, cy, cardW, 16, 2, 2, 'F')
    doc.setFontSize(7)
    doc.setTextColor(136, 136, 136)
    doc.text(c[0].toUpperCase(), x + 3, cy + 5)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.setTextColor(17, 24, 39)
    doc.text(c[1], x + 3, cy + 12)
    doc.setFont('helvetica', 'normal')
  })
  y += Math.ceil(cards.length / 4) * 18 + 8

  doc.setFontSize(9)
  doc.setTextColor(55, 65, 81)
  const formula = [
    `${linha.diasTrabalhados} dias × ${fmt(linha.valorDia || f.valorDiaria)} = ${fmt(linha.valorBruto)}`,
    (linha.valesPendentes || 0) > 0 ? `vale (adiant.) − ${fmt(linha.valesPendentes)}` : '',
  ].filter(Boolean).join('  ·  ')
  doc.text(formula, m, y)
  y += 6
  garantir(10)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  if (desconto.houve) doc.setTextColor(153, 27, 27)
  else doc.setTextColor(22, 101, 52)
  const avisoDesc = doc.splitTextToSize(desconto.texto, pageW - m * 2)
  doc.text(avisoDesc, m, y)
  doc.setFont('helvetica', 'normal')
  y += avisoDesc.length * 4 + 4
  if ((linha.valesPendentes || linha.valesNoPeriodo || 0) > 0) {
    garantir(12)
    doc.setFontSize(8)
    doc.setTextColor(154, 52, 18)
    const aviso = doc.splitTextToSize(
      'Vale = adiantamento: parte do pagamento já entregue antes do fechamento. Reduz o valor a receber neste período.',
      pageW - m * 2
    )
    doc.text(aviso, m, y)
    y += aviso.length * 4 + 4
  }
  y += 4

  garantir(16)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(17, 24, 39)
  doc.text('Registros do período', m, y)
  y += 5
  doc.setFillColor(26, 28, 34)
  doc.rect(m, y, pageW - m * 2, 8, 'F')
  doc.setFontSize(8)
  doc.setTextColor(212, 137, 26)
  doc.text('DATA', m + 3, y + 5.2)
  doc.text('STATUS', m + 45, y + 5.2)
  doc.text('OBS.', m + 85, y + 5.2)
  y += 8

  const regs = linha.registros || []
  if (regs.length === 0) {
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(156, 163, 175)
    doc.text('Nenhum registro manual — dias úteis até hoje foram contados automaticamente.', m + 3, y + 6)
    y += 12
  } else {
    doc.setFont('helvetica', 'normal')
    regs.forEach((r, i) => {
      garantir(8)
      if (i % 2 === 0) {
        doc.setFillColor(250, 250, 249)
        doc.rect(m, y, pageW - m * 2, 7, 'F')
      }
      doc.setFontSize(8)
      doc.setTextColor(17, 24, 39)
      doc.text(fmtData(r.data), m + 3, y + 5)
      doc.text(STATUS_TXT[r.status] || r.status, m + 45, y + 5)
      const obs = `${r.motivo || ''}${r.descontar === false && r.status !== 'TRABALHADO' ? ' (sem desconto)' : ''}`.trim()
      if (obs) {
        const lines = doc.splitTextToSize(obs, pageW - m * 2 - 90)
        doc.text(lines, m + 85, y + 5)
      }
      y += 7
    })
  }

  garantir(28)
  y += 16
  const colW = (pageW - m * 2 - 20) / 2
  doc.setDrawColor(209, 213, 219)
  doc.line(m, y, m + colW, y)
  doc.line(pageW - m - colW, y, pageW - m, y)
  doc.setFontSize(8)
  doc.setTextColor(156, 163, 175)
  doc.text('Assinatura do funcionário', m + colW / 2, y + 6, { align: 'center' })
  doc.text(d.assinaturaEmpresa, pageW - m - colW / 2, y + 6, { align: 'center' })

  const pages = doc.getNumberOfPages()
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setTextColor(156, 163, 175)
    doc.text(d.rodape, pageW / 2, pageH - 10, { align: 'center' })
  }

  const blob = doc.output('blob')
  return new File([blob], nomeArquivo(linha, relatorio), { type: 'application/pdf' })
}

export function mensagemFolhaWhatsApp(opts: FolhaIndividualOpts) {
  const { linha, empresa = {} } = opts
  const d = montarDadosRelatorio(empresa)
  return [
    `Olá, ${linha.funcionario.nome}!`,
    '',
    `Segue o relatório da sua folha de pagamento.`,
    `Período: ${periodoTxt(opts.relatorio)}`,
    `A receber: ${fmt(linha.aReceber ?? Math.max(0, linha.valorLiquido - (linha.valesPendentes || 0) - (linha.descontosAvulsos || 0) - (linha.pagamentosJaFeitos || 0)))}`,
    resumoDescontos(linha).texto,
    (linha.valesPendentes || 0) > 0 ? `Vale (adiantamento já recebido): − ${fmt(linha.valesPendentes)}` : '',
    '',
    'Anexe o PDF que acabou de ser baixado neste aparelho.',
    '',
    d.nome,
  ].filter(Boolean).join('\n')
}

export async function enviarFolhaWhatsApp(opts: FolhaIndividualOpts, conversaAberta = false) {
  const { linha } = opts
  if (!telefoneWhatsApp(linha.funcionario)) {
    throw new Error('Cadastre o celular do funcionário para enviar no WhatsApp.')
  }
  const file = await gerarPdfFolhaIndividual(opts)
  return enviarArquivoWhatsApp({
    pessoa: linha.funcionario,
    file,
    texto: mensagemFolhaWhatsApp(opts),
    titulo: `Folha — ${linha.funcionario.nome}`,
    conversaAberta,
  })
}

export { abrirWhatsApp, telefoneWhatsApp }
