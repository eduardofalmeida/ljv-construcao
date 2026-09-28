import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'
import FabMenu from './FabMenu'
import BottomTabBar from './BottomTabBar'

export default function Layout() {
  const [sidebarAberta, setSidebarAberta] = useState(false)

  return (
    <div className="flex h-screen bg-stone-100 overflow-hidden">
      {/* Sidebar — desktop sempre visível, mobile slide-out */}
      <Sidebar aberta={sidebarAberta} fechar={() => setSidebarAberta(false)} />

      {/* Overlay mobile (ao abrir o sidebar) */}
      {sidebarAberta && (
        <div
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={() => setSidebarAberta(false)}
        />
      )}

      {/* Conteúdo principal */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <Header abrirSidebar={() => setSidebarAberta(true)} />

        {/* padding-bottom no mobile para não ficar atrás da BottomTabBar */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden pb-28 lg:pb-6">
          <div className="w-full max-w-7xl mx-auto px-3 py-4 sm:p-6 animate-fade-in">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Bottom Tab Bar — somente mobile */}
      <BottomTabBar abrirSidebar={() => setSidebarAberta(true)} />

      {/* FAB — ação rápida (acima da bottom bar no mobile) */}
      <FabMenu />
    </div>
  )
}
