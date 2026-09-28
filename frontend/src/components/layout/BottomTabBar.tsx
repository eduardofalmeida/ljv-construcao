import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Building2, ClipboardList, FileText, MoreHorizontal } from 'lucide-react'
import clsx from 'clsx'

const tabs = [
  { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Início' },
  { to: '/admin/obras', icon: Building2, label: 'Obras' },
  { to: '/admin/folha', icon: ClipboardList, label: 'Ponto' },
  { to: '/admin/orcamentos', icon: FileText, label: 'Orçam.' },
]

interface BottomTabBarProps {
  abrirSidebar: () => void
}

export default function BottomTabBar({ abrirSidebar }: BottomTabBarProps) {
  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-stone-200 safe-area-bottom">
      <div className="flex items-stretch min-h-[64px]">
        {tabs.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            className={({ isActive }) => clsx(
              'flex-1 flex flex-col items-center justify-center gap-0.5 text-[11px] font-semibold transition-colors min-h-[48px] touch-manipulation',
              isActive ? 'text-accent-500' : 'text-primary-400'
            )}
          >
            {({ isActive }) => (
              <>
                <div className={clsx(
                  'p-1.5 rounded-xl transition-all',
                  isActive ? 'bg-accent-500/10' : ''
                )}>
                  <tab.icon size={22} strokeWidth={isActive ? 2.5 : 1.8} />
                </div>
                <span>{tab.label}</span>
              </>
            )}
          </NavLink>
        ))}

        <button
          type="button"
          onClick={abrirSidebar}
          className="flex-1 flex flex-col items-center justify-center gap-0.5 text-[11px] font-semibold text-primary-400 transition-colors min-h-[48px] touch-manipulation"
        >
          <div className="p-1.5 rounded-xl">
            <MoreHorizontal size={22} strokeWidth={1.8} />
          </div>
          <span>Mais</span>
        </button>
      </div>
    </nav>
  )
}
