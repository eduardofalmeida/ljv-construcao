import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  ArrowLeft, Edit2, Calendar, MapPin, Users,
  Plus, Trash2, Sun, Cloud, CloudRain, Wind, CloudSun,
  BookOpen, ChevronDown, ChevronUp, User, Banknote, CheckCircle, Clock,
  Wrench, Wallet, ListChecks, RotateCcw
} from 'lucide-react'
import api from '../../services/api'
import type {
  Obra, DiarioObra, StatusObra, RecebimentoObra, ResumoRecebimentoObra,
  PeriodicidadePagamentoObra, AditivoObra, TipoRecebimentoObra, CategoriaAditivo,
  ItemObra
} from '../../types'
import Modal from '../../components/ui/Modal'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import toast from 'react-hot-toast'
import clsx from 'clsx'
import { maskCurrency } from '../../utils/masks'

// ─── Utils ───────────────────────────────────────────────────
const statusConfig: Record<StatusObra, { label: string; cor: string; bg: string }> = {
  ORCAMENTO:    { label: 'Orçamento',    cor: 'text-gray-600',   bg: 'bg-gray-100' },
  APROVADA:     { label: 'Aprovada',     cor: 'text-blue-700',   bg: 'bg-blue-100' },
  EM_ANDAMENTO: { label: 'Em andamento', cor: 'text-accent-700', bg: 'bg-accent-100' },
  PAUSADA:      { label: 'Pausada',      cor: 'text-yellow-700', bg: 'bg-yellow-100' },
  CONCLUIDA:    { label: 'Concluída',    cor: 'text-emerald-700',bg: 'bg-emerald-100' },
  CANCELADA:    { label: 'Cancelada',    cor: 'text-red-600',    bg: 'bg-red-100' },
}

function fmt(v?: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0)
}
function fmtData(d?: string) {
  if (!d) return '—'
  return new Date(d + 'T00:00:00').toLocaleDateString('pt-BR')
}

const PERIODICIDADE: Record<PeriodicidadePagamentoObra, string> = {
  SEMANAL: 'Semanal',
  QUINZENAL: 'Quinzenal',
  MENSAL: 'Mensal',
  UNICO: 'Pagamento único',
}

const TIPOS_PAG: Record<TipoRecebimentoObra, string> = {
  ENTRADA: 'Entrada',
  PARCELA: 'Parcela / ciclo',
  SALDO: 'Saldo final',
  ADITIVO: 'Pagamento de extra',
  OUTRO: 'Outro',
}

const CATEGORIA_ADITIVO: Record<CategoriaAditivo, string> = {
  SERVICO_EXTRA: 'Serviço extra',
  MATERIAL: 'Material extra',
  ALTERACAO: 'Alteração de projeto',
  OUTRO: 'Outro',
}

const UNIDADES = ['vb', 'un', 'm²', 'm', 'm³', 'kg', 'h', 'pç', 'lt']

function parseMoeda(raw: string) {
  const digits = raw.replace(/\D/g, '')
  return digits ? Number(digits) / 100 : 0
}

function hojeISO() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const climaIcons: Record<string, React.ElementType> = {
  'Ensolarado': Sun,
  'Nublado': Cloud,
  'Chuvoso': CloudRain,
  'Ventoso': Wind,
  'Parcialmente nublado': CloudSun,
}

// ─── Form Diário ─────────────────────────────────────────────
function FormDiario({ obraId, diario, onSalvar, onFechar }: {
  obraId: number
  diario: Partial<DiarioObra> | null
  onSalvar: () => void
  onFechar: () => void
}) {
  const hoje = new Date().toISOString().split('T')[0]
  const [form, setForm] = useState<Partial<DiarioObra>>(
    diario || { data: hoje, trabalhadores: 0 }
  )
  const [salvando, setSalvando] = useState(false)

  const set = (campo: keyof DiarioObra, valor: unknown) =>
    setForm(f => ({ ...f, [campo]: valor }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.data) return toast.error('Data é obrigatória')
    setSalvando(true)
    try {
      if (form.id) {
        await api.put(`/obras/${obraId}/diario/${form.id}`, form)
        toast.success('Registro atualizado!')
      } else {
        await api.post(`/obras/${obraId}/diario`, form)
        toast.success('Registro adicionado!')
      }
      onSalvar()
    } catch {
      toast.error('Erro ao salvar registro')
    } finally {
      setSalvando(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="label">Data *</label>
          <input type="date" className="input" value={form.data || ''} onChange={e => set('data', e.target.value)} required />
        </div>
        <div>
          <label className="label">Trabalhadores presentes</label>
          <div className="relative">
            <input
              type="number"
              min="0"
              className="input pr-14"
              placeholder="0"
              value={form.trabalhadores ?? ''}
              onChange={e => set('trabalhadores', Number(e.target.value))}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-primary-400 pointer-events-none">pessoas</span>
          </div>
        </div>
        <div className="sm:col-span-2">
          <label className="label">Clima</label>
          <div className="flex flex-wrap gap-2">
            {Object.keys(climaIcons).map((c) => {
              const Icon = climaIcons[c]
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => set('clima', form.clima === c ? '' : c)}
                  className={clsx(
                    'flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium border transition-all',
                    form.clima === c
                      ? 'bg-primary-900 text-white border-primary-900'
                      : 'bg-white text-primary-600 border-stone-200 hover:border-primary-300'
                  )}
                >
                  <Icon size={14} />
                  {c}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      <div>
        <label className="label">Atividades executadas</label>
        <textarea className="input min-h-[80px] resize-none" placeholder="O que foi feito hoje..." value={form.atividades || ''} onChange={e => set('atividades', e.target.value)} />
      </div>
      <div>
        <label className="label">Observações / Problemas</label>
        <textarea className="input min-h-[70px] resize-none" placeholder="Atrasos, falta de material, ocorrências..." value={form.observacoes || ''} onChange={e => set('observacoes', e.target.value)} />
      </div>

      <div className="modal-actions">
        <button type="button" onClick={onFechar} className="flex-1 btn-outline">Cancelar</button>
        <button type="submit" disabled={salvando} className="flex-1 btn-primary">
          {salvando ? 'Salvando...' : form.id ? 'Atualizar' : 'Registrar dia'}
        </button>
      </div>
    </form>
  )
}

// ─── Card Diário ─────────────────────────────────────────────
function CardDiario({ d, onEditar, onRemover }: {
  d: DiarioObra
  onEditar: () => void
  onRemover: () => void
}) {
  const [expandido, setExpandido] = useState(false)
  const ClimaIcon = d.clima ? (climaIcons[d.clima] ?? Sun) : null
  const dataObj = new Date(d.data + 'T00:00:00')

  return (
    <div className="card overflow-hidden">
      {/* ── Linha principal (clicável) ── */}
      <div
        className="flex items-stretch cursor-pointer hover:bg-stone-50 transition-colors"
        onClick={() => setExpandido(!expandido)}
      >
        {/* Coluna de data */}
        <div className="flex-shrink-0 w-14 bg-stone-900 flex flex-col items-center justify-center py-3 px-1">
          <div className="text-2xl font-black text-white leading-none">{dataObj.getDate()}</div>
          <div className="text-[9px] font-bold text-white/50 uppercase tracking-widest mt-0.5">
            {dataObj.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')}
          </div>
          <div className="text-[9px] text-white/30 mt-0.5">
            {dataObj.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '')}
          </div>
        </div>

        {/* Conteúdo principal */}
        <div className="flex-1 min-w-0 px-4 py-3">
          {/* Tags: clima + trabalhadores */}
          <div className="flex items-center gap-2 flex-wrap mb-1">
            {ClimaIcon && (
              <span className="flex items-center gap-1 text-xs text-primary-400 bg-stone-100 px-2 py-0.5 rounded-full">
                <ClimaIcon size={11} />
                {d.clima}
              </span>
            )}
            {(d.trabalhadores ?? 0) > 0 && (
              <span className="flex items-center gap-1 text-xs text-primary-400 bg-stone-100 px-2 py-0.5 rounded-full">
                <Users size={11} />
                {d.trabalhadores} {d.trabalhadores === 1 ? 'trabalhador' : 'trabalhadores'}
              </span>
            )}
          </div>

          {/* Resumo das atividades */}
          {d.atividades ? (
            <p className="text-sm font-medium text-primary-800 line-clamp-2 leading-snug">
              {d.atividades}
            </p>
          ) : (
            <p className="text-sm text-primary-300 italic">Sem descrição de atividades</p>
          )}

          {/* Indicador de observação */}
          {d.observacoes && !expandido && (
            <p className="text-xs text-primary-400 mt-1 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 flex-shrink-0" />
              Contém observações
            </p>
          )}
        </div>

        {/* Ações + chevron */}
        <div className="flex-shrink-0 flex items-center gap-0.5 pr-2">
          <button
            onClick={e => { e.stopPropagation(); onEditar() }}
            className="icon-btn"
            title="Editar"
            aria-label="Editar"
          >
            <Edit2 size={16} />
          </button>
          <button
            onClick={e => { e.stopPropagation(); onRemover() }}
            className="icon-btn-danger"
            title="Remover"
            aria-label="Remover"
          >
            <Trash2 size={16} />
          </button>
          <div className="p-2 text-primary-300">
            {expandido ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </div>
        </div>
      </div>

      {/* ── Conteúdo expandido ── */}
      {expandido && (
        <div className="border-t border-stone-100 px-5 py-4 space-y-3 bg-stone-50/60">
          {d.atividades && (
            <div>
              <p className="text-[10px] font-bold text-primary-400 uppercase tracking-wider mb-1.5">Atividades executadas</p>
              <p className="text-sm text-primary-700 whitespace-pre-wrap leading-relaxed">{d.atividades}</p>
            </div>
          )}
          {d.observacoes && (
            <div>
              <p className="text-[10px] font-bold text-primary-400 uppercase tracking-wider mb-1.5">Observações / Problemas</p>
              <p className="text-sm text-primary-600 whitespace-pre-wrap leading-relaxed">{d.observacoes}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

const FORMAS = ['Dinheiro', 'PIX', 'Transferência', 'Cheque', 'Cartão de débito', 'Cartão de crédito', 'Boleto']

function FormRecebimento({ obra, recebimento, onSalvar, onFechar }: {
  obra: Obra
  recebimento: Partial<RecebimentoObra> | null
  onSalvar: () => void
  onFechar: () => void
}) {
  const periodo = PERIODICIDADE[obra.periodicidadePagamento || 'SEMANAL']
  const [form, setForm] = useState<Partial<RecebimentoObra>>(recebimento || {
    data: hojeISO(),
    valor: obra.valorParcela || undefined,
    recebido: true,
    dataRecebimento: hojeISO(),
    tipo: obra.periodicidadePagamento === 'UNICO' ? 'ENTRADA' : 'PARCELA',
    referencia: `Pagamento ${periodo.toLowerCase()}`,
  })
  const [salvando, setSalvando] = useState(false)
  const set = (campo: keyof RecebimentoObra, valor: unknown) => setForm(f => ({ ...f, [campo]: valor }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.valor || form.valor <= 0) return toast.error('Informe o valor recebido')
    if (!form.data) return toast.error('Informe a data')
    setSalvando(true)
    try {
      const payload = {
        ...form,
        recebido: form.recebido !== false,
        dataRecebimento: form.recebido !== false ? (form.dataRecebimento || form.data) : null,
      }
      if (form.id) {
        await api.put(`/obras/${obra.id}/recebimentos/${form.id}`, payload)
        toast.success('Recebimento atualizado!')
      } else {
        await api.post(`/obras/${obra.id}/recebimentos`, payload)
        toast.success('Recebimento registrado!')
      }
      onSalvar()
    } catch {
      toast.error('Erro ao salvar recebimento')
    } finally {
      setSalvando(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="rounded-xl bg-emerald-50 border border-emerald-100 px-4 py-3 text-xs text-emerald-800">
        Cliente paga <strong>{periodo.toLowerCase()}</strong>
        {obra.valorParcela ? <> · parcela combinada <strong>{fmt(obra.valorParcela)}</strong></> : null}
        {obra.valorContrato ? <> · contrato {fmt(obra.valorContrato)}</> : null}
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="label">Valor recebido *</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-primary-400">R$</span>
            <input type="text" inputMode="decimal" className="input pl-9 text-lg font-black" placeholder="0,00"
              value={form.valor ? maskCurrency(form.valor) : ''}
              onChange={e => {
                const d = e.target.value.replace(/\D/g, '')
                set('valor', d ? Number(d) / 100 : undefined)
              }} />
          </div>
        </div>
        <div>
          <label className="label">Data de referência *</label>
          <input type="date" className="input" value={form.data || ''} onChange={e => set('data', e.target.value)} required />
        </div>
        <div className="sm:col-span-2">
          <label className="label">Referência</label>
          <input className="input" placeholder="Ex: Semana 08/09 a 14/09, Quinzena 1, Parcela 3"
            value={form.referencia || ''} onChange={e => set('referencia', e.target.value)} />
        </div>
        <div>
          <label className="label">Tipo</label>
          <select className="input" value={form.tipo || 'PARCELA'} onChange={e => set('tipo', e.target.value as TipoRecebimentoObra)}>
            {(Object.keys(TIPOS_PAG) as TipoRecebimentoObra[]).map(k => (
              <option key={k} value={k}>{TIPOS_PAG[k]}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Forma</label>
          <select className="input" value={form.formaPagamento || ''} onChange={e => set('formaPagamento', e.target.value)}>
            <option value="">Selecione...</option>
            {FORMAS.map(f => <option key={f} value={f}>{f}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Data em que entrou</label>
          <input type="date" className="input" value={form.dataRecebimento || ''} onChange={e => set('dataRecebimento', e.target.value)} />
        </div>
      </div>

      <div className="flex items-center gap-3 bg-stone-50 rounded-xl px-4 py-3">
        <input type="checkbox" id="recebido-obra" checked={form.recebido !== false}
          onChange={e => set('recebido', e.target.checked)} className="w-4 h-4 rounded border-stone-300" />
        <label htmlFor="recebido-obra" className="text-sm font-medium text-primary-700 cursor-pointer">
          Já recebi este valor (entra no financeiro da empresa)
        </label>
      </div>

      <div>
        <label className="label">Anotação</label>
        <textarea className="input min-h-[70px] resize-none" placeholder="Ex: PIX do João, ficou faltando R$ 200 para a próxima..."
          value={form.observacoes || ''} onChange={e => set('observacoes', e.target.value)} />
      </div>

      <div className="modal-actions">
        <button type="button" onClick={onFechar} className="flex-1 btn-outline">Cancelar</button>
        <button type="submit" disabled={salvando} className="flex-1 btn-primary">
          {salvando ? 'Salvando...' : form.id ? 'Atualizar' : 'Registrar'}
        </button>
      </div>
    </form>
  )
}

function FormAditivo({ obraId, aditivo, onSalvar, onFechar }: {
  obraId: number
  aditivo: Partial<AditivoObra> | null
  onSalvar: () => void
  onFechar: () => void
}) {
  const [form, setForm] = useState<Partial<AditivoObra>>(aditivo || {
    data: hojeISO(),
    unidade: 'vb',
    quantidade: 1,
    valorUnitario: 0,
    categoria: 'SERVICO_EXTRA',
    cobravel: true,
  })
  const [salvando, setSalvando] = useState(false)
  const set = (campo: keyof AditivoObra, valor: unknown) => setForm(f => ({ ...f, [campo]: valor }))

  const qtd = Number(form.quantidade) || 0
  const unit = Number(form.valorUnitario) || 0
  const total = qtd * unit

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.descricao?.trim()) return toast.error('Descreva o extra')
    if (total <= 0) return toast.error('Informe quantidade e valor')
    setSalvando(true)
    try {
      const payload = {
        ...form,
        quantidade: qtd,
        valorUnitario: unit,
        cobravel: form.cobravel !== false,
      }
      if (form.id) {
        await api.put(`/obras/${obraId}/aditivos/${form.id}`, payload)
        toast.success('Extra atualizado!')
      } else {
        await api.post(`/obras/${obraId}/aditivos`, payload)
        toast.success('Extra adicionado à obra!')
      }
      onSalvar()
    } catch {
      toast.error('Erro ao salvar extra')
    } finally {
      setSalvando(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="rounded-xl bg-amber-50 border border-amber-100 px-4 py-3 text-xs text-amber-900">
        Use para serviços, materiais ou mudanças que surgiram depois do orçamento. Se marcar para cobrar, o valor entra no total a receber do cliente.
      </div>

      <div>
        <label className="label">O que surgiu *</label>
        <input className="input" placeholder="Ex: Troca de piso do banheiro social"
          value={form.descricao || ''} onChange={e => set('descricao', e.target.value)} required />
      </div>
      <div>
        <label className="label">Detalhe</label>
        <input className="input" placeholder="Ex: Inclui demolição, material e mão de obra"
          value={form.observacao || ''} onChange={e => set('observacao', e.target.value)} />
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="label">Tipo</label>
          <select className="input" value={form.categoria || 'SERVICO_EXTRA'}
            onChange={e => set('categoria', e.target.value as CategoriaAditivo)}>
            {(Object.keys(CATEGORIA_ADITIVO) as CategoriaAditivo[]).map(k => (
              <option key={k} value={k}>{CATEGORIA_ADITIVO[k]}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Data</label>
          <input type="date" className="input" value={form.data || ''} onChange={e => set('data', e.target.value)} />
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div>
          <label className="label">Unidade</label>
          <select className="input" value={form.unidade || 'vb'} onChange={e => set('unidade', e.target.value)}>
            {UNIDADES.map(u => <option key={u} value={u}>{u}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Qtd</label>
          <input type="number" min="0" step="0.01" className="input"
            value={form.quantidade ?? ''} onChange={e => set('quantidade', Number(e.target.value))} />
        </div>
        <div>
          <label className="label">Valor unit.</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-primary-400">R$</span>
            <input type="text" inputMode="decimal" className="input pl-8"
              value={form.valorUnitario ? maskCurrency(form.valorUnitario) : ''}
              onChange={e => set('valorUnitario', parseMoeda(e.target.value))} />
          </div>
        </div>
        <div>
          <label className="label">Total</label>
          <div className="input bg-stone-50 font-bold text-primary-900 flex items-center">{fmt(total)}</div>
        </div>
      </div>

      <div>
        <label className="label">Quem pediu</label>
        <input className="input" placeholder="Ex: Cliente, engenheiro, fiscal da prefeitura..."
          value={form.solicitadoPor || ''} onChange={e => set('solicitadoPor', e.target.value)} />
      </div>

      <div className="flex items-center gap-3 bg-stone-50 rounded-xl px-4 py-3">
        <input type="checkbox" id="cobravel-aditivo" checked={form.cobravel !== false}
          onChange={e => set('cobravel', e.target.checked)} className="w-4 h-4 rounded border-stone-300" />
        <label htmlFor="cobravel-aditivo" className="text-sm font-medium text-primary-700 cursor-pointer">
          Cobrar do cliente (soma no total a receber)
        </label>
      </div>

      <div>
        <label className="label">Observações</label>
        <textarea className="input min-h-[70px] resize-none"
          placeholder="Combinado verbal, prazo, motivo da mudança..."
          value={form.observacoes || ''} onChange={e => set('observacoes', e.target.value)} />
      </div>

      <div className="modal-actions">
        <button type="button" onClick={onFechar} className="flex-1 btn-outline">Cancelar</button>
        <button type="submit" disabled={salvando} className="flex-1 btn-primary">
          {salvando ? 'Salvando...' : form.id ? 'Atualizar extra' : 'Adicionar extra'}
        </button>
      </div>
    </form>
  )
}

function FormItemObra({ obraId, item, onSalvar, onFechar }: {
  obraId: number
  item: Partial<ItemObra> | null
  onSalvar: () => void
  onFechar: () => void
}) {
  const [form, setForm] = useState<Partial<ItemObra>>(item || {
    unidade: 'vb',
    quantidade: 1,
    valorUnitario: 0,
  })
  const [salvando, setSalvando] = useState(false)
  const set = (campo: keyof ItemObra, valor: unknown) => setForm(f => ({ ...f, [campo]: valor }))
  const qtd = Number(form.quantidade) || 0
  const unit = Number(form.valorUnitario) || 0
  const total = qtd * unit

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.descricao?.trim()) return toast.error('Descreva o serviço')
    if (total < 0) return toast.error('Valor inválido')
    setSalvando(true)
    try {
      const payload = { ...form, quantidade: qtd, valorUnitario: unit }
      if (form.id) {
        await api.put(`/obras/${obraId}/itens/${form.id}`, payload)
        toast.success('Serviço atualizado!')
      } else {
        await api.post(`/obras/${obraId}/itens`, payload)
        toast.success('Serviço adicionado à obra!')
      }
      onSalvar()
    } catch {
      toast.error('Erro ao salvar serviço')
    } finally {
      setSalvando(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="rounded-xl bg-blue-50 border border-blue-100 px-4 py-3 text-xs text-blue-900">
        Este serviço entra no total a receber do cliente. Você pode alterar quantidade e valor a qualquer momento.
      </div>
      <div>
        <label className="label">Serviço *</label>
        <input className="input" placeholder="Ex: Pintura de paredes internas"
          value={form.descricao || ''} onChange={e => set('descricao', e.target.value)} required />
      </div>
      <div>
        <label className="label">Detalhe</label>
        <input className="input" placeholder="Ex: Inclui tinta e mão de obra"
          value={form.observacao || ''} onChange={e => set('observacao', e.target.value)} />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div>
          <label className="label">Unidade</label>
          <select className="input" value={form.unidade || 'vb'} onChange={e => set('unidade', e.target.value)}>
            {UNIDADES.map(u => <option key={u} value={u}>{u}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Qtd</label>
          <input type="number" min="0" step="0.01" className="input"
            value={form.quantidade ?? ''} onChange={e => set('quantidade', Number(e.target.value))} />
        </div>
        <div>
          <label className="label">Valor unit.</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-primary-400">R$</span>
            <input type="text" inputMode="decimal" className="input pl-8"
              value={form.valorUnitario ? maskCurrency(form.valorUnitario) : ''}
              onChange={e => set('valorUnitario', parseMoeda(e.target.value))} />
          </div>
        </div>
        <div>
          <label className="label">Total</label>
          <div className="input bg-stone-50 font-bold text-primary-900 flex items-center">{fmt(total)}</div>
        </div>
      </div>
      <div className="modal-actions">
        <button type="button" onClick={onFechar} className="flex-1 btn-outline">Cancelar</button>
        <button type="submit" disabled={salvando} className="flex-1 btn-primary">
          {salvando ? 'Salvando...' : form.id ? 'Atualizar' : 'Adicionar serviço'}
        </button>
      </div>
    </form>
  )
}

function FormRetirarItem({ obraId, item, onSalvar, onFechar }: {
  obraId: number
  item: ItemObra
  onSalvar: () => void
  onFechar: () => void
}) {
  const [motivo, setMotivo] = useState('')
  const [salvando, setSalvando] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSalvando(true)
    try {
      await api.patch(`/obras/${obraId}/itens/${item.id}/retirar`, { motivoRemocao: motivo || null })
      toast.success('Serviço retirado do escopo')
      onSalvar()
    } catch {
      toast.error('Erro ao retirar serviço')
    } finally {
      setSalvando(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-sm text-primary-600">
        Retirar <strong>{item.descricao}</strong> ({fmt(item.valorTotal)}) do total a receber?
      </p>
      <div>
        <label className="label">Motivo (opcional)</label>
        <textarea className="input min-h-[80px] resize-none"
          placeholder="Ex: Cliente desistiu, já estava incluso em outro item..."
          value={motivo} onChange={e => setMotivo(e.target.value)} />
      </div>
      <div className="modal-actions">
        <button type="button" onClick={onFechar} className="flex-1 btn-outline">Cancelar</button>
        <button type="submit" disabled={salvando} className="flex-1 btn-danger">
          {salvando ? 'Retirando...' : 'Retirar serviço'}
        </button>
      </div>
    </form>
  )
}

// ─── Página principal ────────────────────────────────────────
export default function ObraDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [obra, setObra] = useState<Obra | null>(null)
  const [diarios, setDiarios] = useState<DiarioObra[]>([])
  const [recebimentos, setRecebimentos] = useState<RecebimentoObra[]>([])
  const [resumoRec, setResumoRec] = useState<ResumoRecebimentoObra | null>(null)
  const [aditivos, setAditivos] = useState<AditivoObra[]>([])
  const [itens, setItens] = useState<ItemObra[]>([])
  const [carregando, setCarregando] = useState(true)

  const [modalDiario, setModalDiario] = useState(false)
  const [diarioSelecionado, setDiarioSelecionado] = useState<Partial<DiarioObra> | null>(null)
  const [confirmarRemocao, setConfirmarRemocao] = useState<DiarioObra | null>(null)
  const [removendo, setRemovendo] = useState(false)
  const [modalRec, setModalRec] = useState(false)
  const [recSelecionado, setRecSelecionado] = useState<Partial<RecebimentoObra> | null>(null)
  const [confirmarRec, setConfirmarRec] = useState<RecebimentoObra | null>(null)
  const [modalAditivo, setModalAditivo] = useState(false)
  const [aditivoSelecionado, setAditivoSelecionado] = useState<Partial<AditivoObra> | null>(null)
  const [confirmarAditivo, setConfirmarAditivo] = useState<AditivoObra | null>(null)
  const [modalItem, setModalItem] = useState(false)
  const [itemSelecionado, setItemSelecionado] = useState<Partial<ItemObra> | null>(null)
  const [itemRetirar, setItemRetirar] = useState<ItemObra | null>(null)
  const [importando, setImportando] = useState(false)

  const carregar = useCallback(async () => {
    if (!id) return
    setCarregando(true)
    try {
      const [obraRes, diariosRes, recRes, resumoRes, aditivosRes, itensRes] = await Promise.all([
        api.get<Obra>(`/obras/${id}`),
        api.get<DiarioObra[]>(`/obras/${id}/diario`),
        api.get<RecebimentoObra[]>(`/obras/${id}/recebimentos`),
        api.get<ResumoRecebimentoObra>(`/obras/${id}/recebimentos/resumo`),
        api.get<AditivoObra[]>(`/obras/${id}/aditivos`),
        api.get<ItemObra[]>(`/obras/${id}/itens`),
      ])
      setObra(obraRes.data)
      setDiarios(diariosRes.data)
      setRecebimentos(recRes.data)
      setResumoRec(resumoRes.data)
      setAditivos(aditivosRes.data)
      setItens(itensRes.data)
    } catch {
      toast.error('Erro ao carregar obra')
      navigate('/admin/obras')
    } finally {
      setCarregando(false)
    }
  }, [id, navigate])

  useEffect(() => { carregar() }, [carregar])

  const removerDiario = async () => {
    if (!confirmarRemocao?.id) return
    setRemovendo(true)
    try {
      await api.delete(`/obras/${id}/diario/${confirmarRemocao.id}`)
      toast.success('Registro removido')
      setConfirmarRemocao(null)
      carregar()
    } catch {
      toast.error('Erro ao remover')
    } finally {
      setRemovendo(false)
    }
  }

  const removerRecebimento = async () => {
    if (!confirmarRec?.id) return
    setRemovendo(true)
    try {
      await api.delete(`/obras/${id}/recebimentos/${confirmarRec.id}`)
      toast.success('Recebimento removido')
      setConfirmarRec(null)
      carregar()
    } catch {
      toast.error('Erro ao remover')
    } finally {
      setRemovendo(false)
    }
  }

  const marcarRecebido = async (r: RecebimentoObra) => {
    try {
      await api.patch(`/obras/${id}/recebimentos/${r.id}/receber`, { dataRecebimento: hojeISO() })
      toast.success('Marcado como recebido')
      carregar()
    } catch {
      toast.error('Erro ao confirmar recebimento')
    }
  }

  const removerAditivo = async () => {
    if (!confirmarAditivo?.id) return
    setRemovendo(true)
    try {
      await api.delete(`/obras/${id}/aditivos/${confirmarAditivo.id}`)
      toast.success('Extra removido')
      setConfirmarAditivo(null)
      carregar()
    } catch {
      toast.error('Erro ao remover extra')
    } finally {
      setRemovendo(false)
    }
  }

  const reativarItem = async (item: ItemObra) => {
    try {
      await api.patch(`/obras/${id}/itens/${item.id}/reativar`)
      toast.success('Serviço reativado')
      carregar()
    } catch {
      toast.error('Erro ao reativar serviço')
    }
  }

  const importarOrcamento = async () => {
    setImportando(true)
    try {
      await api.post(`/obras/${id}/itens/importar-orcamento`)
      toast.success('Serviços do orçamento importados!')
      carregar()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { erro?: string } } })?.response?.data?.erro
      toast.error(msg || 'Não foi possível importar o orçamento')
    } finally {
      setImportando(false)
    }
  }

  const itensAtivos = itens.filter(i => i.ativo !== false)
  const itensRetirados = itens.filter(i => i.ativo === false)

  if (carregando) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-8 h-8 border-4 border-accent-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!obra) return null

  const cfg = statusConfig[obra.status]
  const progresso = obra.percentualConcluido ?? 0

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div>
        <Link to="/admin/obras" className="inline-flex items-center gap-1.5 text-sm text-primary-400 hover:text-primary-700 mb-4 transition-colors">
          <ArrowLeft size={15} />
          Voltar para obras
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap mb-1">
              <span className={clsx('badge', cfg.bg, cfg.cor)}>{cfg.label}</span>
            </div>
            <h1 className="text-2xl font-black text-primary-900 leading-tight">{obra.nome}</h1>
            {obra.cliente && (
              <div className="flex items-center gap-1.5 text-sm text-primary-400 mt-1">
                <User size={13} />
                {obra.cliente.nome}
              </div>
            )}
          </div>
          <Link
            to={`/admin/obras`}
            state={{ editar: obra }}
            className="btn-outline flex-shrink-0"
            onClick={() => navigate('/admin/obras')}
          >
            <Edit2 size={15} />
            Editar obra
          </Link>
        </div>
      </div>

      {/* Barra de progresso */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-primary-700">Progresso da obra</span>
          <span className="text-2xl font-black text-primary-900">{progresso}%</span>
        </div>
        <div className="h-3 bg-stone-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-accent-400 to-accent-500 rounded-full transition-all duration-700"
            style={{ width: `${progresso}%` }}
          />
        </div>
        {obra.dataPrevisaoFim && (
          <p className="text-xs text-primary-400 mt-2 flex items-center gap-1">
            <Calendar size={11} />
            Previsão: {fmtData(obra.dataPrevisaoFim)}
          </p>
        )}
        {obra.cidade && (
          <p className="text-xs text-primary-400 mt-1 flex items-center gap-1">
            <MapPin size={11} />
            {obra.cidade}{obra.estado ? `, ${obra.estado}` : ''}
          </p>
        )}
      </div>

      {/* Financeiro do cliente */}
      <div className="card overflow-hidden">
        <div className="p-5 border-b border-stone-100">
          <h2 className="text-lg font-bold text-primary-900 flex items-center gap-2">
            <Wallet size={18} className="text-emerald-500" />
            Conta do cliente nesta obra
          </h2>
          <p className="text-sm text-primary-400 mt-0.5">
            Serviços ativos + extras · {PERIODICIDADE[obra.periodicidadePagamento || 'SEMANAL']}
            {obra.valorParcela ? ` · ${fmt(obra.valorParcela)} por ciclo` : ''}
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-5 gap-px bg-stone-100">
          {[
            {
              label: 'Serviços',
              valor: fmt(resumoRec?.totalEscopo ?? obra.valorContrato),
              hint: resumoRec?.temItens
                ? `${resumoRec.quantidadeItensAtivos} ativo(s)`
                : 'Valor do contrato',
              cor: 'text-primary-900',
            },
            {
              label: 'Extras',
              valor: fmt(resumoRec?.totalAditivos),
              hint: resumoRec?.quantidadeAditivos ? `${resumoRec.quantidadeAditivos} item(ns)` : 'Nenhum extra',
              cor: 'text-amber-700',
            },
            {
              label: 'A receber no total',
              valor: fmt(resumoRec?.totalAReceber ?? obra.valorContrato),
              hint: 'Serviços + extras',
              cor: 'text-primary-900',
            },
            {
              label: 'Já recebi',
              valor: fmt(resumoRec?.totalRecebido),
              hint: resumoRec?.quantidadeRecebido ? `${resumoRec.quantidadeRecebido} pagamento(s)` : 'Nenhum pagamento ainda',
              cor: 'text-emerald-700',
            },
            {
              label: (resumoRec?.saldoContrato ?? 0) < 0 ? 'A mais (troco)' : 'Ainda falta',
              valor: fmt(Math.abs(resumoRec?.saldoContrato ?? 0)),
              hint: resumoRec?.totalPendente ? `${fmt(resumoRec.totalPendente)} lançado e não recebido` : 'Saldo em aberto',
              cor: (resumoRec?.saldoContrato ?? 0) <= 0 ? 'text-emerald-700' : 'text-orange-600',
            },
          ].map(item => (
            <div key={item.label} className={`bg-white p-3.5 sm:p-4 ${item.label.startsWith('Ainda falta') || item.label.startsWith('A mais') ? 'col-span-2 lg:col-span-1' : ''}`}>
              <p className="text-[10px] font-bold text-primary-400 uppercase tracking-wider">{item.label}</p>
              <p className={`text-lg font-black mt-1 break-words ${item.cor}`}>{item.valor}</p>
              <p className="text-[11px] text-primary-400 mt-1">{item.hint}</p>
            </div>
          ))}
        </div>

        <div className="px-5 py-4">
          <div className="flex justify-between text-xs text-primary-500 mb-1.5">
            <span>Recebido {fmt(resumoRec?.totalRecebido)}</span>
            <span>Total {fmt(resumoRec?.totalAReceber ?? obra.valorContrato)}</span>
          </div>
          <div className="h-2.5 bg-stone-100 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500 rounded-full transition-all"
              style={{ width: `${resumoRec?.percentualRecebido ?? 0}%` }} />
          </div>
          <p className="text-xs text-primary-400 mt-1.5">
            {resumoRec?.percentualRecebido ?? 0}% do valor combinado já entrou
          </p>
        </div>
      </div>

      {/* Serviços / escopo da obra */}
      <div className="card overflow-hidden">
        <div className="p-5 border-b border-stone-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-primary-900 flex items-center gap-2">
              <ListChecks size={18} className="text-blue-500" />
              Serviços da obra
            </h2>
            <p className="text-sm text-primary-400 mt-0.5">
              Escopo detalhado · {fmt(resumoRec?.totalEscopo ?? 0)} em serviços ativos
            </p>
          </div>
          <button
            onClick={() => { setItemSelecionado(null); setModalItem(true) }}
            className="btn-primary"
          >
            <Plus size={16} /> Adicionar serviço
          </button>
        </div>
        <div className="p-5">
          {itens.length === 0 ? (
            <div className="text-center py-6 space-y-3">
              <p className="text-primary-500 font-medium mb-1">Nenhum serviço detalhado nesta obra</p>
              <p className="text-primary-400 text-sm">
                Se a obra veio de um orçamento, importe os itens. Ou adicione os serviços manualmente.
              </p>
              <div className="flex flex-col sm:flex-row gap-2 justify-center pt-2">
                <button type="button" onClick={importarOrcamento} disabled={importando} className="btn-outline">
                  {importando ? 'Importando...' : 'Importar do orçamento'}
                </button>
                <button type="button" onClick={() => { setItemSelecionado(null); setModalItem(true) }} className="btn-primary">
                  <Plus size={16} /> Adicionar manualmente
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="divide-y divide-stone-50 -mx-5">
                {itensAtivos.map(item => (
                  <div key={item.id} className="px-5 py-3 flex items-start gap-3 hover:bg-stone-50/60">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 bg-blue-500">
                      <ListChecks size={16} className="text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-primary-900">{item.descricao}</span>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                          item.origem === 'ORCAMENTO'
                            ? 'bg-blue-50 text-blue-700'
                            : 'bg-emerald-50 text-emerald-700'
                        }`}>
                          {item.origem === 'ORCAMENTO' ? 'Do orçamento' : 'Adicionado'}
                        </span>
                      </div>
                      <div className="text-sm font-black text-primary-900 mt-0.5">{fmt(item.valorTotal)}</div>
                      <div className="text-xs text-primary-400 mt-0.5">
                        {item.quantidade} {item.unidade || 'vb'} × {fmt(item.valorUnitario)}
                      </div>
                      {item.observacao && <div className="text-xs text-primary-500 mt-1">{item.observacao}</div>}
                    </div>
                    <div className="flex gap-0.5 flex-shrink-0">
                      <button onClick={() => { setItemSelecionado(item); setModalItem(true) }} className="icon-btn" aria-label="Editar serviço">
                        <Edit2 size={16} />
                      </button>
                      <button onClick={() => setItemRetirar(item)} className="icon-btn-danger" aria-label="Retirar serviço" title="Retirar do escopo">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {itensRetirados.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-primary-400 uppercase tracking-wider mb-2">
                    Retirados ({itensRetirados.length})
                  </p>
                  <div className="space-y-2">
                    {itensRetirados.map(item => (
                      <div key={item.id} className="rounded-xl border border-stone-100 bg-stone-50 px-4 py-3 flex items-start gap-3 opacity-80">
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-primary-600 line-through">{item.descricao}</div>
                          <div className="text-xs text-primary-400 mt-0.5">
                            {fmt(item.valorTotal)}
                            {item.dataRemocao ? ` · retirado em ${fmtData(item.dataRemocao)}` : ''}
                          </div>
                          {item.motivoRemocao && (
                            <div className="text-xs text-primary-500 mt-1">{item.motivoRemocao}</div>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => reativarItem(item)}
                          className="icon-btn text-blue-600 hover:bg-blue-50"
                          title="Reativar"
                          aria-label="Reativar serviço"
                        >
                          <RotateCcw size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Extras / aditivos */}
      <div className="card overflow-hidden">
        <div className="p-5 border-b border-stone-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-primary-900 flex items-center gap-2">
              <Wrench size={18} className="text-amber-500" />
              Extras da obra
            </h2>
            <p className="text-sm text-primary-400 mt-0.5">
              Serviços e materiais que não estavam no orçamento
            </p>
          </div>
          <button
            onClick={() => { setAditivoSelecionado(null); setModalAditivo(true) }}
            className="btn-primary"
          >
            <Plus size={16} /> Adicionar extra
          </button>
        </div>
        <div className="p-5">
          {aditivos.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-primary-500 font-medium mb-1">Nenhum extra nesta obra</p>
              <p className="text-primary-400 text-sm">Se o cliente pedir algo a mais no meio do serviço, registre aqui com o valor.</p>
            </div>
          ) : (
            <div className="divide-y divide-stone-50 -mx-5">
              {aditivos.map(a => (
                <div key={a.id} className="px-5 py-3 flex items-start gap-3 hover:bg-stone-50/60">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 bg-amber-500">
                    <Wrench size={16} className="text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-primary-900">{a.descricao}</span>
                      <span className="text-[10px] font-bold bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded-full">
                        {CATEGORIA_ADITIVO[a.categoria || 'SERVICO_EXTRA']}
                      </span>
                      {a.cobravel === false
                        ? <span className="text-[10px] font-bold bg-stone-100 text-primary-500 px-1.5 py-0.5 rounded-full">Não cobra</span>
                        : <span className="text-[10px] font-bold bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded-full">Cobra do cliente</span>}
                    </div>
                    <div className="text-sm font-black text-primary-900 mt-0.5">{fmt(a.valorTotal)}</div>
                    <div className="text-xs text-primary-400 mt-0.5">
                      {a.quantidade} {a.unidade || 'vb'} × {fmt(a.valorUnitario)}
                      {a.data ? ` · ${fmtData(a.data)}` : ''}
                      {a.solicitadoPor ? ` · pedido por ${a.solicitadoPor}` : ''}
                    </div>
                    {a.observacao && <div className="text-xs text-primary-500 mt-1">{a.observacao}</div>}
                    {a.observacoes && <div className="text-xs text-primary-400 mt-0.5">{a.observacoes}</div>}
                  </div>
                  <div className="flex gap-0.5 flex-shrink-0">
                    <button onClick={() => { setAditivoSelecionado(a); setModalAditivo(true) }} className="icon-btn" aria-label="Editar extra">
                      <Edit2 size={16} />
                    </button>
                    <button onClick={() => setConfirmarAditivo(a)} className="icon-btn-danger" aria-label="Excluir extra">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recebimentos do cliente */}
      <div className="card overflow-hidden">
        <div className="p-5 border-b border-stone-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-primary-900 flex items-center gap-2">
              <Banknote size={18} className="text-emerald-500" />
              Pagamentos do cliente
            </h2>
            <p className="text-sm text-primary-400 mt-0.5">
              Cada entrada, parcela ou saldo que o cliente pagou
            </p>
          </div>
          <button
            onClick={() => { setRecSelecionado(null); setModalRec(true) }}
            className="btn-primary"
          >
            <Plus size={16} /> Registrar pagamento
          </button>
        </div>

        <div className="p-5">
          {recebimentos.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-primary-500 font-medium mb-1">Nenhum pagamento anotado</p>
              <p className="text-primary-400 text-sm">Quando o cliente pagar a semana, a quinzena, o mês ou um extra, registre aqui.</p>
            </div>
          ) : (
            <div className="divide-y divide-stone-50 -mx-5">
              {recebimentos.map(r => (
                <div key={r.id} className="px-5 py-3 flex items-start gap-3 hover:bg-stone-50/60">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    r.recebido ? 'bg-emerald-500' : 'bg-orange-400'
                  }`}>
                    {r.recebido ? <CheckCircle size={16} className="text-white" /> : <Clock size={16} className="text-white" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-primary-900">{fmt(r.valor)}</span>
                      {r.recebido
                        ? <span className="text-[10px] font-bold bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded-full">Recebido</span>
                        : <span className="text-[10px] font-bold bg-orange-50 text-orange-600 px-1.5 py-0.5 rounded-full">A receber</span>}
                      <span className="text-[10px] font-bold bg-stone-100 text-primary-600 px-1.5 py-0.5 rounded-full">
                        {TIPOS_PAG[r.tipo || 'PARCELA']}
                      </span>
                    </div>
                    <div className="text-xs text-primary-400 mt-0.5">
                      {r.referencia || 'Pagamento'} · {fmtData(r.data)}
                      {r.dataRecebimento && r.recebido ? ` · entrou em ${fmtData(r.dataRecebimento)}` : ''}
                      {r.formaPagamento ? ` · ${r.formaPagamento}` : ''}
                    </div>
                    {r.observacoes && <div className="text-xs text-primary-500 mt-1">{r.observacoes}</div>}
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    {!r.recebido && (
                      <button onClick={() => marcarRecebido(r)} className="icon-btn text-emerald-600 hover:bg-emerald-50" title="Marcar recebido" aria-label="Marcar recebido">
                        <CheckCircle size={16} />
                      </button>
                    )}
                    <button onClick={() => { setRecSelecionado(r); setModalRec(true) }} className="icon-btn" aria-label="Editar">
                      <Edit2 size={16} />
                    </button>
                    <button onClick={() => setConfirmarRec(r)} className="icon-btn-danger" aria-label="Excluir">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Descrição / Observações */}
      {(obra.descricao || obra.observacoes) && (
        <div className="card p-5">
          {obra.descricao && (
            <div className="mb-3">
              <p className="text-xs font-bold text-primary-400 uppercase tracking-wide mb-1">Descrição</p>
              <p className="text-sm text-primary-700">{obra.descricao}</p>
            </div>
          )}
          {obra.observacoes && (
            <div>
              <p className="text-xs font-bold text-primary-400 uppercase tracking-wide mb-1">Observações</p>
              <p className="text-sm text-primary-600">{obra.observacoes}</p>
            </div>
          )}
        </div>
      )}

      {/* ── DIÁRIO DE OBRA ─────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-primary-900 flex items-center gap-2">
              <BookOpen size={18} className="text-accent-500" />
              Diário de Obra
            </h2>
            <p className="text-sm text-primary-400 mt-0.5">{diarios.length} registro{diarios.length !== 1 ? 's' : ''}</p>
          </div>
          <button
            onClick={() => { setDiarioSelecionado(null); setModalDiario(true) }}
            className="btn-primary"
          >
            <Plus size={16} />
            Novo registro
          </button>
        </div>

        {diarios.length === 0 ? (
          <div className="card p-10 text-center">
            <div className="w-14 h-14 rounded-2xl bg-primary-50 flex items-center justify-center mx-auto mb-4">
              <BookOpen size={24} className="text-primary-300" />
            </div>
            <p className="text-primary-500 font-medium mb-1">Nenhum registro no diário</p>
            <p className="text-primary-400 text-sm mb-4">Registre o progresso de cada dia de trabalho.</p>
            <button
              onClick={() => { setDiarioSelecionado(null); setModalDiario(true) }}
              className="btn-primary mx-auto"
            >
              <Plus size={15} /> Registrar hoje
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {diarios.map((d) => (
              <CardDiario
                key={d.id}
                d={d}
                onEditar={() => { setDiarioSelecionado(d); setModalDiario(true) }}
                onRemover={() => setConfirmarRemocao(d)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modal diário */}
      <Modal
        aberto={modalDiario}
        fechar={() => setModalDiario(false)}
        titulo={diarioSelecionado?.id ? 'Editar registro' : 'Novo registro do dia'}
        tamanho="md"
      >
        <FormDiario
          obraId={Number(id)}
          diario={diarioSelecionado}
          onSalvar={() => { setModalDiario(false); carregar() }}
          onFechar={() => setModalDiario(false)}
        />
      </Modal>

      <ConfirmDialog
        aberto={!!confirmarRemocao}
        fechar={() => setConfirmarRemocao(null)}
        titulo="Remover registro"
        mensagem={`Remover o registro do dia ${fmtData(confirmarRemocao?.data)}?`}
        onConfirmar={removerDiario}
        carregando={removendo}
      />

      <Modal
        aberto={modalRec}
        fechar={() => setModalRec(false)}
        titulo={recSelecionado?.id ? 'Editar recebimento' : 'Registrar recebimento do cliente'}
        tamanho="md"
      >
        <FormRecebimento
          obra={obra}
          recebimento={recSelecionado}
          onSalvar={() => { setModalRec(false); carregar() }}
          onFechar={() => setModalRec(false)}
        />
      </Modal>

      <ConfirmDialog
        aberto={!!confirmarRec}
        fechar={() => setConfirmarRec(null)}
        titulo="Remover recebimento"
        mensagem={`Remover o lançamento de ${fmt(confirmarRec?.valor)}?`}
        onConfirmar={removerRecebimento}
        carregando={removendo}
      />

      <Modal
        aberto={modalAditivo}
        fechar={() => setModalAditivo(false)}
        titulo={aditivoSelecionado?.id ? 'Editar extra da obra' : 'Adicionar extra na obra'}
        tamanho="md"
      >
        <FormAditivo
          obraId={Number(id)}
          aditivo={aditivoSelecionado}
          onSalvar={() => { setModalAditivo(false); carregar() }}
          onFechar={() => setModalAditivo(false)}
        />
      </Modal>

      <ConfirmDialog
        aberto={!!confirmarAditivo}
        fechar={() => setConfirmarAditivo(null)}
        titulo="Remover extra"
        mensagem={`Remover "${confirmarAditivo?.descricao}" de ${fmt(confirmarAditivo?.valorTotal)}?`}
        onConfirmar={removerAditivo}
        carregando={removendo}
      />

      <Modal
        aberto={modalItem}
        fechar={() => setModalItem(false)}
        titulo={itemSelecionado?.id ? 'Editar serviço' : 'Adicionar serviço na obra'}
        tamanho="md"
      >
        <FormItemObra
          obraId={Number(id)}
          item={itemSelecionado}
          onSalvar={() => { setModalItem(false); carregar() }}
          onFechar={() => setModalItem(false)}
        />
      </Modal>

      <Modal
        aberto={!!itemRetirar}
        fechar={() => setItemRetirar(null)}
        titulo="Retirar serviço"
        tamanho="sm"
      >
        {itemRetirar && (
          <FormRetirarItem
            obraId={Number(id)}
            item={itemRetirar}
            onSalvar={() => { setItemRetirar(null); carregar() }}
            onFechar={() => setItemRetirar(null)}
          />
        )}
      </Modal>
    </div>
  )
}
