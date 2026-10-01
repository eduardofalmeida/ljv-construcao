import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { ConfigSiteProvider } from './contexts/ConfigSiteContext'
import Layout from './components/layout/Layout'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import ClientesPage from './pages/clientes/ClientesPage'
import ObrasPage from './pages/obras/ObrasPage'
import ObraDetailPage from './pages/obras/ObraDetailPage'
import FuncionariosPage from './pages/funcionarios/FuncionariosPage'
import OrcamentosPage from './pages/orcamentos/OrcamentosPage'
import FinanceiroPage from './pages/financeiro/FinanceiroPage'
import PerfilPage from './pages/PerfilPage'
import ConfiguracoesSitePage from './pages/configuracoes/ConfiguracoesSitePage'
import ConfiguracoesEmpresaPage from './pages/configuracoes/ConfiguracoesEmpresaPage'
import DepoimentosAdminPage from './pages/configuracoes/DepoimentosAdminPage'
import FolhaPagamentoPage from './pages/funcionarios/FolhaPagamentoPage'

function RotaProtegida({ children }: { children: React.ReactNode }) {
  const { autenticado, carregando } = useAuth()

  if (carregando) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-accent-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-primary-500 text-sm font-medium">Carregando...</p>
        </div>
      </div>
    )
  }

  if (!autenticado) return <Navigate to="/login" replace />
  return <>{children}</>
}

function AppRoutes() {
  const { autenticado, carregando } = useAuth()

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />

      <Route
        path="/login"
        element={
          carregando ? (
            <div className="min-h-screen flex items-center justify-center bg-stone-50">
              <div className="w-10 h-10 border-4 border-accent-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : autenticado ? (
            <Navigate to="/admin/dashboard" replace />
          ) : (
            <LoginPage />
          )
        }
      />

      {/* Rotas protegidas */}
      <Route
        path="/admin"
        element={
          <RotaProtegida>
            <Layout />
          </RotaProtegida>
        }
      >
        <Route index element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="clientes" element={<ClientesPage />} />
        <Route path="obras" element={<ObrasPage />} />
        <Route path="obras/:id" element={<ObraDetailPage />} />
        <Route path="funcionarios" element={<FuncionariosPage />} />
        <Route path="folha" element={<FolhaPagamentoPage />} />
        <Route path="orcamentos" element={<OrcamentosPage />} />
        <Route path="financeiro" element={<FinanceiroPage />} />
        <Route path="configuracoes-site" element={<ConfiguracoesSitePage />} />
        <Route path="empresa" element={<ConfiguracoesEmpresaPage />} />
        <Route path="depoimentos" element={<DepoimentosAdminPage />} />
      </Route>

      {/* Perfil — dentro do layout protegido mas com rota /perfil */}
      <Route
        path="/perfil"
        element={
          <RotaProtegida>
            <Layout />
          </RotaProtegida>
        }
      >
        <Route index element={<PerfilPage />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <ConfigSiteProvider>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </ConfigSiteProvider>
  )
}
