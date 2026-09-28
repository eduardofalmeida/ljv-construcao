import { useEffect } from 'react'
import { X } from 'lucide-react'
import clsx from 'clsx'

interface ModalProps {
  aberto: boolean
  fechar: () => void
  titulo: string
  children: React.ReactNode
  tamanho?: 'sm' | 'md' | 'lg' | 'xl'
}

export default function Modal({ aberto, fechar, titulo, children, tamanho = 'md' }: ModalProps) {
  useEffect(() => {
    if (aberto) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [aberto])

  if (!aberto) return null

  const larguras = {
    sm: 'sm:max-w-sm',
    md: 'sm:max-w-lg',
    lg: 'sm:max-w-2xl',
    xl: 'sm:max-w-4xl',
  }

  return (
    // Mobile: bottom sheet | Desktop: centered
    <div className="fixed inset-0 z-50 flex flex-col justify-end sm:justify-center sm:items-center sm:p-4">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={fechar}
      />

      {/* Painel */}
      <div className={clsx(
        'relative w-full bg-white shadow-modal flex flex-col animate-slide-up',
        // Mobile: full width, rounded top; Desktop: max-width, fully rounded
        'rounded-t-3xl sm:rounded-2xl',
        // Altura máxima: ocupa até 92dvh no mobile, 90vh no desktop
        'max-h-[92dvh] sm:max-h-[90vh]',
        larguras[tamanho]
      )}>
        {/* Alça visual (mobile only) */}
        <div className="sm:hidden flex justify-center pt-3 pb-1 flex-shrink-0" aria-hidden>
          <div className="w-10 h-1 bg-stone-200 rounded-full" />
        </div>

        {/* Cabeçalho — fixo no topo */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-stone-100 flex-shrink-0">
          <h2 className="text-base sm:text-lg font-bold text-primary-900 break-words pr-4 leading-snug">{titulo}</h2>
          <button
            onClick={fechar}
            className="flex-shrink-0 p-2.5 min-w-[44px] min-h-[44px] text-primary-400 hover:text-primary-700 hover:bg-stone-100 rounded-xl transition-colors"
            aria-label="Fechar"
          >
            <X size={18} />
          </button>
        </div>

        {/* Conteúdo rolável */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-5 sm:px-6 py-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
          {children}
        </div>
      </div>
    </div>
  )
}
