import { useEffect, useState, useCallback } from 'react'
import { Plus, Search, Edit2, Trash2, Building2, Calendar, DollarSign, ExternalLink } from 'lucide-react'
import { Link } from 'react-router-dom'
import api from '../../services/api'
import type { Obra, Page, StatusObra, PeriodicidadePagamentoObra } from '../../types'
import Modal from '../../components/ui/Modal'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import ClienteSelect from '../../components/ui/ClienteSelect'
import { maskCurrency, maskCEP } from '../../utils/masks'
import toast from 'react-hot-toast'
import clsx from 'clsx'
import { useAbrirNovo } from '../../hooks/useAbrirNovo'

// --- Status badge ---
const statusConfig: Record<StatusObra, { label: string; classe: string }> = {
  ORCAMENTO:    { label: 'Orçamento',    classe: 'bg-gray-100 text-gray-600' },
  APROVADA:     { label: 'Aprovada',     classe: 'bg-blue-100 text-blue-700' },
  EM_ANDAMENTO: { label: 'Em andamento', classe: 'bg-accent-100 text-accent-700' },
  PAUSADA:      { label: 'Pausada',      classe: 'bg-yellow-100 text-yellow-700' },
  CONCLUIDA:    { label: 'Concluída',    classe: 'bg-emerald-100 text-emerald-700' },
  CANCELADA:    { label: 'Cancelada',    classe: 'bg-red-100 text-red-600' },
}

function BadgeStatus({ status }: { status: StatusObra }) {
  const cfg = statusConfig[status]
  return <span className={`badge ${cfg.classe}`}>{cfg.label}</span>
}

function formatarMoeda(v?: number) {
  if (!v) return '—'
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)
}

function formatarData(d?: string) {
  if (!d) return '—'
  return new Date(d + 'T00:00:00').toLocaleDateString('pt-BR')
}

const PERIODICIDADE: Record<PeriodicidadePagamentoObra, string> = {
  SEMANAL: 'Semanal',
  QUINZENAL: 'Quinzenal',
  MENSAL: 'Mensal',
  UNICO: 'Pagamento único',
}

// --- Formulário ---
function FormObra({ obra, onSalvar, onFechar }: {
  obra: Partial<Obra> | null
  onSalvar: () => void
  onFechar: () => void
}) {
  const [form, setForm] = useState<Partial<Obra>>(obra || {
    status: 'ORCAMENTO',
    percentualConcluido: 0,
    periodicidadePagamento: 'SEMANAL',
  })
  const [salvando, setSalvando] = useState(false)

  const set = (campo: keyof Obra, valor: unknown) =>
    setForm(f => ({ ...f, [campo]: valor }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.nome?.trim()) return toast.error('Nome é obrigatório')
    setSalvando(true)
    try {
      const payload = {
        ...form,
        cliente: form.cliente?.id ? { id: form.cliente.id } : undefined,
      }
      if (form.id) {
        await api.put(`/obras/${form.id}`, payload)
        toast.success('Obra atualizada!')
      } else {
        await api.post('/obras', payload)
        toast.success('Obra cadastrada!')
      }
      onSalvar()
    } catch {
      toast.error('Erro ao salvar obra')
    } finally {
      setSalvando(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <label className="label">Nome da obra *</label>
          <input className="input" placeholder="Ex: Residência Família Silva" value={form.nome || ''} onChange={e => set('nome', e.target.value)} required />
        </div>
        <div>
          <label className="label">Status</label>
          <select className="input" value={form.status || 'ORCAMENTO'} onChange={e => set('status', e.target.value)}>
            {Object.entries(statusConfig).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
        </div>
        <div>
          <label className="label">% Concluído</label>
          <div className="relative">
            <input
              type="number"
              min="0"
              max="100"
              className="input pr-9"
              placeholder="0"
              value={form.percentualConcluido ?? 0}
              onChange={e => set('percentualConcluido', Math.min(100, Math.max(0, Number(e.target.value))))}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-primary-400 pointer-events-none">%</span>
          </div>
        </div>
        <div className="sm:col-span-2">
          <label className="label">Descrição</label>
          <textarea className="input min-h-[80px] resize-none" placeholder="Descrição da obra..." value={form.descricao || ''} onChange={e => set('descricao', e.target.value)} />
        </div>
        <div className="sm:col-span-2">
          <ClienteSelect
            label="Cliente"
            value={form.cliente || null}
            onChange={(c) => set('cliente', c)}
          />
        </div>
      </div>

      {/* Valores */}
      <div className="border-t border-stone-100 pt-4">
        <h3 className="text-xs font-bold text-primary-400 uppercase tracking-wider mb-3">Valores e datas</h3>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Valor do contrato</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-primary-400 pointer-events-none">R$</span>
              <input
                type="text"
                inputMode="decimal"
                className="input pl-9"
                placeholder="0,00"
                value={form.valorContrato ? maskCurrency(form.valorContrato) : ''}
                onChange={e => {
                  const digits = e.target.value.replace(/\D/g, '')
                  set('valorContrato', digits ? Number(digits) / 100 : undefined)
                }}
              />
            </div>
          </div>
          <div>
            <label className="label">Valor orçado</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-primary-400 pointer-events-none">R$</span>
              <input
                type="text"
                inputMode="decimal"
                className="input pl-9"
                placeholder="0,00"
                value={form.valorOrcado ? maskCurrency(form.valorOrcado) : ''}
                onChange={e => {
                  const digits = e.target.value.replace(/\D/g, '')
                  set('valorOrcado', digits ? Number(digits) / 100 : undefined)
                }}
              />
            </div>
          </div>
          <div>
            <label className="label">Data de início</label>
            <input type="date" className="input" value={form.dataInicio || ''} onChange={e => set('dataInicio', e.target.value)} />
          </div>
          <div>
            <label className="label">Previsão de conclusão</label>
            <input type="date" className="input" value={form.dataPrevisaoFim || ''} onChange={e => set('dataPrevisaoFim', e.target.value)} />
          </div>
        </div>
      </div>

      {/* Pagamento do cliente */}
      <div className="border-t border-stone-100 pt-4">
        <h3 className="text-xs font-bold text-primary-400 uppercase tracking-wider mb-1">Como o cliente paga esta obra</h3>
        <p className="text-xs text-primary-400 mb-3">Cada obra tem o próprio combinado. Você anota cada vez que receber.</p>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="label">Periodicidade</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(Object.entries(PERIODICIDADE) as [PeriodicidadePagamentoObra, string][]).map(([k, label]) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => set('periodicidadePagamento', k)}
                  className={`min-h-[44px] py-2.5 px-2 rounded-xl border-2 text-xs font-bold transition-all ${
                    (form.periodicidadePagamento || 'SEMANAL') === k
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                      : 'border-stone-200 text-primary-500 hover:border-stone-300'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="label">
              {form.periodicidadePagamento === 'UNICO' ? 'Valor do pagamento' : 'Valor de cada pagamento'}
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-primary-400 pointer-events-none">R$</span>
              <input
                type="text"
                inputMode="decimal"
                className="input pl-9"
                placeholder="0,00"
                value={form.valorParcela ? maskCurrency(form.valorParcela) : ''}
                onChange={e => {
                  const digits = e.target.value.replace(/\D/g, '')
                  set('valorParcela', digits ? Number(digits) / 100 : undefined)
                }}
              />
            </div>
            <p className="text-[11px] text-primary-400 mt-1">
              {form.periodicidadePagamento === 'SEMANAL' && 'Ex.: o cliente paga toda sexta o combinado da semana.'}
              {form.periodicidadePagamento === 'QUINZENAL' && 'Ex.: o cliente paga a cada 15 dias.'}
              {form.periodicidadePagamento === 'MENSAL' && 'Ex.: o cliente paga uma vez por mês.'}
              {form.periodicidadePagamento === 'UNICO' && 'Pagamento único ou conforme as parcelas que você registrar.'}
              {!form.periodicidadePagamento && 'Valor que o cliente costuma pagar em cada ciclo.'}
            </p>
          </div>
        </div>
      </div>

      {/* Endereço */}
      <div className="border-t border-stone-100 pt-4">
        <h3 className="text-xs font-bold text-primary-400 uppercase tracking-wider mb-3">Endereço da obra</h3>
        <div className="grid sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2">
            <label className="label">Logradouro</label>
            <input className="input" placeholder="Rua, Avenida..." value={form.logradouro || ''} onChange={e => set('logradouro', e.target.value)} />
          </div>
          <div>
            <label className="label">Número</label>
            <input className="input" placeholder="Nº" value={form.numero || ''} onChange={e => set('numero', e.target.value)} />
          </div>
          <div>
            <label className="label">CEP</label>
            <input className="input" placeholder="00000-000" value={form.cep || ''} onChange={e => set('cep', maskCEP(e.target.value))} />
          </div>
          <div>
            <label className="label">Bairro</label>
            <input className="input" value={form.bairro || ''} onChange={e => set('bairro', e.target.value)} />
          </div>
          <div>
            <label className="label">Cidade</label>
            <input className="input" value={form.cidade || ''} onChange={e => set('cidade', e.target.value)} />
          </div>
          <div>
            <label className="label">Estado</label>
            <select className="input" value={form.estado || ''} onChange={e => set('estado', e.target.value)}>
              <option value="">UF</option>
              {['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'].map(uf => (
                <option key={uf} value={uf}>{uf}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div>
        <label className="label">Observações</label>
        <textarea className="input min-h-[70px] resize-none" value={form.observacoes || ''} onChange={e => set('observacoes', e.target.value)} />
      </div>

      <div className="modal-actions">
        <button type="button" onClick={onFechar} className="flex-1 btn-outline">Cancelar</button>
        <button type="submit" disabled={salvando} className="flex-1 btn-primary">
          {salvando ? 'Salvando...' : form.id ? 'Atualizar' : 'Cadastrar'}
        </button>
      </div>
    </form>
  )
}

// --- Página principal ---
export default function ObrasPage() {
  const [obras, setObras] = useState<Obra[]>([])
  const [total, setTotal] = useState(0)
  const [pagina, setPagina] = useState(0)
  const [busca, setBusca] = useState('')
  const [filtroStatus, setFiltroStatus] = useState<StatusObra | ''>('')
  const [carregando, setCarregando] = useState(true)
  const [modalAberto, setModalAberto] = useState(false)
  const [obraSelecionada, setObraSelecionada] = useState<Partial<Obra> | null>(null)
  const [confirmarRemocao, setConfirmarRemocao] = useState<Obra | null>(null)
  const [removendo, setRemovendo] = useState(false)
  useAbrirNovo(() => { setObraSelecionada(null); setModalAberto(true) })

  const carregar = useCallback(async () => {
    setCarregando(true)
    try {
      const params = new URLSearchParams({ page: String(pagina), size: '12' })
      if (busca) params.set('q', busca)
      if (filtroStatus) params.set('status', filtroStatus)
      const { data } = await api.get<Page<Obra>>(`/obras?${params}`)
      setObras(data.content)
      setTotal(data.totalElements)
    } catch {
      toast.error('Erro ao carregar obras')
    } finally {
      setCarregando(false)
    }
  }, [pagina, busca, filtroStatus])

  useEffect(() => { carregar() }, [carregar])

  const remover = async () => {
    if (!confirmarRemocao?.id) return
    setRemovendo(true)
    try {
      await api.delete(`/obras/${confirmarRemocao.id}`)
      toast.success('Obra removida')
      setConfirmarRemocao(null)
      carregar()
    } catch {
      toast.error('Erro ao remover obra')
    } finally {
      setRemovendo(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Obras</h1>
          <p className="text-primary-500 text-sm mt-1">{total} obra{total !== 1 ? 's' : ''} cadastrada{total !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={() => { setObraSelecionada(null); setModalAberto(true) }} className="btn-primary">
          <Plus size={18} /> Nova Obra
        </button>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-primary-400" />
          <input className="input pl-10" placeholder="Buscar obra..." value={busca} onChange={e => { setBusca(e.target.value); setPagina(0) }} />
        </div>
        <select className="input w-full sm:w-auto" value={filtroStatus} onChange={e => { setFiltroStatus(e.target.value as StatusObra | ''); setPagina(0) }}>
          <option value="">Todos os status</option>
          {Object.entries(statusConfig).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
      </div>

      {/* Lista */}
      {carregando ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-4 border-accent-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : obras.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-20 h-20 rounded-3xl bg-primary-50 flex items-center justify-center mx-auto mb-5">
            <Building2 size={36} className="text-primary-300" />
          </div>
          <h3 className="text-lg font-bold text-primary-700 mb-2">
            {busca || filtroStatus ? 'Nenhuma obra encontrada' : 'Nenhuma obra cadastrada'}
          </h3>
          <p className="text-primary-400 text-sm mb-6">
            {busca || filtroStatus ? 'Tente outros filtros.' : 'Cadastre sua primeira obra para começar.'}
          </p>
          {!busca && !filtroStatus && (
            <button onClick={() => { setObraSelecionada(null); setModalAberto(true) }} className="btn-primary">
              <Plus size={16} /> Cadastrar primeira obra
            </button>
          )}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {obras.map((obra) => (
            <div key={obra.id} className="card-hover overflow-hidden h-full flex flex-col group">
              {/* Header */}
              <div className="p-5 flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-primary-900 truncate mb-1.5">{obra.nome}</div>
                  <BadgeStatus status={obra.status} />
                </div>
                <div className="flex gap-0.5 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity flex-shrink-0">
                  <Link
                    to={`/admin/obras/${obra.id}`}
                    className="icon-btn"
                    title="Ver detalhes"
                    aria-label="Ver detalhes"
                  >
                    <ExternalLink size={16} />
                  </Link>
                  <button
                    onClick={() => { setObraSelecionada(obra); setModalAberto(true) }}
                    className="icon-btn"
                    aria-label="Editar"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => setConfirmarRemocao(obra)}
                    className="icon-btn-danger"
                    aria-label="Excluir"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              {/* Barra de progresso */}
              {(obra.percentualConcluido ?? 0) > 0 && (
                <div className="px-5 pb-3 -mt-2">
                  <div className="flex justify-between text-xs text-primary-400 mb-1">
                    <span>Progresso</span>
                    <span className="font-bold">{obra.percentualConcluido}%</span>
                  </div>
                  <div className="h-1.5 bg-stone-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-accent-500 rounded-full transition-all"
                      style={{ width: `${obra.percentualConcluido}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Rodapé com infos — sempre na base graças ao mt-auto */}
              <div className="mt-auto px-5 pb-5 pt-3 border-t border-stone-100 space-y-1.5">
                {obra.cliente && (
                  <div className="text-xs text-primary-500 flex items-center gap-1.5 min-w-0">
                    <span className="text-primary-300 flex-shrink-0">Cliente:</span>
                    <span className="truncate">{obra.cliente.nome}</span>
                  </div>
                )}
                {(obra.cidade || obra.estado) && (
                  <div className="text-xs text-primary-400 truncate">
                    {obra.cidade}{obra.estado ? `, ${obra.estado}` : ''}
                  </div>
                )}
                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
                  {obra.valorContrato && (
                    <div className="text-xs text-primary-500 flex items-center gap-1">
                      <DollarSign size={11} className="text-primary-400 flex-shrink-0" />
                      <span className="whitespace-nowrap">{formatarMoeda(obra.valorContrato)}</span>
                    </div>
                  )}
                  {obra.dataPrevisaoFim && (
                    <div className="text-xs text-primary-500 flex items-center gap-1">
                      <Calendar size={11} className="text-primary-400 flex-shrink-0" />
                      <span className="whitespace-nowrap">{formatarData(obra.dataPrevisaoFim)}</span>
                    </div>
                  )}
                </div>
                {(obra.valorContrato || obra.totalRecebido || obra.totalAditivos) ? (
                  <div className="pt-2">
                    <div className="flex justify-between text-[11px] text-primary-400 mb-1">
                      <span>Recebido do cliente</span>
                      <span className="font-bold text-emerald-600">
                        {formatarMoeda(obra.totalRecebido)} / {formatarMoeda((obra.valorContrato || 0) + (obra.totalAditivos || 0))}
                      </span>
                    </div>
                    <div className="h-1.5 bg-stone-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full"
                        style={{
                          width: `${(() => {
                            const total = (obra.valorContrato || 0) + (obra.totalAditivos || 0)
                            return total ? Math.min(100, Math.round(((obra.totalRecebido || 0) / total) * 100)) : 0
                          })()}%`,
                        }}
                      />
                    </div>
                    {obra.totalAditivos ? (
                      <div className="text-[10px] text-amber-700 mt-1">
                        Inclui {formatarMoeda(obra.totalAditivos)} de extras
                      </div>
                    ) : null}
                    {obra.periodicidadePagamento && (
                      <div className="text-[10px] text-primary-400 mt-1">
                        {PERIODICIDADE[obra.periodicidadePagamento]}
                        {obra.valorParcela ? ` · ${formatarMoeda(obra.valorParcela)} por ciclo` : ''}
                      </div>
                    )}
                  </div>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}

      {total > 12 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-primary-400">Página {pagina + 1} de {Math.ceil(total / 12)}</span>
          <div className="flex gap-2">
            <button onClick={() => setPagina(p => Math.max(0, p - 1))} disabled={pagina === 0} className="btn-outline py-2 px-4 disabled:opacity-40">Anterior</button>
            <button onClick={() => setPagina(p => p + 1)} disabled={(pagina + 1) * 12 >= total} className="btn-outline py-2 px-4 disabled:opacity-40">Próximo</button>
          </div>
        </div>
      )}

      <Modal aberto={modalAberto} fechar={() => setModalAberto(false)} titulo={obraSelecionada?.id ? 'Editar Obra' : 'Nova Obra'} tamanho="lg">
        <FormObra obra={obraSelecionada} onSalvar={() => { setModalAberto(false); carregar() }} onFechar={() => setModalAberto(false)} />
      </Modal>

      <ConfirmDialog aberto={!!confirmarRemocao} fechar={() => setConfirmarRemocao(null)} titulo="Remover obra" mensagem={`Tem certeza que deseja remover a obra "${confirmarRemocao?.nome}"? Itens, recebimentos, aditivos e o diário também serão apagados. O orçamento vinculado permanece, sem essa obra.`} onConfirmar={remover} carregando={removendo} />
    </div>
  )
}
