import type { StatusOrcamento } from '../types'

export const statusOrcamento: Record<StatusOrcamento, { label: string; classe: string; hint: string }> = {
  RASCUNHO: {
    label: 'Rascunho',
    classe: 'bg-gray-100 text-gray-600',
    hint: 'Ainda não enviado ao cliente',
  },
  ENVIADO: {
    label: 'Aguardando',
    classe: 'bg-blue-100 text-blue-700',
    hint: 'Enviado — ainda sem retorno',
  },
  EM_ANALISE: {
    label: 'Em conversa',
    classe: 'bg-yellow-100 text-yellow-700',
    hint: 'Cliente respondeu e está avaliando',
  },
  APROVADO: {
    label: 'Aceito',
    classe: 'bg-emerald-100 text-emerald-700',
    hint: 'Vira uma obra automaticamente',
  },
  REPROVADO: {
    label: 'Recusado',
    classe: 'bg-red-100 text-red-600',
    hint: 'Cliente não aceitou',
  },
  EXPIRADO: {
    label: 'Expirado',
    classe: 'bg-gray-100 text-gray-500',
    hint: 'Passou da validade sem fechamento',
  },
}

export const STATUS_RESPOSTA: StatusOrcamento[] = ['ENVIADO', 'APROVADO', 'REPROVADO']
