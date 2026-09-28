import { useState, useEffect, useRef, useCallback } from 'react'
import { Search, X, User } from 'lucide-react'
import api from '../../services/api'
import type { Cliente } from '../../types'

interface ClienteSelectProps {
  value?: { id: number; nome: string; telefone?: string; celular?: string; email?: string } | null
  onChange: (cliente: { id: number; nome: string; telefone?: string; celular?: string; email?: string } | null) => void
  placeholder?: string
  label?: string
  required?: boolean
}

interface DropdownPos { top: number; left: number; width: number }

export default function ClienteSelect({
  value,
  onChange,
  placeholder = 'Buscar cliente...',
  label = 'Cliente',
  required = false,
}: ClienteSelectProps) {
  const [query, setQuery] = useState('')
  const [resultados, setResultados] = useState<Cliente[]>([])
  const [aberto, setAberto] = useState(false)
  const [carregando, setCarregando] = useState(false)
  const [pos, setPos] = useState<DropdownPos | null>(null)

  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Fechar ao clicar fora
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setAberto(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Atualizar posição do dropdown (fixed, escapa do overflow)
  const atualizarPos = useCallback(() => {
    if (!inputRef.current) return
    const rect = inputRef.current.getBoundingClientRect()
    setPos({ top: rect.bottom + 4, left: rect.left, width: rect.width })
  }, [])

  useEffect(() => {
    if (aberto) {
      atualizarPos()
      window.addEventListener('scroll', atualizarPos, true)
      window.addEventListener('resize', atualizarPos)
    }
    return () => {
      window.removeEventListener('scroll', atualizarPos, true)
      window.removeEventListener('resize', atualizarPos)
    }
  }, [aberto, atualizarPos])

  const buscar = useCallback(async (q: string) => {
    if (!q.trim()) { setResultados([]); return }
    setCarregando(true)
    try {
      const { data } = await api.get(`/clientes?q=${encodeURIComponent(q)}&size=8`)
      setResultados(data.content || [])
    } catch {
      setResultados([])
    } finally {
      setCarregando(false)
    }
  }, [])

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value
    setQuery(q)
    setAberto(true)
    atualizarPos()
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => buscar(q), 300)
  }

  const selecionar = (c: Cliente) => {
    onChange({
      id: c.id!,
      nome: c.nome,
      telefone: c.telefone,
      celular: c.celular,
      email: c.email,
    })
    setQuery('')
    setAberto(false)
    setResultados([])
  }

  const limpar = () => {
    onChange(null)
    setQuery('')
    setResultados([])
  }

  return (
    <div className="relative" ref={containerRef}>
      {label && <label className="label">{label}{required && ' *'}</label>}

      {/* Campo com cliente selecionado */}
      {value ? (
        <div className="flex items-center gap-3 px-4 py-2.5 border border-accent-200 rounded-xl bg-accent-50">
          <div className="w-7 h-7 rounded-lg bg-primary-900 flex items-center justify-center flex-shrink-0">
            <span className="text-accent-400 font-bold text-xs">{value.nome.charAt(0).toUpperCase()}</span>
          </div>
          <span className="flex-1 text-sm font-semibold text-primary-900 truncate">{value.nome}</span>
          {(value.celular || value.telefone) && (
            <span className="text-xs text-primary-400 hidden sm:inline">{value.celular || value.telefone}</span>
          )}
          <button type="button" onClick={limpar} className="text-primary-400 hover:text-primary-700 flex-shrink-0">
            <X size={15} />
          </button>
        </div>
      ) : (
        <>
          <div className="relative">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-primary-400 pointer-events-none" />
            <input
              ref={inputRef}
              type="text"
              className="input pl-9"
              placeholder={placeholder}
              value={query}
              onChange={handleInput}
              onFocus={() => {
                if (query) { setAberto(true); atualizarPos() }
              }}
              autoComplete="off"
            />
            {carregando && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-accent-500 border-t-transparent rounded-full animate-spin" />
            )}
          </div>

          {/* Dropdown — posição FIXED para escapar do overflow do modal */}
          {aberto && pos && (resultados.length > 0 || query.length > 0) && (
            <div
              className="fixed z-[200] bg-white rounded-xl shadow-modal border border-stone-100 overflow-hidden"
              style={{ top: pos.top, left: pos.left, width: pos.width }}
            >
              {resultados.length === 0 && !carregando ? (
                <div className="px-4 py-3 text-sm text-primary-400 flex items-center gap-2">
                  <User size={14} />
                  Nenhum cliente encontrado
                </div>
              ) : (
                <ul className="max-h-52 overflow-y-auto">
                  {resultados.map((c) => (
                    <li key={c.id}>
                      <button
                        type="button"
                        onMouseDown={() => selecionar(c)}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-stone-50 active:bg-stone-100 text-left transition-colors"
                      >
                        <div className="w-8 h-8 rounded-lg bg-primary-900 flex items-center justify-center flex-shrink-0">
                          <span className="text-accent-400 font-bold text-xs">{c.nome.charAt(0).toUpperCase()}</span>
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-primary-900 truncate">{c.nome}</div>
                          <div className="text-xs text-primary-400 truncate">
                            {[c.celular || c.telefone, c.cpfCnpj].filter(Boolean).join(' · ') || 'Sem telefone'}
                          </div>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
