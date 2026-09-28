import { useEffect, useRef, useState } from 'react'
import { Save, ImagePlus, X, Stamp, Building2, Phone, FileText, AlignLeft } from 'lucide-react'
import api from '../../services/api'
import toast from 'react-hot-toast'
import { redimensionarImagem } from '../../utils/imagem'
import { useConfigSite } from '../../contexts/ConfigSiteContext'
import { montarDadosRelatorio } from '../../utils/dadosRelatorio'

type Config = Record<string, string>

interface Campo {
  chave: string
  label: string
  placeholder?: string
  hint?: string
  multiline?: boolean
}

const SECOES: { titulo: string; icone: React.ReactNode; texto: string; campos: Campo[] }[] = [
  {
    titulo: 'Identidade no documento',
    icone: <Building2 size={16} />,
    texto: 'Nome, slogan e registros que aparecem no topo do orçamento, ao lado do logo.',
    campos: [
      { chave: 'empresa_nome', label: 'Nome da empresa', placeholder: 'Ex: LJV Construção' },
      { chave: 'empresa_slogan', label: 'Slogan / área', placeholder: 'Ex: Construções e reformas' },
      { chave: 'empresa_cnpj', label: 'CNPJ', placeholder: '00.000.000/0000-00' },
      { chave: 'empresa_ie', label: 'Inscrição estadual (opcional)', placeholder: 'Ex: 10.20.0.3' },
      { chave: 'empresa_crea', label: 'CREA / registro técnico (opcional)', placeholder: 'Ex: CREA-SP 000000' },
    ],
  },
  {
    titulo: 'Contato no cabeçalho',
    icone: <Phone size={16} />,
    texto: 'Se deixar em branco, o sistema usa o telefone, e-mail e endereço da página inicial.',
    campos: [
      { chave: 'relatorio_telefone', label: 'Telefone', placeholder: '(11) 9 9999-9999' },
      { chave: 'relatorio_whatsapp', label: 'WhatsApp (se for diferente)', placeholder: '(11) 9 9999-9999' },
      { chave: 'relatorio_email', label: 'E-mail', placeholder: 'contato@empresa.com.br' },
      { chave: 'relatorio_endereco', label: 'Endereço', placeholder: 'Rua, número — Cidade/UF' },
      { chave: 'relatorio_site', label: 'Site', placeholder: 'www.empresa.com.br' },
      { chave: 'relatorio_instagram', label: 'Instagram', placeholder: '@empresa' },
      { chave: 'relatorio_cabecalho_extra', label: 'Linha extra no cabeçalho', placeholder: 'Ex: Atendemos toda a região metropolitana', multiline: true, hint: 'Texto livre abaixo dos dados de contato.' },
    ],
  },
  {
    titulo: 'Título e assinaturas',
    icone: <FileText size={16} />,
    texto: 'Textos do tipo de documento e das duas linhas de assinatura no final.',
    campos: [
      { chave: 'relatorio_titulo', label: 'Título do documento', placeholder: 'Orçamento', hint: 'Aparece no canto superior direito, junto do número.' },
      { chave: 'empresa_responsavel', label: 'Nome do responsável', placeholder: 'Nome completo' },
      { chave: 'relatorio_cargo_assinatura', label: 'Cargo / registro na assinatura', placeholder: 'Ex: Engenheiro responsável — CREA 000' },
      { chave: 'relatorio_assinatura_cliente', label: 'Texto da assinatura do cliente', placeholder: 'Assinatura do cliente' },
      { chave: 'relatorio_assinatura_empresa', label: 'Texto da assinatura da empresa', placeholder: 'Deixe vazio para usar o nome da empresa' },
    ],
  },
  {
    titulo: 'Rodapé',
    icone: <AlignLeft size={16} />,
    texto: 'Se preencher, esse texto substitui o rodapé automático (nome · telefone · e-mail).',
    campos: [
      {
        chave: 'relatorio_rodape',
        label: 'Texto do rodapé',
        placeholder: 'Ex: LJV Construção · (11) 99999-9999 · contato@empresa.com.br · www.empresa.com.br',
        multiline: true,
        hint: 'Use uma ou mais linhas. Vazio = monta sozinho com nome e contatos.',
      },
    ],
  },
]

export default function ConfiguracoesEmpresaPage() {
  const { recarregar } = useConfigSite()
  const [config, setConfig] = useState<Config>({})
  const [carregando, setCarregando] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const inputLogo = useRef<HTMLInputElement>(null)

  useEffect(() => {
    api.get('/config/site')
      .then(r => setConfig(r.data || {}))
      .catch(() => toast.error('Erro ao carregar configurações'))
      .finally(() => setCarregando(false))
  }, [])

  const onChange = (chave: string, valor: string) => {
    setConfig(c => ({ ...c, [chave]: valor }))
  }

  const salvar = async () => {
    setSalvando(true)
    try {
      const chaves = ['empresa_logo', ...SECOES.flatMap(s => s.campos.map(c => c.chave))]
      const payload: Config = {}
      chaves.forEach(chave => { payload[chave] = config[chave] || '' })
      await api.put('/config/site', payload)
      await recarregar()
      toast.success('Cabeçalho e rodapé dos relatórios atualizados.')
    } catch {
      toast.error('Erro ao salvar')
    } finally {
      setSalvando(false)
    }
  }

  const handleLogo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Imagem muito grande. Use um arquivo menor que 5MB.')
      return
    }
    try {
      const dataUrl = await redimensionarImagem(file, 400)
      onChange('empresa_logo', dataUrl)
    } catch {
      toast.error('Erro ao processar a imagem')
    } finally {
      if (inputLogo.current) inputLogo.current.value = ''
    }
  }

  if (carregando) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-accent-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const preview = montarDadosRelatorio(config)

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="page-title">Empresa e relatórios</h1>
          <p className="text-primary-500 text-sm mt-1">
            Tudo o que aparece no cabeçalho e no rodapé do orçamento enviado ao cliente. O logo também vale na navbar e no login.
          </p>
        </div>
        <button onClick={salvar} disabled={salvando} className="btn-primary min-h-[44px]">
          {salvando ? 'Salvando...' : <><Save size={16} /> Salvar</>}
        </button>
      </div>

      <div className="card p-5 sm:p-6 space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-stone-100">
          <ImagePlus size={16} className="text-primary-400" />
          <h2 className="font-bold text-primary-900">Logo no cabeçalho</h2>
        </div>
        <div className="flex items-center gap-4 flex-wrap">
          {config.empresa_logo ? (
            <img src={config.empresa_logo} alt="Logo" className="w-20 h-20 rounded-2xl object-cover border border-stone-200 bg-white" />
          ) : (
            <div className="w-20 h-20 rounded-2xl bg-primary-900 flex items-center justify-center text-accent-400 font-black text-2xl">
              {(config.empresa_nome || 'L').charAt(0).toUpperCase()}
            </div>
          )}
          <div className="flex gap-2 flex-wrap">
            <button type="button" onClick={() => inputLogo.current?.click()} className="btn-outline min-h-[44px]">
              <ImagePlus size={16} /> {config.empresa_logo ? 'Trocar logo' : 'Enviar logo'}
            </button>
            {config.empresa_logo && (
              <button type="button" onClick={() => onChange('empresa_logo', '')} className="btn-outline min-h-[44px] text-red-500 border-red-200">
                <X size={16} /> Remover
              </button>
            )}
          </div>
          <input ref={inputLogo} type="file" accept="image/*" className="hidden" onChange={handleLogo} />
        </div>
      </div>

      {SECOES.map(secao => (
        <div key={secao.titulo} className="card p-5 sm:p-6 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-stone-100">
            <span className="text-primary-400">{secao.icone}</span>
            <div>
              <h2 className="font-bold text-primary-900">{secao.titulo}</h2>
              <p className="text-xs text-primary-400 mt-0.5">{secao.texto}</p>
            </div>
          </div>
          <div className="space-y-4">
            {secao.campos.map(campo => (
              <div key={campo.chave}>
                <label className="label">{campo.label}</label>
                {campo.multiline ? (
                  <textarea
                    className="input resize-none min-h-[72px]"
                    rows={3}
                    value={config[campo.chave] || ''}
                    onChange={e => onChange(campo.chave, e.target.value)}
                    placeholder={campo.placeholder}
                  />
                ) : (
                  <input
                    className="input min-h-[44px]"
                    value={config[campo.chave] || ''}
                    onChange={e => onChange(campo.chave, e.target.value)}
                    placeholder={campo.placeholder}
                  />
                )}
                {campo.hint && <p className="text-xs text-primary-400 mt-1">{campo.hint}</p>}
              </div>
            ))}
          </div>
        </div>
      ))}

      <div className="card p-5 sm:p-6 space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-stone-100">
          <Stamp size={16} className="text-primary-400" />
          <h2 className="font-bold text-primary-900">Prévia do cabeçalho e rodapé</h2>
        </div>
        <div className="rounded-2xl border border-stone-200 bg-white p-4 sm:p-5">
          <div className="flex gap-3 items-start justify-between pb-4 mb-4 border-b-2 border-primary-900">
            <div className="flex gap-3 min-w-0">
              {preview.logo ? (
                <img src={preview.logo} alt="" className="w-12 h-12 rounded-xl object-cover border border-stone-200" />
              ) : (
                <div className="w-12 h-12 rounded-xl bg-primary-900 text-accent-400 font-black flex items-center justify-center">
                  {preview.nome.charAt(0)}
                </div>
              )}
              <div className="min-w-0">
                <div className="font-black text-primary-900 leading-tight">{preview.nome}</div>
                {preview.slogan && <div className="text-[10px] uppercase tracking-widest text-primary-400 mt-0.5">{preview.slogan}</div>}
                <div className="text-[11px] text-primary-500 mt-2 leading-relaxed whitespace-pre-line">
                  {[preview.documentos.join(' · '), ...preview.contatoLinhas].filter(Boolean).join('\n')}
                </div>
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <div className="text-[10px] font-bold uppercase tracking-widest text-primary-400">{preview.tituloDocumento}</div>
              <div className="text-sm font-black text-accent-500">ORC-000</div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-6 pt-6 mt-2">
            <div className="text-center">
              <div className="border-t border-stone-300 pt-2 text-[11px] text-primary-400">{preview.assinaturaCliente}</div>
            </div>
            <div className="text-center">
              <div className="border-t border-stone-300 pt-2 text-[11px] text-primary-400">{preview.assinaturaEmpresa}</div>
              <div className="text-[10px] text-primary-300 mt-0.5">{preview.responsavel || preview.cargoAssinatura}</div>
            </div>
          </div>
          <div className="mt-6 pt-3 border-t border-stone-200 text-center text-[11px] text-primary-400 leading-relaxed">
            {preview.rodape}
          </div>
        </div>
      </div>

      <div className="flex justify-end pb-8">
        <button onClick={salvar} disabled={salvando} className="btn-primary min-h-[44px]">
          {salvando ? 'Salvando...' : <><Save size={16} /> Salvar configurações</>}
        </button>
      </div>
    </div>
  )
}
