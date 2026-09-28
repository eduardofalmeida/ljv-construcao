import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Menu, LogOut, User, ChevronDown, Bell } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { useConfigSite } from '../../contexts/ConfigSiteContext'
import BuscaGlobal from '../ui/BuscaGlobal'
import toast from 'react-hot-toast'
import api from '../../services/api'
import type { OrcamentoResumo } from '../../types'

interface HeaderProps {
  abrirSidebar: () => void
}

function AvatarUsuario({ foto, nome }: { foto?: string; nome: string }) {
  if (foto) {
    return <img src={foto} alt={nome} className="w-8 h-8 rounded-full object-cover" />
  }
  return (
    <div className="w-8 h-8 rounded-full bg-primary-900 flex items-center justify-center flex-shrink-0">
      <span className="text-accent-400 font-bold text-sm">{nome.charAt(0).toUpperCase()}</span>
    </div>
  )
}

export default function Header({ abrirSidebar }: HeaderProps) {
  const { usuario, logout } = useAuth()
  const { config } = useConfigSite()
  const [menuAberto, setMenuAberto] = useState(false)
  const [sinoAberto, setSinoAberto] = useState(false)
  const [alertas, setAlertas] = useState<OrcamentoResumo | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    api.get<OrcamentoResumo>('/orcamentos/resumo')
      .then(({ data }) => setAlertas(data))
      .catch(() => setAlertas(null))
  }, [])

  const handleLogout = async () => {
    await logout()
    toast.success('Sessão encerrada. Até logo!')
  }

  const irParaPerfil = () => {
    setMenuAberto(false)
    navigate('/perfil')
  }

  return (
    <header className="min-h-14 sm:min-h-16 bg-white border-b border-stone-200 flex items-center justify-between px-3 sm:px-6 sticky top-0 z-10 pt-[env(safe-area-inset-top)]">
      {/* Esquerda */}
      <div className="flex items-center gap-1 min-w-0">
        <button
          type="button"
          onClick={abrirSidebar}
          className="lg:hidden icon-btn"
          aria-label="Abrir menu"
        >
          <Menu size={22} />
        </button>

        {config.empresa_logo ? (
          <img src={config.empresa_logo} alt="" className="lg:hidden w-8 h-8 rounded-lg object-cover flex-shrink-0" />
        ) : null}

        <div className="hidden sm:flex items-center gap-2 min-w-0">
          {config.empresa_logo && (
            <img src={config.empresa_logo} alt="" className="w-6 h-6 rounded-md object-cover" />
          )}
          <span className="text-xs font-semibold text-primary-300 uppercase tracking-widest truncate">
            {config.empresa_nome || 'LJV Construção'}
          </span>
          <span className="text-primary-200">·</span>
          <span className="text-xs text-primary-400">Sistema de Gestão</span>
        </div>
      </div>

      {/* Direita */}
      <div className="flex items-center gap-2">
        <BuscaGlobal />

        <div className="relative">
          <button
            onClick={() => setSinoAberto(v => !v)}
            className="relative icon-btn"
            aria-label="Lembretes de orçamento"
          >
            <Bell size={20} />
            {(alertas?.followUpHoje || 0) > 0 && (
              <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 rounded-full bg-accent-500 text-white text-[10px] font-bold flex items-center justify-center">
                {alertas!.followUpHoje}
              </span>
            )}
          </button>
          {sinoAberto && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setSinoAberto(false)} />
              <div className="fixed left-3 right-3 top-[4.25rem] sm:absolute sm:left-auto sm:right-0 sm:top-full sm:mt-2 sm:w-80 bg-white rounded-2xl shadow-modal border border-stone-100 py-2 z-20">
                <div className="px-4 py-2 border-b border-stone-100">
                  <div className="text-sm font-bold text-primary-900">Acompanhar orçamentos</div>
                  <p className="text-xs text-primary-400 mt-0.5">Lembretes de follow-up e validade</p>
                </div>
                {(alertas?.acompanhar?.length || 0) === 0 ? (
                  <p className="px-4 py-6 text-sm text-primary-400 text-center">Nenhum orçamento pendente hoje.</p>
                ) : (
                  <ul className="max-h-72 overflow-y-auto">
                    {alertas!.acompanhar.map(item => (
                      <li key={item.id}>
                        <button
                          onClick={() => { setSinoAberto(false); navigate('/admin/orcamentos') }}
                          className="w-full text-left px-4 py-3 hover:bg-stone-50"
                        >
                          <div className="text-sm font-semibold text-primary-900 truncate">{item.numero} · {item.titulo}</div>
                          <div className="text-xs text-primary-400 mt-0.5">
                            {item.clienteNome || 'Sem cliente'}
                            {item.proximoFollowUp ? ` · follow-up ${new Date(item.proximoFollowUp + 'T00:00:00').toLocaleDateString('pt-BR')}` : ''}
                          </div>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                <div className="border-t border-stone-100 px-4 py-2">
                  <button
                    onClick={() => { setSinoAberto(false); navigate('/admin/orcamentos') }}
                    className="text-xs font-bold text-accent-600 hover:text-accent-700"
                  >
                    Abrir orçamentos
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Menu do usuário */}
        <div className="relative">
          <button
            onClick={() => setMenuAberto(!menuAberto)}
            className="flex items-center gap-2 min-h-[44px] pl-1.5 pr-2 sm:pr-3 py-1 hover:bg-stone-100 rounded-xl transition-colors touch-manipulation"
          >
            <AvatarUsuario foto={usuario?.fotoPerfil} nome={usuario?.nome || 'A'} />
            <div className="hidden sm:block text-left">
              <div className="text-sm font-semibold text-primary-900 leading-tight">{usuario?.nome || 'Usuário'}</div>
              <div className="text-xs text-primary-400 capitalize leading-tight">{usuario?.perfil?.toLowerCase() || 'admin'}</div>
            </div>
            <ChevronDown size={14} className={`text-primary-400 transition-transform ${menuAberto ? 'rotate-180' : ''}`} />
          </button>

          {menuAberto && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuAberto(false)} />
              <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-modal border border-stone-100 py-2 z-20 animate-slide-up">
                <div className="px-4 py-3 border-b border-stone-100">
                  <div className="flex items-center gap-3">
                    <AvatarUsuario foto={usuario?.fotoPerfil} nome={usuario?.nome || 'A'} />
                    <div>
                      <div className="text-sm font-bold text-primary-900">{usuario?.nome}</div>
                      <div className="text-xs text-primary-400 mt-0.5">{usuario?.email}</div>
                    </div>
                  </div>
                </div>
                <div className="py-2">
                  <button
                    onClick={irParaPerfil}
                    className="w-full flex items-center gap-3 px-4 py-3 min-h-[44px] text-sm text-primary-600 hover:bg-stone-50 hover:text-primary-900 transition-colors"
                  >
                    <User size={15} />
                    Meu Perfil
                  </button>
                  <div className="my-1 border-t border-stone-100" />
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 min-h-[44px] text-sm text-red-500 hover:bg-red-50 transition-colors"
                  >
                    <LogOut size={15} />
                    Sair do sistema
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
