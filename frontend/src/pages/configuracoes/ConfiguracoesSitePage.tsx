import { useState, useEffect } from 'react'
import { Save, Globe, Phone, Hash, AlignLeft, RefreshCw, Stamp } from 'lucide-react'
import { Link } from 'react-router-dom'
import api from '../../services/api'
import toast from 'react-hot-toast'

type Config = Record<string, string>

interface Campo {
  chave: string
  label: string
  placeholder?: string
  multiline?: boolean
  hint?: string
}

const SECOES: { titulo: string; icone: React.ReactNode; campos: Campo[] }[] = [
  {
    titulo: 'Cabeçalho (Hero)',
    icone: <Globe size={16} />,
    campos: [
      { chave: 'hero_tag', label: 'Tag superior', placeholder: 'Ex: LJV Construção — Desde 2014' },
      { chave: 'hero_titulo_linha1', label: 'Título — Linha 1', placeholder: 'Ex: Construímos' },
      { chave: 'hero_titulo_linha2', label: 'Título — Linha 2', placeholder: 'Ex: o que você' },
      { chave: 'hero_titulo_linha3', label: 'Título — Linha 3', placeholder: 'Ex: imaginou.' },
      { chave: 'hero_subtitulo', label: 'Subtítulo', placeholder: 'Descrição breve da empresa', multiline: true },
    ],
  },
  {
    titulo: 'Manifesto',
    icone: <AlignLeft size={16} />,
    campos: [
      { chave: 'manifesto', label: 'Texto do manifesto', multiline: true, hint: 'Texto que aparece na seção "Nossa filosofia"' },
    ],
  },
  {
    titulo: 'Números / Estatísticas',
    icone: <Hash size={16} />,
    campos: [
      { chave: 'stat_obras', label: 'Número — Obras entregues', placeholder: 'Ex: 200' },
      { chave: 'stat_obras_label', label: 'Rótulo — Obras', placeholder: 'Obras entregues' },
      { chave: 'stat_anos', label: 'Número — Anos de experiência', placeholder: 'Ex: 10' },
      { chave: 'stat_anos_label', label: 'Rótulo — Anos', placeholder: 'Anos de experiência' },
      { chave: 'stat_satisfacao', label: 'Número — Satisfação (%)', placeholder: 'Ex: 98' },
      { chave: 'stat_satisfacao_label', label: 'Rótulo — Satisfação', placeholder: 'Clientes satisfeitos' },
      { chave: 'stat_equipe', label: 'Número — Equipe', placeholder: 'Ex: 50' },
      { chave: 'stat_equipe_label', label: 'Rótulo — Equipe', placeholder: 'Profissionais qualificados' },
    ],
  },
  {
    titulo: 'Contato (página inicial)',
    icone: <Phone size={16} />,
    campos: [
      { chave: 'contato_telefone', label: 'Telefone / WhatsApp', placeholder: '(11) 9 9999-9999', hint: 'Também preenche o relatório se o contato do documento estiver em branco.' },
      { chave: 'contato_email', label: 'E-mail de contato', placeholder: 'contato@empresa.com.br' },
      { chave: 'contato_endereco', label: 'Endereço / Cidade', placeholder: 'São Paulo, SP — Brasil' },
    ],
  },
  {
    titulo: 'CTA e Rodapé',
    icone: <Globe size={16} />,
    campos: [
      { chave: 'cta_titulo', label: 'Título do CTA final', placeholder: 'Ex: Pronto para começar?' },
      { chave: 'rodape_copy', label: 'Texto do copyright', placeholder: 'LJV Construção. Todos os direitos reservados.' },
    ],
  },
]

export default function ConfiguracoesSitePage() {
  const [config, setConfig] = useState<Config>({})
  const [carregando, setCarregando] = useState(true)
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    api.get('/config/site')
      .then(r => setConfig(r.data))
      .catch(() => toast.error('Erro ao carregar configurações'))
      .finally(() => setCarregando(false))
  }, [])

  const onChange = (chave: string, valor: string) => {
    setConfig(c => ({ ...c, [chave]: valor }))
  }

  const salvar = async () => {
    setSalvando(true)
    try {
      const chaves = SECOES.flatMap(s => s.campos.map(c => c.chave))
      const payload: Config = {}
      chaves.forEach(chave => { payload[chave] = config[chave] || '' })
      await api.put('/config/site', payload)
      toast.success('Textos da página inicial salvos.')
    } catch {
      toast.error('Erro ao salvar configurações')
    } finally {
      setSalvando(false)
    }
  }

  if (carregando) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-accent-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="page-title">Configurações do Site</h1>
          <p className="text-primary-500 text-sm mt-1">
            Textos da página inicial. Logo, CNPJ e cabeçalho dos relatórios ficam em Empresa e relatórios.
          </p>
        </div>
        <button onClick={salvar} disabled={salvando} className="btn-primary">
          {salvando ? (
            <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Salvando...</>
          ) : (
            <><Save size={16} /> Salvar tudo</>
          )}
        </button>
      </div>

      <Link
        to="/admin/empresa"
        className="flex items-start gap-3 bg-accent-50 border border-accent-200 rounded-xl px-4 py-3 text-sm text-accent-800 hover:bg-accent-100 transition-colors"
      >
        <Stamp size={16} className="mt-0.5 flex-shrink-0" />
        <span>
          Logo, nome, CNPJ, telefone, e-mail e rodapé dos documentos ficam no menu{' '}
          <strong>Empresa e relatórios</strong>.
        </span>
      </Link>

      <div className="flex items-start gap-3 bg-stone-50 border border-stone-100 rounded-xl px-4 py-3 text-sm text-primary-600">
        <RefreshCw size={15} className="mt-0.5 flex-shrink-0" />
        <span>As alterações da landing page aparecem imediatamente após salvar.</span>
      </div>

      {SECOES.map(secao => (
        <div key={secao.titulo} className="card p-6 space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-stone-100">
            <span className="text-primary-400">{secao.icone}</span>
            <h2 className="font-bold text-primary-900">{secao.titulo}</h2>
          </div>
          <div className="space-y-4">
            {secao.campos.map(campo => (
              <div key={campo.chave}>
                <label className="label">{campo.label}</label>
                {campo.multiline ? (
                  <textarea
                    className="input resize-none"
                    rows={3}
                    value={config[campo.chave] || ''}
                    onChange={e => onChange(campo.chave, e.target.value)}
                    placeholder={campo.placeholder}
                  />
                ) : (
                  <input
                    className="input"
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

      <div className="flex justify-end pb-8">
        <button onClick={salvar} disabled={salvando} className="btn-primary">
          {salvando ? (
            <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Salvando...</>
          ) : (
            <><Save size={16} /> Salvar configurações</>
          )}
        </button>
      </div>
    </div>
  )
}
