import { useEffect, useState, useCallback } from 'react'
import { Plus, Search, Edit2, Trash2, TrendingUp, TrendingDown, DollarSign, CheckCircle, Clock } from 'lucide-react'
import api from '../../services/api'
import { maskCurrency } from '../../utils/masks'
import type { Transacao, Page, TipoTransacao } from '../../types'
import Modal from '../../components/ui/Modal'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import toast from 'react-hot-toast'
import { useAbrirNovo } from '../../hooks/useAbrirNovo'

function formatarMoeda(v?: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0)
}

function formatarData(d?: string) {
  if (!d) return '—'
  return new Date(d + 'T00:00:00').toLocaleDateString('pt-BR')
}

const categorias = [
  'Material de construção', 'Mão de obra', 'Equipamentos', 'Transporte',
  'Taxas e impostos', 'Honorários', 'Serviços terceirizados',
  'Recebimento de cliente', 'Adiantamento', 'Outros'
]

function FormTransacao({ transacao, onSalvar, onFechar }: {
  transacao: Partial<Transacao> | null
  onSalvar: () => void
  onFechar: () => void
}) {
  const [form, setForm] = useState<Partial<Transacao>>(transacao || {
    tipo: 'DESPESA',
    data: new Date().toISOString().split('T')[0],
    pago: false,
  })
  const [salvando, setSalvando] = useState(false)

  const set = (campo: keyof Transacao, valor: unknown) =>
    setForm(f => ({ ...f, [campo]: valor }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.descricao?.trim()) return toast.error('Descrição é obrigatória')
    if (!form.valor || form.valor <= 0) return toast.error('Informe um valor válido')
    if (!form.data) return toast.error('Data é obrigatória')
    setSalvando(true)
    try {
      if (form.id) {
        await api.put(`/financeiro/${form.id}`, form)
        toast.success('Transação atualizada!')
      } else {
        await api.post('/financeiro', form)
        toast.success('Transação registrada!')
      }
      onSalvar()
    } catch {
      toast.error('Erro ao salvar transação')
    } finally {
      setSalvando(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Tipo */}
      <div>
        <label className="label">Tipo *</label>
        <div className="grid grid-cols-2 gap-3">
          {([['RECEITA', 'Receita', 'text-emerald-600 border-emerald-200 bg-emerald-50'],
             ['DESPESA', 'Despesa', 'text-red-500 border-red-200 bg-red-50']] as const).map(([val, label, cls]) => (
            <button
              key={val}
              type="button"
              onClick={() => set('tipo', val)}
              className={`py-3 rounded-xl border-2 font-bold text-sm transition-all ${
                form.tipo === val ? cls + ' border-current' : 'border-stone-200 text-primary-400 bg-white'
              }`}
            >
              {val === 'RECEITA' ? <TrendingUp size={16} className="inline mr-2" /> : <TrendingDown size={16} className="inline mr-2" />}
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <label className="label">Descrição *</label>
          <input className="input" placeholder="Ex: Compra de cimento" value={form.descricao || ''} onChange={e => set('descricao', e.target.value)} required />
        </div>
        <div>
          <label className="label">Categoria</label>
          <select className="input" value={form.categoria || ''} onChange={e => set('categoria', e.target.value)}>
            <option value="">Selecione...</option>
            {categorias.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Valor *</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-primary-400 pointer-events-none">R$</span>
            <input
              type="text"
              inputMode="decimal"
              className="input pl-9"
              placeholder="0,00"
              required
              value={form.valor ? maskCurrency(form.valor) : ''}
              onChange={e => {
                const digits = e.target.value.replace(/\D/g, '')
                set('valor', digits ? Number(digits) / 100 : undefined)
              }}
            />
          </div>
        </div>
        <div>
          <label className="label">Data *</label>
          <input type="date" className="input" value={form.data || ''} onChange={e => set('data', e.target.value)} required />
        </div>
        <div>
          <label className="label">Forma de pagamento</label>
          <select className="input" value={form.formaPagamento || ''} onChange={e => set('formaPagamento', e.target.value)}>
            <option value="">Selecione...</option>
            {['Dinheiro', 'PIX', 'Transferência', 'Cheque', 'Cartão de débito', 'Cartão de crédito', 'Boleto'].map(f => <option key={f} value={f}>{f}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Data de pagamento</label>
          <input type="date" className="input" value={form.dataPagamento || ''} onChange={e => set('dataPagamento', e.target.value)} />
        </div>
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="pago"
            checked={form.pago || false}
            onChange={e => set('pago', e.target.checked)}
            className="w-4 h-4 rounded border-stone-300 text-accent-500"
          />
          <label htmlFor="pago" className="text-sm font-medium text-primary-700 cursor-pointer">Marcado como pago</label>
        </div>
      </div>

      <div>
        <label className="label">Observações</label>
        <textarea className="input min-h-[70px] resize-none" value={form.observacoes || ''} onChange={e => set('observacoes', e.target.value)} />
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

interface ResumoFinanceiro {
  receitas: number
  despesas: number
  saldo: number
}

export default function FinanceiroPage() {
  const mesAtual = new Date()
  const primeiroDiaMes = `${mesAtual.getFullYear()}-${String(mesAtual.getMonth() + 1).padStart(2, '0')}-01`
  const ultimoDiaMes = new Date(mesAtual.getFullYear(), mesAtual.getMonth() + 1, 0)
    .toISOString().split('T')[0]

  const [transacoes, setTransacoes] = useState<Transacao[]>([])
  const [total, setTotal] = useState(0)
  const [pagina, setPagina] = useState(0)
  const [busca, setBusca] = useState('')
  const [filtroTipo, setFiltroTipo] = useState<TipoTransacao | ''>('')
  const [dataInicio, setDataInicio] = useState(primeiroDiaMes)
  const [dataFim, setDataFim] = useState(ultimoDiaMes)
  const [carregando, setCarregando] = useState(true)
  const [resumo, setResumo] = useState<ResumoFinanceiro | null>(null)
  const [modalAberto, setModalAberto] = useState(false)
  const [selecionado, setSelecionado] = useState<Partial<Transacao> | null>(null)
  const [confirmarRemocao, setConfirmarRemocao] = useState<Transacao | null>(null)
  const [removendo, setRemovendo] = useState(false)
  useAbrirNovo(() => { setSelecionado(null); setModalAberto(true) })

  const carregar = useCallback(async () => {
    setCarregando(true)
    try {
      const params = new URLSearchParams({ page: String(pagina), size: '15' })
      if (busca) params.set('q', busca)
      if (filtroTipo) params.set('tipo', filtroTipo)

      const resumoParams = new URLSearchParams()
      if (dataInicio) resumoParams.set('inicio', dataInicio)
      if (dataFim) resumoParams.set('fim', dataFim)

      const [listagem, res] = await Promise.all([
        api.get<Page<Transacao>>(`/financeiro?${params}`),
        api.get<ResumoFinanceiro>(`/financeiro/resumo?${resumoParams}`),
      ])
      setTransacoes(listagem.data.content)
      setTotal(listagem.data.totalElements)
      setResumo(res.data)
    } catch {
      toast.error('Erro ao carregar financeiro')
    } finally {
      setCarregando(false)
    }
  }, [pagina, busca, filtroTipo, dataInicio, dataFim])

  useEffect(() => { carregar() }, [carregar])

  const remover = async () => {
    if (!confirmarRemocao?.id) return
    setRemovendo(true)
    try {
      await api.delete(`/financeiro/${confirmarRemocao.id}`)
      toast.success('Transação removida')
      setConfirmarRemocao(null)
      carregar()
    } catch {
      toast.error('Erro ao remover transação')
    } finally {
      setRemovendo(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Financeiro</h1>
          <p className="text-primary-500 text-sm mt-1">Controle de receitas e despesas</p>
        </div>
        <button onClick={() => { setSelecionado(null); setModalAberto(true) }} className="btn-primary">
          <Plus size={18} /> Nova Transação
        </button>
      </div>

      {/* Filtro de período */}
      <div className="card p-4 flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <span className="text-sm font-semibold text-primary-600 flex-shrink-0">Período do resumo:</span>
        <div className="flex items-center gap-2 flex-wrap">
          <input
            type="date"
            className="input w-full sm:w-auto"
            value={dataInicio}
            onChange={e => setDataInicio(e.target.value)}
          />
          <span className="text-primary-400 text-sm">até</span>
          <input
            type="date"
            className="input w-full sm:w-auto"
            value={dataFim}
            onChange={e => setDataFim(e.target.value)}
          />
        </div>
        {/* Atalhos rápidos */}
        <div className="flex gap-2 flex-wrap">
          {[
            { label: 'Este mês', fn: () => { setDataInicio(primeiroDiaMes); setDataFim(ultimoDiaMes) } },
            { label: 'Este ano', fn: () => { setDataInicio(`${mesAtual.getFullYear()}-01-01`); setDataFim(`${mesAtual.getFullYear()}-12-31`) } },
            { label: 'Tudo', fn: () => { setDataInicio(''); setDataFim('') } },
          ].map((a) => (
            <button key={a.label} onClick={a.fn} className="text-sm px-4 min-h-[44px] bg-stone-100 hover:bg-primary-900 hover:text-white text-primary-600 rounded-xl font-medium transition-all">
              {a.label}
            </button>
          ))}
        </div>
      </div>

      {/* Resumo */}
      {resumo && (
        <div className="grid sm:grid-cols-3 gap-4">
          <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-5 h-full flex flex-col">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp size={16} className="text-emerald-600" />
              <span className="text-sm font-medium text-emerald-700">Total Receitas</span>
            </div>
            <div className="text-xl md:text-2xl font-black text-emerald-700 mt-auto break-words">{formatarMoeda(resumo.receitas)}</div>
          </div>
          <div className="bg-red-50 border border-red-100 rounded-2xl p-5 h-full flex flex-col">
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown size={16} className="text-red-500" />
              <span className="text-sm font-medium text-red-600">Total Despesas</span>
            </div>
            <div className="text-xl md:text-2xl font-black text-red-600 mt-auto break-words">{formatarMoeda(resumo.despesas)}</div>
          </div>
          <div className={`rounded-2xl p-5 border h-full flex flex-col ${resumo.saldo >= 0 ? 'bg-blue-50 border-blue-100' : 'bg-orange-50 border-orange-100'}`}>
            <div className="flex items-center gap-2 mb-2">
              <DollarSign size={16} className={resumo.saldo >= 0 ? 'text-blue-600' : 'text-orange-500'} />
              <span className={`text-sm font-medium ${resumo.saldo >= 0 ? 'text-blue-700' : 'text-orange-600'}`}>Saldo Total</span>
            </div>
            <div className={`text-xl md:text-2xl font-black mt-auto break-words ${resumo.saldo >= 0 ? 'text-blue-700' : 'text-orange-600'}`}>
              {formatarMoeda(resumo.saldo)}
            </div>
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-primary-400" />
          <input className="input pl-10" placeholder="Buscar transação..." value={busca} onChange={e => { setBusca(e.target.value); setPagina(0) }} />
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          {(['', 'RECEITA', 'DESPESA'] as const).map((t) => (
            <button
              key={t}
              onClick={() => { setFiltroTipo(t); setPagina(0) }}
              className={`flex-1 sm:flex-none min-h-[44px] px-4 rounded-xl text-sm font-semibold transition-all ${
                filtroTipo === t
                  ? t === 'RECEITA' ? 'bg-emerald-500 text-white' : t === 'DESPESA' ? 'bg-red-500 text-white' : 'bg-primary-900 text-white'
                  : 'bg-white border border-stone-200 text-primary-600 hover:border-primary-300'
              }`}
            >
              {t === '' ? 'Todos' : t === 'RECEITA' ? 'Receitas' : 'Despesas'}
            </button>
          ))}
        </div>
      </div>

      {/* Lista */}
      {carregando ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-4 border-accent-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : transacoes.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-20 h-20 rounded-3xl bg-primary-50 flex items-center justify-center mx-auto mb-5">
            <DollarSign size={36} className="text-primary-300" />
          </div>
          <h3 className="text-lg font-bold text-primary-700 mb-2">{busca || filtroTipo ? 'Nenhuma transação encontrada' : 'Nenhuma transação registrada'}</h3>
          {!busca && !filtroTipo && <button onClick={() => { setSelecionado(null); setModalAberto(true) }} className="btn-primary mt-4"><Plus size={16} /> Registrar transação</button>}
        </div>
      ) : (
        <div className="space-y-2">
          {transacoes.map((t) => (
            <div key={t.id} className="card-hover px-4 sm:px-5 py-4 group">
              <div className="flex items-center gap-3">
                {/* Ícone */}
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  t.tipo === 'RECEITA' ? 'bg-emerald-100' : 'bg-red-100'
                }`}>
                  {t.tipo === 'RECEITA'
                    ? <TrendingUp size={16} className="text-emerald-600" />
                    : <TrendingDown size={16} className="text-red-500" />
                  }
                </div>

                {/* Descrição + meta */}
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-primary-900 truncate text-sm">{t.descricao}</div>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    <span className="text-xs text-primary-400">{formatarData(t.data)}</span>
                    {t.categoria && <span className="text-xs text-primary-400">· {t.categoria}</span>}
                    {t.pago
                      ? <span className="flex items-center gap-0.5 text-xs text-emerald-600 font-medium"><CheckCircle size={11} /> Pago</span>
                      : <span className="flex items-center gap-0.5 text-xs text-yellow-600 font-medium"><Clock size={11} /> Pendente</span>
                    }
                  </div>
                </div>

                {/* Valor + Ações */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={`text-base font-black ${t.tipo === 'RECEITA' ? 'text-emerald-600' : 'text-red-500'}`}>
                    {t.tipo === 'RECEITA' ? '+' : '-'}{formatarMoeda(t.valor)}
                  </span>
                  <div className="flex gap-0.5 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                    <button onClick={() => { setSelecionado(t); setModalAberto(true) }} className="icon-btn" aria-label="Editar">
                      <Edit2 size={16} />
                    </button>
                    <button onClick={() => setConfirmarRemocao(t)} className="icon-btn-danger" aria-label="Excluir">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {total > 15 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-primary-400">Página {pagina + 1} de {Math.ceil(total / 15)}</span>
          <div className="flex gap-2">
            <button onClick={() => setPagina(p => Math.max(0, p - 1))} disabled={pagina === 0} className="btn-outline py-2 px-4 disabled:opacity-40">Anterior</button>
            <button onClick={() => setPagina(p => p + 1)} disabled={(pagina + 1) * 15 >= total} className="btn-outline py-2 px-4 disabled:opacity-40">Próximo</button>
          </div>
        </div>
      )}

      <Modal aberto={modalAberto} fechar={() => setModalAberto(false)} titulo={selecionado?.id ? 'Editar Transação' : 'Nova Transação'} tamanho="md">
        <FormTransacao transacao={selecionado} onSalvar={() => { setModalAberto(false); carregar() }} onFechar={() => setModalAberto(false)} />
      </Modal>

      <ConfirmDialog aberto={!!confirmarRemocao} fechar={() => setConfirmarRemocao(null)} titulo="Remover transação" mensagem={`Remover a transação "${confirmarRemocao?.descricao}"?`} onConfirmar={remover} carregando={removendo} />
    </div>
  )
}
