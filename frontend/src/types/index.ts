// =====================================================
// Types — LJV Construção
// =====================================================

export interface Usuario {
  id: number
  username: string
  nome: string
  email: string
  perfil: 'ADMIN' | 'GERENTE' | 'OPERADOR'
  fotoPerfil?: string
}

export interface AuthState {
  autenticado: boolean
  usuario: Usuario | null
  carregando: boolean
}

// --- Clientes ---
export interface Cliente {
  id?: number
  nome: string
  cpfCnpj?: string
  telefone?: string
  celular?: string
  email?: string
  logradouro?: string
  numero?: string
  complemento?: string
  bairro?: string
  cidade?: string
  estado?: string
  cep?: string
  observacoes?: string
  ativo?: boolean
  criadoEm?: string
  atualizadoEm?: string
}

// --- Obras ---
export type StatusObra = 'ORCAMENTO' | 'APROVADA' | 'EM_ANDAMENTO' | 'PAUSADA' | 'CONCLUIDA' | 'CANCELADA'

export type PeriodicidadePagamentoObra = 'SEMANAL' | 'QUINZENAL' | 'MENSAL' | 'UNICO'

export interface Obra {
  id?: number
  nome: string
  descricao?: string
  status: StatusObra
  cliente?: { id: number; nome: string }
  logradouro?: string
  numero?: string
  complemento?: string
  bairro?: string
  cidade?: string
  estado?: string
  cep?: string
  valorContrato?: number
  valorOrcado?: number
  periodicidadePagamento?: PeriodicidadePagamentoObra
  valorParcela?: number
  totalRecebido?: number
  totalAditivos?: number
  totalEscopo?: number
  dataInicio?: string
  dataPrevisaoFim?: string
  dataConclusao?: string
  percentualConcluido?: number
  observacoes?: string
  criadoEm?: string
  atualizadoEm?: string
}

export type TipoRecebimentoObra = 'ENTRADA' | 'PARCELA' | 'SALDO' | 'ADITIVO' | 'OUTRO'

export type CategoriaAditivo = 'SERVICO_EXTRA' | 'MATERIAL' | 'ALTERACAO' | 'OUTRO'

export interface RecebimentoObra {
  id?: number
  obraId?: number
  valor: number
  data: string
  dataRecebimento?: string
  referencia?: string
  tipo?: TipoRecebimentoObra
  formaPagamento?: string
  observacoes?: string
  recebido?: boolean
}

export interface AditivoObra {
  id?: number
  obraId?: number
  descricao: string
  observacao?: string
  unidade?: string
  quantidade?: number
  valorUnitario?: number
  valorTotal?: number
  data?: string
  categoria?: CategoriaAditivo
  cobravel?: boolean
  solicitadoPor?: string
  observacoes?: string
}

export type OrigemItemObra = 'ORCAMENTO' | 'ADICIONADO'

export interface ItemObra {
  id?: number
  obraId?: number
  descricao: string
  observacao?: string
  unidade?: string
  quantidade?: number
  valorUnitario?: number
  valorTotal?: number
  ordem?: number
  origem?: OrigemItemObra
  itemOrcamentoId?: number
  ativo?: boolean
  dataInclusao?: string
  dataRemocao?: string
  motivoRemocao?: string
}

export interface ResumoRecebimentoObra {
  obraId: number
  valorContrato: number
  totalEscopo: number
  temItens: boolean
  quantidadeItensAtivos: number
  quantidadeItens: number
  valorParcela: number
  periodicidade: PeriodicidadePagamentoObra
  totalAditivos: number
  totalAReceber: number
  totalRecebido: number
  totalPendente: number
  saldoContrato: number
  percentualRecebido: number
  quantidadeRecebido: number
  quantidadeAditivos: number
}

// --- Diário de Obra ---
export type Clima = 'Ensolarado' | 'Nublado' | 'Chuvoso' | 'Parcialmente nublado' | 'Ventoso'

export interface DiarioObra {
  id?: number
  obra?: { id: number }
  data: string
  descricao?: string
  trabalhadores?: number
  clima?: string
  atividades?: string
  observacoes?: string
  criadoEm?: string
}

// --- Funcionários ---
export type CargoFuncionario =
  | 'ENGENHEIRO' | 'ARQUITETO' | 'MESTRE_DE_OBRAS' | 'ENCARREGADO'
  | 'PEDREIRO' | 'SERVENTE' | 'ELETRICISTA' | 'ENCANADOR'
  | 'PINTOR' | 'CARPINTEIRO' | 'SOLDADOR' | 'MOTORISTA'
  | 'ADMINISTRATIVO' | 'OUTRO'

export type TipoRecebimento = 'DIARIA' | 'SEMANAL' | 'QUINZENAL' | 'MENSAL'
export type TipoMovimentacao = 'PAGAMENTO' | 'VALE' | 'DESCONTO'

export interface MovimentacaoFuncionario {
  id?: number
  funcionarioId?: number
  funcionarioNome?: string
  tipo: TipoMovimentacao
  valor: number
  data: string
  dataPagamento?: string | null
  pago: boolean
  referencia?: string
  observacoes?: string
  criadoEm?: string
}

/** Status de um dia no controle de ponto */
export type StatusDia = 'TRABALHADO' | 'FALTA' | 'FALTA_JUSTIFICADA' | 'FOLGA'

export interface RegistroPonto {
  id?: number
  funcionarioId?: number
  funcionarioNome?: string
  data: string
  status: StatusDia
  descontar: boolean
  motivo?: string
  observacoes?: string
  criadoEm?: string
}

export interface RelatorioFuncionarioLinha {
  funcionario: {
    id: number
    nome: string
    cargo: string
    tipoRecebimento: TipoRecebimento
    salario: number
    valorDiaria: number
    foto?: string
    telefone?: string
    celular?: string
  }
  diasUteisNoPeriodo: number
  diasTrabalhados: number
  diasExtras: number
  faltasTotal: number
  faltasJustificadas: number
  faltasNaoJustificadas: number
  faltasADescontar: number
  valorDia?: number
  valorBruto: number
  descontos: number
  valorLiquido: number
  /** Total de vales (adiantamentos) lançados no período */
  valesNoPeriodo?: number
  /** Vales ainda a descontar do pagamento */
  valesPendentes?: number
  descontosAvulsos?: number
  pagamentosJaFeitos?: number
  /** Líquido − vales a descontar − descontos avulsos − já pago */
  aReceber?: number
  registros: RegistroPonto[]
}

export interface RelatorioFolha {
  periodo: { inicio: string; fim: string }
  diasUteisNoPeriodo: number
  totalFuncionarios: number
  totalBruto: number
  totalDescontos: number
  totalLiquido: number
  totalExtras: number
  totalVales?: number
  totalValesPendentes?: number
  totalDescontosAvulsos?: number
  totalAPagar?: number
  funcionarios: RelatorioFuncionarioLinha[]
}

export interface Funcionario {
  id?: number
  nome: string
  cpf?: string
  rg?: string
  telefone?: string
  celular?: string
  email?: string
  cargo?: CargoFuncionario
  especialidade?: string
  salario?: number
  tipoRecebimento?: TipoRecebimento
  valorDiaria?: number
  foto?: string
  freelancer?: boolean
  ativo?: boolean
  dataAdmissao?: string
  dataDemissao?: string
  logradouro?: string
  numero?: string
  bairro?: string
  cidade?: string
  estado?: string
  cep?: string
  observacoes?: string
  criadoEm?: string
}

// --- Orçamentos ---
export type StatusOrcamento = 'RASCUNHO' | 'ENVIADO' | 'EM_ANALISE' | 'APROVADO' | 'REPROVADO' | 'EXPIRADO'

export interface ItemOrcamento {
  id?: number
  descricao: string
  observacao?: string
  unidade?: string
  quantidade: number
  valorUnitario: number
  valorTotal: number
  ordem?: number
}

export interface OrcamentoCliente {
  id: number
  nome: string
  telefone?: string
  celular?: string
  email?: string
}

export interface Orcamento {
  id?: number
  numero?: string
  titulo: string
  descricao?: string
  status: StatusOrcamento
  cliente?: OrcamentoCliente
  obra?: { id: number; nome: string }
  valorTotal?: number
  desconto?: number
  valorFinal?: number
  dataValidade?: string
  localServico?: string
  prazoExecucao?: string
  garantia?: string
  formaPagamento?: string
  entradaPercentual?: number
  numeroParcelas?: number
  condicoesPagamento?: string
  incluso?: string
  naoIncluso?: string
  observacoes?: string
  itens?: ItemOrcamento[]
  enviadoEm?: string
  ultimoContatoEm?: string
  proximoFollowUp?: string
  dataResposta?: string
  notaAcompanhamento?: string
  criadoEm?: string
}

export interface OrcamentoResumo {
  rascunhos: number
  aguardandoResposta: number
  followUpHoje: number
  aprovados: number
  recusados: number
  expirados: number
  aprovadosMes: number
  acompanhar: {
    id: number
    numero?: string
    titulo: string
    status: StatusOrcamento
    valorFinal?: number
    proximoFollowUp?: string
    dataValidade?: string
    clienteNome?: string
  }[]
}

// --- Financeiro ---
export type TipoTransacao = 'RECEITA' | 'DESPESA'

export interface Transacao {
  id?: number
  tipo: TipoTransacao
  descricao: string
  categoria?: string
  valor: number
  data: string
  dataPagamento?: string
  formaPagamento?: string
  obra?: { id: number; nome: string }
  cliente?: { id: number; nome: string }
  pago?: boolean
  observacoes?: string
  criadoEm?: string
}

// --- Paginação ---
export interface Page<T> {
  content: T[]
  totalElements: number
  totalPages: number
  number: number
  size: number
}

// --- Dashboard ---
export interface ObraResumo {
  id: number
  nome: string
  percentualConcluido: number
  cliente: string
}

export interface FuncionarioPendente {
  id: number
  nome: string
  cargo: string
  tipoRecebimento: TipoRecebimento
  foto?: string
  pagamentoPendente: number
  valePendente: number
  descontoPendente: number
  totalAPagar: number
}

export interface FolhaDashboard {
  totalPagamentosPendentes: number
  totalValesPendentes: number
  quantidadeFuncionariosPendentes: number
  funcionariosPendentes: FuncionarioPendente[]
}

export interface DashboardResumo {
  folhaPendente: FolhaDashboard
  totalClientes: number
  obrasAtivas: number
  totalFuncionarios: number
  obrasEmAndamento: number
  obrasEmAndamentoLista: ObraResumo[]
  receitaMes: number
  despesaMes: number
  saldoMes: number
  orcamentos?: {
    aguardandoResposta: number
    followUpHoje: number
    aprovadosMes: number
  }
}
