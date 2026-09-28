import { useEffect, useState, useCallback, Fragment } from 'react'
import {
  Calendar, FileText, ChevronLeft, ChevronRight,
  CheckCircle, X, Printer, TrendingDown, Users,
  DollarSign, AlertTriangle, Coffee, Star,
  Wallet, CreditCard, MinusCircle, Clock, PlusCircle,
  ChevronDown, ChevronUp, Banknote, Info, Search, MessageCircle
} from 'lucide-react'
import api from '../../services/api'
import type { Funcionario, RegistroPonto, RelatorioFolha, RelatorioFuncionarioLinha, StatusDia, MovimentacaoFuncionario, TipoMovimentacao } from '../../types'
import toast from 'react-hot-toast'
import Modal from '../../components/ui/Modal'
import { maskCurrency } from '../../utils/masks'
import { useConfigSite } from '../../contexts/ConfigSiteContext'
import { montarDadosRelatorio } from '../../utils/dadosRelatorio'
import { imprimirFolhaIndividual, enviarFolhaWhatsApp } from '../../utils/folhaPDF'
import { telefoneWhatsApp } from '../../utils/whatsapp'

// ─── Constantes e helpers ──────────────────────────────────────

const STATUS_CONFIG: Record<StatusDia, {
  label: string; short: string; cor: string; corBg: string; corText: string; icon: React.ReactNode
}> = {
  TRABALHADO: {
    label: 'Trabalhado', short: '✓', cor: 'bg-emerald-500',
    corBg: 'bg-emerald-50 border-emerald-200', corText: 'text-emerald-700',
    icon: <CheckCircle size={12} />
  },
  FALTA: {
    label: 'Falta', short: 'F', cor: 'bg-red-500',
    corBg: 'bg-red-50 border-red-200', corText: 'text-red-600',
    icon: <AlertTriangle size={12} />
  },
  FALTA_JUSTIFICADA: {
    label: 'Justificada', short: 'J', cor: 'bg-yellow-500',
    corBg: 'bg-yellow-50 border-yellow-200', corText: 'text-yellow-700',
    icon: <Coffee size={12} />
  },
  FOLGA: {
    label: 'Folga', short: 'FL', cor: 'bg-blue-400',
    corBg: 'bg-blue-50 border-blue-200', corText: 'text-blue-600',
    icon: <Star size={12} />
  },
}

const CARGOS: Record<string, string> = {
  ENGENHEIRO: 'Engenheiro', ARQUITETO: 'Arquiteto', MESTRE_DE_OBRAS: 'Mestre de Obras',
  ENCARREGADO: 'Encarregado', PEDREIRO: 'Pedreiro', SERVENTE: 'Servente',
  ELETRICISTA: 'Eletricista', ENCANADOR: 'Encanador', PINTOR: 'Pintor',
  CARPINTEIRO: 'Carpinteiro', SOLDADOR: 'Soldador', MOTORISTA: 'Motorista',
  ADMINISTRATIVO: 'Administrativo', OUTRO: 'Outro',
}

const TIPO_LABEL: Record<string, string> = {
  DIARIA: 'Diária', SEMANAL: 'Semanal', QUINZENAL: 'Quinzenal', MENSAL: 'Mensal'
}

const MOV_CONFIG: Record<TipoMovimentacao, { label: string; cor: string; bg: string; text: string; icon: React.ReactNode }> = {
  PAGAMENTO: { label: 'Pagamento', cor: 'bg-emerald-500', bg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-700', icon: <Banknote size={14} /> },
  VALE:      { label: 'Vale (adiant.)', cor: 'bg-orange-500', bg: 'bg-orange-50 border-orange-200',   text: 'text-orange-700', icon: <CreditCard size={14} /> },
  DESCONTO:  { label: 'Desconto',  cor: 'bg-red-500',    bg: 'bg-red-50 border-red-200',          text: 'text-red-700',    icon: <MinusCircle size={14} /> },
}

function fmt(v: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(v) || 0)
}
function fmtData(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString('pt-BR')
}
function nomeMes(ano: number, mes: number) {
  return new Date(ano, mes - 1, 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
}
function diasDoMes(ano: number, mes: number) {
  const dias: Date[] = []
  const total = new Date(ano, mes, 0).getDate()
  for (let d = 1; d <= total; d++) dias.push(new Date(ano, mes - 1, d))
  return dias
}
function isWeekend(d: Date) { return d.getDay() === 0 || d.getDay() === 6 }
function toISO(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// ─── Modal de detalhe do dia ───────────────────────────────────
interface ModalDiaProps {
  aberto: boolean
  fechar: () => void
  funcionario: Funcionario | null
  data: string
  isWeekend: boolean
  registroExistente: RegistroPonto | null
  onSalvar: () => void
  onRemover: () => void
}

function ModalDia({ aberto, fechar, funcionario, data, isWeekend: weekend, registroExistente, onSalvar, onRemover }: ModalDiaProps) {
  const [status, setStatus] = useState<StatusDia>(registroExistente?.status ?? (weekend ? 'TRABALHADO' : 'FALTA'))
  const [descontar, setDescontar] = useState(registroExistente?.descontar ?? true)
  const [motivo, setMotivo] = useState(registroExistente?.motivo ?? '')
  const [observacoes, setObservacoes] = useState(registroExistente?.observacoes ?? '')
  const [salvando, setSalvando] = useState(false)
  const [confirmarFuturo, setConfirmarFuturo] = useState(false)
  const dataFutura = !!data && data > toISO(new Date())

  useEffect(() => {
    setStatus(registroExistente?.status ?? (weekend ? 'TRABALHADO' : 'FALTA'))
    setDescontar(registroExistente?.descontar ?? true)
    setMotivo(registroExistente?.motivo ?? '')
    setObservacoes(registroExistente?.observacoes ?? '')
    setConfirmarFuturo(false)
  }, [registroExistente, aberto, weekend, data])

  const persistir = async () => {
    if (!funcionario?.id) return
    setSalvando(true)
    try {
      await api.post(`/funcionarios/${funcionario.id}/ponto`, {
        data, status, descontar, motivo, observacoes
      })
      toast.success('Registro salvo!')
      onSalvar()
      fechar()
    } catch {
      toast.error('Erro ao salvar registro')
    } finally {
      setSalvando(false)
      setConfirmarFuturo(false)
    }
  }

  const salvar = () => {
    if (dataFutura && !confirmarFuturo) {
      setConfirmarFuturo(true)
      return
    }
    persistir()
  }

  const remover = async () => {
    if (!registroExistente?.id || !funcionario?.id) return
    setSalvando(true)
    try {
      await api.delete(`/funcionarios/${funcionario.id}/ponto/${registroExistente.id}`)
      toast.success('Registro removido')
      onRemover()
      fechar()
    } catch {
      toast.error('Erro ao remover registro')
    } finally {
      setSalvando(false)
    }
  }

  const dataFormatada = fmtData(data)
  const diaSemana = data ? new Date(data + 'T00:00:00').toLocaleDateString('pt-BR', { weekday: 'long' }) : ''

  return (
    <Modal aberto={aberto} fechar={fechar} titulo={`${funcionario?.nome || ''}`} tamanho="sm">
      <div className="space-y-4">
        {/* Data */}
        <div className="flex items-center gap-2 bg-stone-50 rounded-xl px-4 py-3">
          <Calendar size={15} className="text-primary-400" />
          <div>
            <div className="text-sm font-bold text-primary-900 capitalize">{diaSemana}</div>
            <div className="text-xs text-primary-400">{dataFormatada}</div>
          </div>
          {weekend && (
            <span className="ml-auto text-xs font-bold bg-violet-100 text-violet-600 px-2 py-0.5 rounded-full">
              Fim de semana
            </span>
          )}
        </div>

        {dataFutura && !confirmarFuturo && (
          <div className="rounded-xl px-4 py-3 text-xs bg-amber-50 border border-amber-200 text-amber-800">
            Esta data ainda não chegou. Ao salvar, vamos pedir uma confirmação antes de registrar.
          </div>
        )}

        {confirmarFuturo && (
          <div className="rounded-2xl px-4 py-4 bg-amber-50 border-2 border-amber-300 text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-white mx-auto flex items-center justify-center">
              <AlertTriangle size={22} className="text-amber-500" />
            </div>
            <p className="text-sm font-bold text-amber-900">Data futura</p>
            <p className="text-sm text-amber-800 leading-relaxed">
              {dataFormatada} ({diaSemana}) ainda não chegou.
              Deseja marcar <strong>{STATUS_CONFIG[status].label.toLowerCase()}</strong>
              {funcionario?.nome ? ` para ${funcionario.nome}` : ''} mesmo assim?
            </p>
          </div>
        )}

        {!confirmarFuturo && (
          <>
        {funcionario && (
          <div className="rounded-xl px-4 py-3 text-xs bg-emerald-50 border border-emerald-100 text-emerald-800">
            {weekend
              ? 'Fim de semana só entra no pagamento se marcar como Trabalhado.'
              : funcionario.freelancer
                ? 'Freelancer: este dia só entra no pagamento se marcar presença.'
                : `Dia útil: se não marcar falta, conta como trabalhado${funcionario.valorDiaria ? ` (${fmt(funcionario.valorDiaria)} / dia)` : ''}.`
            }
          </div>
        )}

        {/* Status */}
        <div>
          <label className="label">Status do dia</label>
          <div className="grid grid-cols-2 gap-2">
            {(Object.entries(STATUS_CONFIG) as [StatusDia, typeof STATUS_CONFIG[StatusDia]][]).map(([key, cfg]) => (
              <button
                key={key}
                type="button"
                onClick={() => setStatus(key)}
                className={`flex items-center gap-2 px-3 py-3.5 min-h-[52px] rounded-xl border-2 text-sm font-semibold transition-all ${
                  status === key
                    ? `${cfg.corBg} ${cfg.corText} border-current`
                    : 'border-stone-200 text-primary-400 hover:border-stone-300'
                }`}
              >
                <span className={`w-5 h-5 rounded flex items-center justify-center text-white text-xs ${cfg.cor}`}>
                  {cfg.short}
                </span>
                {cfg.label}
              </button>
            ))}
          </div>
        </div>

        {/* Descontar — só para faltas */}
        {(status === 'FALTA' || status === 'FALTA_JUSTIFICADA') && (
          <div className="flex items-center gap-3 bg-stone-50 rounded-xl px-4 py-3">
            <input
              type="checkbox"
              id="descontar"
              checked={descontar}
              onChange={e => setDescontar(e.target.checked)}
              className="w-4 h-4 rounded border-stone-300"
            />
            <label htmlFor="descontar" className="text-sm font-medium text-primary-700 cursor-pointer">
              Descontar do pagamento
            </label>
          </div>
        )}

        {/* Motivo */}
        <div>
          <label className="label">Motivo / Observação rápida</label>
          <input
            className="input"
            placeholder={
              status === 'TRABALHADO' ? 'Ex: Hora extra, projeto X...' :
              status === 'FALTA' ? 'Ex: Não compareceu' :
              status === 'FALTA_JUSTIFICADA' ? 'Ex: Atestado médico' :
              'Ex: Feriado, folga combinada...'
            }
            value={motivo}
            onChange={e => setMotivo(e.target.value)}
          />
        </div>

        {/* Observações */}
        <div>
          <label className="label">Observações adicionais</label>
          <textarea className="input resize-none" rows={2} value={observacoes} onChange={e => setObservacoes(e.target.value)} />
        </div>
          </>
        )}

        <div className="modal-actions">
          {confirmarFuturo ? (
            <>
              <button
                type="button"
                onClick={() => setConfirmarFuturo(false)}
                disabled={salvando}
                className="flex-1 btn-outline min-h-[48px]"
              >
                Voltar
              </button>
              <button
                type="button"
                onClick={persistir}
                disabled={salvando}
                className="flex-1 btn-primary min-h-[48px]"
              >
                {salvando ? '...' : 'Sim, continuar'}
              </button>
            </>
          ) : (
            <>
              {registroExistente && (
                <button onClick={remover} disabled={salvando} className="btn-outline min-h-[48px] text-red-500 border-red-200 hover:bg-red-50 px-3">
                  <X size={15} />
                </button>
              )}
              <button onClick={fechar} className="flex-1 btn-outline min-h-[48px]">Cancelar</button>
              <button onClick={salvar} disabled={salvando} className="flex-1 btn-primary min-h-[48px]">
                {salvando ? '...' : 'Salvar'}
              </button>
            </>
          )}
        </div>
      </div>
    </Modal>
  )
}

// ─── Célula do calendário ──────────────────────────────────────
interface CelulaProps {
  data: Date
  registro?: RegistroPonto
  onClick: () => void
  disabled?: boolean
  freelancer?: boolean
  tamanho?: 'sm' | 'lg'
}

function Celula({ data, registro, onClick, disabled, freelancer, tamanho = 'sm' }: CelulaProps) {
  const weekend = isWeekend(data)
  const futuro = toISO(data) > toISO(new Date())
  const isHoje = toISO(data) === toISO(new Date())
  const grande = tamanho === 'lg'
  const base = grande
    ? `w-full min-h-[46px] sm:min-h-[42px] rounded-xl flex flex-col items-center justify-center gap-0 py-1 ${isHoje ? 'ring-2 ring-accent-500 ring-offset-1' : ''}`
    : 'w-8 h-8 rounded-lg mx-auto flex items-center justify-center'

  if (disabled) {
    return (
      <div className={`${base} bg-stone-50 cursor-not-allowed`} title="Antes da data de admissão">
        {grande && <span className="text-[10px] text-stone-300">{data.getDate()}</span>}
        <span className="text-xs text-stone-200">✕</span>
      </div>
    )
  }

  if (!registro) {
    if (futuro && !weekend) {
      return (
        <button onClick={onClick} className={`${base} hover:bg-stone-100`} title="Dia ainda não chegou">
          {grande && <span className="text-[11px] text-primary-300 font-semibold">{data.getDate()}</span>}
          <span className="text-xs text-stone-300">·</span>
        </button>
      )
    }
    return (
      <button
        onClick={onClick}
        className={`${base} transition-all active:scale-95 ${
          weekend ? 'bg-stone-100' : freelancer ? 'bg-amber-50' : 'bg-emerald-50'
        }`}
        title={
          weekend ? 'Fim de semana' : freelancer ? 'Freelancer: marcar presença' : 'Conta como trabalhado'
        }
      >
        {grande && (
          <span className={`text-[11px] font-bold leading-none ${weekend ? 'text-violet-400' : 'text-primary-600'}`}>
            {data.getDate()}
          </span>
        )}
        {weekend
          ? <span className="text-xs text-stone-400">—</span>
          : freelancer
            ? <span className="text-xs text-amber-500">○</span>
            : <span className="text-xs text-emerald-500">✓</span>
        }
      </button>
    )
  }

  const cfg = STATUS_CONFIG[registro.status]
  return (
    <button
      onClick={onClick}
      className={`${base} font-black text-white active:scale-95 ${cfg.cor}`}
      title={`${cfg.label}${registro.motivo ? ` — ${registro.motivo}` : ''}`}
    >
      {grande && <span className="text-[11px] font-bold text-white/90 leading-none">{data.getDate()}</span>}
      <span className={grande ? 'text-sm' : 'text-[11px]'}>{cfg.short}</span>
    </button>
  )
}

// ─── Aba: Controle de Ponto ────────────────────────────────────
function AbaControle() {
  const hoje = new Date()
  const [ano, setAno] = useState(hoje.getFullYear())
  const [mes, setMes] = useState(hoje.getMonth() + 1)
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([])
  const [pontos, setPontos] = useState<Record<number, Record<string, RegistroPonto>>>({})
  const [carregando, setCarregando] = useState(true)
  const [modalAberto, setModalAberto] = useState(false)
  const [funcSel, setFuncSel] = useState<Funcionario | null>(null)
  const [dataSel, setDataSel] = useState('')
  const [registroSel, setRegistroSel] = useState<RegistroPonto | null>(null)
  const [busca, setBusca] = useState('')
  const [visao, setVisao] = useState<'semana' | 'mes'>('semana')
  const [marcadoRapido, setMarcadoRapido] = useState<number | null>(null)

  const fetchInicio = toISO((() => {
    const d = new Date(ano, mes - 1, 1)
    d.setDate(1 - d.getDay())
    return d
  })())
  const fetchFim = toISO((() => {
    const d = new Date(ano, mes, 0)
    d.setDate(d.getDate() + (6 - d.getDay()))
    return d
  })())

  const carregar = useCallback(async (silencioso = false) => {
    if (!silencioso) setCarregando(true)
    try {
      const { data: resp } = await api.get<{ content: Funcionario[] }>('/funcionarios?size=200&ativo=true')
      setFuncionarios(resp.content)

      const mapa: Record<number, Record<string, RegistroPonto>> = {}
      await Promise.all(resp.content.map(async (f) => {
        if (!f.id) return
        const { data: regs } = await api.get<RegistroPonto[]>(
          `/funcionarios/${f.id}/ponto?inicio=${fetchInicio}&fim=${fetchFim}`
        )
        mapa[f.id] = Object.fromEntries(regs.map(r => [r.data, r]))
      }))
      setPontos(mapa)
    } catch {
      toast.error('Erro ao carregar dados')
    } finally {
      if (!silencioso) setCarregando(false)
    }
  }, [fetchInicio, fetchFim])

  useEffect(() => { carregar() }, [carregar])

  const navMes = (delta: number) => {
    const d = new Date(ano, mes - 1 + delta, 1)
    setAno(d.getFullYear())
    setMes(d.getMonth() + 1)
  }

  const abrirModal = (func: Funcionario, dia: Date) => {
    const dataStr = toISO(dia)
    setFuncSel(func)
    setDataSel(dataStr)
    setRegistroSel(func.id ? (pontos[func.id]?.[dataStr] ?? null) : null)
    setModalAberto(true)
  }

  const marcarRapido = async (func: Funcionario, status: StatusDia) => {
    if (!func.id) return
    const hojeISO = toISO(new Date())
    if (func.dataAdmissao && hojeISO < func.dataAdmissao) {
      toast.error('Funcionário ainda não havia sido admitido')
      return
    }
    setMarcadoRapido(func.id)
    try {
      await api.post(`/funcionarios/${func.id}/ponto`, { data: hojeISO, status, descontar: true })
      toast.success(status === 'TRABALHADO' ? 'Presença de hoje marcada' : 'Falta de hoje marcada')
      await carregar(true)
    } catch {
      toast.error('Erro ao salvar')
    } finally {
      setMarcadoRapido(null)
    }
  }

  function diasDaSemanaVisivel() {
    const noMesAtual = ano === hoje.getFullYear() && mes === hoje.getMonth() + 1
    const ref = noMesAtual ? hoje : new Date(ano, mes - 1, 1)
    const start = new Date(ref)
    start.setDate(ref.getDate() - ref.getDay())
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start)
      d.setDate(start.getDate() + i)
      return d
    })
  }

  const dias = diasDoMes(ano, mes)

  // Resumo do mês por funcionário — mesma regra do pagamento
  function resumoFunc(func: Funcionario) {
    const regs = pontos[func.id!] || {}
    const hojeISO = toISO(new Date())
    let faltas = 0, trabalhados = 0, extras = 0
    dias.forEach(d => {
      const iso = toISO(d)
      if (func.dataAdmissao && iso < func.dataAdmissao) return
      const r = regs[iso]
      if (r) {
        if (r.status === 'TRABALHADO') { trabalhados++; if (isWeekend(d)) extras++ }
        if (r.status === 'FALTA' || r.status === 'FALTA_JUSTIFICADA') faltas++
        return
      }
      if (isWeekend(d) || iso > hojeISO) return
      if (!func.freelancer) trabalhados++
    })
    const valorDia = func.valorDiaria || 0
    return { faltas, trabalhados, extras, estimado: trabalhados * valorDia, valorDia }
  }

  const diasNaSemana = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']
  const lista = funcionarios.filter(f =>
    !busca.trim() || f.nome.toLowerCase().includes(busca.trim().toLowerCase())
  )

  function CalendarioFuncionario({ func, diasCal }: { func: Funcionario; diasCal: Date[] }) {
    const regs = pontos[func.id!] || {}
    const offset = visao === 'mes' ? (diasCal[0]?.getDay() ?? 0) : 0
    const mesAtual = visao === 'semana'
    return (
      <div>
        <div className="grid grid-cols-7 gap-[3px] sm:gap-1 mb-1">
          {diasNaSemana.map((l, i) => (
            <div key={i} className={`text-center text-[11px] font-bold ${i === 0 || i === 6 ? 'text-violet-400' : 'text-primary-400'}`}>
              {l}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-[3px] sm:gap-1">
          {Array.from({ length: offset }).map((_, i) => <div key={`e-${i}`} />)}
          {diasCal.map((d, i) => {
            const dataStr = toISO(d)
            const foraDoMes = d.getMonth() !== mes - 1
            const antesAdmissao = func.dataAdmissao ? dataStr < func.dataAdmissao : false
            return (
              <div key={i} className={mesAtual && foraDoMes ? 'opacity-35' : undefined}>
                <Celula
                  data={d}
                  registro={regs[dataStr]}
                  onClick={() => abrirModal(func, d)}
                  disabled={antesAdmissao}
                  freelancer={!!func.freelancer}
                  tamanho="lg"
                />
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3 sm:space-y-4 pb-8">
      {/* Navegação */}
      <div className="flex items-center justify-between gap-2">
        <button onClick={() => navMes(-1)} className="p-3 min-w-[44px] min-h-[44px] hover:bg-stone-100 rounded-xl transition-colors" aria-label="Mês anterior">
          <ChevronLeft size={22} className="text-primary-500" />
        </button>
        <h2 className="text-base sm:text-lg font-bold text-primary-900 capitalize text-center leading-tight">{nomeMes(ano, mes)}</h2>
        <button onClick={() => navMes(1)} className="p-3 min-w-[44px] min-h-[44px] hover:bg-stone-100 rounded-xl transition-colors" aria-label="Próximo mês">
          <ChevronRight size={22} className="text-primary-500" />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-1 bg-stone-100 p-1 rounded-xl lg:hidden">
        <button
          type="button"
          onClick={() => setVisao('semana')}
          className={`min-h-[44px] rounded-lg text-sm font-bold transition-all ${visao === 'semana' ? 'bg-white shadow-sm text-primary-900' : 'text-primary-400'}`}
        >
          Esta semana
        </button>
        <button
          type="button"
          onClick={() => setVisao('mes')}
          className={`min-h-[44px] rounded-lg text-sm font-bold transition-all ${visao === 'mes' ? 'bg-white shadow-sm text-primary-900' : 'text-primary-400'}`}
        >
          Mês inteiro
        </button>
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-primary-400" />
        <input
          className="input pl-10 min-h-[44px]"
          placeholder="Buscar funcionário..."
          value={busca}
          onChange={e => setBusca(e.target.value)}
        />
      </div>

      <div className="flex items-start gap-2 rounded-xl bg-stone-50 border border-stone-100 px-3 py-2.5 text-xs text-primary-600">
        <Info size={14} className="text-primary-400 mt-0.5 flex-shrink-0" />
        <p>Toque no dia para marcar. Fixo: dia útil conta sozinho. Freelancer: só conta o que marcar.</p>
      </div>

      <div className="flex flex-wrap gap-x-3 gap-y-1.5 text-xs px-0.5">
        {(Object.entries(STATUS_CONFIG) as [StatusDia, typeof STATUS_CONFIG[StatusDia]][]).map(([key, cfg]) => (
          <div key={key} className="flex items-center gap-1">
            <span className={`w-3.5 h-3.5 rounded ${cfg.cor} flex items-center justify-center text-white text-[8px] font-black`}>{cfg.short}</span>
            <span className="text-primary-500">{cfg.label}</span>
          </div>
        ))}
      </div>

      {carregando ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-4 border-accent-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : lista.length === 0 ? (
        <div className="card p-12 text-center text-primary-400">
          <Users size={36} className="mx-auto mb-3 text-primary-200" />
          <p>{busca ? 'Nenhum funcionário encontrado' : 'Nenhum funcionário cadastrado'}</p>
        </div>
      ) : (
        <>
          {/* Mobile: cards com calendário */}
          <div className="space-y-3 lg:hidden -mx-1">
            {lista.map(func => {
              const { faltas, trabalhados, extras, estimado, valorDia } = resumoFunc(func)
              const hojeISO = toISO(hoje)
              const noMesAtual = ano === hoje.getFullYear() && mes === hoje.getMonth() + 1
              const podeHoje = noMesAtual && !(func.dataAdmissao && hojeISO < func.dataAdmissao)
              const statusHoje = func.id ? pontos[func.id]?.[hojeISO] : undefined
              const diasCal = visao === 'semana' ? diasDaSemanaVisivel() : dias
              return (
                <div key={func.id} className="card overflow-hidden">
                  <div className="p-3 pb-2 flex items-start gap-3">
                    <div className="w-11 h-11 rounded-xl bg-primary-900 flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {func.foto
                        ? <img src={func.foto} alt={func.nome} className="w-full h-full object-cover" />
                        : <span className="text-accent-400 font-bold text-sm">
                            {func.nome.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()}
                          </span>
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-primary-900 leading-snug break-words">{func.nome}</div>
                      <div className="flex flex-wrap items-center gap-1.5 mt-1">
                        {func.freelancer && <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-orange-100 text-orange-600">Freelancer</span>}
                        {func.cargo && <span className="text-xs text-primary-400">{CARGOS[func.cargo]}</span>}
                      </div>
                      <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1.5 text-xs">
                        <span className="font-black text-emerald-600">{trabalhados}d</span>
                        {valorDia > 0 && <span className="font-bold text-primary-700">{fmt(estimado)}</span>}
                        {faltas > 0 && <span className="font-bold text-red-500">{faltas} falta{faltas > 1 ? 's' : ''}</span>}
                        {extras > 0 && <span className="font-bold text-violet-500">+{extras} FdS</span>}
                      </div>
                    </div>
                  </div>

                  {podeHoje && (
                    <div className="grid grid-cols-2 gap-2 px-3 pb-3">
                      <button
                        type="button"
                        disabled={marcadoRapido === func.id}
                        onClick={() => marcarRapido(func, 'TRABALHADO')}
                        className={`min-h-[48px] rounded-xl text-sm font-bold active:scale-95 transition-all ${
                          statusHoje?.status === 'TRABALHADO'
                            ? 'bg-emerald-500 text-white'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}
                      >
                        {marcadoRapido === func.id ? '...' : '✓ Presente hoje'}
                      </button>
                      <button
                        type="button"
                        disabled={marcadoRapido === func.id}
                        onClick={() => marcarRapido(func, 'FALTA')}
                        className={`min-h-[48px] rounded-xl text-sm font-bold active:scale-95 transition-all ${
                          statusHoje?.status === 'FALTA'
                            ? 'bg-red-500 text-white'
                            : 'bg-red-50 text-red-600 border border-red-200'
                        }`}
                      >
                        {marcadoRapido === func.id ? '...' : 'Falta hoje'}
                      </button>
                    </div>
                  )}

                  <div className="px-2 pb-3">
                    <CalendarioFuncionario func={func} diasCal={diasCal} />
                    <p className="text-[11px] text-primary-400 mt-2 text-center">Toque no dia para marcar</p>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Desktop: tabela do mês */}
          <div className="hidden lg:block card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-stone-100">
                    <th className="text-left px-3 py-3 text-xs font-bold text-primary-400 uppercase tracking-wider sticky left-0 bg-white z-10 w-56 min-w-56 max-w-56 shadow-[4px_0_8px_-6px_rgba(0,0,0,0.12)]">
                      Funcionário
                    </th>
                    {dias.map((d, i) => {
                      const weekend = isWeekend(d)
                      const isHoje = toISO(d) === toISO(hoje)
                      return (
                        <th key={i} className={`text-center py-2 min-w-[36px] ${weekend ? 'bg-violet-50/50' : ''} ${isHoje ? 'bg-accent-50' : ''}`}>
                          <div className={`text-[10px] ${weekend ? 'text-violet-400' : 'text-primary-300'}`}>
                            {diasNaSemana[d.getDay()]}
                          </div>
                          <div className={`text-xs font-bold ${isHoje ? 'text-accent-600' : weekend ? 'text-violet-500' : 'text-primary-600'}`}>
                            {d.getDate()}
                          </div>
                        </th>
                      )
                    })}
                    <th className="sticky right-0 bg-white z-10 px-3 py-3 text-xs font-bold text-primary-400 uppercase tracking-wider text-center min-w-[90px] border-l border-stone-100">
                      Resumo
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-50">
                  {lista.map(func => {
                    const regs = pontos[func.id!] || {}
                    const { faltas, trabalhados, extras, estimado, valorDia } = resumoFunc(func)
                    return (
                      <tr key={func.id} className="hover:bg-stone-50/50 transition-colors group">
                        <td className="px-3 py-2 sticky left-0 bg-white group-hover:bg-stone-50/50 z-10 w-56 min-w-56 max-w-56 shadow-[4px_0_8px_-6px_rgba(0,0,0,0.12)]">
                          <div className="flex items-start gap-2 min-w-0">
                            <div className="w-7 h-7 rounded-lg bg-primary-900 flex items-center justify-center flex-shrink-0 overflow-hidden mt-0.5">
                              {func.foto
                                ? <img src={func.foto} alt={func.nome} className="w-full h-full object-cover" />
                                : <span className="text-accent-400 font-bold text-[10px]">
                                    {func.nome.split(' ').slice(0,2).map(n=>n[0]).join('').toUpperCase()}
                                  </span>
                              }
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="font-semibold text-primary-900 text-sm leading-snug break-words" title={func.nome}>
                                {func.nome}
                              </div>
                              <div className="flex flex-wrap items-center gap-1 mt-0.5">
                                {func.freelancer && (
                                  <span className="text-[8px] font-black px-1 py-0.5 rounded bg-orange-100 text-orange-600">FREE</span>
                                )}
                                {func.cargo && (
                                  <span className="text-[11px] text-primary-400 leading-tight">{CARGOS[func.cargo]}</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                        {dias.map((d, i) => {
                          const dataStr = toISO(d)
                          const antesAdmissao = func.dataAdmissao ? dataStr < func.dataAdmissao : false
                          return (
                            <td key={i} className={`p-0.5 text-center align-middle ${isWeekend(d) ? 'bg-violet-50/30' : ''}`}>
                              <Celula
                                data={d}
                                registro={regs[dataStr]}
                                onClick={() => abrirModal(func, d)}
                                disabled={antesAdmissao}
                                freelancer={!!func.freelancer}
                              />
                            </td>
                          )
                        })}
                        <td className="px-2 py-2 sticky right-0 bg-white group-hover:bg-stone-50/50 z-10 border-l border-stone-100 text-center">
                          <div className="flex flex-col items-center gap-0.5 min-w-[72px]">
                            <span className="text-xs font-black text-emerald-500">{trabalhados}d</span>
                            {valorDia > 0 && <span className="text-[10px] font-bold text-primary-700">{fmt(estimado)}</span>}
                            {extras > 0 && <span className="text-[10px] font-bold text-violet-500">+{extras} ext</span>}
                            {faltas > 0 && <span className="text-[10px] font-bold text-red-500">{faltas}f</span>}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <div className="px-4 py-3 bg-stone-50 border-t border-stone-100 text-xs text-primary-400">
              Clique no dia para marcar presença, falta ou folga.
            </div>
          </div>
        </>
      )}

      <ModalDia
        aberto={modalAberto}
        fechar={() => setModalAberto(false)}
        funcionario={funcSel}
        data={dataSel}
        isWeekend={dataSel ? isWeekend(new Date(dataSel + 'T00:00:00')) : false}
        registroExistente={registroSel}
        onSalvar={() => carregar(true)}
        onRemover={() => carregar(true)}
      />
    </div>
  )
}

// ─── Aba: Relatório de Folha ────────────────────────────────────
function AbaRelatorio() {
  const { config } = useConfigSite()
  const hoje = new Date()
  const [inicio, setInicio] = useState(
    `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-01`
  )
  const [fim, setFim] = useState(toISO(hoje))
  const [relatorio, setRelatorio] = useState<RelatorioFolha | null>(null)
  const [carregando, setCarregando] = useState(false)
  const [expandido, setExpandido] = useState<number | null>(null)
  const [filtroFunc, setFiltroFunc] = useState<number | ''>('')
  const [enviandoId, setEnviandoId] = useState<number | null>(null)

  const gerar = useCallback(async () => {
    if (!inicio || !fim) return
    setCarregando(true)
    try {
      const { data } = await api.get<RelatorioFolha>(`/relatorio/folha?inicio=${inicio}&fim=${fim}`)
      setRelatorio(data)
    } catch {
      toast.error('Erro ao gerar relatório')
    } finally {
      setCarregando(false)
    }
  }, [inicio, fim])

  useEffect(() => { gerar() }, [gerar])

  const setMesRapido = (mesStr: string) => {
    const [y, m] = mesStr.split('-').map(Number)
    const primeiro = `${y}-${String(m).padStart(2, '0')}-01`
    const ultimoMes = toISO(new Date(y, m, 0))
    const hojeISO = toISO(new Date())
    setInicio(primeiro)
    setFim(ultimoMes > hojeISO ? hojeISO : ultimoMes)
  }

  const linhasFiltradas = (relatorio?.funcionarios || []).filter(l =>
    !filtroFunc || l.funcionario.id === filtroFunc
  )

  const aReceberLinha = (l: RelatorioFuncionarioLinha) =>
    l.aReceber ?? Math.max(0,
      (l.valorLiquido || 0) - (l.valesPendentes || 0) - (l.descontosAvulsos || 0) - (l.pagamentosJaFeitos || 0)
    )

  const optsIndividual = (linha: RelatorioFuncionarioLinha) => ({
    linha,
    relatorio: relatorio!,
    empresa: config,
    cargoLabel: CARGOS[linha.funcionario.cargo] || linha.funcionario.cargo,
    tipoLabel: TIPO_LABEL[linha.funcionario.tipoRecebimento] || linha.funcionario.tipoRecebimento,
  })

  const imprimirIndividual = (linha: RelatorioFuncionarioLinha) => {
    if (!relatorio) return
    imprimirFolhaIndividual(optsIndividual(linha))
  }

  const enviarWhats = async (linha: RelatorioFuncionarioLinha) => {
    if (!relatorio) return
    if (!telefoneWhatsApp(linha.funcionario)) {
      toast.error('Cadastre o celular do funcionário para enviar no WhatsApp.')
      return
    }
    setEnviandoId(linha.funcionario.id)
    try {
      const modo = await enviarFolhaWhatsApp(optsIndividual(linha))
      toast.success(
        modo === 'compartilhado'
          ? 'Escolha o WhatsApp na lista para enviar o PDF em anexo.'
          : 'WhatsApp aberto. Anexe o PDF que acabou de ser baixado na conversa.'
      )
    } catch (err) {
      if ((err as Error).name === 'AbortError') return
      toast.error((err as Error).message || 'Não foi possível enviar no WhatsApp')
    } finally {
      setEnviandoId(null)
    }
  }

  const imprimir = () => {
    if (!relatorio) return
    const win = window.open('', '_blank')
    if (!win) return
    const d = montarDadosRelatorio(config)
    const periodo = `${fmtData(relatorio.periodo.inicio)} a ${fmtData(relatorio.periodo.fim)}`
    const cabecalhoContato = [d.documentos.join(' · '), ...d.contatoLinhas].filter(Boolean).join('<br/>')
    const logoHTML = d.logo
      ? `<img src="${d.logo}" alt="" style="width:52px;height:52px;object-fit:cover;border-radius:10px;border:1px solid #e5e7eb"/>`
      : `<div style="width:52px;height:52px;border-radius:10px;background:#1a1c22;color:#d4891a;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:20px">${(d.nome || 'L').charAt(0)}</div>`

    const linhas = relatorio.funcionarios.map(f => {
      const regs = f.registros.map(r => {
        const cfg = STATUS_CONFIG[r.status]
        return `<span style="display:inline-flex;align-items:center;gap:4px;padding:2px 8px;border-radius:999px;font-size:11px;background:${
          r.status === 'TRABALHADO' ? '#d1fae5' :
          r.status === 'FALTA' ? '#fee2e2' :
          r.status === 'FALTA_JUSTIFICADA' ? '#fef3c7' : '#dbeafe'
        };color:${
          r.status === 'TRABALHADO' ? '#065f46' :
          r.status === 'FALTA' ? '#991b1b' :
          r.status === 'FALTA_JUSTIFICADA' ? '#92400e' : '#1e40af'
        };">${cfg.short} ${fmtData(r.data)}${r.motivo ? ' · ' + r.motivo : ''}${r.descontar === false && r.status !== 'TRABALHADO' ? ' (sem desc.)' : ''}</span>`
      }).join(' ')

      return `
        <tr style="border-bottom:1px solid #eee; vertical-align:top;">
          <td style="padding:10px 8px;">
            <strong>${f.funcionario.nome}</strong><br>
            <small style="color:#666;">${CARGOS[f.funcionario.cargo] || f.funcionario.cargo}</small>
          </td>
          <td style="padding:10px 8px; text-align:center;">${TIPO_LABEL[f.funcionario.tipoRecebimento]}</td>
          <td style="padding:10px 8px; text-align:center;">${f.diasUteisNoPeriodo}</td>
          <td style="padding:10px 8px; text-align:center; color:#16a34a; font-weight:bold;">${f.diasTrabalhados}</td>
          <td style="padding:10px 8px; text-align:center; color:#7c3aed; font-weight:bold;">${f.diasExtras > 0 ? '+' + f.diasExtras : '—'}</td>
          <td style="padding:10px 8px; text-align:center; color:${f.faltasTotal > 0 ? '#dc2626' : '#16a34a'}; font-weight:bold;">${f.faltasTotal}</td>
          <td style="padding:10px 8px; text-align:center;">${f.faltasJustificadas > 0 ? f.faltasJustificadas : '—'}</td>
          <td style="padding:10px 8px; text-align:center; color:${f.faltasADescontar > 0 ? '#ea580c' : '#999'};">${f.faltasADescontar > 0 ? f.faltasADescontar : '—'}</td>
          <td style="padding:10px 8px; text-align:right;">${fmt(f.valorBruto)}<br><small style="color:#888;font-weight:400">${f.diasTrabalhados}d × ${fmt(f.valorDia || f.funcionario.valorDiaria)}</small></td>
          <td style="padding:10px 8px; text-align:right; color:#ea580c;">${(f.valesPendentes || f.valesNoPeriodo || 0) > 0 ? '- ' + fmt(f.valesPendentes ?? f.valesNoPeriodo ?? 0) : '—'}</td>
          <td style="padding:10px 8px; text-align:right; color:#dc2626;">${f.descontos > 0 ? '- ' + fmt(f.descontos) : '—'}</td>
          <td style="padding:10px 8px; text-align:right; font-weight:900; color:#166534;">${fmt(aReceberLinha(f))}</td>
        </tr>
        ${regs ? `<tr style="border-bottom:2px solid #eee; background:#fafaf8;">
          <td colspan="12" style="padding:6px 8px 10px 8px;">
            <div style="font-size:11px;color:#999;margin-bottom:4px;">Registros marcados:</div>
            <div style="display:flex;flex-wrap:wrap;gap:4px;">${regs}</div>
          </td>
        </tr>` : ''}
      `
    }).join('')

    win.document.write(`<!DOCTYPE html><html lang="pt-BR"><head>
      <meta charset="UTF-8">
      <title>Folha de Pagamento — ${d.nome}</title>
      <style>
        *{box-sizing:border-box;margin:0;padding:0}
        body{font-family:-apple-system,sans-serif;font-size:13px;color:#111;padding:32px}
        h1{font-size:22px;font-weight:900;margin-bottom:4px}
        .sub{color:#666;font-size:12px;margin-bottom:24px}
        .cards{display:flex;gap:16px;flex-wrap:wrap;margin-bottom:28px}
        .card{background:#f9f9f7;border:1px solid #e8e8e0;border-radius:12px;padding:16px 20px}
        .card-label{font-size:11px;color:#888;text-transform:uppercase;letter-spacing:.05em;margin-bottom:4px}
        .card-val{font-size:20px;font-weight:900}
        table{width:100%;border-collapse:collapse}
        thead tr{background:#111;color:#fff}
        thead th{padding:8px;text-align:left;font-size:10px;text-transform:uppercase;letter-spacing:.04em;white-space:nowrap}
        tfoot tr{background:#f3f4f6;font-weight:bold}
        tfoot td{padding:10px 8px}
        .rodape{margin-top:40px;padding-top:16px;border-top:1px solid #e5e7eb;text-align:center;font-size:11px;color:#9ca3af;line-height:1.6}
        @media print{button{display:none}}
      </style></head><body>
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:24px;margin-bottom:28px;padding-bottom:20px;border-bottom:2px solid #1a1c22">
        <div style="display:flex;gap:12px;align-items:flex-start">
          ${logoHTML}
          <div>
            <div style="font-size:20px;font-weight:900;color:#1a1c22">${d.nome}</div>
            ${d.slogan ? `<div style="font-size:10px;font-weight:600;letter-spacing:2px;text-transform:uppercase;color:#9ca3af;margin-top:2px">${d.slogan}</div>` : ''}
            ${cabecalhoContato ? `<div style="margin-top:8px;font-size:12px;color:#6b7280;line-height:1.55">${cabecalhoContato}</div>` : ''}
          </div>
        </div>
        <div style="text-align:right;flex-shrink:0">
          <div style="font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#9ca3af">Relatório</div>
          <div style="font-size:16px;font-weight:900;color:#d4891a;margin-top:4px">Folha de pagamento</div>
        </div>
      </div>
      <h1>Relatório de Folha de Pagamento</h1>
      <p class="sub">Período: ${periodo} &nbsp;·&nbsp; ${relatorio.diasUteisNoPeriodo} dias úteis<br>
      Conta: dias trabalhados até a data × valor da diária. Dias futuros e fins de semana sem marca não entram.</p>
      <div class="cards">
        <div class="card"><div class="card-label">Funcionários</div><div class="card-val">${relatorio.totalFuncionarios}</div></div>
        <div class="card"><div class="card-label">Total bruto</div><div class="card-val">${fmt(relatorio.totalBruto)}</div></div>
        <div class="card"><div class="card-label">Vales (adiant.)</div><div class="card-val" style="color:#ea580c">${fmt(relatorio.totalValesPendentes ?? relatorio.totalVales ?? 0)}</div></div>
        <div class="card"><div class="card-label">Desc. faltas</div><div class="card-val" style="color:#dc2626">${fmt(relatorio.totalDescontos)}</div></div>
        <div class="card"><div class="card-label">Total a pagar</div><div class="card-val" style="color:#166534">${fmt(relatorio.totalAPagar ?? relatorio.totalLiquido)}</div></div>
      </div>
      <table>
        <thead><tr>
          <th>Funcionário</th><th>Tipo</th><th>Dias úteis</th><th>Trabalhados</th>
          <th>Extras (FdS)</th><th>Faltas</th><th>Justif.</th><th>A desc.</th>
          <th>Bruto</th><th>Vale</th><th>Desc. faltas</th><th>A receber</th>
        </tr></thead>
        <tbody>${linhas}</tbody>
        <tfoot><tr>
          <td colspan="8">TOTAL GERAL</td>
          <td style="text-align:right">${fmt(relatorio.totalBruto)}</td>
          <td style="text-align:right;color:#ea580c">- ${fmt(relatorio.totalValesPendentes ?? relatorio.totalVales ?? 0)}</td>
          <td style="text-align:right;color:#dc2626">- ${fmt(relatorio.totalDescontos)}</td>
          <td style="text-align:right;color:#166534;font-size:15px">${fmt(relatorio.totalAPagar ?? relatorio.totalLiquido)}</td>
        </tr></tfoot>
      </table>
      <div class="rodape">${d.rodape}</div>
      <script>window.onload=()=>window.print()</script>
    </body></html>`)
    win.document.close()
  }

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <div className="card p-4 grid grid-cols-1 sm:flex sm:flex-row items-stretch sm:items-end gap-3 sm:gap-4 sm:flex-wrap">
        <div>
          <label className="label text-xs">Mês rápido</label>
          <input type="month" className="input py-2.5 min-h-[44px] text-sm"
            value={inicio.slice(0, 7)}
            onChange={e => setMesRapido(e.target.value)} />
        </div>
        <div className="text-primary-300 text-sm hidden sm:block pb-2">ou</div>
        <div>
          <label className="label text-xs">Início</label>
          <input type="date" className="input py-2.5 min-h-[44px] text-sm" value={inicio} onChange={e => setInicio(e.target.value)} />
        </div>
        <div>
          <label className="label text-xs">Fim</label>
          <input type="date" className="input py-2.5 min-h-[44px] text-sm" value={fim} onChange={e => setFim(e.target.value)} />
        </div>
        <div>
          <label className="label text-xs">Funcionário</label>
          <select
            className="input py-2.5 min-h-[44px] text-sm w-full sm:min-w-[200px]"
            value={filtroFunc}
            onChange={e => setFiltroFunc(e.target.value ? Number(e.target.value) : '')}
          >
            <option value="">Todos</option>
            {(relatorio?.funcionarios || []).map(l => (
              <option key={l.funcionario.id} value={l.funcionario.id}>{l.funcionario.nome}</option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-2 sm:flex gap-2 sm:pb-0">
          <button onClick={gerar} disabled={carregando} className="btn-primary min-h-[44px] justify-center">
            {carregando
              ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              : <FileText size={16} />
            }
            Gerar
          </button>
          {relatorio && filtroFunc && (
            <>
              <button
                onClick={() => {
                  const linha = linhasFiltradas[0]
                  if (linha) imprimirIndividual(linha)
                }}
                className="btn-outline min-h-[44px] justify-center"
              >
                <Printer size={16} /> Relatório individual
              </button>
              <button
                onClick={() => {
                  const linha = linhasFiltradas[0]
                  if (linha) enviarWhats(linha)
                }}
                disabled={enviandoId !== null}
                className="btn-primary min-h-[44px] justify-center"
              >
                <MessageCircle size={16} /> WhatsApp
              </button>
            </>
          )}
          {relatorio && !filtroFunc && (
            <button onClick={imprimir} className="btn-outline min-h-[44px] justify-center">
              <Printer size={16} /> Imprimir todos
            </button>
          )}
        </div>
      </div>

      {carregando ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-accent-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : !relatorio ? null : (
        <>
          <div className="flex items-start gap-2 rounded-xl bg-stone-50 border border-stone-100 px-4 py-3 text-xs text-primary-600">
            <Info size={14} className="text-primary-400 mt-0.5 flex-shrink-0" />
            <p>
              Cada linha é <strong>dias trabalhados × valor do dia</strong>.
              <strong> Vale</strong> = adiantamento do pagamento (semanal/quinzenal/mensal) já entregue — entra no &quot;A receber&quot;.
              O período padrão vai até hoje, para não contar dia que ainda não aconteceu.
            </p>
          </div>
          {/* Cards de resumo */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            {[
              { label: 'Funcionários', val: String(relatorio.totalFuncionarios), icon: Users, cor: 'bg-blue-500' },
              { label: 'Total bruto', val: fmt(relatorio.totalBruto), icon: DollarSign, cor: 'bg-primary-800' },
              { label: 'Vales (adiant.)', val: fmt(relatorio.totalValesPendentes ?? relatorio.totalVales ?? 0), icon: CreditCard, cor: 'bg-orange-500' },
              { label: 'Desc. faltas', val: fmt(relatorio.totalDescontos), icon: TrendingDown, cor: 'bg-red-500' },
              { label: 'Total a pagar', val: fmt(relatorio.totalAPagar ?? relatorio.totalLiquido), icon: CheckCircle, cor: 'bg-emerald-600' },
            ].map(c => (
              <div key={c.label} className="card p-4 sm:p-5 h-full flex flex-col">
                <div className={`w-9 h-9 rounded-xl ${c.cor} flex items-center justify-center mb-3`}>
                  <c.icon size={17} className="text-white" />
                </div>
                <div className="text-sm sm:text-lg font-black text-primary-900 mt-auto break-words">{c.val}</div>
                <div className="text-xs text-primary-400 mt-0.5">{c.label}</div>
              </div>
            ))}
          </div>

          {/* Mobile: cards por funcionário */}
          <div className="space-y-3 lg:hidden">
            {linhasFiltradas.map((linha, i) => (
              <div key={linha.funcionario.id} className="card p-4">
                <button
                  type="button"
                  onClick={() => setExpandido(expandido === i ? null : i)}
                  className="w-full text-left"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary-900 flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {linha.funcionario.foto
                        ? <img src={linha.funcionario.foto} alt={linha.funcionario.nome} className="w-full h-full object-cover" />
                        : <span className="text-accent-400 font-bold text-xs">
                            {linha.funcionario.nome.split(' ').slice(0, 2).map((n: string) => n[0]).join('').toUpperCase()}
                          </span>
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-primary-900 leading-snug break-words">{linha.funcionario.nome}</div>
                      <div className="text-xs text-primary-400 mt-0.5">{CARGOS[linha.funcionario.cargo] || linha.funcionario.cargo}</div>
                      <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-2 text-xs">
                        <span className="font-black text-emerald-600">{linha.diasTrabalhados}d</span>
                        {linha.faltasTotal > 0 && <span className="font-bold text-red-500">{linha.faltasTotal} falta{linha.faltasTotal > 1 ? 's' : ''}</span>}
                        {linha.diasExtras > 0 && <span className="font-bold text-violet-500">+{linha.diasExtras} FdS</span>}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-[10px] uppercase text-primary-400">A receber</div>
                      <div className="text-sm font-black text-emerald-600">{fmt(aReceberLinha(linha))}</div>
                    </div>
                  </div>
                </button>
                {expandido === i && (
                  <div className="mt-3 pt-3 border-t border-stone-100 text-xs text-primary-600 space-y-1">
                    <p>{linha.diasTrabalhados}d × {fmt(linha.valorDia || linha.funcionario.valorDiaria)} = {fmt(linha.valorBruto)}</p>
                    {linha.descontos > 0 && <p className="text-red-500">Desc. faltas: − {fmt(linha.descontos)}</p>}
                    {(linha.valesPendentes || 0) > 0 && (
                      <p className="text-orange-600">Vale (adiantamento): − {fmt(linha.valesPendentes)}</p>
                    )}
                    {(linha.descontosAvulsos || 0) > 0 && (
                      <p className="text-red-500">Descontos avulsos: − {fmt(linha.descontosAvulsos)}</p>
                    )}
                    <p className="font-bold text-emerald-700">A receber: {fmt(aReceberLinha(linha))}</p>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-stone-100">
                  <button type="button" onClick={() => imprimirIndividual(linha)} className="btn-outline min-h-[44px] justify-center text-xs">
                    <Printer size={14} /> Relatório
                  </button>
                  <button
                    type="button"
                    onClick={() => enviarWhats(linha)}
                    disabled={enviandoId === linha.funcionario.id}
                    className="btn-primary min-h-[44px] justify-center text-xs"
                  >
                    <MessageCircle size={14} /> {enviandoId === linha.funcionario.id ? 'Enviando...' : 'WhatsApp'}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop: tabela */}
          <div className="hidden lg:block card overflow-hidden">
            <div className="px-5 py-4 border-b border-stone-100 flex items-center justify-between flex-wrap gap-2">
              <h3 className="font-bold text-primary-900">Detalhamento por funcionário</h3>
              <span className="text-xs text-primary-400 bg-stone-100 rounded-full px-3 py-1">
                {relatorio.diasUteisNoPeriodo} dias úteis no período
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-stone-50">
                  <tr>
                    {['Funcionário','Tipo','Dias úteis','Trabalhados','Extras','Faltas','Justif.','A descontar','Bruto','Vale','Desc. faltas','A receber','Ações'].map(h => (
                      <th key={h} className="px-3 py-3 text-xs font-bold text-primary-400 uppercase tracking-wider whitespace-nowrap text-left first:pl-5 last:pr-5 last:text-right">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-50">
                  {linhasFiltradas.map((linha, i) => (
                    <Fragment key={linha.funcionario.id}>
                      <tr
                        className="hover:bg-stone-50 cursor-pointer transition-colors"
                        onClick={() => setExpandido(expandido === i ? null : i)}
                      >
                        <td className="pl-5 pr-3 py-4 min-w-[200px] max-w-[280px]">
                          <div className="flex items-start gap-2.5 min-w-0">
                            <div className="w-8 h-8 rounded-lg bg-primary-900 flex items-center justify-center flex-shrink-0 overflow-hidden mt-0.5">
                              {linha.funcionario.foto
                                ? <img src={linha.funcionario.foto} alt={linha.funcionario.nome} className="w-full h-full object-cover" />
                                : <span className="text-accent-400 font-bold text-[10px]">
                                    {linha.funcionario.nome.split(' ').slice(0,2).map((n: string)=>n[0]).join('').toUpperCase()}
                                  </span>
                              }
                            </div>
                            <div className="min-w-0">
                              <div className="font-semibold text-primary-900 leading-snug break-words" title={linha.funcionario.nome}>{linha.funcionario.nome}</div>
                              <div className="text-xs text-primary-400">{CARGOS[linha.funcionario.cargo] || linha.funcionario.cargo}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-4">
                          <span className={`text-xs font-bold px-2 py-1 rounded-full whitespace-nowrap ${
                            linha.funcionario.tipoRecebimento === 'DIARIA' ? 'bg-blue-50 text-blue-600' :
                            linha.funcionario.tipoRecebimento === 'SEMANAL' ? 'bg-violet-50 text-violet-600' :
                            linha.funcionario.tipoRecebimento === 'QUINZENAL' ? 'bg-indigo-50 text-indigo-600' :
                            'bg-emerald-50 text-emerald-600'
                          }`}>{TIPO_LABEL[linha.funcionario.tipoRecebimento]}</span>
                        </td>
                        <td className="px-3 py-4 text-center text-primary-600 font-semibold">{linha.diasUteisNoPeriodo}</td>
                        <td className="px-3 py-4 text-center font-black text-emerald-600">{linha.diasTrabalhados}</td>
                        <td className="px-3 py-4 text-center">
                          {linha.diasExtras > 0
                            ? <span className="font-bold text-violet-500">+{linha.diasExtras}</span>
                            : <span className="text-primary-300">—</span>}
                        </td>
                        <td className="px-3 py-4 text-center">
                          <span className={`text-sm font-black ${linha.faltasTotal > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                            {linha.faltasTotal}
                          </span>
                        </td>
                        <td className="px-3 py-4 text-center">
                          {linha.faltasJustificadas > 0
                            ? <span className="text-yellow-600 font-semibold">{linha.faltasJustificadas}</span>
                            : <span className="text-primary-300">—</span>}
                        </td>
                        <td className="px-3 py-4 text-center">
                          {linha.faltasADescontar > 0
                            ? <span className="text-red-500 font-semibold">{linha.faltasADescontar}</span>
                            : <span className="text-primary-300">—</span>}
                        </td>
                        <td className="px-3 py-4 text-right text-primary-700">
                          <div className="font-semibold">{fmt(linha.valorBruto)}</div>
                          <div className="text-[10px] text-primary-400 font-normal">
                            {linha.diasTrabalhados}d × {fmt(linha.valorDia || linha.funcionario.valorDiaria)}
                          </div>
                        </td>
                        <td className="px-3 py-4 text-right">
                          {(linha.valesPendentes || 0) > 0
                            ? <span className="text-orange-500 font-semibold" title="Adiantamento a descontar">− {fmt(linha.valesPendentes)}</span>
                            : <span className="text-primary-300">—</span>}
                        </td>
                        <td className="px-3 py-4 text-right">
                          {linha.descontos > 0
                            ? <span className="text-red-500 font-semibold">− {fmt(linha.descontos)}</span>
                            : <span className="text-primary-300">—</span>}
                        </td>
                        <td className="pr-5 pl-3 py-4 text-right font-black text-emerald-600 text-base">{fmt(aReceberLinha(linha))}</td>
                        <td className="px-3 py-4" onClick={e => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => imprimirIndividual(linha)}
                              className="p-2 text-primary-400 hover:text-accent-600 hover:bg-accent-50 rounded-lg"
                              title="Relatório individual"
                            >
                              <Printer size={15} />
                            </button>
                            <button
                              type="button"
                              onClick={() => enviarWhats(linha)}
                              disabled={enviandoId === linha.funcionario.id}
                              className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg disabled:opacity-40"
                              title="Enviar no WhatsApp"
                            >
                              <MessageCircle size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>

                      {expandido === i && (
                        <tr className="bg-stone-50/80">
                          <td colSpan={13} className="px-5 py-4">
                            <div className="text-xs font-bold text-primary-700 mb-2">
                              {linha.diasTrabalhados} dias × {fmt(linha.valorDia || linha.funcionario.valorDiaria)} = {fmt(linha.valorBruto)}
                              {linha.descontos > 0 ? ` · faltas − ${fmt(linha.descontos)}` : ''}
                              {(linha.valesPendentes || 0) > 0 ? ` · vale (adiant.) − ${fmt(linha.valesPendentes)}` : ''}
                              {' · a receber '}{fmt(aReceberLinha(linha))}
                            </div>
                            {linha.registros.length > 0 ? (
                              <>
                                <div className="text-xs font-bold text-primary-400 uppercase tracking-wider mb-3">
                                  Registros marcados no período
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  {linha.registros.map(r => {
                                    const cfg = STATUS_CONFIG[r.status]
                                    return (
                                      <div key={r.id}
                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border ${cfg.corBg} ${cfg.corText}`}
                                      >
                                        {cfg.icon}
                                        <span className="font-bold">{fmtData(r.data)}</span>
                                        <span className="opacity-70">{cfg.label}</span>
                                        {r.motivo && <span className="opacity-60">· {r.motivo}</span>}
                                        {(r.status === 'FALTA' || r.status === 'FALTA_JUSTIFICADA') && !r.descontar && (
                                          <span className="opacity-60 italic">(sem desconto)</span>
                                        )}
                                      </div>
                                    )
                                  })}
                                </div>
                              </>
                            ) : (
                              <p className="text-xs text-primary-400">Nenhum registro manual — dias úteis até hoje foram contados automaticamente.</p>
                            )}
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  ))}
                </tbody>
                {!filtroFunc && (
                <tfoot className="bg-primary-950 text-white">
                  <tr>
                    <td className="pl-5 pr-3 py-4 font-black text-sm" colSpan={8}>TOTAL GERAL</td>
                    <td className="px-3 py-4 text-right font-bold">{fmt(relatorio.totalBruto)}</td>
                    <td className="px-3 py-4 text-right font-bold text-orange-300">
                      {(relatorio.totalValesPendentes ?? 0) > 0 ? `− ${fmt(relatorio.totalValesPendentes)}` : '—'}
                    </td>
                    <td className="px-3 py-4 text-right font-bold text-red-300">
                      {relatorio.totalDescontos > 0 ? `− ${fmt(relatorio.totalDescontos)}` : '—'}
                    </td>
                    <td className="pr-5 pl-3 py-4 text-right font-black text-emerald-300 text-base">{fmt(relatorio.totalAPagar ?? relatorio.totalLiquido)}</td>
                    <td />
                  </tr>
                </tfoot>
                )}
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// ─── Tipos ────────────────────────────────────────────────────
interface TotaisFunc {
  totalPago: number
  totalPendente: number
  totalVales: number
  valesPendentes: number
  totalDescontos: number
}

interface SaldoAtual {
  funcionarioId: number
  nome: string
  foto?: string
  freelancer: boolean
  tipoRecebimento: string
  inicioCiclo: string
  fimCiclo: string
  dataUltimoPagamento?: string | null
  valorUltimoPagamento?: number
  diasTrabalhados: number
  valorDia: number
  valorBruto: number
  valesPendentes: number
  descontos: number
  pagamentosJaFeitos: number
  saldoFinal: number
}

interface UltimoPagamento {
  encontrado: boolean
  id?: number
  dataPagamento?: string
  inicioCiclo?: string
  valor?: number
  referencia?: string
}

interface ResumoPeriodo {
  funcionario: { id: number; nome: string; tipoRecebimento: string; salario: number; valorDiaria: number; foto?: string; cargo: string }
  periodo: { inicio: string; fim: string }
  modoFreelancer: boolean
  diasUteisNoPeriodo: number
  diasTrabalhados: number
  diasExtras: number
  diasSemRegistro: number
  diasFuturosNaoContados: number
  faltasTotal: number
  faltasJustificadas: number
  faltasADescontar: number
  valorDia: number
  valorBruto: number
  descontosFaltas: number
  valorLiquido: number
  pagamentosJaFeitos: number
  pagamentosPendentes: number
  valesNoPeriodo: number
  valesPendentes: number
  descontosNoPeriodo: number
  saldoFinal: number
  registros: RegistroPonto[]
}

// ─── Painel de resumo por período ────────────────────────────
function PainelResumoPeriodo({ resumo, carregando }: { resumo: ResumoPeriodo | null; carregando: boolean }) {
  if (carregando) {
    return (
      <div className="flex items-center justify-center py-6 bg-stone-50 rounded-2xl border border-stone-200">
        <div className="w-5 h-5 border-2 border-accent-500 border-t-transparent rounded-full animate-spin" />
        <span className="ml-2 text-sm text-primary-400">Calculando...</span>
      </div>
    )
  }
  if (!resumo) return null

  const r = resumo
  const tipoLabel = TIPO_LABEL[r.funcionario.tipoRecebimento] || r.funcionario.tipoRecebimento

  // Contagem de registros por status para o mini-calendário
  const countStatus = r.registros.reduce((acc, reg) => {
    acc[reg.status as string] = (acc[reg.status as string] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  return (
    <div className="rounded-2xl border border-stone-200 overflow-hidden text-sm">

      {/* Cabeçalho com saldo */}
      <div className="bg-stone-900 px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0 overflow-hidden">
              {r.funcionario.foto
                ? <img src={r.funcionario.foto} alt={r.funcionario.nome} className="w-full h-full object-cover" />
                : <span className="text-accent-400 font-black text-xs">
                    {r.funcionario.nome.split(' ').slice(0,2).map(n=>n[0]).join('').toUpperCase()}
                  </span>
              }
            </div>
            <div className="min-w-0">
              <div className="text-white font-bold text-sm leading-snug break-words">{r.funcionario.nome}</div>
              <div className="text-white/40 text-xs flex items-center gap-1.5">
                <span>{tipoLabel}</span>
                {r.modoFreelancer
                  ? <span className="bg-orange-500/20 text-orange-300 text-[9px] font-bold px-1.5 rounded">Conta só presenças marcadas</span>
                  : <span className="bg-emerald-500/20 text-emerald-300 text-[9px] font-bold px-1.5 rounded">Dias úteis até hoje × diária</span>
                }
              </div>
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <div className="text-white/40 text-[10px] uppercase tracking-wider">Saldo final</div>
            <div className={`text-lg font-black ${r.saldoFinal > 0 ? 'text-emerald-400' : 'text-stone-400'}`}>
              {fmt(r.saldoFinal)}
            </div>
          </div>
        </div>
      </div>

      {/* Aviso: sem valor da diária cadastrado */}
      {!(Number(r.valorDia) > 0) && (
        <div className="bg-red-50 border-b border-red-200 px-4 py-2.5 flex items-center gap-2">
          <AlertTriangle size={13} className="text-red-600 flex-shrink-0" />
          <span className="text-red-700 text-xs font-semibold">
            Valor da diária não cadastrado. Edite o funcionário e informe o valor por dia para o cálculo aparecer.
          </span>
        </div>
      )}

      {/* Aviso para freelancer sem registros suficientes */}
      {r.modoFreelancer && r.diasTrabalhados === 0 && (
        <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-2.5 flex items-center gap-2">
          <AlertTriangle size={13} className="text-yellow-600 flex-shrink-0" />
          <span className="text-yellow-700 text-xs font-semibold">
            Nenhuma presença marcada no período. Vá ao Controle de Ponto e marque os dias trabalhados.
          </span>
        </div>
      )}

      {/* Aviso para freelancer com dias sem registro */}
      {r.modoFreelancer && r.diasSemRegistro > 0 && r.diasTrabalhados > 0 && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2.5 flex items-center gap-2">
          <AlertTriangle size={13} className="text-amber-600 flex-shrink-0" />
          <span className="text-amber-700 text-xs">
            <span className="font-bold">{r.diasSemRegistro} dia{r.diasSemRegistro > 1 ? 's' : ''} sem registro</span>
            {' '}no período — não contam na conta. Marque no Controle de Ponto se necessário.
          </span>
        </div>
      )}

      {/* Grid de contadores de dias */}
      <div className={`grid divide-x divide-stone-100 border-b border-stone-100 text-center ${r.modoFreelancer ? 'grid-cols-4' : 'grid-cols-3'}`}>
        <div className="px-2 py-2.5">
          <div className="text-[9px] text-primary-400 uppercase tracking-wider mb-0.5">Trabalhados</div>
          <div className="text-base font-black text-emerald-600">{r.diasTrabalhados}</div>
          {r.diasExtras > 0 && <div className="text-[9px] text-violet-500">+{r.diasExtras} FdS</div>}
        </div>
        <div className="px-2 py-2.5">
          <div className="text-[9px] text-primary-400 uppercase tracking-wider mb-0.5">Faltas</div>
          <div className={`text-base font-black ${r.faltasTotal > 0 ? 'text-red-500' : 'text-stone-300'}`}>{r.faltasTotal}</div>
          {r.faltasADescontar > 0 && <div className="text-[9px] text-orange-500">{r.faltasADescontar} c/desc.</div>}
        </div>
        {r.modoFreelancer && (
          <div className="px-2 py-2.5">
            <div className="text-[9px] text-primary-400 uppercase tracking-wider mb-0.5">Sem registro</div>
            <div className={`text-base font-black ${r.diasSemRegistro > 0 ? 'text-amber-500' : 'text-stone-300'}`}>{r.diasSemRegistro}</div>
            <div className="text-[9px] text-stone-400">não contam</div>
          </div>
        )}
        <div className="px-2 py-2.5">
          <div className="text-[9px] text-primary-400 uppercase tracking-wider mb-0.5">Dias úteis</div>
          <div className="text-base font-black text-primary-700">{r.diasUteisNoPeriodo}</div>
        </div>
      </div>

      {/* Detalhamento financeiro */}
      <div className="divide-y divide-stone-100">

        {/* Bruto calculado */}
        <div className="flex items-center justify-between px-4 py-2.5">
          <span className="text-primary-600 flex items-center gap-1.5 flex-wrap">
            <span className="w-2 h-2 rounded-full bg-blue-400 flex-shrink-0" />
            <span>Valor bruto</span>
            <span className="text-[10px] text-primary-400">
              {r.diasTrabalhados} dia{r.diasTrabalhados !== 1 ? 's' : ''} × {fmt(r.valorDia || r.funcionario.valorDiaria)}
            </span>
          </span>
          <span className="font-bold text-primary-900 flex-shrink-0">{fmt(r.valorBruto)}</span>
        </div>

        {/* Desconto por faltas (assalariado) */}
        {r.descontosFaltas > 0 && (
          <div className="flex items-center justify-between px-4 py-2.5">
            <span className="text-primary-600 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-yellow-400 flex-shrink-0" />
              Desconto por faltas ({r.faltasADescontar}d)
            </span>
            <span className="font-bold text-yellow-600">− {fmt(r.descontosFaltas)}</span>
          </div>
        )}

        {/* Valor líquido do trabalho */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-stone-50">
          <span className="font-semibold text-primary-700">Líquido pelo trabalho</span>
          <span className="font-black text-primary-900">{fmt(r.valorLiquido)}</span>
        </div>

        {/* Vales = adiantamento do pagamento periódico */}
        {(r.valesPendentes > 0 || r.valesNoPeriodo > 0) && (
          <div className="flex items-center justify-between px-4 py-2.5">
            <span className="text-primary-600 flex items-center gap-1.5 flex-wrap">
              <span className="w-2 h-2 rounded-full bg-orange-400 flex-shrink-0" />
              <span>Vale (adiantamento)</span>
              {r.valesNoPeriodo > r.valesPendentes && r.valesPendentes > 0 && (
                <span className="text-[10px] text-primary-400">
                  ({fmt(r.valesNoPeriodo)} no período · {fmt(r.valesNoPeriodo - r.valesPendentes)} já descontado)
                </span>
              )}
              {r.valesPendentes === 0 && r.valesNoPeriodo > 0 && (
                <span className="text-[10px] text-emerald-600">(já descontado do pagamento)</span>
              )}
            </span>
            <span className="font-bold text-orange-500">
              {r.valesPendentes > 0 ? `− ${fmt(r.valesPendentes)}` : fmt(r.valesNoPeriodo)}
            </span>
          </div>
        )}

        {/* Descontos registrados */}
        {r.descontosNoPeriodo > 0 && (
          <div className="flex items-center justify-between px-4 py-2.5">
            <span className="text-primary-600 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-red-400 flex-shrink-0" />
              Descontos registrados
            </span>
            <span className="font-bold text-red-500">− {fmt(r.descontosNoPeriodo)}</span>
          </div>
        )}

        {/* Pagamentos já realizados no período */}
        {r.pagamentosJaFeitos > 0 && (
          <div className="flex items-center justify-between px-4 py-2.5">
            <span className="text-primary-600 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0" />
              Já pago neste período
            </span>
            <span className="font-bold text-emerald-600">− {fmt(r.pagamentosJaFeitos)}</span>
          </div>
        )}

        {/* Saldo final em destaque */}
        <div className={`flex items-center justify-between px-4 py-3 ${r.saldoFinal > 0 ? 'bg-emerald-50' : 'bg-stone-100'}`}>
          <span className={`font-black ${r.saldoFinal > 0 ? 'text-emerald-800' : 'text-primary-500'}`}>
            Saldo a pagar agora
          </span>
          <span className={`text-xl font-black ${r.saldoFinal > 0 ? 'text-emerald-700' : 'text-primary-400'}`}>
            {fmt(r.saldoFinal)}
          </span>
        </div>
      </div>

      {/* Registros de ponto (expandível) */}
      {r.registros.length > 0 && (
        <details className="border-t border-stone-100">
          <summary className="px-4 py-2.5 text-xs font-bold text-primary-400 cursor-pointer hover:bg-stone-50 transition-colors flex items-center justify-between">
            <span className="flex items-center gap-2">
              Registros de ponto ({r.registros.length})
              {Object.entries(countStatus).map(([st, n]) => {
                const cfg = STATUS_CONFIG[st as StatusDia]
                return cfg ? (
                  <span key={st} className={`flex items-center gap-0.5 text-[9px] font-black px-1.5 py-0.5 rounded border ${cfg.corBg} ${cfg.corText}`}>
                    <span>{cfg.short}</span> {n}
                  </span>
                ) : null
              })}
            </span>
            <ChevronDown size={12} />
          </summary>
          <div className="px-4 pb-3 pt-2 flex flex-wrap gap-1.5 bg-stone-50/80">
            {r.registros.map((reg: RegistroPonto) => {
              const cfg = STATUS_CONFIG[reg.status as StatusDia]
              return (
                <span key={reg.id}
                  className={`flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-lg border ${cfg?.corBg} ${cfg?.corText}`}>
                  <span className={`w-3.5 h-3.5 rounded ${cfg?.cor} flex items-center justify-center text-white text-[8px] font-black`}>
                    {cfg?.short}
                  </span>
                  {fmtData(reg.data as unknown as string)}
                  {reg.motivo && <span className="opacity-60 ml-0.5">· {reg.motivo}</span>}
                  {(reg.status === 'FALTA' || reg.status === 'FALTA_JUSTIFICADA') && !reg.descontar && (
                    <span className="opacity-50 italic">(sem desc.)</span>
                  )}
                </span>
              )
            })}
          </div>
        </details>
      )}
    </div>
  )
}

// ─── Modal de pagamento / vale / desconto ─────────────────────
function ModalMovimentacao({
  aberto, fechar, funcionario, tipo: tipoInicial, onSalvar
}: {
  aberto: boolean
  fechar: () => void
  funcionario: Funcionario | null
  tipo: TipoMovimentacao
  onSalvar: () => void
}) {
  const hoje = new Date()
  const hojeStr = toISO(hoje)
  const inicioMes = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-01`

  const [periodoInicio, setPeriodoInicio] = useState(inicioMes)
  const [periodoFim, setPeriodoFim] = useState(hojeStr)
  const [tipo, setTipo] = useState<TipoMovimentacao>(tipoInicial)
  const [valorStr, setValorStr] = useState('')
  const [dataRef, setDataRef] = useState(hojeStr)
  const [pago, setPago] = useState(tipoInicial === 'PAGAMENTO')
  const [referencia, setReferencia] = useState('')
  const [observacoes, setObservacoes] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [resumo, setResumo] = useState<ResumoPeriodo | null>(null)
  const [carregandoResumo, setCarregandoResumo] = useState(false)
  const [ultimoPgto, setUltimoPgto] = useState<UltimoPagamento | null>(null)
  const [carregandoCiclo, setCarregandoCiclo] = useState(false)

  // Reset + detectar ciclo ao abrir
  useEffect(() => {
    if (!aberto || !funcionario?.id) return

    setTipo(tipoInicial)
    setPago(tipoInicial === 'PAGAMENTO')
    setValorStr('')
    setDataRef(hojeStr)
    setReferencia('')
    setObservacoes('')
    setResumo(null)
    setUltimoPgto(null)

    // Buscar último pagamento para determinar início do ciclo
    setCarregandoCiclo(true)
    api.get<UltimoPagamento>(`/funcionarios/${funcionario.id}/movimentacoes/ultimo-pagamento`)
      .then(({ data }) => {
        setUltimoPgto(data)
        if (data.encontrado && data.inicioCiclo) {
          setPeriodoInicio(data.inicioCiclo)
        } else {
          setPeriodoInicio(inicioMes)
        }
        setPeriodoFim(hojeStr)
      })
      .catch(() => {
        setPeriodoInicio(inicioMes)
        setPeriodoFim(hojeStr)
      })
      .finally(() => setCarregandoCiclo(false))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aberto, funcionario?.id, tipoInicial])

  // Buscar resumo ao mudar período
  useEffect(() => {
    if (!aberto || !funcionario?.id || !periodoInicio || !periodoFim || carregandoCiclo) return
    let ativo = true
    setCarregandoResumo(true)
    api.get<ResumoPeriodo>(`/funcionarios/${funcionario.id}/resumo-periodo?inicio=${periodoInicio}&fim=${periodoFim}`)
      .then(({ data }) => { if (ativo) setResumo(data) })
      .catch(() => { if (ativo) { setResumo(null); toast.error('Erro ao calcular o valor a receber') } })
      .finally(() => { if (ativo) setCarregandoResumo(false) })
    return () => { ativo = false }
  }, [aberto, funcionario?.id, periodoInicio, periodoFim, carregandoCiclo])

  // Pré-preenche valor (só se vazio e PAGAMENTO)
  useEffect(() => {
    if (resumo && tipo === 'PAGAMENTO' && !valorStr && resumo.saldoFinal > 0) {
      setValorStr(maskCurrency(resumo.saldoFinal))
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resumo])

  // Referência automática
  useEffect(() => {
    if (periodoInicio && periodoFim && !referencia) {
      if (tipo === 'PAGAMENTO') {
        setReferencia(`Período ${fmtData(periodoInicio)} – ${fmtData(periodoFim)}`)
      } else if (tipo === 'VALE') {
        setReferencia(`Adiantamento do ciclo ${fmtData(periodoInicio)} – ${fmtData(periodoFim)}`)
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [periodoInicio, periodoFim, tipo])

  const salvar = async () => {
    if (!funcionario?.id) return
    const valor = Number(valorStr.replace(/\D/g, '')) / 100
    if (!valor || valor <= 0) return toast.error('Informe o valor')
    setSalvando(true)
    try {
      await api.post(`/funcionarios/${funcionario.id}/movimentacoes`, {
        tipo, valor, data: dataRef, pago, referencia, observacoes
      })
      toast.success(MOV_CONFIG[tipo].label + ' registrado!')
      onSalvar()
      fechar()
    } catch {
      toast.error('Erro ao salvar')
    } finally {
      setSalvando(false)
    }
  }

  const setPresetPeriodo = (preset: 'semana' | 'quinzena1' | 'quinzena2' | 'mes') => {
    const h = new Date()
    const ano = h.getFullYear()
    const mes = h.getMonth() + 1
    const mesStr = String(mes).padStart(2, '0')
    if (preset === 'semana') {
      const dow = h.getDay() === 0 ? 6 : h.getDay() - 1 // segunda = 0
      const seg = new Date(h); seg.setDate(h.getDate() - dow)
      setPeriodoInicio(toISO(seg))
      setPeriodoFim(hojeStr)
    } else if (preset === 'quinzena1') {
      setPeriodoInicio(`${ano}-${mesStr}-01`)
      setPeriodoFim(`${ano}-${mesStr}-15`)
    } else if (preset === 'quinzena2') {
      const fim = new Date(ano, mes, 0)
      setPeriodoInicio(`${ano}-${mesStr}-16`)
      setPeriodoFim(toISO(fim))
    } else {
      setPeriodoInicio(`${ano}-${mesStr}-01`)
      setPeriodoFim(toISO(new Date(ano, mes, 0)))
    }
    setValorStr('')
    setReferencia('')
  }

  return (
    <Modal aberto={aberto} fechar={fechar} titulo={`${funcionario?.nome || ''}`} tamanho="md">
      <div className="space-y-4">

        {/* ── Tipo de lançamento ── */}
        <div>
          <label className="label">Tipo de lançamento</label>
          <div className="grid grid-cols-3 gap-2">
            {(Object.entries(MOV_CONFIG) as [TipoMovimentacao, typeof MOV_CONFIG[TipoMovimentacao]][]).map(([k, cfg]) => (
              <button key={k} type="button" onClick={() => { setTipo(k); setValorStr('') }}
                className={`flex flex-col items-center gap-1 py-2.5 rounded-xl border-2 text-xs font-bold transition-all ${
                  tipo === k ? `${cfg.bg} ${cfg.text} border-current` : 'border-stone-200 text-primary-400 hover:border-stone-300'
                }`}>
                <span className={`w-6 h-6 rounded-lg ${cfg.cor} flex items-center justify-center text-white`}>{cfg.icon}</span>
                {cfg.label}
              </button>
            ))}
          </div>
        </div>

        {tipo === 'VALE' && (
          <div className="rounded-xl bg-orange-50 border border-orange-200 px-4 py-3 text-sm text-orange-900">
            <div className="font-bold text-xs uppercase tracking-wider text-orange-700 mb-1">Adiantamento do pagamento</div>
            <p className="text-xs leading-relaxed text-orange-800/90">
              O vale é uma parte do pagamento (semanal, quinzenal ou mensal) entregue antes do fechamento.
              O valor entra como já recebido pelo funcionário e será <strong>descontado automaticamente</strong> no próximo pagamento do ciclo.
            </p>
          </div>
        )}

        {/* ── Banner do ciclo atual ── */}
        {tipo === 'PAGAMENTO' && (
          <div className={`rounded-xl px-4 py-3 flex items-start gap-3 text-sm ${
            ultimoPgto?.encontrado
              ? 'bg-blue-50 border border-blue-200'
              : 'bg-stone-50 border border-stone-200'
          }`}>
            {carregandoCiclo ? (
              <div className="flex items-center gap-2 text-primary-400">
                <div className="w-4 h-4 border-2 border-primary-300 border-t-primary-600 rounded-full animate-spin flex-shrink-0" />
                <span className="text-xs">Detectando ciclo...</span>
              </div>
            ) : ultimoPgto?.encontrado ? (
              <>
                <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <CheckCircle size={11} className="text-white" />
                </div>
                <div className="min-w-0">
                  <div className="font-bold text-blue-800 text-xs uppercase tracking-wider">Ciclo atual</div>
                  <div className="text-blue-700 text-sm mt-0.5">
                    Desde <span className="font-bold">{fmtData(ultimoPgto.inicioCiclo!)}</span>
                    {' '}— após pagamento de{' '}
                    <span className="font-bold">{fmt(ultimoPgto.valor || 0)}</span>
                    {' '}em <span className="font-bold">{fmtData(ultimoPgto.dataPagamento!)}</span>
                  </div>
                  {ultimoPgto.referencia && (
                    <div className="text-blue-500 text-xs mt-0.5">Ref: {ultimoPgto.referencia}</div>
                  )}
                </div>
              </>
            ) : (
              <>
                <div className="w-5 h-5 rounded-full bg-stone-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Clock size={11} className="text-white" />
                </div>
                <div>
                  <div className="font-bold text-primary-600 text-xs uppercase tracking-wider">Primeiro pagamento</div>
                  <div className="text-primary-500 text-sm mt-0.5">
                    Nenhum pagamento anterior. Período definido a partir do início do mês.
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* ── Período ── */}
        <div className="rounded-2xl border border-stone-200 overflow-hidden">
          <div className="bg-stone-50 px-4 py-2.5 flex items-center justify-between border-b border-stone-200">
            <span className="text-xs font-bold text-primary-600 uppercase tracking-wider">Período de referência</span>
            <div className="flex gap-1">
              {([['semana','Sem.'],['quinzena1','Q1'],['quinzena2','Q2'],['mes','Mês']] as const).map(([k, label]) => (
                <button key={k} type="button"
                  onClick={() => setPresetPeriodo(k)}
                  className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-white border border-stone-200 text-primary-500 hover:border-accent-400 hover:text-accent-600 transition-all">
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 px-4 py-3">
            <div>
              <label className="text-[10px] font-bold text-primary-400 uppercase tracking-wider block mb-1">De</label>
              <input type="date" className="input py-2 text-sm" value={periodoInicio}
                onChange={e => { setPeriodoInicio(e.target.value); setValorStr(''); setReferencia('') }} />
            </div>
            <div>
              <label className="text-[10px] font-bold text-primary-400 uppercase tracking-wider block mb-1">Até</label>
              <input type="date" className="input py-2 text-sm" value={periodoFim}
                onChange={e => { setPeriodoFim(e.target.value); setValorStr(''); setReferencia('') }} />
            </div>
          </div>
        </div>

        {/* ── Resumo detalhado do período ── */}
        <PainelResumoPeriodo resumo={resumo} carregando={carregandoResumo} />

        {/* ── Valor ── */}
        <div>
          <label className="label">
            Valor a lançar
            {tipo === 'PAGAMENTO' && resumo && resumo.saldoFinal > 0 && (
              <button type="button"
                onClick={() => setValorStr(maskCurrency(resumo.saldoFinal))}
                className="ml-2 text-[11px] font-bold text-accent-600 hover:text-accent-700 underline underline-offset-2">
                Usar saldo ({fmt(resumo.saldoFinal)})
              </button>
            )}
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-primary-400 pointer-events-none">R$</span>
            <input type="text" inputMode="decimal" className="input pl-9 text-xl font-black" placeholder="0,00"
              value={valorStr}
              onChange={e => {
                const digits = e.target.value.replace(/\D/g, '')
                setValorStr(digits ? maskCurrency(Number(digits) / 100) : '')
              }} />
          </div>
        </div>

        {/* ── Data de referência ── */}
        <div>
          <label className="label">Data do lançamento</label>
          <input type="date" className="input" value={dataRef} onChange={e => setDataRef(e.target.value)} />
        </div>

        {/* ── Referência ── */}
        <div>
          <label className="label">Descrição / Referência</label>
          <input className="input" placeholder={
            tipo === 'PAGAMENTO' ? 'Ex: Pagamento semana 08/09 – 14/09' :
            tipo === 'VALE' ? 'Ex: Vale — adiantamento da quinzena' :
            'Ex: Desconto — ferramenta danificada'
          } value={referencia} onChange={e => setReferencia(e.target.value)} />
        </div>

        {/* ── Já pago ── */}
        {tipo === 'PAGAMENTO' && (
          <div className="flex items-center gap-3 bg-stone-50 rounded-xl px-4 py-3">
            <input type="checkbox" id="pago-check" checked={pago} onChange={e => setPago(e.target.checked)}
              className="w-4 h-4 rounded border-stone-300" />
            <label htmlFor="pago-check" className="text-sm font-medium text-primary-700 cursor-pointer">
              Já foi pago (marcar como quitado agora)
            </label>
          </div>
        )}

        {/* ── Observações ── */}
        <div>
          <label className="label">Observações internas</label>
          <textarea className="input resize-none" rows={2} value={observacoes} onChange={e => setObservacoes(e.target.value)}
            placeholder="Informações adicionais sobre este lançamento..." />
        </div>

        <div className="modal-actions">
          <button onClick={fechar} className="flex-1 btn-outline">Cancelar</button>
          <button onClick={salvar} disabled={salvando} className="flex-1 btn-primary">
            {salvando
              ? <div className="flex items-center gap-2 justify-center"><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Salvando...</div>
              : 'Confirmar lançamento'
            }
          </button>
        </div>
      </div>
    </Modal>
  )
}

// ─── Modal de confirmar pagamento ─────────────────────────────
function ModalConfirmarPagamento({
  aberto, fechar, movimentacao, funcionario, onSalvar
}: {
  aberto: boolean
  fechar: () => void
  movimentacao: MovimentacaoFuncionario | null
  funcionario: Funcionario | null
  onSalvar: () => void
}) {
  const hoje = toISO(new Date())
  const [dataPagamento, setDataPagamento] = useState(hoje)
  const [observacoes, setObservacoes] = useState('')
  const [salvando, setSalvando] = useState(false)

  useEffect(() => { setDataPagamento(hoje); setObservacoes('') }, [aberto, hoje])

  const confirmar = async () => {
    if (!funcionario?.id || !movimentacao?.id) return
    setSalvando(true)
    try {
      await api.patch(`/funcionarios/${funcionario.id}/movimentacoes/${movimentacao.id}/pagar`, {
        dataPagamento, observacoes
      })
      toast.success('Pagamento confirmado!')
      onSalvar()
      fechar()
    } catch {
      toast.error('Erro ao confirmar')
    } finally {
      setSalvando(false)
    }
  }

  return (
    <Modal aberto={aberto} fechar={fechar} titulo="Confirmar pagamento" tamanho="sm">
      <div className="space-y-4">
        <div className="bg-emerald-50 rounded-xl px-4 py-3 flex items-center gap-3">
          <Banknote size={18} className="text-emerald-600 flex-shrink-0" />
          <div>
            <div className="text-sm font-bold text-emerald-800">{movimentacao?.referencia || MOV_CONFIG[movimentacao?.tipo || 'PAGAMENTO']?.label}</div>
            <div className="text-lg font-black text-emerald-700">{fmt(movimentacao?.valor || 0)}</div>
          </div>
        </div>
        <div>
          <label className="label">Data do pagamento</label>
          <input type="date" className="input" value={dataPagamento} onChange={e => setDataPagamento(e.target.value)} />
        </div>
        <div>
          <label className="label">Observações</label>
          <input className="input" placeholder="Ex: Pago via PIX, dinheiro..." value={observacoes} onChange={e => setObservacoes(e.target.value)} />
        </div>
        <div className="modal-actions">
          <button onClick={fechar} className="flex-1 btn-outline">Cancelar</button>
          <button onClick={confirmar} disabled={salvando} className="flex-1 btn-primary bg-emerald-600 hover:bg-emerald-700">
            {salvando ? '...' : '✓ Confirmar Pago'}
          </button>
        </div>
      </div>
    </Modal>
  )
}

// ─── Aba: Pagamentos ──────────────────────────────────────────
function AbaPagamentos() {
  const hoje = new Date()
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([])
  const [movsPorFunc, setMovsPorFunc] = useState<Record<number, MovimentacaoFuncionario[]>>({})
  const [ultimosPorFunc, setUltimosPorFunc] = useState<Record<number, UltimoPagamento>>({})
  const [saldos, setSaldos] = useState<Record<number, SaldoAtual>>({})
  const [totalAPagar, setTotalAPagar] = useState(0)
  const [carregando, setCarregando] = useState(true)
  const [expandido, setExpandido] = useState<number | null>(null)
  const [modalMov, setModalMov] = useState<{ func: Funcionario; tipo: TipoMovimentacao } | null>(null)
  const [modalPagar, setModalPagar] = useState<{ func: Funcionario; mov: MovimentacaoFuncionario } | null>(null)
  const [removendo, setRemovendo] = useState<number | null>(null)

  const carregar = useCallback(async () => {
    setCarregando(true)
    try {
      const { data: resp } = await api.get<{ content: Funcionario[] }>('/funcionarios?size=200&ativo=true')
      setFuncionarios(resp.content)
      const mapa: Record<number, MovimentacaoFuncionario[]> = {}
      const mapaUltimo: Record<number, UltimoPagamento> = {}
      const [{ data: saldosResp }] = await Promise.all([
        api.get<{ totalAPagar: number; totalValesPendentes: number; funcionarios: SaldoAtual[] }>('/folha/saldos-atuais'),
        ...resp.content.map(async (f) => {
          if (!f.id) return
          const [{ data: movs }, { data: ult }] = await Promise.all([
            api.get<MovimentacaoFuncionario[]>(`/funcionarios/${f.id}/movimentacoes`),
            api.get<UltimoPagamento>(`/funcionarios/${f.id}/movimentacoes/ultimo-pagamento`),
          ])
          mapa[f.id] = movs
          mapaUltimo[f.id] = ult
        }),
      ])
      setMovsPorFunc(mapa)
      setUltimosPorFunc(mapaUltimo)
      setTotalAPagar(Number(saldosResp.totalAPagar) || 0)
      setSaldos(Object.fromEntries((saldosResp.funcionarios || []).map(s => [s.funcionarioId, s])))
    } catch {
      toast.error('Erro ao carregar dados')
    } finally {
      setCarregando(false)
    }
  }, [])

  useEffect(() => { carregar() }, [carregar])

  const remover = async (func: Funcionario, mov: MovimentacaoFuncionario) => {
    if (!func.id || !mov.id) return
    setRemovendo(mov.id)
    try {
      await api.delete(`/funcionarios/${func.id}/movimentacoes/${mov.id}`)
      toast.success('Removido')
      carregar()
    } catch {
      toast.error('Erro ao remover')
    } finally {
      setRemovendo(null)
    }
  }

  // Totais por funcionário
  function calcTotais(funcId: number) {
    const movs = movsPorFunc[funcId] || []
    const totalPago = movs.filter(m => m.tipo === 'PAGAMENTO' && m.pago).reduce((s, m) => s + m.valor, 0)
    const totalPendente = movs.filter(m => m.tipo === 'PAGAMENTO' && !m.pago).reduce((s, m) => s + m.valor, 0)
    const totalVales = movs.filter(m => m.tipo === 'VALE').reduce((s, m) => s + m.valor, 0)
    const valesPendentes = movs.filter(m => m.tipo === 'VALE' && !m.pago).reduce((s, m) => s + m.valor, 0)
    const totalDescontos = movs.filter(m => m.tipo === 'DESCONTO').reduce((s, m) => s + m.valor, 0)
    return { totalPago, totalPendente, totalVales, valesPendentes, totalDescontos }
  }

  const totalGeralPendente = funcionarios.reduce((s, f) => s + calcTotais(f.id!).totalPendente, 0)
  const totalGeralVales = funcionarios.reduce((s, f) => s + calcTotais(f.id!).valesPendentes, 0)
  const funcionariosOrdenados = [...funcionarios].sort((a, b) =>
    (saldos[b.id!]?.saldoFinal || 0) - (saldos[a.id!]?.saldoFinal || 0)
  )

  return (
    <div className="space-y-5">
      <div className="flex items-start gap-2 rounded-xl bg-stone-50 border border-stone-100 px-4 py-3 text-xs text-primary-600">
        <Info size={14} className="text-primary-400 mt-0.5 flex-shrink-0" />
        <p>
          <strong>A receber agora</strong> = dias trabalhados do ciclo × diária, menos <strong>vales (adiantamentos)</strong> e descontos.
          O vale é parte do pagamento entregue antes; ao quitar o pagamento do ciclo, ele é descontado automaticamente.
          Clique em Registrar pagamento para conferir a conta e quitar.
        </p>
      </div>

      {/* Resumo geral */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="card p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center flex-shrink-0">
            <Banknote size={18} className="text-white" />
          </div>
          <div>
            <div className="text-xs text-primary-400">A pagar agora (ciclo)</div>
            <div className="text-lg font-black text-emerald-700">{fmt(totalAPagar)}</div>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center flex-shrink-0">
            <Clock size={18} className="text-white" />
          </div>
          <div>
            <div className="text-xs text-primary-400">Lançamentos pendentes</div>
            <div className="text-lg font-black text-primary-900">{fmt(totalGeralPendente)}</div>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-red-500 flex items-center justify-center flex-shrink-0">
            <CreditCard size={18} className="text-white" />
          </div>
          <div>
            <div className="text-xs text-primary-400">Vales a descontar</div>
            <div className="text-lg font-black text-primary-900">{fmt(totalGeralVales)}</div>
          </div>
        </div>
      </div>

      {carregando ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-4 border-accent-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : funcionarios.length === 0 ? (
        <div className="card p-12 text-center text-primary-400">
          <Users size={36} className="mx-auto mb-3 text-primary-200" />
          <p>Nenhum funcionário cadastrado</p>
        </div>
      ) : (
        <div className="space-y-3">
          {funcionariosOrdenados.map((func) => {
            const movs = movsPorFunc[func.id!] || []
            const { totalPago, totalPendente, totalVales, valesPendentes, totalDescontos } = calcTotais(func.id!)
            const isExpanded = expandido === func.id
            const ult = ultimosPorFunc[func.id!]
            const saldo = saldos[func.id!]
            const inicioCiclo = saldo?.inicioCiclo || (ult?.encontrado ? ult.inicioCiclo : null)

            return (
              <div key={func.id} className="card overflow-hidden">
                {/* Header do card */}
                <div className="p-4 sm:p-5">
                  <div className="flex items-start gap-3">
                    {/* Avatar */}
                    <div className="w-10 h-10 rounded-xl bg-primary-900 flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {func.foto
                        ? <img src={func.foto} alt={func.nome} className="w-full h-full object-cover" />
                        : <span className="text-accent-400 font-bold text-sm">
                            {func.nome.split(' ').slice(0,2).map(n=>n[0]).join('').toUpperCase()}
                          </span>
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-primary-900 leading-snug break-words" title={func.nome}>{func.nome}</div>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        {func.cargo && <span className="text-xs text-primary-400">{CARGOS[func.cargo]}</span>}
                        {func.tipoRecebimento && (
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            func.tipoRecebimento === 'DIARIA' ? 'bg-blue-50 text-blue-600' :
                            func.tipoRecebimento === 'SEMANAL' ? 'bg-violet-50 text-violet-600' :
                            func.tipoRecebimento === 'QUINZENAL' ? 'bg-indigo-50 text-indigo-600' :
                            'bg-emerald-50 text-emerald-600'
                          }`}>{TIPO_LABEL[func.tipoRecebimento]}</span>
                        )}
                        {func.freelancer && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-orange-50 text-orange-600">Freelancer</span>
                        )}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      {saldo && Number(saldo.valorDia) > 0 ? (
                        <>
                          <div className="text-[10px] uppercase tracking-wider text-primary-400">A receber</div>
                          <div className={`text-base font-black ${Number(saldo.saldoFinal) > 0 ? 'text-emerald-600' : 'text-stone-400'}`}>
                            {fmt(saldo.saldoFinal)}
                          </div>
                          <div className="text-[10px] text-primary-400">
                            {saldo.diasTrabalhados}d × {fmt(saldo.valorDia)}
                          </div>
                        </>
                      ) : (
                        <>
                          {totalPendente > 0 && (
                            <div className="text-sm font-black text-orange-500">{fmt(totalPendente)}</div>
                          )}
                          {totalPago > 0 && (
                            <div className="text-xs text-emerald-500">{fmt(totalPago)} pago</div>
                          )}
                        </>
                      )}
                      {valesPendentes > 0 && (
                        <div className="text-xs text-orange-500">Adiant. {fmt(valesPendentes)}</div>
                      )}
                    </div>
                  </div>

                  {/* Ciclo atual */}
                  {inicioCiclo && (
                    <div className="mt-3 flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-xl px-3 py-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0" />
                      <span className="text-xs text-blue-700">
                        <span className="font-bold">Ciclo atual</span> desde{' '}
                        <span className="font-bold">{fmtData(inicioCiclo)}</span>
                        {ult?.dataPagamento && (
                          <span className="text-blue-500">
                            {' '}· último pgto: {fmt(ult.valor || 0)} em {fmtData(ult.dataPagamento)}
                          </span>
                        )}
                      </span>
                    </div>
                  )}

                  {/* Ações rápidas */}
                  <div className="grid grid-cols-2 sm:flex gap-2 mt-3 sm:flex-wrap">
                    <button
                      onClick={() => setModalMov({ func, tipo: 'PAGAMENTO' })}
                      className="flex items-center justify-center gap-1.5 px-3 py-3 min-h-[44px] rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-colors"
                    >
                      <Banknote size={13} /> Pagamento
                    </button>
                    <button
                      onClick={() => setModalMov({ func, tipo: 'VALE' })}
                      className="flex items-center justify-center gap-1.5 px-3 py-3 min-h-[44px] rounded-xl bg-orange-500 text-white text-xs font-bold hover:bg-orange-600 transition-colors"
                    >
                      <CreditCard size={13} /> Vale
                    </button>
                    <button
                      onClick={() => setModalMov({ func, tipo: 'DESCONTO' })}
                      className="flex items-center justify-center gap-1.5 px-3 py-3 min-h-[44px] rounded-xl bg-stone-100 text-primary-600 text-xs font-bold hover:bg-stone-200 transition-colors"
                    >
                      <MinusCircle size={13} /> Desconto
                    </button>
                    <button
                      onClick={() => setExpandido(isExpanded ? null : func.id!)}
                      className="flex items-center justify-center gap-1 px-3 py-3 min-h-[44px] rounded-xl bg-stone-100 text-primary-500 text-xs font-semibold hover:bg-stone-200 transition-colors sm:ml-auto"
                    >
                      Histórico ({movs.length})
                      {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                    </button>
                  </div>
                </div>

                {/* Histórico expandido */}
                {isExpanded && (
                  <div className="border-t border-stone-100">
                    {movs.length === 0 ? (
                      <div className="px-5 py-8 text-center text-primary-400 text-sm">
                        <Wallet size={24} className="mx-auto mb-2 text-primary-200" />
                        Nenhum lançamento registrado ainda
                      </div>
                    ) : (() => {
                        // Separar ciclo atual vs histórico
                        const cicloInicio = inicioCiclo ? new Date(inicioCiclo + 'T00:00:00') : null
                        const movsCiclo = cicloInicio
                          ? movs.filter(m => new Date(m.data + 'T00:00:00') >= cicloInicio)
                          : movs
                        const movsHistorico = cicloInicio
                          ? movs.filter(m => new Date(m.data + 'T00:00:00') < cicloInicio)
                          : []

                        const MovRow = ({ mov }: { mov: MovimentacaoFuncionario }) => {
                          const cfg = MOV_CONFIG[mov.tipo]
                          const isDesc = mov.tipo === 'DESCONTO' || mov.tipo === 'VALE'
                          return (
                            <div key={mov.id} className="px-5 py-3 flex items-start gap-3 hover:bg-stone-50/50 transition-colors group/mov">
                              <div className={`w-8 h-8 rounded-lg ${cfg.cor} flex items-center justify-center flex-shrink-0 text-white`}>
                                {cfg.icon}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-xs font-bold text-primary-500 uppercase tracking-wider">{cfg.label}</span>
                                  {mov.referencia && <span className="text-xs text-primary-400">· {mov.referencia}</span>}
                                  {mov.tipo === 'VALE'
                                    ? (mov.pago
                                      ? <span className="text-[10px] font-bold bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded-full">✓ Descontado {mov.dataPagamento ? fmtData(mov.dataPagamento) : ''}</span>
                                      : <span className="text-[10px] font-bold bg-orange-50 text-orange-500 px-1.5 py-0.5 rounded-full">A descontar do pagamento</span>)
                                    : mov.pago
                                      ? <span className="text-[10px] font-bold bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded-full">✓ Pago {mov.dataPagamento ? fmtData(mov.dataPagamento) : ''}</span>
                                      : <span className="text-[10px] font-bold bg-orange-50 text-orange-500 px-1.5 py-0.5 rounded-full">Pendente</span>
                                  }
                                </div>
                                <div className="text-xs text-primary-400 mt-0.5">{fmtData(mov.data)}{mov.observacoes ? ` · ${mov.observacoes}` : ''}</div>
                              </div>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                <span className={`text-sm font-black ${isDesc ? 'text-red-500' : 'text-emerald-600'}`}>
                                  {isDesc ? '− ' : '+ '}{fmt(mov.valor)}
                                </span>
                                <div className="flex gap-1 sm:opacity-0 sm:group-hover/mov:opacity-100 transition-opacity">
                                  {!mov.pago && mov.tipo === 'PAGAMENTO' && (
                                    <button
                                      onClick={() => setModalPagar({ func, mov })}
                                      className="p-1 rounded-lg bg-emerald-100 text-emerald-600 hover:bg-emerald-200 transition-colors"
                                      title="Marcar como pago"
                                    >
                                      <CheckCircle size={13} />
                                    </button>
                                  )}
                                  <button
                                    onClick={() => remover(func, mov)}
                                    disabled={removendo === mov.id}
                                    className="p-1 rounded-lg text-primary-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                                    title="Remover"
                                  >
                                    <X size={13} />
                                  </button>
                                </div>
                              </div>
                            </div>
                          )
                        }

                        return (
                          <div>
                            {/* Ciclo atual */}
                            {movsCiclo.length > 0 && (
                              <>
                                <div className="px-5 py-2 bg-blue-50 border-b border-blue-100 flex items-center gap-2">
                                  <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                                  <span className="text-[10px] font-black text-blue-600 uppercase tracking-wider">
                                    Ciclo atual {inicioCiclo ? `— desde ${fmtData(inicioCiclo)}` : ''}
                                  </span>
                                </div>
                                <div className="divide-y divide-stone-50">
                                  {movsCiclo.map(mov => <MovRow key={mov.id} mov={mov} />)}
                                </div>
                              </>
                            )}

                            {movsCiclo.length === 0 && movsHistorico.length > 0 && (
                              <div className="px-5 py-3 text-center text-xs text-primary-400 italic border-b border-stone-100">
                                Nenhum lançamento no ciclo atual
                              </div>
                            )}

                            {/* Histórico de ciclos anteriores */}
                            {movsHistorico.length > 0 && (
                              <details>
                                <summary className="px-5 py-3 bg-stone-50 border-t border-stone-100 flex items-center gap-2 cursor-pointer hover:bg-stone-100 transition-colors list-none">
                                  <ChevronDown size={14} className="text-primary-400 flex-shrink-0" />
                                  <span className="text-xs font-bold text-primary-400 uppercase tracking-wider">
                                    Histórico anterior ({movsHistorico.length} lançamento{movsHistorico.length !== 1 ? 's' : ''})
                                  </span>
                                </summary>
                                <div className="divide-y divide-stone-50 bg-stone-50/40">
                                  {movsHistorico.map(mov => <MovRow key={mov.id} mov={mov} />)}
                                </div>
                              </details>
                            )}

                            {/* Totais */}
                            <div className="px-5 py-3 bg-stone-50 border-t border-stone-100 flex items-center justify-between flex-wrap gap-2">
                              <span className="text-xs font-bold text-primary-400 uppercase tracking-wider">Total geral</span>
                              <div className="flex gap-4 flex-wrap text-xs">
                                {totalPago > 0 && <span className="text-emerald-600 font-bold">Pago: {fmt(totalPago)}</span>}
                                {totalPendente > 0 && <span className="text-orange-500 font-bold">Pendente: {fmt(totalPendente)}</span>}
                                {totalVales > 0 && <span className="text-orange-600 font-bold">Adiantamentos: {fmt(totalVales)}</span>}
                                {valesPendentes > 0 && totalVales !== valesPendentes && (
                                  <span className="text-orange-500 font-bold">A descontar: {fmt(valesPendentes)}</span>
                                )}
                                {totalDescontos > 0 && <span className="text-red-500 font-bold">Descontos: {fmt(totalDescontos)}</span>}
                              </div>
                            </div>
                          </div>
                        )
                      })()
                    }
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Modais */}
      <ModalMovimentacao
        aberto={!!modalMov}
        fechar={() => setModalMov(null)}
        funcionario={modalMov?.func || null}
        tipo={modalMov?.tipo || 'PAGAMENTO'}
        onSalvar={carregar}
      />
      <ModalConfirmarPagamento
        aberto={!!modalPagar}
        fechar={() => setModalPagar(null)}
        movimentacao={modalPagar?.mov || null}
        funcionario={modalPagar?.func || null}
        onSalvar={carregar}
      />
    </div>
  )
}

// ─── Página principal ──────────────────────────────────────────
export default function FolhaPagamentoPage() {
  const [aba, setAba] = useState<'controle' | 'pagamentos' | 'relatorio'>('controle')

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="page-title text-xl sm:text-2xl">Folha de Pagamento</h1>
        <p className="text-primary-500 text-xs sm:text-sm mt-1">
          Controle de ponto, pagamentos e relatório — a conta é sempre dias trabalhados × diária
        </p>
      </div>

      <div className="grid grid-cols-3 gap-1 bg-stone-100 p-1 rounded-xl w-full">
        <button
          onClick={() => setAba('controle')}
          className={`flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-2 px-1 sm:px-4 py-2.5 min-h-[48px] rounded-lg text-[11px] sm:text-sm font-semibold transition-all ${
            aba === 'controle' ? 'bg-white shadow-sm text-primary-900' : 'text-primary-400'
          }`}
        >
          <Calendar size={16} />
          Ponto
        </button>
        <button
          onClick={() => setAba('pagamentos')}
          className={`flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-2 px-1 sm:px-4 py-2.5 min-h-[48px] rounded-lg text-[11px] sm:text-sm font-semibold transition-all ${
            aba === 'pagamentos' ? 'bg-white shadow-sm text-primary-900' : 'text-primary-400'
          }`}
        >
          <Wallet size={16} />
          Pagamentos
        </button>
        <button
          onClick={() => setAba('relatorio')}
          className={`flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-2 px-1 sm:px-4 py-2.5 min-h-[48px] rounded-lg text-[11px] sm:text-sm font-semibold transition-all ${
            aba === 'relatorio' ? 'bg-white shadow-sm text-primary-900' : 'text-primary-400'
          }`}
        >
          <FileText size={16} />
          Relatório
        </button>
      </div>

      {aba === 'controle' ? <AbaControle /> : aba === 'pagamentos' ? <AbaPagamentos /> : <AbaRelatorio />}
    </div>
  )
}
