import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Eye, EyeOff, Lock, User, ArrowLeft, HardHat } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import LogoEmpresa from '../components/ui/LogoEmpresa'
import { useConfigSite } from '../contexts/ConfigSiteContext'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const { login } = useAuth()
  const { config } = useConfigSite()
  const [form, setForm] = useState({ username: '', password: '' })
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [carregando, setCarregando] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.username || !form.password) {
      toast.error('Preencha todos os campos')
      return
    }
    setCarregando(true)
    try {
      await login(form.username.toLowerCase(), form.password.toLowerCase())
      toast.success(`Bem-vindo ao sistema ${config.empresa_nome || 'LJV Construção'}!`)
    } catch {
      toast.error('Usuário ou senha incorretos. Tente novamente.')
    } finally {
      setCarregando(false)
    }
  }

  return (
    <div className="min-h-screen bg-primary-950 flex">

      {/* Painel esquerdo — Marca */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 relative overflow-hidden">
        {/* Fundo decorativo */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary-950 via-primary-900 to-primary-800" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-accent-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-accent-500/5 rounded-full blur-3xl" />
        <div className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
            backgroundSize: '40px 40px'
          }}
        />

        {/* Logo */}
        <div className="relative z-10">
          <Link to="/" className="flex items-center gap-3 group">
            <LogoEmpresa variant="light" size="lg" />
          </Link>
        </div>

        {/* Mensagem central */}
        <div className="relative z-10 space-y-6">
          <div className="w-16 h-1 bg-accent-500 rounded-full" />
          <h1 className="text-5xl font-black text-white leading-tight">
            Sistema de<br />
            <span className="text-accent-400">Gestão</span><br />
            Completa
          </h1>
          <p className="text-white/50 text-lg leading-relaxed max-w-sm">
            Gerencie obras, clientes, funcionários e financeiro
            em um único lugar, com organização e eficiência.
          </p>

          <div className="grid grid-cols-2 gap-4 pt-4">
            {[
              { icon: HardHat, label: 'Gestão de Obras' },
              { icon: User, label: 'Controle de Equipe' },
              { icon: Lock, label: 'Dados Seguros' },
              { icon: HardHat, label: 'Relatórios' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 bg-white/5 rounded-xl px-4 py-3">
                <item.icon size={16} className="text-accent-400 flex-shrink-0" />
                <span className="text-white/70 text-sm font-medium">{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer do painel */}
        <div className="relative z-10">
          <p className="text-white/20 text-xs">
            © {new Date().getFullYear()} {config.empresa_nome || 'LJV Construção'} — Todos os direitos reservados
          </p>
        </div>
      </div>

      {/* Painel direito — Formulário */}
      <div className="w-full lg:w-1/2 flex flex-col items-center justify-center px-6 py-12 bg-stone-50">

        {/* Voltar (mobile) */}
        <Link to="/" className="lg:hidden self-start mb-8 flex items-center gap-2 text-primary-500 hover:text-primary-700 text-sm font-medium">
          <ArrowLeft size={16} />
          Voltar para o site
        </Link>

        <div className="w-full max-w-md">
          {/* Logo mobile */}
          <div className="lg:hidden flex items-center gap-2.5 mb-10">
            <LogoEmpresa variant="dark" size="md" />
          </div>

          {/* Header */}
          <div className="mb-10">
            <h2 className="text-3xl font-black text-primary-900 mb-2">Bem-vindo</h2>
            <p className="text-primary-500">Entre com suas credenciais para acessar o sistema.</p>
          </div>

          {/* Formulário */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="label">Usuário</label>
              <div className="relative">
                <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-primary-400" />
                <input
                  type="text"
                  className="input pl-10"
                  placeholder="Digite seu usuário"
                  value={form.username}
                  onChange={(e) => setForm(f => ({ ...f, username: e.target.value.toLowerCase() }))}
                  autoComplete="username"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  autoFocus
                />
              </div>
            </div>

            <div>
              <label className="label">Senha</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-primary-400" />
                <input
                  type={mostrarSenha ? 'text' : 'password'}
                  className="input pl-10 pr-10"
                  placeholder="Digite sua senha"
                  value={form.password}
                  onChange={(e) => setForm(f => ({ ...f, password: e.target.value.toLowerCase() }))}
                  autoComplete="current-password"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                />
                <button
                  type="button"
                  onClick={() => setMostrarSenha(!mostrarSenha)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-primary-400 hover:text-primary-600"
                >
                  {mostrarSenha ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={carregando}
              className="w-full py-3.5 bg-accent-500 hover:bg-accent-600 disabled:bg-accent-400 text-white font-bold text-base rounded-xl transition-all duration-200 shadow-sm hover:shadow-md flex items-center justify-center gap-2"
            >
              {carregando ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Entrando...
                </>
              ) : (
                'Entrar no sistema'
              )}
            </button>
          </form>

          <div className="mt-8 text-center">
            <Link to="/" className="text-sm text-primary-400 hover:text-primary-600 flex items-center justify-center gap-1.5">
              <ArrowLeft size={14} />
              Voltar para o site da LJV Construção
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
