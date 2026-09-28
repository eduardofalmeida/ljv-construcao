import { useState, useRef } from 'react'
import { Camera, Save, Lock, User, Mail, AlertCircle, Check } from 'lucide-react'
import api from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import toast from 'react-hot-toast'

// ─── Redimensionar imagem antes de salvar ─────────────────────
function redimensionarImagem(file: File, maxSize = 256): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const size = Math.min(img.width, img.height)
        const scale = Math.min(maxSize / size, 1)
        canvas.width = img.width * scale
        canvas.height = img.height * scale
        const ctx = canvas.getContext('2d')!
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        resolve(canvas.toDataURL('image/jpeg', 0.85))
      }
      img.onerror = reject
      img.src = e.target?.result as string
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

// ─── Avatar ───────────────────────────────────────────────────
function Avatar({ foto, nome, size = 'lg' }: { foto?: string; nome: string; size?: 'sm' | 'lg' }) {
  const dim = size === 'lg' ? 'w-24 h-24' : 'w-10 h-10'
  const txt = size === 'lg' ? 'text-3xl' : 'text-base'
  if (foto) {
    return <img src={foto} alt={nome} className={`${dim} rounded-full object-cover border-2 border-white shadow-md`} />
  }
  return (
    <div className={`${dim} rounded-full bg-primary-900 flex items-center justify-center border-2 border-white shadow-md`}>
      <span className={`${txt} font-black text-accent-400`}>{nome.charAt(0).toUpperCase()}</span>
    </div>
  )
}

export { Avatar }

// ─── Página principal ─────────────────────────────────────────
export default function PerfilPage() {
  const { usuario, atualizarUsuario } = useAuth()
  const [nome, setNome] = useState(usuario?.nome || '')
  const [email, setEmail] = useState(usuario?.email || '')
  const [foto, setFoto] = useState<string>(usuario?.fotoPerfil || '')
  const [salvando, setSalvando] = useState(false)

  const [senhaAtual, setSenhaAtual] = useState('')
  const [novaSenha, setNovaSenha] = useState('')
  const [confirmarSenha, setConfirmarSenha] = useState('')
  const [salvandoSenha, setSalvandoSenha] = useState(false)

  const inputFoto = useRef<HTMLInputElement>(null)

  // ─── Upload de foto ───────────────────────────────────────
  const handleFoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Imagem muito grande. Use uma foto menor que 5MB.')
      return
    }
    try {
      const dataUrl = await redimensionarImagem(file, 300)
      setFoto(dataUrl)
    } catch {
      toast.error('Erro ao processar a imagem')
    }
  }

  // ─── Salvar dados ─────────────────────────────────────────
  const salvarDados = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nome.trim()) return toast.error('Nome é obrigatório')
    setSalvando(true)
    try {
      const { data } = await api.put('/perfil', { nome, email, fotoPerfil: foto })
      atualizarUsuario({ nome: data.nome, email: data.email, fotoPerfil: data.fotoPerfil })
      toast.success('Perfil atualizado com sucesso!')
    } catch {
      toast.error('Erro ao salvar perfil')
    } finally {
      setSalvando(false)
    }
  }

  // ─── Alterar senha ────────────────────────────────────────
  const alterarSenha = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!senhaAtual) return toast.error('Informe sua senha atual')
    if (novaSenha.length < 6) return toast.error('A nova senha deve ter pelo menos 6 caracteres')
    if (novaSenha !== confirmarSenha) return toast.error('As senhas não coincidem')
    setSalvandoSenha(true)
    try {
      await api.put('/perfil/senha', { senhaAtual, novaSenha })
      toast.success('Senha alterada com sucesso!')
      setSenhaAtual('')
      setNovaSenha('')
      setConfirmarSenha('')
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error
      toast.error(msg || 'Erro ao alterar senha')
    } finally {
      setSalvandoSenha(false)
    }
  }

  const perfilLabel: Record<string, string> = {
    ADMIN: 'Administrador', GERENTE: 'Gerente', OPERADOR: 'Operador'
  }

  return (
    <div className="max-w-2xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="page-title">Meu Perfil</h1>
        <p className="text-primary-500 text-sm mt-1">Gerencie seus dados e preferências</p>
      </div>

      {/* Foto + dados básicos */}
      <form onSubmit={salvarDados} className="card p-6 space-y-6">
        {/* Foto */}
        <div className="flex items-center gap-6">
          <div className="relative flex-shrink-0">
            <Avatar foto={foto} nome={nome || 'U'} size="lg" />
            <button
              type="button"
              onClick={() => inputFoto.current?.click()}
              className="absolute bottom-0 right-0 w-8 h-8 bg-accent-500 hover:bg-accent-600 rounded-full flex items-center justify-center shadow-md transition-colors"
            >
              <Camera size={14} className="text-white" />
            </button>
            <input
              ref={inputFoto}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFoto}
            />
          </div>
          <div>
            <div className="font-bold text-primary-900 text-lg">{usuario?.nome}</div>
            <div className="text-sm text-primary-400">{usuario?.username}</div>
            <span className="inline-block mt-1.5 text-xs font-semibold px-2.5 py-1 bg-accent-100 text-accent-700 rounded-full">
              {perfilLabel[usuario?.perfil || 'OPERADOR']}
            </span>
          </div>
        </div>

        {foto !== usuario?.fotoPerfil && (
          <div className="flex items-center gap-2 text-sm text-accent-600 bg-accent-50 border border-accent-200 rounded-xl px-4 py-3">
            <AlertCircle size={15} />
            <span>Foto alterada. Clique em "Salvar alterações" para confirmar.</span>
          </div>
        )}

        {/* Campos */}
        <div className="space-y-4">
          <div>
            <label className="label">
              <User size={13} className="inline mr-1.5 text-primary-400" />
              Nome completo
            </label>
            <input
              className="input"
              value={nome}
              onChange={e => setNome(e.target.value)}
              placeholder="Seu nome"
              required
            />
          </div>
          <div>
            <label className="label">
              <Mail size={13} className="inline mr-1.5 text-primary-400" />
              E-mail
            </label>
            <input
              type="email"
              className="input"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="seu@email.com"
            />
          </div>
          <div>
            <label className="label">Usuário (login)</label>
            <input className="input bg-stone-50 text-primary-400 cursor-not-allowed" value={usuario?.username || ''} readOnly />
            <p className="text-xs text-primary-400 mt-1">O nome de usuário não pode ser alterado.</p>
          </div>
        </div>

        <button
          type="submit"
          disabled={salvando}
          className="btn-primary w-full justify-center py-3"
        >
          {salvando ? (
            <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Salvando...</>
          ) : (
            <><Save size={16} /> Salvar alterações</>
          )}
        </button>
      </form>

      {/* Alterar senha */}
      <form onSubmit={alterarSenha} className="card p-6 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Lock size={18} className="text-primary-400" />
          <h2 className="font-bold text-primary-900">Alterar senha</h2>
        </div>

        <div>
          <label className="label">Senha atual</label>
          <input
            type="password"
            className="input"
            value={senhaAtual}
            onChange={e => setSenhaAtual(e.target.value)}
            placeholder="••••••••"
            autoComplete="current-password"
          />
        </div>
        <div>
          <label className="label">Nova senha</label>
          <input
            type="password"
            className="input"
            value={novaSenha}
            onChange={e => setNovaSenha(e.target.value)}
            placeholder="Mínimo 6 caracteres"
            autoComplete="new-password"
          />
        </div>
        <div>
          <label className="label">Confirmar nova senha</label>
          <div className="relative">
            <input
              type="password"
              className={`input ${confirmarSenha && novaSenha && confirmarSenha === novaSenha ? 'border-emerald-400 focus:ring-emerald-400/50' : ''}`}
              value={confirmarSenha}
              onChange={e => setConfirmarSenha(e.target.value)}
              placeholder="Repita a nova senha"
              autoComplete="new-password"
            />
            {confirmarSenha && novaSenha && confirmarSenha === novaSenha && (
              <Check size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500" />
            )}
          </div>
        </div>

        <button
          type="submit"
          disabled={salvandoSenha}
          className="btn-secondary w-full justify-center py-3"
        >
          {salvandoSenha ? (
            <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Alterando...</>
          ) : (
            <><Lock size={16} /> Alterar senha</>
          )}
        </button>
      </form>
    </div>
  )
}
