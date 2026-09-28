import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Users, Building2, HardHat, TrendingUp, TrendingDown,
  DollarSign, ArrowRight, Activity, ExternalLink,
  Wallet, CreditCard, Clock, AlertCircle, CheckCircle2, FileText, Bell
} from 'lucide-react'
import api from '../services/api'
import type { DashboardResumo, FuncionarioPendente } from '../types'

function formatarMoeda(valor: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(valor || 0)
}

interface CardMetricaProps {
  titulo: string
  valor: string | number
  icone: React.ElementType
  cor: string
  descricao?: string
  link?: string
}

function CardMetrica({ titulo, valor, icone: Icone, cor, descricao, link }: CardMetricaProps) {
  const conteudo = (
    <div className="card p-3.5 sm:p-5 md:p-6 h-full flex flex-col group hover:shadow-card-hover transition-all duration-200">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-10 h-10 md:w-11 md:h-11 rounded-xl md:rounded-2xl flex items-center justify-center flex-shrink-0 ${cor}`}>
          <Icone size={20} className="text-white" />
        </div>
        {link && (
          <ArrowRight size={15} className="text-primary-300 group-hover:text-primary-500 group-hover:translate-x-1 transition-all flex-shrink-0" />
        )}
      </div>
      <div className="mt-auto">
        <div className="text-xl sm:text-2xl md:text-3xl font-black text-primary-900 mb-1 leading-tight break-words">
          {valor}
        </div>
        <div className="text-xs sm:text-sm font-medium text-primary-500 leading-snug">{titulo}</div>
        {descricao && (
          <div className="text-xs text-primary-400 mt-1 leading-snug">{descricao}</div>
        )}
      </div>
    </div>
  )

  if (link) {
    return <Link to={link} className="block h-full">{conteudo}</Link>
  }
  return conteudo
}

function CardFinanceiro({ titulo, valor, tipo }: { titulo: string, valor: number, tipo: 'receita' | 'despesa' | 'saldo' }) {
  const config = {
    receita: { icon: TrendingUp, cor: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' },
    despesa: { icon: TrendingDown, cor: 'text-red-500', bg: 'bg-red-50', border: 'border-red-100' },
    saldo: { icon: DollarSign, cor: valor >= 0 ? 'text-emerald-600' : 'text-red-500', bg: valor >= 0 ? 'bg-emerald-50' : 'bg-red-50', border: valor >= 0 ? 'border-emerald-100' : 'border-red-100' },
  }[tipo]

  const Icon = config.icon

  return (
    <div className={`rounded-2xl border p-5 h-full flex flex-col ${config.bg} ${config.border}`}>
      <div className="flex items-center gap-2 mb-3">
        <Icon size={16} className={config.cor} />
        <span className="text-sm font-medium text-primary-600">{titulo}</span>
      </div>
      <div className={`text-xl md:text-2xl font-black mt-auto break-words ${config.cor}`}>
        {formatarMoeda(valor)}
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const [resumo, setResumo] = useState<DashboardResumo | null>(null)
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    api.get('/dashboard/resumo')
      .then(({ data }) => setResumo(data))
      .catch(() => setResumo(null))
      .finally(() => setCarregando(false))
  }, [])

  const agora = new Date()
  const saudacao = agora.getHours() < 12 ? 'Bom dia' : agora.getHours() < 18 ? 'Boa tarde' : 'Boa noite'
  const mes = agora.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })

  if (carregando) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-accent-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-primary-500 text-sm">Carregando dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-2xl font-black text-primary-900">{saudacao}! 👋</h1>
          <p className="text-primary-500 text-sm mt-1">
            Visão geral do sistema LJV Construção
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl border border-stone-200 text-sm text-primary-500">
          <Activity size={14} className="text-accent-500" />
          <span className="font-medium capitalize">{mes}</span>
        </div>
      </div>

      {/* Cards principais */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        <CardMetrica
          titulo="Clientes ativos"
          valor={resumo?.totalClientes ?? '—'}
          icone={Users}
          cor="bg-blue-500"
          link="/admin/clientes"
        />
        <CardMetrica
          titulo="Obras em andamento"
          valor={resumo?.obrasEmAndamento ?? '—'}
          icone={Building2}
          cor="bg-accent-500"
          link="/admin/obras"
          descricao={resumo ? `${resumo.obrasAtivas} obras ativas no total` : undefined}
        />
        <CardMetrica
          titulo="Funcionários ativos"
          valor={resumo?.totalFuncionarios ?? '—'}
          icone={HardHat}
          cor="bg-primary-700"
          link="/admin/funcionarios"
        />
        <CardMetrica
          titulo="Saldo do mês"
          valor={resumo ? formatarMoeda(resumo.saldoMes) : '—'}
          icone={DollarSign}
          cor={resumo && resumo.saldoMes < 0 ? 'bg-red-500' : 'bg-emerald-500'}
          link="/admin/financeiro"
        />
      </div>

      {(resumo?.orcamentos?.followUpHoje || resumo?.orcamentos?.aguardandoResposta) ? (
        <Link to="/admin/orcamentos" className="card p-4 sm:p-5 flex items-start gap-3 hover:shadow-card-hover transition-all">
          <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
            {(resumo?.orcamentos?.followUpHoje || 0) > 0 ? <Bell size={18} className="text-amber-600" /> : <FileText size={18} className="text-amber-600" />}
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-bold text-primary-900">Orçamentos para acompanhar</div>
            <p className="text-sm text-primary-500 mt-0.5">
              {resumo?.orcamentos?.followUpHoje || 0} lembrete{(resumo?.orcamentos?.followUpHoje || 0) !== 1 ? 's' : ''} hoje
              {' · '}
              {resumo?.orcamentos?.aguardandoResposta || 0} aguardando resposta
              {' · '}
              {resumo?.orcamentos?.aprovadosMes || 0} aceito{(resumo?.orcamentos?.aprovadosMes || 0) !== 1 ? 's' : ''} neste mês
            </p>
          </div>
          <ArrowRight size={16} className="text-primary-300 mt-1 flex-shrink-0" />
        </Link>
      ) : null}

      {/* Financeiro do mês */}
      <div>
        <h2 className="text-lg font-bold text-primary-900 mb-4 flex items-center gap-2">
          <DollarSign size={18} className="text-accent-500" />
          Financeiro — <span className="capitalize font-normal text-primary-500">{mes}</span>
        </h2>
        <div className="grid sm:grid-cols-3 gap-4">
          <CardFinanceiro titulo="Receitas do mês" valor={resumo?.receitaMes ?? 0} tipo="receita" />
          <CardFinanceiro titulo="Despesas do mês" valor={resumo?.despesaMes ?? 0} tipo="despesa" />
          <CardFinanceiro titulo="Saldo do mês" valor={resumo?.saldoMes ?? 0} tipo="saldo" />
        </div>
      </div>

      {/* Obras em andamento */}
      {resumo?.obrasEmAndamentoLista && resumo.obrasEmAndamentoLista.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-primary-900 flex items-center gap-2">
              <Building2 size={18} className="text-accent-500" />
              Obras em andamento
            </h2>
            <Link to="/admin/obras" className="text-sm text-primary-400 hover:text-primary-700 flex items-center gap-1 transition-colors">
              Ver todas <ArrowRight size={13} />
            </Link>
          </div>
          <div className="space-y-3">
            {resumo.obrasEmAndamentoLista.map((o) => (
              <Link
                key={o.id}
                to={`/admin/obras/${o.id}`}
                className="card-hover p-4 flex items-center gap-4 group block"
              >
                <div className="w-10 h-10 rounded-xl bg-primary-900 flex items-center justify-center flex-shrink-0">
                  <Building2 size={18} className="text-accent-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="font-semibold text-primary-900 text-sm truncate">{o.nome}</span>
                    <span className="text-sm font-bold text-primary-900 flex-shrink-0">{o.percentualConcluido}%</span>
                  </div>
                  <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-accent-500 rounded-full transition-all"
                      style={{ width: `${o.percentualConcluido}%` }}
                    />
                  </div>
                  {o.cliente && (
                    <p className="text-xs text-primary-400 mt-1.5">{o.cliente}</p>
                  )}
                </div>
                <ExternalLink size={14} className="text-primary-200 group-hover:text-primary-400 flex-shrink-0 transition-colors" />
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ─── Folha de funcionários ─────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-primary-900 flex items-center gap-2">
            <HardHat size={18} className="text-accent-500" />
            Folha de Funcionários
          </h2>
          <Link to="/admin/folha" className="text-sm text-primary-400 hover:text-primary-700 flex items-center gap-1 transition-colors">
            Gerenciar <ArrowRight size={13} />
          </Link>
        </div>

        {/* Cards de resumo da folha */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-5">
          <div className="card p-4 sm:p-5 h-full flex flex-col border-l-4 border-l-orange-400">
            <div className="flex items-center gap-2 mb-2">
              <Clock size={14} className="text-orange-500" />
              <span className="text-xs font-semibold text-primary-500">A pagar</span>
            </div>
            <div className="text-lg sm:text-xl font-black text-orange-500 mt-auto break-words">
              {formatarMoeda(resumo?.folhaPendente?.totalPagamentosPendentes ?? 0)}
            </div>
            <div className="text-xs text-primary-400 mt-0.5">
              {resumo?.folhaPendente?.quantidadeFuncionariosPendentes ?? 0} funcionário(s)
            </div>
          </div>

          <div className="card p-4 sm:p-5 h-full flex flex-col border-l-4 border-l-red-400">
            <div className="flex items-center gap-2 mb-2">
              <CreditCard size={14} className="text-red-500" />
              <span className="text-xs font-semibold text-primary-500">Vales a descontar</span>
            </div>
            <div className="text-lg sm:text-xl font-black text-red-500 mt-auto break-words">
              {formatarMoeda(resumo?.folhaPendente?.totalValesPendentes ?? 0)}
            </div>
            <div className="text-xs text-primary-400 mt-0.5">A descontar dos pagamentos</div>
          </div>

          <div className="card p-4 sm:p-5 h-full flex flex-col border-l-4 border-l-emerald-400 col-span-2 sm:col-span-1">
            <div className="flex items-center gap-2 mb-2">
              <Wallet size={14} className="text-emerald-600" />
              <span className="text-xs font-semibold text-primary-500">Total líquido</span>
            </div>
            <div className="text-lg sm:text-xl font-black text-emerald-600 mt-auto break-words">
              {formatarMoeda(
                Math.max(0,
                  (resumo?.folhaPendente?.totalPagamentosPendentes ?? 0) -
                  (resumo?.folhaPendente?.totalValesPendentes ?? 0)
                )
              )}
            </div>
            <div className="text-xs text-primary-400 mt-0.5">Bruto − vales (adiant.)</div>
          </div>
        </div>

        {/* Lista de funcionários com pendências */}
        {(resumo?.folhaPendente?.funcionariosPendentes?.length ?? 0) === 0 ? (
          <div className="card p-8 text-center">
            <CheckCircle2 size={28} className="mx-auto mb-2 text-emerald-400" />
            <p className="text-sm font-semibold text-primary-600">Nenhum pagamento pendente</p>
            <p className="text-xs text-primary-400 mt-1">Todos os funcionários estão em dia!</p>
          </div>
        ) : (
          <div className="card overflow-hidden">
            <div className="px-4 py-3 bg-stone-50 border-b border-stone-100 flex items-center gap-2">
              <AlertCircle size={14} className="text-orange-500" />
              <span className="text-xs font-bold text-primary-600 uppercase tracking-wider">
                {resumo!.folhaPendente.quantidadeFuncionariosPendentes} funcionário(s) com pagamento pendente
              </span>
            </div>
            <div className="divide-y divide-stone-50">
              {resumo!.folhaPendente.funcionariosPendentes.map((f: FuncionarioPendente) => (
                <div key={f.id} className="px-4 sm:px-5 py-3.5 flex items-center gap-3 hover:bg-stone-50/60 transition-colors">
                  {/* Avatar */}
                  <div className="w-9 h-9 rounded-xl bg-primary-900 flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {f.foto
                      ? <img src={f.foto} alt={f.nome} className="w-full h-full object-cover" />
                      : <span className="text-accent-400 font-bold text-xs">
                          {f.nome.split(' ').slice(0,2).map(n => n[0]).join('').toUpperCase()}
                        </span>
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-primary-900 text-sm truncate">{f.nome}</div>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        f.tipoRecebimento === 'DIARIA' ? 'bg-blue-50 text-blue-600' :
                        f.tipoRecebimento === 'SEMANAL' ? 'bg-violet-50 text-violet-600' :
                        f.tipoRecebimento === 'QUINZENAL' ? 'bg-indigo-50 text-indigo-600' :
                        'bg-emerald-50 text-emerald-600'
                      }`}>
                        {{ DIARIA:'Diária', SEMANAL:'Semanal', QUINZENAL:'Quinzenal', MENSAL:'Mensal' }[f.tipoRecebimento]}
                      </span>
                      {f.valePendente > 0 && (
                        <span className="text-[10px] text-red-500 font-semibold">Adiant.: {formatarMoeda(f.valePendente)}</span>
                      )}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-sm font-black text-orange-500">{formatarMoeda(f.pagamentoPendente)}</div>
                    {f.totalAPagar !== f.pagamentoPendente && (
                      <div className="text-xs text-emerald-600 font-semibold">Líq: {formatarMoeda(f.totalAPagar)}</div>
                    )}
                  </div>
                  <Link to="/admin/folha" className="icon-btn flex-shrink-0" aria-label="Abrir folha">
                    <ArrowRight size={14} />
                  </Link>
                </div>
              ))}
            </div>
            <div className="px-5 py-3 bg-stone-50 border-t border-stone-100 flex items-center justify-between">
              <span className="text-xs text-primary-400">Total a pagar (líquido)</span>
              <span className="text-sm font-black text-emerald-600">
                {formatarMoeda(
                  Math.max(0,
                    (resumo?.folhaPendente?.totalPagamentosPendentes ?? 0) -
                    (resumo?.folhaPendente?.totalValesPendentes ?? 0)
                  )
                )}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Atalhos rápidos */}
      <div>
        <h2 className="text-lg font-bold text-primary-900 mb-4">Acesso rápido</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[
            { to: '/admin/obras', icon: Building2, title: 'Gerenciar Obras', desc: 'Acompanhe o status de cada obra', cor: 'border-l-accent-500' },
            { to: '/admin/clientes', icon: Users, title: 'Clientes', desc: 'Gerencie sua carteira de clientes', cor: 'border-l-blue-500' },
            { to: '/admin/orcamentos', icon: TrendingUp, title: 'Orçamentos', desc: 'Crie e gerencie orçamentos', cor: 'border-l-violet-500' },
            { to: '/admin/funcionarios', icon: HardHat, title: 'Funcionários', desc: 'Controle sua equipe de trabalho', cor: 'border-l-orange-500' },
            { to: '/admin/folha', icon: Wallet, title: 'Folha de Pagamento', desc: 'Adiantamentos, pagamentos e ponto', cor: 'border-l-red-400' },
            { to: '/admin/financeiro', icon: DollarSign, title: 'Financeiro', desc: 'Receitas, despesas e saldo', cor: 'border-l-emerald-500' },
          ].map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={`card p-5 border-l-4 ${item.cor} hover:shadow-card-hover transition-all duration-200 group flex items-center gap-4`}
            >
              <item.icon size={20} className="text-primary-400 group-hover:text-primary-700 transition-colors flex-shrink-0" />
              <div className="min-w-0">
                <div className="font-semibold text-primary-800 text-sm">{item.title}</div>
                <div className="text-xs text-primary-400 mt-0.5 truncate">{item.desc}</div>
              </div>
              <ArrowRight size={14} className="ml-auto text-primary-200 group-hover:text-primary-400 group-hover:translate-x-1 transition-all flex-shrink-0" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
