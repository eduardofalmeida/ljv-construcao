import { useState, useEffect, useRef, useCallback } from 'react'
import { Search, X, Building2, Users, FileText, ArrowRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import api from '../../services/api'

interface ResultadoBusca {
  clientes: Array<{ id: number; nome: string; cpfCnpj?: string }>
  obras: Array<{ id: number; nome: string; status: string }>
  orcamentos: Array<{ id: number; titulo: string; numero?: string; status: string }>
}

export default function BuscaGlobal() {
  const [aberta, setAberta] = useState(false)
  const [query, setQuery] = useState('')
  const [resultado, setResultado] = useState<ResultadoBusca | null>(null)
  const [carregando, setCarregando] = useState(false)
  const navigate = useNavigate()
  const inputRef = useRef<HTMLInputElement>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Atalho de teclado: Ctrl+K / Cmd+K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        setAberta(true)
      }
      if (e.key === 'Escape') setAberta(false)
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [])

  useEffect(() => {
    if (aberta) {
      setTimeout(() => inputRef.current?.focus(), 50)
    } else {
      setQuery('')
      setResultado(null)
    }
  }, [aberta])

  const buscar = useCallback(async (q: string) => {
    if (q.trim().length < 2) { setResultado(null); return }
    setCarregando(true)
    try {
      const { data } = await api.get<ResultadoBusca>(`/busca?q=${encodeURIComponent(q)}`)
      setResultado(data)
    } catch {
      setResultado(null)
    } finally {
      setCarregando(false)
    }
  }, [])

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value
    setQuery(q)
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => buscar(q), 300)
  }

  const ir = (rota: string) => {
    navigate(rota)
    setAberta(false)
  }

  const temResultados = resultado && (
    resultado.clientes.length + resultado.obras.length + resultado.orcamentos.length > 0
  )

  if (!aberta) {
    return (
      <button
        onClick={() => setAberta(true)}
        className="flex items-center gap-2 min-h-[44px] min-w-[44px] px-2.5 sm:px-3 py-1.5 text-sm text-primary-400 hover:text-primary-700 bg-stone-100 hover:bg-stone-200 rounded-xl transition-colors touch-manipulation"
        title="Buscar"
        aria-label="Buscar"
      >
        <Search size={15} />
        <span className="hidden sm:inline text-xs">Buscar...</span>
        <kbd className="hidden sm:inline text-[10px] bg-white border border-stone-200 text-primary-300 px-1.5 py-0.5 rounded font-mono">⌘K</kbd>
      </button>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-4 sm:pt-16 px-3 sm:px-4">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setAberta(false)} />

      {/* Painel */}
      <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-modal overflow-hidden animate-slide-up">
        {/* Input */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-stone-100">
          <Search size={18} className="text-primary-400 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            className="flex-1 text-base text-primary-900 placeholder-primary-300 bg-transparent outline-none"
            placeholder="Buscar clientes, obras, orçamentos..."
            value={query}
            onChange={handleInput}
          />
          {carregando && (
            <div className="w-4 h-4 border-2 border-accent-500 border-t-transparent rounded-full animate-spin flex-shrink-0" />
          )}
          <button onClick={() => setAberta(false)} className="icon-btn flex-shrink-0" aria-label="Fechar busca">
            <X size={18} />
          </button>
        </div>

        {/* Resultados */}
        <div className="max-h-[60vh] overflow-y-auto">
          {!query && (
            <div className="px-4 py-6 text-center text-sm text-primary-400">
              Digite para buscar em todo o sistema
            </div>
          )}

          {query.length > 0 && !temResultados && !carregando && (
            <div className="px-4 py-6 text-center text-sm text-primary-400">
              Nenhum resultado para "<strong>{query}</strong>"
            </div>
          )}

          {resultado && (
            <div className="py-2">
              {/* Clientes */}
              {resultado.clientes.length > 0 && (
                <div>
                  <div className="px-4 py-2 flex items-center gap-2">
                    <Users size={12} className="text-primary-300" />
                    <span className="text-[10px] font-bold text-primary-300 uppercase tracking-widest">Clientes</span>
                  </div>
                  {resultado.clientes.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => ir('/admin/clientes')}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-stone-50 text-left transition-colors"
                    >
                      <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-blue-600 font-bold text-xs">{c.nome.charAt(0)}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-primary-900 truncate">{c.nome}</div>
                        {c.cpfCnpj && <div className="text-xs text-primary-400">{c.cpfCnpj}</div>}
                      </div>
                      <ArrowRight size={14} className="text-primary-300 flex-shrink-0" />
                    </button>
                  ))}
                </div>
              )}

              {/* Obras */}
              {resultado.obras.length > 0 && (
                <div>
                  <div className="px-4 py-2 flex items-center gap-2">
                    <Building2 size={12} className="text-primary-300" />
                    <span className="text-[10px] font-bold text-primary-300 uppercase tracking-widest">Obras</span>
                  </div>
                  {resultado.obras.map((o) => (
                    <button
                      key={o.id}
                      onClick={() => ir(`/admin/obras/${o.id}`)}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-stone-50 text-left transition-colors"
                    >
                      <div className="w-8 h-8 rounded-lg bg-accent-100 flex items-center justify-center flex-shrink-0">
                        <Building2 size={14} className="text-accent-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-primary-900 truncate">{o.nome}</div>
                        <div className="text-xs text-primary-400">{o.status.replace('_', ' ')}</div>
                      </div>
                      <ArrowRight size={14} className="text-primary-300 flex-shrink-0" />
                    </button>
                  ))}
                </div>
              )}

              {/* Orçamentos */}
              {resultado.orcamentos.length > 0 && (
                <div>
                  <div className="px-4 py-2 flex items-center gap-2">
                    <FileText size={12} className="text-primary-300" />
                    <span className="text-[10px] font-bold text-primary-300 uppercase tracking-widest">Orçamentos</span>
                  </div>
                  {resultado.orcamentos.map((o) => (
                    <button
                      key={o.id}
                      onClick={() => ir('/admin/orcamentos')}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-stone-50 text-left transition-colors"
                    >
                      <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center flex-shrink-0">
                        <FileText size={14} className="text-violet-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-primary-900 truncate">{o.titulo}</div>
                        {o.numero && <div className="text-xs text-primary-400">{o.numero}</div>}
                      </div>
                      <ArrowRight size={14} className="text-primary-300 flex-shrink-0" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Rodapé */}
        <div className="hidden sm:flex px-4 py-2.5 border-t border-stone-100 items-center gap-4 text-xs text-primary-300">
          <span><kbd className="bg-stone-100 px-1 py-0.5 rounded font-mono">↵</kbd> selecionar</span>
          <span><kbd className="bg-stone-100 px-1 py-0.5 rounded font-mono">Esc</kbd> fechar</span>
        </div>
      </div>
    </div>
  )
}
