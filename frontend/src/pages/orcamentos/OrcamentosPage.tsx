import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import {
  Plus, Search, Edit2, Trash2, FileText, Calendar, Printer,
  MessageCircle, Bell, Check, X, Clock, Building2
} from 'lucide-react'
import api from '../../services/api'
import { imprimirOrcamento } from '../../utils/orcamentoPDF'
import { enviarOrcamentoWhatsApp, telefoneWhatsApp } from '../../utils/whatsappOrcamento'
import { statusOrcamento, STATUS_RESPOSTA } from '../../utils/orcamentoStatus'
import type { Orcamento, OrcamentoResumo, Page, StatusOrcamento } from '../../types'
import Modal from '../../components/ui/Modal'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import FormOrcamento from './FormOrcamento'
import { useConfigSite } from '../../contexts/ConfigSiteContext'
import { useAbrirNovo } from '../../hooks/useAbrirNovo'
import toast from 'react-hot-toast'

function formatarMoeda(v?: number) {
  if (!v) return 'R$ 0,00'
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)
}

function formatarData(d?: string) {
  if (!d) return '—'
  return new Date(d + 'T00:00:00').toLocaleDateString('pt-BR')
}

function hojeISO() {
  return new Date().toISOString().slice(0, 10)
}

function precisaAcompanhar(orc: Orcamento) {
  if (orc.status !== 'ENVIADO' && orc.status !== 'EM_ANALISE') return false
  const hoje = hojeISO()
  if (orc.dataValidade && orc.dataValidade <= hojeISOPlus(2)) return true
  if (orc.proximoFollowUp) return orc.proximoFollowUp <= hoje
  const base = (orc.enviadoEm || orc.criadoEm || '').slice(0, 10)
  if (!base) return false
  const limite = new Date(base + 'T00:00:00')
  limite.setDate(limite.getDate() + 3)
  return limite.toISOString().slice(0, 10) <= hoje
}

function hojeISOPlus(dias: number) {
  const d = new Date()
  d.setDate(d.getDate() + dias)
  return d.toISOString().slice(0, 10)
}

export default function OrcamentosPage() {
  const { config } = useConfigSite()
  const [orcamentos, setOrcamentos] = useState<Orcamento[]>([])
  const [resumo, setResumo] = useState<OrcamentoResumo | null>(null)
  const [total, setTotal] = useState(0)
  const [pagina, setPagina] = useState(0)
  const [busca, setBusca] = useState('')
  const [filtroStatus, setFiltroStatus] = useState<StatusOrcamento | ''>('')
  const [carregando, setCarregando] = useState(true)
  const [modalAberto, setModalAberto] = useState(false)
  const [selecionado, setSelecionado] = useState<Partial<Orcamento> | null>(null)
  const [confirmarRemocao, setConfirmarRemocao] = useState<Orcamento | null>(null)
  const [confirmarAceite, setConfirmarAceite] = useState<Orcamento | null>(null)
  const [removendo, setRemovendo] = useState(false)
  const [aceitando, setAceitando] = useState(false)
  const [enviandoId, setEnviandoId] = useState<number | null>(null)
  useAbrirNovo(() => { setSelecionado(null); setModalAberto(true) })

  const carregarResumo = useCallback(async () => {
    try {
      const { data } = await api.get<OrcamentoResumo>('/orcamentos/resumo')
      setResumo(data)
    } catch { /* silencioso */ }
  }, [])

  const carregar = useCallback(async () => {
    setCarregando(true)
    try {
      const params = new URLSearchParams({ page: String(pagina), size: '12' })
      if (busca) params.set('q', busca)
      if (filtroStatus) params.set('status', filtroStatus)
      const { data } = await api.get<Page<Orcamento>>(`/orcamentos?${params}`)
      setOrcamentos(data.content)
      setTotal(data.totalElements)
    } catch {
      toast.error('Erro ao carregar orçamentos')
    } finally {
      setCarregando(false)
    }
  }, [pagina, busca, filtroStatus])

  useEffect(() => { carregar() }, [carregar])
  useEffect(() => { carregarResumo() }, [carregarResumo])

  const recarregarTudo = () => {
    carregar()
    carregarResumo()
  }

  const abrirEdicao = async (orc: Orcamento) => {
    try {
      const { data } = await api.get<Orcamento>(`/orcamentos/${orc.id}`)
      setSelecionado(data)
      setModalAberto(true)
    } catch {
      toast.error('Erro ao abrir orçamento')
    }
  }

  const gerarRelatorio = async (orc: Orcamento) => {
    try {
      const { data } = await api.get<Orcamento>(`/orcamentos/${orc.id}`)
      imprimirOrcamento(data, config)
    } catch {
      toast.error('Erro ao gerar relatório')
    }
  }

  const marcarEnviado = async (id: number) => {
    await api.patch(`/orcamentos/${id}/acompanhamento`, { marcarEnviado: true })
  }

  const enviarWhats = async (orc: Orcamento) => {
    if (!orc.id) return
    if (!telefoneWhatsApp(orc.cliente)) {
      toast.error('Cadastre o celular do cliente para enviar no WhatsApp.')
      abrirEdicao(orc)
      return
    }
    setEnviandoId(orc.id)
    try {
      const { data } = await api.get<Orcamento>(`/orcamentos/${orc.id}`)
      const modo = await enviarOrcamentoWhatsApp(data, config)
      await marcarEnviado(orc.id)
      recarregarTudo()
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

  const aoSalvarForm = async (salvo: Orcamento, opcoes?: { whatsapp?: boolean }) => {
    setModalAberto(false)
    recarregarTudo()
    if (salvo.status === 'APROVADO' && salvo.obra?.id) {
      toast.success(`Obra “${salvo.obra.nome}” criada a partir do orçamento.`)
    }
    if (opcoes?.whatsapp && salvo.id) {
      await enviarWhats(salvo)
    }
  }

  const mudarStatus = async (orc: Orcamento, status: StatusOrcamento) => {
    if (status === 'APROVADO' && orc.status !== 'APROVADO') {
      setConfirmarAceite(orc)
      return
    }
    try {
      await api.patch(`/orcamentos/${orc.id}/acompanhamento`, { status })
      recarregarTudo()
      toast.success(`Status: ${statusOrcamento[status].label}`)
    } catch {
      toast.error('Erro ao atualizar status')
    }
  }

  const aceitarOrcamento = async () => {
    if (!confirmarAceite?.id) return
    setAceitando(true)
    try {
      const { data } = await api.patch<Orcamento>(`/orcamentos/${confirmarAceite.id}/acompanhamento`, { status: 'APROVADO' })
      setConfirmarAceite(null)
      recarregarTudo()
      if (data.obra?.id) {
        toast.success(`Orçamento aceito. A obra “${data.obra.nome}” foi criada.`)
      } else {
        toast.success('Orçamento aceito.')
      }
    } catch {
      toast.error('Erro ao aceitar orçamento')
    } finally {
      setAceitando(false)
    }
  }

  const adiarFollowUp = async (orc: Orcamento) => {
    try {
      await api.patch(`/orcamentos/${orc.id}/acompanhamento`, { adiarDias: 3 })
      recarregarTudo()
      toast.success('Lembrete adiado por 3 dias')
    } catch {
      toast.error('Erro ao adiar lembrete')
    }
  }

  const remover = async () => {
    if (!confirmarRemocao?.id) return
    setRemovendo(true)
    try {
      await api.delete(`/orcamentos/${confirmarRemocao.id}`)
      toast.success('Orçamento removido')
      setConfirmarRemocao(null)
      recarregarTudo()
    } catch {
      toast.error('Erro ao remover orçamento')
    } finally {
      setRemovendo(false)
    }
  }

  const chips: { key: StatusOrcamento | ''; label: string; valor: number }[] = [
    { key: '', label: 'Todos', valor: total },
    { key: 'RASCUNHO', label: 'Rascunhos', valor: resumo?.rascunhos ?? 0 },
    { key: 'ENVIADO', label: 'Aguardando', valor: resumo?.aguardandoResposta ?? 0 },
    { key: 'APROVADO', label: 'Aceitos', valor: resumo?.aprovados ?? 0 },
    { key: 'REPROVADO', label: 'Recusados', valor: resumo?.recusados ?? 0 },
  ]

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Orçamentos</h1>
          <p className="text-primary-500 text-sm mt-1">{total} orçamento{total !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={() => { setSelecionado(null); setModalAberto(true) }} className="btn-primary">
          <Plus size={18} /> Novo Orçamento
        </button>
      </div>

      {(resumo?.followUpHoje || 0) > 0 && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 flex items-start gap-3">
          <Bell size={18} className="text-amber-600 mt-0.5 flex-shrink-0" />
          <div className="min-w-0">
            <div className="font-bold text-amber-900 text-sm">
              {resumo!.followUpHoje} orçamento{resumo!.followUpHoje > 1 ? 's' : ''} para acompanhar hoje
            </div>
            <p className="text-xs text-amber-800 mt-0.5">
              Enviados sem resposta ou perto de vencer. Fale com o cliente e atualize o status.
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {resumo!.acompanhar.slice(0, 4).map(item => (
                <button
                  key={item.id}
                  onClick={() => setFiltroStatus('ENVIADO')}
                  className="text-xs font-semibold bg-white border border-amber-200 rounded-full px-3 py-1 text-amber-800"
                >
                  {item.numero || item.titulo} {item.clienteNome ? `· ${item.clienteNome}` : ''}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        {chips.map(chip => (
          <button
            key={chip.key || 'todos'}
            onClick={() => { setFiltroStatus(chip.key); setPagina(0) }}
            className={`flex-shrink-0 min-h-[40px] px-3 py-2 rounded-xl text-xs font-bold border-2 transition-all ${
              filtroStatus === chip.key
                ? 'border-accent-500 bg-accent-50 text-accent-700'
                : 'border-stone-200 text-primary-500 bg-white'
            }`}
          >
            {chip.label} <span className="opacity-60">{chip.valor}</span>
          </button>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-primary-400" />
          <input className="input pl-10" placeholder="Buscar orçamento..." value={busca} onChange={e => { setBusca(e.target.value); setPagina(0) }} />
        </div>
        <select className="input hidden sm:block w-full sm:w-auto" value={filtroStatus} onChange={e => { setFiltroStatus(e.target.value as StatusOrcamento | ''); setPagina(0) }}>
          <option value="">Todos os status</option>
          {(Object.keys(statusOrcamento) as StatusOrcamento[]).map(k => (
            <option key={k} value={k}>{statusOrcamento[k].label}</option>
          ))}
        </select>
      </div>

      {carregando ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-4 border-accent-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : orcamentos.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-20 h-20 rounded-3xl bg-primary-50 flex items-center justify-center mx-auto mb-5">
            <FileText size={36} className="text-primary-300" />
          </div>
          <h3 className="text-lg font-bold text-primary-700 mb-2">{busca || filtroStatus ? 'Nenhum orçamento encontrado' : 'Nenhum orçamento criado'}</h3>
          {!busca && !filtroStatus && <button onClick={() => { setSelecionado(null); setModalAberto(true) }} className="btn-primary mt-4"><Plus size={16} /> Criar orçamento</button>}
        </div>
      ) : (
        <div className="space-y-3">
          {orcamentos.map((orc) => {
            const cfg = statusOrcamento[orc.status]
            const follow = precisaAcompanhar(orc)
            return (
              <div key={orc.id} className={`card-hover p-4 sm:p-5 group ${follow ? 'ring-1 ring-amber-300' : ''}`}>
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-primary-100 flex items-center justify-center flex-shrink-0">
                    <FileText size={16} className="text-primary-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      {orc.numero && <span className="text-xs font-mono text-primary-400">{orc.numero}</span>}
                      <span className={`badge ${cfg.classe}`}>{cfg.label}</span>
                      {follow && (
                        <span className="badge bg-amber-100 text-amber-700">
                          <Clock size={11} className="mr-1" /> Acompanhar
                        </span>
                      )}
                    </div>
                    <div className="font-bold text-primary-900 truncate">{orc.titulo}</div>
                    <div className="text-xs text-primary-400 mt-0.5">
                      {orc.cliente?.nome || 'Sem cliente'}
                      {(orc.cliente?.celular || orc.cliente?.telefone) ? ` · ${orc.cliente.celular || orc.cliente.telefone}` : ''}
                    </div>
                    {orc.notaAcompanhamento && (
                      <p className="text-xs text-primary-500 mt-1 line-clamp-2">{orc.notaAcompanhamento}</p>
                    )}
                    {orc.status === 'APROVADO' && orc.obra?.id && (
                      <Link
                        to={`/admin/obras/${orc.obra.id}`}
                        className="inline-flex items-center gap-1.5 mt-2 min-h-[40px] text-sm font-bold text-accent-600 hover:text-accent-700"
                      >
                        <Building2 size={15} /> Abrir obra
                      </Link>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-end gap-0.5 mt-3 pt-2 border-t border-stone-50">
                    <button
                      onClick={() => enviarWhats(orc)}
                      disabled={enviandoId === orc.id}
                      className="icon-btn text-emerald-600 hover:bg-emerald-50"
                      title="Enviar PDF no WhatsApp"
                      aria-label="WhatsApp"
                    >
                      <MessageCircle size={18} />
                    </button>
                    <button onClick={() => gerarRelatorio(orc)} className="icon-btn" title="Gerar relatório" aria-label="Relatório">
                      <Printer size={16} />
                    </button>
                    <button onClick={() => abrirEdicao(orc)} className="icon-btn" aria-label="Editar">
                      <Edit2 size={16} />
                    </button>
                    <button onClick={() => setConfirmarRemocao(orc)} className="icon-btn-danger" aria-label="Excluir">
                      <Trash2 size={16} />
                    </button>
                </div>

                <div className="flex flex-wrap gap-1.5 mt-3">
                  {STATUS_RESPOSTA.map(st => (
                    <button
                      key={st}
                      onClick={() => mudarStatus(orc, st)}
                      className={`min-h-[40px] px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
                        orc.status === st
                          ? statusOrcamento[st].classe + ' border-transparent'
                          : 'border-stone-200 text-primary-400 hover:border-stone-300'
                      }`}
                    >
                      {st === 'APROVADO' && <Check size={10} className="inline mr-0.5" />}
                      {st === 'REPROVADO' && <X size={10} className="inline mr-0.5" />}
                      {statusOrcamento[st].label}
                    </button>
                  ))}
                  {follow && (
                    <button
                      onClick={() => adiarFollowUp(orc)}
                      className="min-h-[40px] px-3 py-2 rounded-xl text-xs font-bold border border-amber-200 text-amber-700 hover:bg-amber-50"
                    >
                      Lembrar em 3 dias
                    </button>
                  )}
                </div>

                <div className="flex items-center justify-between mt-3 pt-3 border-t border-stone-100">
                  <div className="font-black text-lg text-primary-900">{formatarMoeda(orc.valorFinal)}</div>
                  <div className="flex items-center gap-3 text-xs text-primary-400">
                    {orc.proximoFollowUp && (orc.status === 'ENVIADO' || orc.status === 'EM_ANALISE') && (
                      <span>Follow-up {formatarData(orc.proximoFollowUp)}</span>
                    )}
                    {orc.dataValidade && (
                      <span className="flex items-center gap-1">
                        <Calendar size={11} /> {formatarData(orc.dataValidade)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
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

      <Modal aberto={modalAberto} fechar={() => setModalAberto(false)} titulo={selecionado?.id ? 'Editar Orçamento' : 'Novo Orçamento'} tamanho="xl">
        <FormOrcamento
          key={selecionado?.id || 'novo'}
          orcamento={selecionado}
          onSalvar={aoSalvarForm}
          onFechar={() => setModalAberto(false)}
        />
      </Modal>

      <ConfirmDialog aberto={!!confirmarRemocao} fechar={() => setConfirmarRemocao(null)} titulo="Remover orçamento" mensagem={`Remover o orçamento "${confirmarRemocao?.titulo}"?`} onConfirmar={remover} carregando={removendo} />
      <ConfirmDialog
        aberto={!!confirmarAceite}
        fechar={() => setConfirmarAceite(null)}
        titulo="Aceitar orçamento"
        mensagem={`Marcar "${confirmarAceite?.titulo}" como aceito? Isso cria uma obra com o cliente e o valor deste orçamento.`}
        onConfirmar={aceitarOrcamento}
        carregando={aceitando}
        confirmLabel="Aceitar e criar obra"
        tom="warning"
      />
    </div>
  )
}
