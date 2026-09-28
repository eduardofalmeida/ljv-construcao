import { NavLink, Link } from 'react-router-dom'
import {
  LayoutDashboard, Users, Building2, FileText,
  HardHat, DollarSign, Package, Truck, BarChart3, X,
  Globe, UserCircle, ClipboardList, MessageSquare, Stamp
} from 'lucide-react'
import clsx from 'clsx'
import LogoEmpresa from '../ui/LogoEmpresa'

interface SidebarProps {
  aberta: boolean
  fechar: () => void
}

const navItems = [
  { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/admin/obras', icon: Building2, label: 'Obras' },
  { to: '/admin/clientes', icon: Users, label: 'Clientes' },
  { to: '/admin/orcamentos', icon: FileText, label: 'Orçamentos' },
  { to: '/admin/funcionarios', icon: HardHat, label: 'Funcionários' },
  { to: '/admin/folha', icon: ClipboardList, label: 'Folha de Pagamento' },
  { to: '/admin/financeiro', icon: DollarSign, label: 'Financeiro' },
]

const navItemsEmBreve = [
  { icon: Package, label: 'Materiais' },
  { icon: Truck, label: 'Fornecedores' },
  { icon: BarChart3, label: 'Relatórios' },
]

export default function Sidebar({ aberta, fechar }: SidebarProps) {
  return (
    <aside
      className={clsx(
        'fixed lg:static inset-y-0 left-0 z-30 flex flex-col',
        'w-64 bg-primary-950 text-white',
        'transform transition-transform duration-300 ease-in-out',
        aberta ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      )}
    >
      {/* Logo */}
      <div className="flex items-center justify-between h-16 px-5 border-b border-white/5">
        <Link to="/admin/dashboard" className="flex items-center min-w-0 flex-1 overflow-hidden pr-2">
          <LogoEmpresa variant="light" size="sm" />
        </Link>
        <button onClick={fechar} className="lg:hidden icon-btn text-white/70 hover:text-white hover:bg-white/10" aria-label="Fechar menu">
          <X size={20} />
        </button>
      </div>

      {/* Navegação */}
      <nav className="flex-1 py-6 px-3 overflow-y-auto space-y-8">
        {/* Menu principal */}
        <div className="space-y-1">
          <div className="px-3 mb-3">
            <span className="text-[10px] font-bold text-white/25 tracking-widest uppercase">Menu Principal</span>
          </div>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={fechar}
              className={({ isActive }) => clsx(
                'flex items-center gap-3 px-3 py-3 min-h-[44px] rounded-xl text-sm font-medium transition-all duration-150',
                isActive
                  ? 'bg-accent-500 text-white shadow-lg shadow-accent-500/25'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              )}
            >
              <item.icon size={18} />
              {item.label}
            </NavLink>
          ))}
        </div>

        {/* Em breve */}
        <div className="space-y-1">
          <div className="px-3 mb-3">
            <span className="text-[10px] font-bold text-white/25 tracking-widest uppercase">Em Breve</span>
          </div>
          {navItemsEmBreve.map((item) => (
            <div
              key={item.label}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-white/25 cursor-not-allowed"
            >
              <item.icon size={18} />
              {item.label}
              <span className="ml-auto text-[10px] bg-white/5 text-white/25 px-1.5 py-0.5 rounded-md">Em breve</span>
            </div>
          ))}
        </div>

        {/* Configurações */}
        <div className="space-y-1">
          <div className="px-3 mb-3">
            <span className="text-[10px] font-bold text-white/25 tracking-widest uppercase">Configurações</span>
          </div>
          <NavLink
            to="/perfil"
            onClick={fechar}
            className={({ isActive }) => clsx(
              'flex items-center gap-3 px-3 py-3 min-h-[44px] rounded-xl text-sm font-medium transition-all duration-150',
              isActive
                ? 'bg-accent-500 text-white shadow-lg shadow-accent-500/25'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            )}
          >
            <UserCircle size={18} />
            Meu Perfil
          </NavLink>
          <NavLink
            to="/admin/empresa"
            onClick={fechar}
            className={({ isActive }) => clsx(
              'flex items-center gap-3 px-3 py-3 min-h-[44px] rounded-xl text-sm font-medium transition-all duration-150',
              isActive
                ? 'bg-accent-500 text-white shadow-lg shadow-accent-500/25'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            )}
          >
            <Stamp size={18} />
            Empresa e relatórios
          </NavLink>
          <NavLink
            to="/admin/configuracoes-site"
            onClick={fechar}
            className={({ isActive }) => clsx(
              'flex items-center gap-3 px-3 py-3 min-h-[44px] rounded-xl text-sm font-medium transition-all duration-150',
              isActive
                ? 'bg-accent-500 text-white shadow-lg shadow-accent-500/25'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            )}
          >
            <Globe size={18} />
            Configurações do Site
          </NavLink>
          <NavLink
            to="/admin/depoimentos"
            onClick={fechar}
            className={({ isActive }) => clsx(
              'flex items-center gap-3 px-3 py-3 min-h-[44px] rounded-xl text-sm font-medium transition-all duration-150',
              isActive
                ? 'bg-accent-500 text-white shadow-lg shadow-accent-500/25'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            )}
          >
            <MessageSquare size={18} />
            Depoimentos
          </NavLink>
        </div>
      </nav>

      {/* Rodapé */}
      <div className="p-4 border-t border-white/5">
        <Link
          to="/"
          className="flex items-center gap-2 text-white/30 hover:text-white/60 text-xs transition-colors"
        >
          <span>← Voltar ao site</span>
        </Link>
      </div>
    </aside>
  )
}
