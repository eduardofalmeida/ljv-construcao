import { AlertTriangle } from 'lucide-react'
import Modal from './Modal'

interface ConfirmDialogProps {
  aberto: boolean
  fechar: () => void
  titulo?: string
  mensagem: string
  onConfirmar: () => void
  carregando?: boolean
  confirmLabel?: string
  tom?: 'danger' | 'warning'
}

export default function ConfirmDialog({
  aberto,
  fechar,
  titulo = 'Confirmar ação',
  mensagem,
  onConfirmar,
  carregando = false,
  confirmLabel = 'Confirmar',
  tom = 'danger'
}: ConfirmDialogProps) {
  const aviso = tom === 'warning'
  return (
    <Modal aberto={aberto} fechar={fechar} titulo={titulo} tamanho="sm">
      <div className="flex flex-col items-center text-center gap-4 py-2">
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${aviso ? 'bg-amber-50' : 'bg-red-50'}`}>
          <AlertTriangle size={24} className={aviso ? 'text-amber-500' : 'text-red-500'} />
        </div>
        <p className="text-primary-600 text-sm leading-relaxed">{mensagem}</p>
        <div className="flex gap-3 w-full mt-2">
          <button
            onClick={fechar}
            className="flex-1 btn-outline min-h-[48px]"
            disabled={carregando}
          >
            Cancelar
          </button>
          <button
            onClick={onConfirmar}
            disabled={carregando}
            className={`flex-1 min-h-[48px] ${aviso ? 'btn-primary' : 'btn-danger'}`}
          >
            {carregando ? 'Aguarde...' : confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  )
}
