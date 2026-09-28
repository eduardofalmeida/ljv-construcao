import { jsPDF } from 'jspdf'
import type { Orcamento } from '../types'
import { montarDadosRelatorio, type ConfigMap } from './dadosRelatorio'

function fmt(v?: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0)
}

function fmtData(d?: string) {
  if (!d) return '—'
  return new Date(d + 'T00:00:00').toLocaleDateString('pt-BR')
}

function esc(s?: string) {
  if (!s) return ''
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/\n/g, '<br/>')
}

export function imprimirOrcamento(orc: Orcamento, empresa: ConfigMap = {}) {
  const win = window.open('', '_blank', 'width=900,height=700')
  if (!win) return

  const d = montarDadosRelatorio(empresa)

  const itens = orc.itens || []
  const itensHTML = itens.length > 0
    ? itens.map((item, i) => `
      <tr style="background:${i % 2 === 0 ? '#fafaf9' : '#fff'}">
        <td style="padding:10px 12px">
          <div style="font-size:13px;font-weight:600;color:#111827">${esc(item.descricao)}</div>
          ${item.observacao ? `<div style="font-size:11px;color:#6b7280;margin-top:3px">${esc(item.observacao)}</div>` : ''}
        </td>
        <td style="padding:10px 12px;font-size:13px;color:#374151;text-align:center">${esc(item.unidade) || '—'}</td>
        <td style="padding:10px 12px;font-size:13px;color:#374151;text-align:right">${item.quantidade}</td>
        <td style="padding:10px 12px;font-size:13px;color:#374151;text-align:right">${fmt(item.valorUnitario)}</td>
        <td style="padding:10px 12px;font-size:13px;font-weight:700;color:#111827;text-align:right">${fmt(item.valorTotal)}</td>
      </tr>
    `).join('')
    : `<tr><td colspan="5" style="padding:20px;text-align:center;color:#9ca3af;font-size:13px">Nenhum item cadastrado</td></tr>`

  const logoHTML = d.logo
    ? `<img src="${d.logo}" alt="${esc(d.nome)}" style="width:64px;height:64px;object-fit:cover;border-radius:12px;border:1px solid #e5e7eb"/>`
    : `<div style="width:64px;height:64px;border-radius:12px;background:#1a1c22;color:#d4891a;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:24px">${esc(d.nome).charAt(0)}</div>`

  const bloco = (titulo: string, texto?: string) => texto
    ? `<div style="background:#f9fafb;border-radius:12px;padding:16px;margin-bottom:16px">
        <div style="font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#9ca3af;margin-bottom:8px">${esc(titulo)}</div>
        <div style="font-size:13px;color:#374151;line-height:1.6">${esc(texto)}</div>
      </div>`
    : ''

  const pagamentoLinhas = [
    orc.formaPagamento ? `<div><strong>Formas:</strong> ${esc(orc.formaPagamento.split(',').join(', '))}</div>` : '',
    orc.entradaPercentual ? `<div><strong>Entrada:</strong> ${orc.entradaPercentual}%</div>` : '',
    orc.numeroParcelas && orc.numeroParcelas > 1 ? `<div><strong>Parcelas:</strong> ${orc.numeroParcelas}x</div>` : '',
    orc.condicoesPagamento ? `<div style="margin-top:6px">${esc(orc.condicoesPagamento)}</div>` : '',
  ].filter(Boolean).join('')

  const cabecalhoContato = [
    d.documentos.length ? d.documentos.map(esc).join(' · ') : '',
    ...d.contatoLinhas.map(esc),
  ].filter(Boolean).join('<br/>')

  win.document.write(`<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8"/>
  <title>${esc(d.tituloDocumento)} ${orc.numero || ''} — ${esc(d.nome)}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Inter', Arial, sans-serif; color: #111827; background: #fff; }
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .no-print { display: none !important; }
      @page { margin: 14mm; }
    }
    .page { max-width: 800px; margin: 0 auto; padding: 40px 32px; }
    table { width: 100%; border-collapse: collapse; }
  </style>
</head>
<body>
<div class="page">

  <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:24px;margin-bottom:36px;padding-bottom:24px;border-bottom:2px solid #1a1c22">
    <div style="display:flex;gap:14px;align-items:flex-start">
      ${logoHTML}
      <div>
        <div style="font-size:22px;font-weight:900;color:#1a1c22;letter-spacing:-0.5px">${esc(d.nome)}</div>
        ${d.slogan ? `<div style="font-size:10px;font-weight:600;letter-spacing:3px;text-transform:uppercase;color:#9ca3af;margin-top:2px">${esc(d.slogan)}</div>` : ''}
        ${cabecalhoContato ? `<div style="margin-top:10px;font-size:12px;color:#6b7280;line-height:1.6">${cabecalhoContato}</div>` : ''}
      </div>
    </div>
    <div style="text-align:right;flex-shrink:0">
      <div style="font-size:11px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:#9ca3af">${esc(d.tituloDocumento)}</div>
      <div style="font-size:22px;font-weight:900;color:#d4891a;margin-top:4px">${esc(orc.numero) || '—'}</div>
      <div style="margin-top:8px;font-size:12px;color:#6b7280">
        Data: ${fmtData(orc.criadoEm?.slice(0, 10) || new Date().toISOString().slice(0, 10))}<br/>
        ${orc.dataValidade ? `Válido até: ${fmtData(orc.dataValidade)}` : ''}
      </div>
    </div>
  </div>

  <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:28px">
    <div style="background:#f9fafb;border-radius:12px;padding:16px">
      <div style="font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#9ca3af;margin-bottom:8px">Cliente</div>
      <div style="font-size:16px;font-weight:700;color:#111827">${esc(orc.cliente?.nome) || '—'}</div>
    </div>
    <div style="background:#f9fafb;border-radius:12px;padding:16px">
      <div style="font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#9ca3af;margin-bottom:8px">Local</div>
      <div style="font-size:14px;font-weight:600;color:#111827">${esc(orc.localServico || orc.obra?.nome || orc.titulo)}</div>
    </div>
  </div>

  <div style="margin-bottom:24px">
    <div style="font-size:20px;font-weight:800;color:#111827;margin-bottom:8px">${esc(orc.titulo)}</div>
    ${orc.descricao ? `<div style="font-size:13px;color:#6b7280;line-height:1.6">${esc(orc.descricao)}</div>` : ''}
  </div>

  ${(orc.prazoExecucao || orc.garantia) ? `
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:24px">
    ${orc.prazoExecucao ? `<div style="border:1px solid #e5e7eb;border-radius:12px;padding:12px 16px"><div style="font-size:10px;color:#9ca3af;text-transform:uppercase;font-weight:700">Prazo</div><div style="font-weight:700;margin-top:4px">${esc(orc.prazoExecucao)}</div></div>` : ''}
    ${orc.garantia ? `<div style="border:1px solid #e5e7eb;border-radius:12px;padding:12px 16px"><div style="font-size:10px;color:#9ca3af;text-transform:uppercase;font-weight:700">Garantia</div><div style="font-weight:700;margin-top:4px">${esc(orc.garantia)}</div></div>` : ''}
  </div>` : ''}

  <div style="margin-bottom:24px">
    <table>
      <thead>
        <tr style="background:#1a1c22">
          <th style="padding:12px;font-size:11px;font-weight:600;letter-spacing:1px;text-transform:uppercase;color:#d4891a;text-align:left">Descrição</th>
          <th style="padding:12px;font-size:11px;font-weight:600;letter-spacing:1px;text-transform:uppercase;color:#d4891a;text-align:center">Unid.</th>
          <th style="padding:12px;font-size:11px;font-weight:600;letter-spacing:1px;text-transform:uppercase;color:#d4891a;text-align:right">Qtd.</th>
          <th style="padding:12px;font-size:11px;font-weight:600;letter-spacing:1px;text-transform:uppercase;color:#d4891a;text-align:right">Valor unit.</th>
          <th style="padding:12px;font-size:11px;font-weight:600;letter-spacing:1px;text-transform:uppercase;color:#d4891a;text-align:right">Total</th>
        </tr>
      </thead>
      <tbody>${itensHTML}</tbody>
    </table>
  </div>

  <div style="display:flex;justify-content:flex-end;margin-bottom:28px">
    <div style="min-width:280px">
      <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #e5e7eb">
        <span style="font-size:13px;color:#6b7280">Subtotal</span>
        <span style="font-size:13px;font-weight:600;color:#111827">${fmt(orc.valorTotal)}</span>
      </div>
      ${orc.desconto ? `
      <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #e5e7eb">
        <span style="font-size:13px;color:#6b7280">Desconto</span>
        <span style="font-size:13px;font-weight:600;color:#ef4444">−${fmt(orc.desconto)}</span>
      </div>` : ''}
      <div style="display:flex;justify-content:space-between;background:#fef3e2;border-radius:8px;margin-top:4px;padding:12px 16px">
        <span style="font-size:15px;font-weight:800;color:#1a1c22">TOTAL</span>
        <span style="font-size:20px;font-weight:900;color:#d4891a">${fmt(orc.valorFinal || orc.valorTotal)}</span>
      </div>
    </div>
  </div>

  ${pagamentoLinhas ? `
  <div style="background:#f9fafb;border-radius:12px;padding:16px;margin-bottom:16px">
    <div style="font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#9ca3af;margin-bottom:8px">Pagamento</div>
    <div style="font-size:13px;color:#374151;line-height:1.7">${pagamentoLinhas}</div>
  </div>` : ''}

  ${bloco('O que está incluso', orc.incluso)}
  ${bloco('O que não está incluso', orc.naoIncluso)}
  ${bloco('Observações', orc.observacoes)}

  <div style="margin-top:48px;display:grid;grid-template-columns:1fr 1fr;gap:40px">
    <div style="text-align:center">
      <div style="border-top:1px solid #d1d5db;padding-top:8px;font-size:12px;color:#9ca3af">${esc(d.assinaturaCliente)}</div>
      <div style="font-size:11px;color:#d1d5db;margin-top:2px">${esc(orc.cliente?.nome)}</div>
    </div>
    <div style="text-align:center">
      <div style="border-top:1px solid #d1d5db;padding-top:8px;font-size:12px;color:#9ca3af">${esc(d.assinaturaEmpresa)}</div>
      <div style="font-size:11px;color:#d1d5db;margin-top:2px">${esc(d.responsavel) || esc(d.cargoAssinatura)}</div>
    </div>
  </div>

  <div style="margin-top:40px;padding-top:16px;border-top:1px solid #e5e7eb;text-align:center;font-size:11px;color:#9ca3af;line-height:1.6">
    ${esc(d.rodape)}
  </div>

</div>

<div class="no-print" style="position:fixed;bottom:24px;right:24px">
  <button onclick="window.print()" style="background:#d4891a;color:#fff;border:none;padding:12px 24px;border-radius:12px;font-size:14px;font-weight:700;cursor:pointer;box-shadow:0 4px 16px rgba(212,137,26,0.4)">
    Imprimir / Salvar PDF
  </button>
</div>
</body>
</html>`)

  win.document.close()
}

function nomeArquivoPdf(orc: Orcamento) {
  const numero = (orc.numero || 'orcamento').replace(/[^\w.-]+/g, '_')
  const cliente = (orc.cliente?.nome || '').replace(/[^\w.-]+/g, '_').slice(0, 40)
  return cliente ? `${numero}-${cliente}.pdf` : `${numero}.pdf`
}

export async function gerarArquivoPdfOrcamento(orc: Orcamento, empresa: ConfigMap = {}): Promise<File> {
  const d = montarDadosRelatorio(empresa)
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const pageW = doc.internal.pageSize.getWidth()
  const pageH = doc.internal.pageSize.getHeight()
  const m = 16
  let y = m

  const garantirEspaco = (h: number) => {
    if (y + h > pageH - 18) {
      doc.addPage()
      y = m
    }
  }

  if (d.logo && d.logo.startsWith('data:image')) {
    try {
      const fmt = d.logo.includes('image/png') ? 'PNG' : 'JPEG'
      doc.addImage(d.logo, fmt, m, y, 16, 16)
    } catch { /* logo inválido */ }
  }

  const textoX = d.logo ? m + 20 : m
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.setTextColor(26, 28, 34)
  doc.text(d.nome, textoX, y + 6)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(107, 114, 128)
  const cabecalho = [
    d.slogan,
    d.documentos.join(' · '),
    ...d.contatoLinhas,
  ].filter(Boolean)
  if (cabecalho.length) {
    doc.text(cabecalho.join('\n'), textoX, y + 11)
  }

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(156, 163, 175)
  doc.text(d.tituloDocumento.toUpperCase(), pageW - m, y + 5, { align: 'right' })
  doc.setFontSize(14)
  doc.setTextColor(212, 137, 26)
  doc.text(orc.numero || '—', pageW - m, y + 12, { align: 'right' })

  y += 28
  doc.setDrawColor(26, 28, 34)
  doc.setLineWidth(0.6)
  doc.line(m, y, pageW - m, y)
  y += 8

  doc.setFontSize(9)
  doc.setTextColor(156, 163, 175)
  doc.text('CLIENTE', m, y)
  doc.text('LOCAL', pageW / 2, y)
  y += 5
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(17, 24, 39)
  doc.text(orc.cliente?.nome || '—', m, y)
  const localLinhas = doc.splitTextToSize(orc.localServico || orc.obra?.nome || orc.titulo, (pageW / 2) - m - 4)
  doc.text(localLinhas, pageW / 2, y)
  y += Math.max(10, localLinhas.length * 5)

  doc.setFontSize(13)
  doc.text(orc.titulo, m, y)
  y += 6
  if (orc.descricao) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(107, 114, 128)
    const desc = doc.splitTextToSize(orc.descricao, pageW - m * 2)
    doc.text(desc, m, y)
    y += desc.length * 4.2 + 4
  }

  doc.setFontSize(8)
  doc.setTextColor(107, 114, 128)
  doc.text(`Data: ${fmtData(orc.criadoEm?.slice(0, 10) || new Date().toISOString().slice(0, 10))}`, m, y)
  if (orc.dataValidade) doc.text(`Válido até: ${fmtData(orc.dataValidade)}`, m + 55, y)
  y += 8

  const cols = [m, m + 92, m + 108, m + 128, m + 150]
  const desenharCabecalhoTabela = () => {
    doc.setFillColor(26, 28, 34)
    doc.rect(m, y, pageW - m * 2, 8, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.setTextColor(212, 137, 26)
    doc.text('DESCRIÇÃO', cols[0] + 2, y + 5.2)
    doc.text('UNID.', cols[1], y + 5.2)
    doc.text('QTD.', cols[2], y + 5.2)
    doc.text('UNIT.', cols[3], y + 5.2)
    doc.text('TOTAL', pageW - m - 2, y + 5.2, { align: 'right' })
    y += 8
  }

  desenharCabecalhoTabela()
  const itens = orc.itens || []
  doc.setFont('helvetica', 'normal')
  itens.forEach((item, i) => {
    const desc = doc.splitTextToSize(item.descricao + (item.observacao ? `\n${item.observacao}` : ''), 88)
    const h = Math.max(8, desc.length * 4 + 4)
    if (y + h > pageH - 28) {
      doc.addPage()
      y = m
      desenharCabecalhoTabela()
    }
    if (i % 2 === 0) {
      doc.setFillColor(250, 250, 249)
      doc.rect(m, y, pageW - m * 2, h, 'F')
    }
    doc.setFontSize(8)
    doc.setTextColor(17, 24, 39)
    doc.text(desc, cols[0] + 2, y + 4)
    doc.text(item.unidade || '—', cols[1], y + 4)
    doc.text(String(item.quantidade), cols[2], y + 4)
    doc.text(fmt(item.valorUnitario), cols[3], y + 4)
    doc.setFont('helvetica', 'bold')
    doc.text(fmt(item.valorTotal), pageW - m - 2, y + 4, { align: 'right' })
    doc.setFont('helvetica', 'normal')
    y += h
  })

  y += 6
  garantirEspaco(28)
  const boxX = pageW - m - 70
  doc.setFontSize(9)
  doc.setTextColor(107, 114, 128)
  doc.text('Subtotal', boxX, y)
  doc.setTextColor(17, 24, 39)
  doc.text(fmt(orc.valorTotal), pageW - m, y, { align: 'right' })
  y += 6
  if (orc.desconto) {
    doc.setTextColor(239, 68, 68)
    doc.text('Desconto', boxX, y)
    doc.text(`-${fmt(orc.desconto)}`, pageW - m, y, { align: 'right' })
    y += 6
  }
  doc.setFillColor(254, 243, 226)
  doc.roundedRect(boxX - 4, y - 4, 74, 12, 2, 2, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(26, 28, 34)
  doc.text('TOTAL', boxX, y + 4)
  doc.setTextColor(212, 137, 26)
  doc.text(fmt(orc.valorFinal || orc.valorTotal), pageW - m, y + 4, { align: 'right' })
  y += 16

  const bloco = (titulo: string, texto?: string) => {
    if (!texto) return
    const lines = doc.splitTextToSize(texto, pageW - m * 2 - 6)
    garantirEspaco(12 + lines.length * 4)
    doc.setFillColor(249, 250, 251)
    doc.roundedRect(m, y, pageW - m * 2, 8 + lines.length * 4, 2, 2, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.setTextColor(156, 163, 175)
    doc.text(titulo.toUpperCase(), m + 3, y + 5)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(55, 65, 81)
    doc.text(lines, m + 3, y + 10)
    y += 12 + lines.length * 4
  }

  bloco('Pagamento', [
    orc.formaPagamento ? `Formas: ${orc.formaPagamento.split(',').join(', ')}` : '',
    orc.entradaPercentual ? `Entrada: ${orc.entradaPercentual}%` : '',
    orc.numeroParcelas && orc.numeroParcelas > 1 ? `Parcelas: ${orc.numeroParcelas}x` : '',
    orc.condicoesPagamento || '',
  ].filter(Boolean).join('\n'))
  bloco('O que está incluso', orc.incluso)
  bloco('O que não está incluso', orc.naoIncluso)
  bloco('Observações', orc.observacoes)

  garantirEspaco(28)
  y += 10
  const colW = (pageW - m * 2 - 20) / 2
  doc.setDrawColor(209, 213, 219)
  doc.line(m, y, m + colW, y)
  doc.line(pageW - m - colW, y, pageW - m, y)
  doc.setFontSize(8)
  doc.setTextColor(156, 163, 175)
  doc.text(d.assinaturaCliente, m + colW / 2, y + 5, { align: 'center' })
  doc.text(d.assinaturaEmpresa, pageW - m - colW / 2, y + 5, { align: 'center' })
  doc.setFontSize(7)
  doc.text(orc.cliente?.nome || '', m + colW / 2, y + 9, { align: 'center' })
  doc.text(d.responsavel || d.cargoAssinatura, pageW - m - colW / 2, y + 9, { align: 'center' })

  const pages = doc.getNumberOfPages()
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setTextColor(156, 163, 175)
    doc.text(d.rodape, pageW / 2, pageH - 10, { align: 'center' })
  }

  const blob = doc.output('blob')
  return new File([blob], nomeArquivoPdf(orc), { type: 'application/pdf' })
}
