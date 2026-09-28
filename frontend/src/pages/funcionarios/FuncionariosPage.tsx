import { useEffect, useState, useCallback, useRef } from 'react'
import { Plus, Search, Edit2, Trash2, HardHat, Phone, Mail, Camera, ImagePlus, X, UserX, Briefcase } from 'lucide-react'
import api from '../../services/api'
import { maskPhone, maskCPF, maskCEP, maskCurrency } from '../../utils/masks'
import type { Funcionario, Page, CargoFuncionario } from '../../types'
import Modal from '../../components/ui/Modal'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import toast from 'react-hot-toast'
import { useAbrirNovo } from '../../hooks/useAbrirNovo'

/** Redimensiona imagem para max 480px e retorna data URL */
function redimensionarImagem(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (ev) => {
      const img = new Image()
      img.onload = () => {
        const MAX = 480
        let { width, height } = img
        if (width > height) { if (width > MAX) { height = Math.round(height * MAX / width); width = MAX } }
        else { if (height > MAX) { width = Math.round(width * MAX / height); height = MAX } }
        const canvas = document.createElement('canvas')
        canvas.width = width; canvas.height = height
        canvas.getContext('2d')!.drawImage(img, 0, 0, width, height)
        resolve(canvas.toDataURL('image/jpeg', 0.82))
      }
      img.onerror = reject
      img.src = ev.target?.result as string
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

const cargos: Record<CargoFuncionario, string> = {
  ENGENHEIRO: 'Engenheiro', ARQUITETO: 'Arquiteto', MESTRE_DE_OBRAS: 'Mestre de Obras',
  ENCARREGADO: 'Encarregado', PEDREIRO: 'Pedreiro', SERVENTE: 'Servente',
  ELETRICISTA: 'Eletricista', ENCANADOR: 'Encanador', PINTOR: 'Pintor',
  CARPINTEIRO: 'Carpinteiro', SOLDADOR: 'Soldador', MOTORISTA: 'Motorista',
  ADMINISTRATIVO: 'Administrativo', OUTRO: 'Outro',
}

function formatarMoeda(v?: number) {
  if (!v) return '—'
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)
}

function FormFuncionario({ funcionario, onSalvar, onFechar }: {
  funcionario: Partial<Funcionario> | null
  onSalvar: () => void
  onFechar: () => void
}) {
  const [form, setForm] = useState<Partial<Funcionario>>(
    funcionario || { tipoRecebimento: 'DIARIA', ativo: true, freelancer: false }
  )
  const [salvando, setSalvando] = useState(false)
  const inputCameraRef = useRef<HTMLInputElement>(null)
  const inputGaleriaRef = useRef<HTMLInputElement>(null)

  const set = (campo: keyof Funcionario, valor: unknown) =>
    setForm(f => ({ ...f, [campo]: valor }))

  const processarImagem = async (file: File | undefined) => {
    if (!file) return
    try {
      const dataUrl = await redimensionarImagem(file)
      set('foto', dataUrl)
    } catch {
      toast.error('Erro ao processar imagem')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.nome?.trim()) return toast.error('Nome é obrigatório')
    const temValor = (form.valorDiaria && form.valorDiaria > 0) || (form.salario && form.salario > 0)
    if (!temValor) return toast.error('Informe o valor da diária (ou o salário) para calcular os pagamentos')
    setSalvando(true)
    try {
      if (form.id) {
        await api.put(`/funcionarios/${form.id}`, form)
        toast.success('Funcionário atualizado!')
      } else {
        await api.post('/funcionarios', form)
        toast.success('Funcionário cadastrado!')
      }
      onSalvar()
    } catch {
      toast.error('Erro ao salvar funcionário')
    } finally {
      setSalvando(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">

      {/* ── Foto do funcionário ───────────────────────────────── */}
      <div className="flex flex-col items-center gap-3 pb-2">
        {/* Avatar / preview */}
        <div className="relative group/foto">
          <div className="w-24 h-24 rounded-2xl overflow-hidden bg-primary-900 flex items-center justify-center shadow-md">
            {form.foto ? (
              <img src={form.foto} alt="Foto" className="w-full h-full object-cover" />
            ) : (
              <span className="text-accent-400 font-black text-2xl">
                {form.nome ? form.nome.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase() : <HardHat size={28} className="text-primary-400" />}
              </span>
            )}
          </div>
          {form.foto && (
            <button
              type="button"
              onClick={() => set('foto', undefined)}
              className="absolute -top-1.5 -right-1.5 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center shadow hover:bg-red-600 transition-colors"
              title="Remover foto"
            >
              <X size={12} />
            </button>
          )}
        </div>

        {/* Botões de upload */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => inputCameraRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary-900 text-white text-xs font-semibold hover:bg-primary-800 transition-colors"
          >
            <Camera size={14} /> Tirar foto
          </button>
          <button
            type="button"
            onClick={() => inputGaleriaRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-stone-100 text-primary-700 text-xs font-semibold hover:bg-stone-200 transition-colors"
          >
            <ImagePlus size={14} /> Galeria
          </button>
        </div>

        {/* Inputs ocultos */}
        <input
          ref={inputCameraRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={e => processarImagem(e.target.files?.[0])}
        />
        <input
          ref={inputGaleriaRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={e => processarImagem(e.target.files?.[0])}
        />
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <label className="label">Nome completo *</label>
          <input className="input" placeholder="Nome do funcionário" value={form.nome || ''} onChange={e => set('nome', e.target.value)} required />
        </div>
        <div>
          <label className="label">Cargo</label>
          <select className="input" value={form.cargo || ''} onChange={e => set('cargo', e.target.value)}>
            <option value="">Selecione...</option>
            {Object.entries(cargos).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Especialidade</label>
          <input className="input" placeholder="Ex: Alvenaria estrutural" value={form.especialidade || ''} onChange={e => set('especialidade', e.target.value)} />
        </div>
        <div>
          <label className="label">CPF</label>
          <input className="input" placeholder="000.000.000-00" value={form.cpf || ''} onChange={e => set('cpf', maskCPF(e.target.value))} />
        </div>
        <div>
          <label className="label">RG</label>
          <input className="input" placeholder="0000000" value={form.rg || ''} onChange={e => set('rg', e.target.value)} />
        </div>
        <div>
          <label className="label">Telefone</label>
          <input className="input" placeholder="(11) 3333-4444" value={form.telefone || ''} onChange={e => set('telefone', maskPhone(e.target.value))} />
        </div>
        <div>
          <label className="label">Celular</label>
          <input className="input" placeholder="(11) 9 9999-9999" value={form.celular || ''} onChange={e => set('celular', maskPhone(e.target.value))} />
        </div>
        <div>
          <label className="label">E-mail</label>
          <input type="email" className="input" placeholder="email@exemplo.com" value={form.email || ''} onChange={e => set('email', e.target.value)} />
        </div>
        <div>
          <label className="label">Tipo de recebimento</label>
          <select className="input" value={form.tipoRecebimento || 'DIARIA'} onChange={e => set('tipoRecebimento', e.target.value)}>
            <option value="DIARIA">Diária (valor × dias trabalhados)</option>
            <option value="SEMANAL">Semanal (toda semana)</option>
            <option value="QUINZENAL">Quinzenal (2× por mês)</option>
            <option value="MENSAL">Mensal (salário fixo)</option>
          </select>
        </div>
        <div>
          {(form.tipoRecebimento as string) === 'DIARIA' ? (
            <>
              <label className="label">Valor da diária</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-primary-400 pointer-events-none">R$</span>
                <input type="text" inputMode="decimal" className="input pl-9" placeholder="0,00"
                  value={form.valorDiaria ? maskCurrency(form.valorDiaria) : ''}
                  onChange={e => { const d = e.target.value.replace(/\D/g, ''); set('valorDiaria', d ? Number(d)/100 : undefined) }} />
              </div>
            </>
          ) : (
            <>
              <label className="label">
                Salário base&nbsp;
                <span className="text-primary-400 font-normal text-xs">
                  {form.tipoRecebimento === 'SEMANAL' ? '(valor semanal)' :
                   form.tipoRecebimento === 'QUINZENAL' ? '(valor por quinzena)' : '(valor mensal)'}
                </span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-primary-400 pointer-events-none">R$</span>
                <input type="text" inputMode="decimal" className="input pl-9" placeholder="0,00"
                  value={form.salario ? maskCurrency(form.salario) : ''}
                  onChange={e => { const d = e.target.value.replace(/\D/g, ''); set('salario', d ? Number(d)/100 : undefined) }} />
              </div>
              {(form.tipoRecebimento as string) === 'DIARIA' || form.tipoRecebimento === 'SEMANAL' ? null : (
                <div className="mt-2">
                  <label className="label">Valor da diária (para cálculo de desconto)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-primary-400 pointer-events-none">R$</span>
                    <input type="text" inputMode="decimal" className="input pl-9" placeholder="Opcional"
                      value={form.valorDiaria ? maskCurrency(form.valorDiaria) : ''}
                      onChange={e => { const d = e.target.value.replace(/\D/g, ''); set('valorDiaria', d ? Number(d)/100 : undefined) }} />
                  </div>
                </div>
              )}
            </>
          )}
        </div>
        <div>
          <label className="label">
            Data de admissão
            <span className="text-primary-400 font-normal text-xs ml-1">(define o início do controle de ponto)</span>
          </label>
          <input type="date" className="input" value={form.dataAdmissao || ''} onChange={e => set('dataAdmissao', e.target.value)} />
        </div>
        <div>
          <label className="label">Data de demissão</label>
          <input type="date" className="input" value={form.dataDemissao || ''} onChange={e => set('dataDemissao', e.target.value)} />
        </div>
      </div>

      {/* ── Opções de vínculo ────────────────────────── */}
      <div className="border-t border-stone-100 pt-4">
        <h3 className="text-xs font-bold text-primary-400 uppercase tracking-wider mb-3">Situação</h3>
        <div className="grid sm:grid-cols-2 gap-3">
          {/* Freelancer */}
          <button
            type="button"
            onClick={() => set('freelancer', !form.freelancer)}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-left transition-all ${
              form.freelancer
                ? 'border-orange-400 bg-orange-50'
                : 'border-stone-200 hover:border-stone-300'
            }`}
          >
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
              form.freelancer ? 'bg-orange-500' : 'bg-stone-100'
            }`}>
              <Briefcase size={16} className={form.freelancer ? 'text-white' : 'text-primary-400'} />
            </div>
            <div>
              <div className={`font-bold text-sm ${form.freelancer ? 'text-orange-700' : 'text-primary-700'}`}>
                Freelancer
              </div>
              <div className="text-xs text-primary-400 leading-snug">
                {form.freelancer ? 'Sem vínculo fixo — conta só presenças marcadas' : 'Clique para marcar como freelancer'}
              </div>
            </div>
          </button>

          {/* Ativo */}
          <button
            type="button"
            onClick={() => set('ativo', form.ativo === false ? true : false)}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-left transition-all ${
              form.ativo === false
                ? 'border-red-300 bg-red-50'
                : 'border-emerald-300 bg-emerald-50'
            }`}
          >
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
              form.ativo === false ? 'bg-red-500' : 'bg-emerald-500'
            }`}>
              {form.ativo === false
                ? <UserX size={16} className="text-white" />
                : <HardHat size={16} className="text-white" />
              }
            </div>
            <div>
              <div className={`font-bold text-sm ${form.ativo === false ? 'text-red-700' : 'text-emerald-700'}`}>
                {form.ativo === false ? 'Inativo' : 'Ativo'}
              </div>
              <div className="text-xs text-primary-400 leading-snug">
                {form.ativo === false
                  ? 'Não aparece no controle de ponto'
                  : 'Aparece no controle de ponto e pagamentos'
                }
              </div>
            </div>
          </button>
        </div>
      </div>

      <div className="border-t border-stone-100 pt-4">
        <h3 className="text-xs font-bold text-primary-400 uppercase tracking-wider mb-3">Endereço</h3>
        <div className="grid sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2">
            <label className="label">Logradouro</label>
            <input className="input" value={form.logradouro || ''} onChange={e => set('logradouro', e.target.value)} />
          </div>
          <div>
            <label className="label">Número</label>
            <input className="input" value={form.numero || ''} onChange={e => set('numero', e.target.value)} />
          </div>
          <div>
            <label className="label">CEP</label>
            <input className="input" placeholder="00000-000" value={form.cep || ''} onChange={e => set('cep', maskCEP(e.target.value))} />
          </div>
          <div>
            <label className="label">Bairro</label>
            <input className="input" value={form.bairro || ''} onChange={e => set('bairro', e.target.value)} />
          </div>
          <div>
            <label className="label">Cidade</label>
            <input className="input" value={form.cidade || ''} onChange={e => set('cidade', e.target.value)} />
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

      <div>
        <label className="label">Observações</label>
        <textarea className="input min-h-[70px] resize-none" value={form.observacoes || ''} onChange={e => set('observacoes', e.target.value)} />
      </div>

      <div className="modal-actions">
        <button type="button" onClick={onFechar} className="flex-1 btn-outline">Cancelar</button>
        <button type="submit" disabled={salvando} className="flex-1 btn-primary">
          {salvando ? 'Salvando...' : form.id ? 'Atualizar' : 'Cadastrar'}
        </button>
      </div>
    </form>
  )
}

export default function FuncionariosPage() {
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([])
  const [total, setTotal] = useState(0)
  const [pagina, setPagina] = useState(0)
  const [busca, setBusca] = useState('')
  const [mostrarInativos, setMostrarInativos] = useState(false)
  const [carregando, setCarregando] = useState(true)
  const [modalAberto, setModalAberto] = useState(false)
  const [selecionado, setSelecionado] = useState<Partial<Funcionario> | null>(null)
  const [confirmarRemocao, setConfirmarRemocao] = useState<Funcionario | null>(null)
  const [removendo, setRemovendo] = useState(false)
  useAbrirNovo(() => { setSelecionado(null); setModalAberto(true) })

  const carregar = useCallback(async () => {
    setCarregando(true)
    try {
      const params = new URLSearchParams({ page: String(pagina), size: '12' })
      if (busca) params.set('q', busca)
      if (!mostrarInativos) params.set('ativo', 'true')
      const { data } = await api.get<Page<Funcionario>>(`/funcionarios?${params}`)
      setFuncionarios(data.content)
      setTotal(data.totalElements)
    } catch {
      toast.error('Erro ao carregar funcionários')
    } finally {
      setCarregando(false)
    }
  }, [pagina, busca, mostrarInativos])

  useEffect(() => { carregar() }, [carregar])

  const remover = async () => {
    if (!confirmarRemocao?.id) return
    setRemovendo(true)
    try {
      await api.delete(`/funcionarios/${confirmarRemocao.id}`)
      toast.success('Funcionário removido')
      setConfirmarRemocao(null)
      carregar()
    } catch {
      toast.error('Erro ao remover funcionário')
    } finally {
      setRemovendo(false)
    }
  }

  const iniciais = (nome: string) => nome.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Funcionários</h1>
          <p className="text-primary-500 text-sm mt-1">{total} funcionário{total !== 1 ? 's' : ''} ativo{total !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={() => { setSelecionado(null); setModalAberto(true) }} className="btn-primary">
          <Plus size={18} /> Novo Funcionário
        </button>
      </div>

      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-0 max-w-sm">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-primary-400" />
          <input className="input pl-10 w-full" placeholder="Buscar por nome ou CPF..." value={busca} onChange={e => { setBusca(e.target.value); setPagina(0) }} />
        </div>
        <button
          onClick={() => { setMostrarInativos(v => !v); setPagina(0) }}
          className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold border transition-colors ${
            mostrarInativos ? 'bg-red-50 text-red-600 border-red-200' : 'bg-stone-50 text-primary-500 border-stone-200 hover:bg-stone-100'
          }`}
        >
          <UserX size={14} /> {mostrarInativos ? 'Mostrando inativos' : 'Mostrar inativos'}
        </button>
      </div>

      {carregando ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-4 border-accent-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : funcionarios.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-20 h-20 rounded-3xl bg-primary-50 flex items-center justify-center mx-auto mb-5">
            <HardHat size={36} className="text-primary-300" />
          </div>
          <h3 className="text-lg font-bold text-primary-700 mb-2">{busca ? 'Nenhum funcionário encontrado' : 'Nenhum funcionário cadastrado'}</h3>
          <p className="text-primary-400 text-sm mb-6">{busca ? 'Tente uma busca diferente.' : 'Cadastre seu primeiro funcionário.'}</p>
          {!busca && <button onClick={() => { setSelecionado(null); setModalAberto(true) }} className="btn-primary"><Plus size={16} /> Cadastrar funcionário</button>}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {funcionarios.map((f) => (
            <div key={f.id} className="card-hover p-5 h-full flex flex-col group">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-11 h-11 rounded-xl bg-primary-900 flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {f.foto
                      ? <img src={f.foto} alt={f.nome} className="w-full h-full object-cover" />
                      : <span className="text-accent-400 font-bold text-sm">{iniciais(f.nome)}</span>
                    }
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <div className="font-bold text-primary-900 truncate">{f.nome}</div>
                      {f.freelancer && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-orange-100 text-orange-600 flex-shrink-0">FREELANCER</span>
                      )}
                      {f.ativo === false && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-red-100 text-red-600 flex-shrink-0">INATIVO</span>
                      )}
                    </div>
                    {f.cargo && <div className="text-xs text-accent-600 font-medium">{cargos[f.cargo]}</div>}
                  </div>
                </div>
                <div className="flex gap-0.5 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity flex-shrink-0">
                  <button onClick={() => { setSelecionado(f); setModalAberto(true) }} className="icon-btn" aria-label="Editar">
                    <Edit2 size={16} />
                  </button>
                  <button onClick={() => setConfirmarRemocao(f)} className="icon-btn-danger" aria-label="Excluir">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <div className="space-y-1.5 mt-3 pt-3 border-t border-stone-100">
                {f.celular && <div className="flex items-center gap-2 text-xs text-primary-500"><Phone size={11} className="text-primary-400" />{f.celular}</div>}
                {f.email && <div className="flex items-center gap-2 text-xs text-primary-500"><Mail size={11} className="text-primary-400" /><span className="truncate">{f.email}</span></div>}
                <div className="flex items-center justify-between mt-1">
                  {f.tipoRecebimento === 'DIARIA' && f.valorDiaria && (
                    <div className="text-xs text-emerald-600 font-semibold">{formatarMoeda(f.valorDiaria)}/dia</div>
                  )}
                  {f.tipoRecebimento !== 'DIARIA' && f.salario && (
                    <div className="text-xs text-emerald-600 font-semibold">
                      {formatarMoeda(f.salario)}/{f.tipoRecebimento === 'QUINZENAL' ? 'quinzena×2' : 'mês'}
                    </div>
                  )}
                  {f.tipoRecebimento && (
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      f.tipoRecebimento === 'DIARIA' ? 'bg-blue-50 text-blue-600' :
                      f.tipoRecebimento === 'SEMANAL' ? 'bg-violet-50 text-violet-600' :
                      f.tipoRecebimento === 'QUINZENAL' ? 'bg-indigo-50 text-indigo-600' :
                      'bg-emerald-50 text-emerald-600'
                    }`}>
                      {{ DIARIA:'Diária', SEMANAL:'Semanal', QUINZENAL:'Quinzenal', MENSAL:'Mensal' }[f.tipoRecebimento]}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {total > 12 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-primary-400">Página {pagina + 1} de {Math.ceil(total / 12)}</span>
          <div className="flex gap-2">
            <button onClick={() => setPagina(p => Math.max(0, p - 1))} disabled={pagina === 0} className="btn-outline py-2 px-4 disabled:opacity-40">Anterior</button>
            <button onClick={() => setPagina(p => p + 1)} disabled={(pagina + 1) * 12 >= total} className="btn-outline py-2 px-4 disabled:opacity-40">Próximo</button>
          </div>
        </div>
      )}

      <Modal aberto={modalAberto} fechar={() => setModalAberto(false)} titulo={selecionado?.id ? 'Editar Funcionário' : 'Novo Funcionário'} tamanho="lg">
        <FormFuncionario funcionario={selecionado} onSalvar={() => { setModalAberto(false); carregar() }} onFechar={() => setModalAberto(false)} />
      </Modal>

      <ConfirmDialog aberto={!!confirmarRemocao} fechar={() => setConfirmarRemocao(null)} titulo="Remover funcionário" mensagem={`Remover o funcionário "${confirmarRemocao?.nome}"?`} onConfirmar={remover} carregando={removendo} />
    </div>
  )
}
