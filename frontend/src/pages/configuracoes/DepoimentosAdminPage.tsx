import { useEffect, useState, useCallback } from 'react'
import {
  Star, CheckCircle, XCircle, Trash2, Clock,
  MessageSquare, MapPin, Eye, EyeOff, RefreshCw
} from 'lucide-react'
import api from '../../services/api'
import toast from 'react-hot-toast'
import ConfirmDialog from '../../components/ui/ConfirmDialog'

// ─── Tipos ────────────────────────────────────────────────────
type StatusDep = 'PENDENTE' | 'APROVADO' | 'REPROVADO'

interface Depoimento {
  id: number
  nome: string
  cidade?: string
  cargo?: string
  texto: string
  estrelas: number
  status: StatusDep
  notaAdmin?: string
  criadoEm: string
}

interface Contadores { pendentes: number; aprovados: number; reprovados: number }

// ─── Config visual por status ─────────────────────────────────
const STATUS_CFG: Record<StatusDep, { label: string; bg: string; text: string; icon: React.ReactNode }> = {
  PENDENTE:  { label: 'Pendente',  bg: 'bg-yellow-50 border-yellow-200', text: 'text-yellow-700', icon: <Clock size={13} /> },
  APROVADO:  { label: 'Aprovado',  bg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-700', icon: <CheckCircle size={13} /> },
  REPROVADO: { label: 'Reprovado', bg: 'bg-red-50 border-red-200', text: 'text-red-600', icon: <XCircle size={13} /> },
}

function fmtData(d: string) {
  return new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

// ─── Card de depoimento ───────────────────────────────────────
function CardDepoimento({
  dep, onAprovar, onReprovar, onExcluir, aprovando, reprovando
}: {
  dep: Depoimento
  onAprovar: (id: number) => void
  onReprovar: (id: number) => void
  onExcluir: (dep: Depoimento) => void
  aprovando: number | null
  reprovando: number | null
}) {
  const cfg = STATUS_CFG[dep.status]

  return (
    <div className="card p-5 space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-primary-900 flex items-center justify-center flex-shrink-0">
            <span className="text-accent-400 font-black text-sm">
              {dep.nome.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()}
            </span>
          </div>
          <div className="min-w-0">
            <div className="font-bold text-primary-900 truncate">{dep.nome}</div>
            <div className="text-xs text-primary-400 flex items-center gap-2 flex-wrap">
              {dep.cidade && <span className="flex items-center gap-1"><MapPin size={10} />{dep.cidade}</span>}
              {dep.cargo && <span className="text-primary-300">·</span>}
              {dep.cargo && <span>{dep.cargo}</span>}
            </div>
          </div>
        </div>
        {/* Badge status */}
        <span className={`flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full border flex-shrink-0 ${cfg.bg} ${cfg.text}`}>
          {cfg.icon}{cfg.label}
        </span>
      </div>

      {/* Estrelas */}
      <div className="flex gap-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star key={i} size={14} className={i < dep.estrelas ? 'fill-accent-400 text-accent-400' : 'text-stone-200'} />
        ))}
        <span className="text-xs text-primary-400 ml-1 self-center">{dep.estrelas}/5</span>
      </div>

      {/* Texto do depoimento */}
      <div className="bg-stone-50 rounded-xl px-4 py-3 border border-stone-100">
        <div className="flex items-start gap-2">
          <MessageSquare size={14} className="text-primary-300 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-primary-700 leading-relaxed italic">"{dep.texto}"</p>
        </div>
      </div>

      {/* Nota admin (se houver) */}
      {dep.notaAdmin && (
        <div className="text-xs text-primary-400 bg-primary-50 rounded-lg px-3 py-2 border border-primary-100">
          <span className="font-bold text-primary-600">Nota interna:</span> {dep.notaAdmin}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-stone-100">
        <span className="text-xs text-primary-400">{fmtData(dep.criadoEm)}</span>
        <div className="flex gap-2">
          {dep.status !== 'APROVADO' && (
            <button
              onClick={() => onAprovar(dep.id)}
              disabled={aprovando === dep.id}
              className="flex items-center gap-1.5 px-3 min-h-[44px] rounded-xl bg-emerald-100 text-emerald-700 hover:bg-emerald-200 text-xs font-bold transition-colors disabled:opacity-50"
            >
              {aprovando === dep.id
                ? <div className="w-3 h-3 border-2 border-emerald-500/30 border-t-emerald-600 rounded-full animate-spin" />
                : <CheckCircle size={13} />
              }
              Aprovar
            </button>
          )}
          {dep.status !== 'REPROVADO' && (
            <button
              onClick={() => onReprovar(dep.id)}
              disabled={reprovando === dep.id}
              className="flex items-center gap-1.5 px-3 min-h-[44px] rounded-xl bg-red-100 text-red-600 hover:bg-red-200 text-xs font-bold transition-colors disabled:opacity-50"
            >
              {reprovando === dep.id
                ? <div className="w-3 h-3 border-2 border-red-400/30 border-t-red-500 rounded-full animate-spin" />
                : <XCircle size={13} />
              }
              Reprovar
            </button>
          )}
          {dep.status === 'APROVADO' && (
            <button
              onClick={() => onReprovar(dep.id)}
              disabled={reprovando === dep.id}
              className="flex items-center gap-1.5 px-3 min-h-[44px] rounded-xl bg-stone-100 text-primary-500 hover:bg-stone-200 text-xs font-semibold transition-colors disabled:opacity-50"
            >
              <EyeOff size={13} /> Ocultar
            </button>
          )}
          <button
            onClick={() => onExcluir(dep)}
            className="p-1.5 text-primary-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
            title="Excluir permanentemente"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Página principal ─────────────────────────────────────────
export default function DepoimentosAdminPage() {
  const [depoimentos, setDepoimentos] = useState<Depoimento[]>([])
  const [contadores, setContadores] = useState<Contadores>({ pendentes: 0, aprovados: 0, reprovados: 0 })
  const [filtro, setFiltro] = useState<StatusDep | 'TODOS'>('TODOS')
  const [carregando, setCarregando] = useState(true)
  const [aprovando, setAprovando] = useState<number | null>(null)
  const [reprovando, setReprovando] = useState<number | null>(null)
  const [excluindo, setExcluindo] = useState<Depoimento | null>(null)
  const [confirmExcluir, setConfirmExcluir] = useState(false)

  const carregar = useCallback(async () => {
    setCarregando(true)
    try {
      const params = filtro !== 'TODOS' ? `?status=${filtro}` : ''
      const [{ data: deps }, { data: cont }] = await Promise.all([
        api.get<Depoimento[]>(`/depoimentos${params}`),
        api.get<Contadores>('/depoimentos/contadores'),
      ])
      setDepoimentos(deps)
      setContadores(cont)
    } catch {
      toast.error('Erro ao carregar depoimentos')
    } finally {
      setCarregando(false)
    }
  }, [filtro])

  useEffect(() => { carregar() }, [carregar])

  const aprovar = async (id: number) => {
    setAprovando(id)
    try {
      await api.patch(`/depoimentos/${id}/aprovar`)
      toast.success('Depoimento aprovado! Já aparece na landing page.')
      carregar()
    } catch {
      toast.error('Erro ao aprovar')
    } finally {
      setAprovando(null)
    }
  }

  const reprovar = async (id: number) => {
    setReprovando(id)
    try {
      await api.patch(`/depoimentos/${id}/reprovar`)
      toast.success('Depoimento reprovado.')
      carregar()
    } catch {
      toast.error('Erro ao reprovar')
    } finally {
      setReprovando(null)
    }
  }

  const excluir = async () => {
    if (!excluindo) return
    try {
      await api.delete(`/depoimentos/${excluindo.id}`)
      toast.success('Depoimento excluído.')
      setExcluindo(null)
      carregar()
    } catch {
      toast.error('Erro ao excluir')
    }
  }

  const abas: { key: StatusDep | 'TODOS'; label: string; count?: number }[] = [
    { key: 'TODOS', label: 'Todos' },
    { key: 'PENDENTE', label: 'Pendentes', count: contadores.pendentes },
    { key: 'APROVADO', label: 'Aprovados', count: contadores.aprovados },
    { key: 'REPROVADO', label: 'Reprovados', count: contadores.reprovados },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="page-title">Depoimentos</h1>
          <p className="text-primary-500 text-sm mt-1">
            Aprove ou reprove os depoimentos enviados pelos clientes
          </p>
        </div>
        <button onClick={carregar} className="btn-outline gap-2">
          <RefreshCw size={15} /> Atualizar
        </button>
      </div>

      {/* Preview da landing page */}
      <div className="bg-accent-50 border border-accent-200 rounded-2xl px-5 py-4 flex items-center gap-3">
        <Eye size={16} className="text-accent-600 flex-shrink-0" />
        <p className="text-sm text-accent-800">
          <span className="font-bold">Apenas depoimentos aprovados</span> aparecem na landing page, em tempo real.
          Depoimentos pendentes e reprovados ficam visíveis somente aqui.
        </p>
      </div>

      {/* Filtros */}
      <div className="flex gap-1 bg-stone-100 p-1 rounded-xl w-fit flex-wrap">
        {abas.map(aba => (
          <button
            key={aba.key}
            onClick={() => setFiltro(aba.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              filtro === aba.key ? 'bg-white shadow-sm text-primary-900' : 'text-primary-400 hover:text-primary-700'
            }`}
          >
            {aba.label}
            {aba.count !== undefined && aba.count > 0 && (
              <span className={`text-xs font-black px-1.5 py-0.5 rounded-full ${
                aba.key === 'PENDENTE' ? 'bg-yellow-100 text-yellow-700' :
                aba.key === 'APROVADO' ? 'bg-emerald-100 text-emerald-700' :
                'bg-red-100 text-red-600'
              }`}>
                {aba.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Conteúdo */}
      {carregando ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-accent-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : depoimentos.length === 0 ? (
        <div className="card p-16 text-center">
          <MessageSquare size={36} className="mx-auto mb-3 text-primary-200" />
          <p className="text-primary-500 font-semibold">Nenhum depoimento {filtro !== 'TODOS' ? STATUS_CFG[filtro as StatusDep]?.label.toLowerCase() : ''}</p>
          <p className="text-primary-400 text-sm mt-1">
            {filtro === 'PENDENTE' ? 'Tudo em dia! Nenhum depoimento aguarda análise.' :
             filtro === 'APROVADO' ? 'Aprove depoimentos para que apareçam na landing page.' :
             'Nenhum depoimento foi enviado ainda.'}
          </p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {depoimentos.map(dep => (
            <CardDepoimento
              key={dep.id}
              dep={dep}
              onAprovar={aprovar}
              onReprovar={reprovar}
              onExcluir={d => { setExcluindo(d); setConfirmExcluir(true) }}
              aprovando={aprovando}
              reprovando={reprovando}
            />
          ))}
        </div>
      )}

      {/* Confirmar exclusão */}
      <ConfirmDialog
        aberto={confirmExcluir}
        fechar={() => { setConfirmExcluir(false); setExcluindo(null) }}
        titulo="Excluir depoimento"
        mensagem={`Excluir o depoimento de "${excluindo?.nome}" permanentemente? Esta ação não pode ser desfeita.`}
        onConfirmar={excluir}
        carregando={false}
      />
    </div>
  )
}
