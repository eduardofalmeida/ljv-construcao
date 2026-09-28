import { useState, useEffect, useRef } from 'react'

/**
 * Detecta alterações não salvas em formulários.
 * Exibe confirmação se o usuário tentar fechar com dados modificados.
 */
export function useUnsavedChanges(initialValue: object) {
  const initial = useRef(JSON.stringify(initialValue))
  const [isDirty, setIsDirty] = useState(false)

  const check = (currentValue: object) => {
    setIsDirty(JSON.stringify(currentValue) !== initial.current)
  }

  const reset = (newValue?: object) => {
    if (newValue) initial.current = JSON.stringify(newValue)
    setIsDirty(false)
  }

  return { isDirty, check, reset }
}

/**
 * Hook para confirmar saída de modal com alterações não salvas.
 * Retorna a função `confirmClose` que exibe um confirm nativo antes de fechar.
 */
export function useConfirmClose(isDirty: boolean, onClose: () => void) {
  const confirmClose = () => {
    if (isDirty) {
      const ok = window.confirm('Você tem alterações não salvas. Deseja realmente sair?')
      if (!ok) return
    }
    onClose()
  }
  return confirmClose
}
