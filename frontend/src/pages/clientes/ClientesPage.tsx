import { useEffect, useState, useCallback } from 'react'
import { Plus, Search, Edit2, Trash2, Users, Phone, Mail, MapPin } from 'lucide-react'
import api from '../../services/api'
import type { Cliente, Page } from '../../types'
import Modal from '../../components/ui/Modal'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import { maskPhone, maskCPFCNPJ, maskCEP } from '../../utils/masks'
import toast from 'react-hot-toast'
import { useAbrirNovo } from '../../hooks/useAbrirNovo'

// --- Formulário ---
function FormCliente({ cliente, onSalvar, onFechar }: {
  cliente: Partial<Cliente> | null
  onSalvar: () => void
  onFechar: () => void
}) {
  const [form, setForm] = useState<Partial<Cliente>>(cliente || {})
  const [salvando, setSalvando] = useState(false)

  const set = (campo: keyof Cliente, valor: string) =>
    setForm(f => ({ ...f, [campo]: valor }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.nome?.trim()) return toast.error('Nome é obrigatório')
    setSalvando(true)
    try {
      if (form.id) {
        await api.put(`/clientes/${form.id}`, form)
        toast.success('Cliente atualizado com sucesso!')
      } else {
        await api.post('/clientes', form)
        toast.success('Cliente cadastrado com sucesso!')
      }
      onSalvar()
    } catch {
      toast.error('Erro ao salvar cliente. Tente novamente.')
    } finally {
      setSalvando(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Dados principais */}
      <div>
        <h3 className="text-xs font-bold text-primary-400 uppercase tracking-wider mb-3">Dados pessoais</h3>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="label">Nome completo *</label>
            <input className="input" placeholder="Nome do cliente" value={form.nome || ''} onChange={e => set('nome', e.target.value)} required />
          </div>
          <div>
            <label className="label">CPF / CNPJ</label>
            <input className="input" placeholder="000.000.000-00" value={form.cpfCnpj || ''} onChange={e => set('cpfCnpj', maskCPFCNPJ(e.target.value))} />
          </div>
          <div>
            <label className="label">E-mail</label>
            <input type="email" className="input" placeholder="email@exemplo.com" value={form.email || ''} onChange={e => set('email', e.target.value)} />
          </div>
          <div>
            <label className="label">Telefone</label>
            <input className="input" placeholder="(11) 3333-4444" value={form.telefone || ''} onChange={e => set('telefone', maskPhone(e.target.value))} />
          </div>
          <div>
            <label className="label">Celular</label>
            <input className="input" placeholder="(11) 9 9999-9999" value={form.celular || ''} onChange={e => set('celular', maskPhone(e.target.value))} />
          </div>
        </div>
      </div>

      {/* Endereço */}
      <div className="border-t border-stone-100 pt-4">
        <h3 className="text-xs font-bold text-primary-400 uppercase tracking-wider mb-3">Endereço</h3>
        <div className="grid sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2">
            <label className="label">Logradouro</label>
            <input className="input" placeholder="Rua, Avenida..." value={form.logradouro || ''} onChange={e => set('logradouro', e.target.value)} />
          </div>
          <div>
            <label className="label">Número</label>
            <input className="input" placeholder="Nº" value={form.numero || ''} onChange={e => set('numero', e.target.value)} />
          </div>
          <div>
            <label className="label">Complemento</label>
            <input className="input" placeholder="Apto, Sala..." value={form.complemento || ''} onChange={e => set('complemento', e.target.value)} />
          </div>
          <div>
            <label className="label">Bairro</label>
            <input className="input" placeholder="Bairro" value={form.bairro || ''} onChange={e => set('bairro', e.target.value)} />
          </div>
          <div>
            <label className="label">CEP</label>
            <input className="input" placeholder="00000-000" value={form.cep || ''} onChange={e => set('cep', maskCEP(e.target.value))} />
          </div>
          <div>
            <label className="label">Cidade</label>
            <input className="input" placeholder="Cidade" value={form.cidade || ''} onChange={e => set('cidade', e.target.value)} />
          </div>
          <div>
            <label className="label">Estado</label>
            <select className="input" value={form.estado || ''} onChange={e => set('estado', e.target.value)}>
              <option value="">UF</option>
              {['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'].map(uf => (
                <option key={uf} value={uf}>{uf}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Observações */}
      <div>
        <label className="label">Observações</label>
        <textarea className="input min-h-[80px] resize-none" placeholder="Informações adicionais..." value={form.observacoes || ''} onChange={e => set('observacoes', e.target.value)} />
      </div>

      {/* Botões — sticky para sempre ficarem visíveis */}
      <div className="modal-actions">
        <button type="button" onClick={onFechar} className="flex-1 btn-outline">Cancelar</button>
        <button type="submit" disabled={salvando} className="flex-1 btn-primary">
          {salvando ? 'Salvando...' : form.id ? 'Atualizar' : 'Cadastrar'}
        </button>
      </div>
    </form>
  )
}

// --- Página principal ---
export default function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [total, setTotal] = useState(0)
  const [pagina, setPagina] = useState(0)
  const [busca, setBusca] = useState('')
  const [carregando, setCarregando] = useState(true)
  const [modalAberto, setModalAberto] = useState(false)
  const [clienteSelecionado, setClienteSelecionado] = useState<Partial<Cliente> | null>(null)
  const [confirmarRemocao, setConfirmarRemocao] = useState<Cliente | null>(null)
  const [removendo, setRemovendo] = useState(false)

  const carregar = useCallback(async () => {
    setCarregando(true)
    try {
      const params = new URLSearchParams({ page: String(pagina), size: '12' })
      if (busca) params.set('q', busca)
      const { data } = await api.get<Page<Cliente>>(`/clientes?${params}`)
      setClientes(data.content)
      setTotal(data.totalElements)
    } catch {
      toast.error('Erro ao carregar clientes')
    } finally {
      setCarregando(false)
    }
  }, [pagina, busca])

  useEffect(() => { carregar() }, [carregar])

  const abrirCadastro = () => { setClienteSelecionado(null); setModalAberto(true) }
  const abrirEdicao = (c: Cliente) => { setClienteSelecionado(c); setModalAberto(true) }
  useAbrirNovo(abrirCadastro)
  const fecharModal = () => { setModalAberto(false); setClienteSelecionado(null) }

  const remover = async () => {
    if (!confirmarRemocao?.id) return
    setRemovendo(true)
    try {
      await api.delete(`/clientes/${confirmarRemocao.id}`)
      toast.success('Cliente removido')
      setConfirmarRemocao(null)
      carregar()
    } catch {
      toast.error('Erro ao remover cliente')
    } finally {
      setRemovendo(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Clientes</h1>
          <p className="text-primary-500 text-sm mt-1">{total} cliente{total !== 1 ? 's' : ''} cadastrado{total !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={abrirCadastro} className="btn-primary">
          <Plus size={18} />
          Novo Cliente
        </button>
      </div>

      {/* Busca */}
      <div className="relative">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-primary-400" />
        <input
          className="input pl-10 max-w-sm"
          placeholder="Buscar por nome, CPF/CNPJ ou e-mail..."
          value={busca}
          onChange={e => { setBusca(e.target.value); setPagina(0) }}
        />
      </div>

      {/* Lista */}
      {carregando ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-4 border-accent-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : clientes.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-20 h-20 rounded-3xl bg-primary-50 flex items-center justify-center mx-auto mb-5">
            <Users size={36} className="text-primary-300" />
          </div>
          <h3 className="text-lg font-bold text-primary-700 mb-2">
            {busca ? 'Nenhum cliente encontrado' : 'Nenhum cliente cadastrado'}
          </h3>
          <p className="text-primary-400 text-sm mb-6">
            {busca ? 'Tente uma busca diferente.' : 'Cadastre seu primeiro cliente para começar.'}
          </p>
          {!busca && (
            <button onClick={abrirCadastro} className="btn-primary">
              <Plus size={16} /> Cadastrar primeiro cliente
            </button>
          )}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {clientes.map((c) => (
            <div key={c.id} className="card-hover p-5 h-full flex flex-col group">
              {/* Cabeçalho do card */}
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-primary-900 flex items-center justify-center flex-shrink-0">
                    <span className="text-accent-400 font-bold">{c.nome.charAt(0).toUpperCase()}</span>
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-primary-900 truncate">{c.nome}</div>
                    {c.cpfCnpj && <div className="text-xs text-primary-400">{c.cpfCnpj}</div>}
                  </div>
                </div>
                <div className="flex gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity flex-shrink-0">
                  <button onClick={() => abrirEdicao(c)} className="icon-btn" aria-label="Editar">
                    <Edit2 size={16} />
                  </button>
                  <button onClick={() => setConfirmarRemocao(c)} className="icon-btn-danger" aria-label="Excluir">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              {/* Informações */}
              <div className="space-y-2">
                {c.celular && (
                  <div className="flex items-center gap-2 text-xs text-primary-500">
                    <Phone size={12} className="text-primary-400 flex-shrink-0" />
                    <span>{c.celular}</span>
                  </div>
                )}
                {c.email && (
                  <div className="flex items-center gap-2 text-xs text-primary-500">
                    <Mail size={12} className="text-primary-400 flex-shrink-0" />
                    <span className="truncate">{c.email}</span>
                  </div>
                )}
                {c.cidade && (
                  <div className="flex items-center gap-2 text-xs text-primary-500">
                    <MapPin size={12} className="text-primary-400 flex-shrink-0" />
                    <span>{c.cidade}{c.estado ? `, ${c.estado}` : ''}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Paginação */}
      {total > 12 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-primary-400">
            Página {pagina + 1} de {Math.ceil(total / 12)}
          </span>
          <div className="flex gap-2">
            <button onClick={() => setPagina(p => Math.max(0, p - 1))} disabled={pagina === 0} className="btn-outline py-2 px-4 disabled:opacity-40">Anterior</button>
            <button onClick={() => setPagina(p => p + 1)} disabled={(pagina + 1) * 12 >= total} className="btn-outline py-2 px-4 disabled:opacity-40">Próximo</button>
          </div>
        </div>
      )}

      {/* Modal */}
      <Modal
        aberto={modalAberto}
        fechar={fecharModal}
        titulo={clienteSelecionado?.id ? 'Editar Cliente' : 'Novo Cliente'}
        tamanho="lg"
      >
        <FormCliente
          cliente={clienteSelecionado}
          onSalvar={() => { fecharModal(); carregar() }}
          onFechar={fecharModal}
        />
      </Modal>

      {/* Confirmar remoção */}
      <ConfirmDialog
        aberto={!!confirmarRemocao}
        fechar={() => setConfirmarRemocao(null)}
        titulo="Remover cliente"
        mensagem={`Tem certeza que deseja remover o cliente "${confirmarRemocao?.nome}"? Esta ação não pode ser desfeita.`}
        onConfirmar={remover}
        carregando={removendo}
      />
    </div>
  )
}
