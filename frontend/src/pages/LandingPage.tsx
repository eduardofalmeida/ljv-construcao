import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Lock, Menu, Star, X } from 'lucide-react'
import axios from 'axios'
import { maskPhone } from '../utils/masks'
import { apiBaseUrl } from '../services/api'
import { MENSAGENS, linkWhatsApp, openWhatsApp } from '../config/contatoLjv'
import { detectarQualidade, type Qualidade } from '../landing/qualidade'
import { ponteiro } from '../landing/ponteiro'
import { HOTSPOTS } from '../landing/hotspots'
import MaqueteEstatica from '../landing/MaqueteEstatica'
import LimiteCena from '../landing/LimiteCena'

const HeroCena = lazy(() => import('../landing/HeroCena'))
const NarrativaCena = lazy(() => import('../landing/NarrativaCena'))
const ModeloInterativo = lazy(() => import('../landing/ModeloInterativo'))
const CtaCena = lazy(() => import('../landing/CtaCena'))

const FASES = [
  { ate: 0.16, nome: 'Projeto', texto: 'Linhas, medidas e a intenção do volume.' },
  { ate: 0.36, nome: 'Planejamento', texto: 'A fundação entra primeiro. A ordem do trabalho aparece.' },
  { ate: 0.56, nome: 'Estrutura', texto: 'Pilares e vigas sustentam o que ainda vai fechar.' },
  { ate: 0.78, nome: 'Execução', texto: 'Paredes, vidro e os planos da arquitetura.' },
  { ate: 1.01, nome: 'Entrega', texto: 'O volume completo — ainda uma maquete conceitual.' },
]

const SERVICOS = [
  { n: '01', titulo: 'Construção residencial', texto: 'Casas conduzidas com escopo, etapas e acabamento no mesmo critério.' },
  { n: '02', titulo: 'Construção comercial', texto: 'Espaços de trabalho organizados para funcionar no dia a dia.' },
  { n: '03', titulo: 'Gerenciamento', texto: 'Equipe, compras e decisões sob uma coordenação só.' },
  { n: '04', titulo: 'Reformas', texto: 'Ampliação e renovação com a interferência combinada antes.' },
  { n: '05', titulo: 'Planejamento', texto: 'O que será feito, em que ordem e com qual proposta.' },
  { n: '06', titulo: 'Acompanhamento', texto: 'Presença e registro ao longo da execução.' },
]

const DIFERENCIAIS = [
  { n: '01', titulo: 'Atendimento próximo', texto: 'Conversa direta, sem fila de intermediários.' },
  { n: '02', titulo: 'Planejamento', texto: 'A ordem do trabalho definida antes do canteiro.' },
  { n: '03', titulo: 'Transparência', texto: 'O que foi feito e o que vem a seguir, em linguagem clara.' },
  { n: '04', titulo: 'Organização', texto: 'Canteiro, compras e equipe no mesmo ritmo.' },
  { n: '05', titulo: 'Acompanhamento', texto: 'A obra não fica sem quem responda por ela.' },
  { n: '06', titulo: 'Compromisso com a qualidade', texto: 'Acabamento conferido, não só prometido.' },
]

const PROCESSO = [
  { n: '01', titulo: 'Entendimento', texto: 'O que você quer construir, em que condição e com qual prioridade.' },
  { n: '02', titulo: 'Planejamento', texto: 'As etapas necessárias, na ordem em que a obra pede.' },
  { n: '03', titulo: 'Orçamento', texto: 'Uma proposta clara, antes de começar.' },
  { n: '04', titulo: 'Execução', texto: 'Coordenação do que foi combinado.' },
  { n: '05', titulo: 'Acompanhamento', texto: 'Presença ao longo das etapas.' },
  { n: '06', titulo: 'Entrega', texto: 'Fechamento com atenção aos detalhes.' },
]

const NAV = [
  { href: '#topo', label: 'Início' },
  { href: '#sobre', label: 'Sobre' },
  { href: '#servicos', label: 'Serviços' },
  { href: '#processo', label: 'Processo' },
  { href: '#contato', label: 'Contato' },
]

const SEED_IGNORAR: Record<string, string> = {
  contato_telefone: '(11) 9 9999-9999',
  contato_endereco: 'São Paulo, SP — Brasil',
}

interface DepoimentoAPI {
  id: number
  nome: string
  cidade?: string
  cargo?: string
  texto: string
  estrelas: number
}

function useReveal() {
  const ref = useRef<HTMLDivElement>(null)
  const [visivel, setVisivel] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setVisivel(true)
      return
    }
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        setVisivel(true)
        obs.disconnect()
      }
    }, { threshold: 0.2 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])
  return { ref, visivel }
}

function Zap({
  mensagem,
  className,
  children,
  onMouseEnter,
  onMouseLeave,
  onClick,
}: {
  mensagem: string
  className?: string
  children: React.ReactNode
  onMouseEnter?: () => void
  onMouseLeave?: () => void
  onClick?: () => void
}) {
  return (
    <a
      className={className}
      href={linkWhatsApp(mensagem)}
      target="_blank"
      rel="noopener noreferrer"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onClick={e => {
        e.preventDefault()
        onClick?.()
        openWhatsApp(mensagem)
      }}
    >
      {children}
    </a>
  )
}

function IconeWhats() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
      <path fill="currentColor" d="M20.5 3.5A11 11 0 0 0 2.1 17.8L1 23l5.3-1.1A11 11 0 0 0 12 23a11 11 0 0 0 8.5-19.5zM12 21a9 9 0 0 1-4.6-1.3l-.3-.2-3.2.8.8-3.1-.2-.3A9 9 0 1 1 12 21zm5-6.7c-.3-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.7.8-.8 1-.3.2-.6.1a7.4 7.4 0 0 1-2.2-1.4 8 8 0 0 1-1.5-1.9c-.2-.3 0-.4.1-.6l.4-.5.2-.3a.5.5 0 0 0 0-.5c-.1-.1-.6-1.4-.8-1.9s-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-1 2.2 5.2 5.2 0 0 0 1.1 2.7 12 12 0 0 0 4.5 4 15 15 0 0 0 1.5.5 3.6 3.6 0 0 0 1.7.1 2.7 2.7 0 0 0 1.8-1.2 2.2 2.2 0 0 0 .2-1.2c-.1-.1-.3-.2-.6-.3z" />
    </svg>
  )
}

function Marca({ nome, src = '/images/logo-ljv.png' }: { nome: string; src?: string }) {
  return <img src={src} alt={nome} className="lp-logo" />
}

function Ponte() {
  const { ref, visivel } = useReveal()
  return (
    <div ref={ref} className={`lp-bridge${visivel ? ' is-in' : ''}`} aria-hidden="true">
      <span /><span /><span />
    </div>
  )
}

function Desenho({ i }: { i: number }) {
  const tracos = [
    'M20 150 H280 M40 150 V40 H150 V90 H250 V150 M40 40 L95 18 H150',
    'M30 150 H270 M50 150 V50 H250 V150 M50 90 H250 M120 50 V150 M190 50 V150',
    'M40 30 V160 M40 30 H260 M80 30 V160 M140 30 V160 M200 30 V160 M40 70 H260 M40 110 H260',
    'M30 150 H270 M48 150 V70 H130 V150 M150 150 V48 H250 V150 M168 70 H232 V112 H168 Z',
    'M24 40 H300 M24 40 V24 M24 40 H48 M60 150 V55 M120 150 V40 M200 150 V70 M260 150 V48 M60 150 H260',
    'M40 150 H270 M40 150 V45 H270 V150 M40 80 H270 M90 80 V150 M160 80 V150 M220 80 V150 M70 58 H120',
  ]
  return (
    <svg viewBox="0 0 320 180" className="lp-desenho" aria-hidden="true">
      <path d={tracos[i]} fill="none" stroke="currentColor" strokeWidth="1.15" />
      <path d="M16 16 H36 M16 16 V36 M304 16 H284 M304 16 V36 M16 164 H36 M16 164 V144 M304 164 H284 M304 164 V144" fill="none" stroke="#e36a1e" strokeWidth="1" />
    </svg>
  )
}

export default function LandingPage() {
  const qualidadeInicial = detectarQualidade()
  const [qualidade] = useState<Qualidade>(qualidadeInicial)
  const [compact, setCompact] = useState(() => window.matchMedia('(max-width: 1023px)').matches)
  const [reduzido] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  const [pronta, setPronta] = useState(qualidadeInicial === 'estatica')
  const [jaViu, setJaViu] = useState(false)
  const [heroOn, setHeroOn] = useState(true)
  const [narOn, setNarOn] = useState(false)
  const [modeloOn, setModeloOn] = useState(false)
  const [ctaOn, setCtaOn] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [menuAberto, setMenuAberto] = useState(false)
  const [servico, setServico] = useState(0)
  const [hotspot, setHotspot] = useState(HOTSPOTS[0].id)
  const [config, setConfig] = useState<Record<string, string>>({})
  const [depoimentos, setDepoimentos] = useState<DepoimentoAPI[]>([])
  const [formDep, setFormDep] = useState({ nome: '', cidade: '', cargo: '', texto: '', estrelas: 5 })
  const [enviandoDep, setEnviandoDep] = useState(false)
  const [depEnviado, setDepEnviado] = useState(false)
  const [erroDep, setErroDep] = useState('')
  const [depAberto, setDepAberto] = useState(false)

  const heroRef = useRef<HTMLElement>(null)
  const trilhaRef = useRef<HTMLElement>(null)
  const modeloRef = useRef<HTMLElement>(null)
  const ctaRef = useRef<HTMLElement>(null)
  const tempoRef = useRef<HTMLOListElement>(null)
  const cursorRef = useRef<HTMLDivElement>(null)
  const faseNome = useRef<HTMLParagraphElement>(null)
  const faseTexto = useRef<HTMLParagraphElement>(null)
  const railRef = useRef<HTMLSpanElement>(null)
  const estaticaNar = useRef<HTMLDivElement>(null)
  const prog = useRef(0)
  const fino = !reduzido && typeof window !== 'undefined' && window.matchMedia('(pointer: fine)').matches

  useEffect(() => {
    const marcar = (msg: string) => document.querySelector('.lp')?.setAttribute('data-erro', msg.slice(0, 200))
    const onErr = (e: ErrorEvent) => marcar(e.message || 'erro')
    const onRej = (e: PromiseRejectionEvent) => marcar(String(e.reason?.message || e.reason || 'rejeicao'))
    window.addEventListener('error', onErr)
    window.addEventListener('unhandledrejection', onRej)
    return () => {
      window.removeEventListener('error', onErr)
      window.removeEventListener('unhandledrejection', onRej)
    }
  }, [])

  useEffect(() => {
    const base = apiBaseUrl()
    axios.get(`${base}/config/site`).then(r => {
      if (r.data && typeof r.data === 'object' && !Array.isArray(r.data)) setConfig(r.data)
    }).catch(() => {})
    axios.get(`${base}/depoimentos/aprovados`)
      .then(r => setDepoimentos(Array.isArray(r.data) ? r.data : []))
      .catch(() => setDepoimentos([]))
  }, [])

  useEffect(() => {
    const id = window.setTimeout(() => setPronta(true), 3200)
    return () => clearTimeout(id)
  }, [])

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 1023px)')
    const aplicar = () => setCompact(mq.matches)
    mq.addEventListener('change', aplicar)
    return () => mq.removeEventListener('change', aplicar)
  }, [])

  useEffect(() => {
    const observar = (el: HTMLElement | null, set: (v: boolean) => void, margem = '180px') => {
      if (!el) return () => {}
      const obs = new IntersectionObserver(([e]) => set(e.isIntersecting), { rootMargin: margem })
      obs.observe(el)
      return () => obs.disconnect()
    }
    const limpar = [
      observar(heroRef.current, setHeroOn, '0px'),
      observar(trilhaRef.current, setNarOn, '0px'),
      observar(modeloRef.current, setModeloOn, '280px'),
      observar(ctaRef.current, setCtaOn, '240px'),
    ]
    return () => limpar.forEach(fn => fn())
  }, [])

  useEffect(() => {
    const anterior = document.body.style.overflowX
    document.body.style.overflowX = 'clip'
    return () => { document.body.style.overflowX = anterior }
  }, [])

  useEffect(() => {
    document.body.style.overflow = menuAberto ? 'hidden' : ''
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setMenuAberto(false) }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKey)
    }
  }, [menuAberto])

  useEffect(() => {
    let quadro = 0
    let mx = window.innerWidth / 2
    let my = window.innerHeight / 2
    let cx = mx
    let cy = my
    let ultimoScroll = window.scrollY > 10
    let ultimaFase = -1
    let ultimoPasso = -1

    const tick = () => {
      const rolagem = window.scrollY > 10
      if (rolagem !== ultimoScroll) {
        ultimoScroll = rolagem
        setScrolled(rolagem)
      }
      const trilha = trilhaRef.current
      if (trilha) {
        const rect = trilha.getBoundingClientRect()
        const total = Math.max(rect.height - window.innerHeight, window.innerHeight * 0.55)
        const p = Math.min(1, Math.max(0, -rect.top / total))
        prog.current = p
        estaticaNar.current?.style.setProperty('--p', String(p))
        if (railRef.current) railRef.current.style.transform = `scaleY(${p})`
        const idx = Math.max(0, FASES.findIndex(f => p <= f.ate))
        if (idx !== ultimaFase) {
          ultimaFase = idx
          if (faseNome.current) faseNome.current.textContent = FASES[idx].nome
          if (faseTexto.current) faseTexto.current.textContent = FASES[idx].texto
        }
      }
      const tempo = tempoRef.current
      if (tempo) {
        const rect = tempo.getBoundingClientRect()
        const p = reduzido ? 1 : Math.min(1, Math.max(0, (window.innerHeight * 0.62 - rect.top) / (rect.height * 0.8)))
        tempo.style.setProperty('--p', String(p))
        const passo = Math.min(5, Math.floor(p * 6))
        if (passo !== ultimoPasso) {
          ultimoPasso = passo
          tempo.querySelectorAll('.lp-step').forEach((el, i) => el.classList.toggle('is-now', p >= (i + 0.15) / 6))
        }
      }
      if (fino && cursorRef.current) {
        cx += (mx - cx) * 0.2
        cy += (my - cy) * 0.2
        cursorRef.current.style.transform = `translate3d(${cx}px, ${cy}px, 0)`
      }
      quadro = requestAnimationFrame(tick)
    }

    const mover = (e: MouseEvent) => {
      cursorRef.current?.classList.add('is-on')
      mx = e.clientX
      my = e.clientY
      ponteiro.x = (e.clientX / window.innerWidth) * 2 - 1
      ponteiro.y = -((e.clientY / window.innerHeight) * 2 - 1)
      const alvo = document.elementFromPoint(e.clientX, e.clientY)
      const cursor = cursorRef.current
      if (!cursor) return
      cursor.classList.toggle('is-hot', Boolean(alvo?.closest('a, button')))
      cursor.classList.toggle('is-3d', Boolean(alvo?.closest('[data-cursor="3d"]')))
      cursor.classList.toggle('is-off', Boolean(alvo?.closest('input, textarea, select')))
    }

    if (fino) window.addEventListener('mousemove', mover, { passive: true })
    quadro = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(quadro)
      if (fino) window.removeEventListener('mousemove', mover)
    }
  }, [fino, reduzido])

  const enviarOrcamento = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const dados = new FormData(e.currentTarget)
    const nome = String(dados.get('nome') || '').trim()
    const whatsapp = String(dados.get('whatsapp') || '').trim()
    const email = String(dados.get('email') || '').trim()
    const tipo = String(dados.get('tipo') || '').trim()
    const projeto = String(dados.get('projeto') || '').trim()
    const texto = [
      MENSAGENS.orcamento,
      nome && `Nome: ${nome}`,
      whatsapp && `WhatsApp: ${whatsapp}`,
      email && `E-mail: ${email}`,
      tipo && `Tipo de obra: ${tipo}`,
      projeto && `Projeto: ${projeto}`,
    ].filter(Boolean).join('\n')
    openWhatsApp(texto)
  }

  const enviarDepoimento = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formDep.nome.trim() || !formDep.texto.trim()) return
    setEnviandoDep(true)
    setErroDep('')
    try {
      await axios.post(`${apiBaseUrl()}/depoimentos`, formDep)
      setDepEnviado(true)
      setFormDep({ nome: '', cidade: '', cargo: '', texto: '', estrelas: 5 })
    } catch {
      setErroDep('Não foi possível enviar agora. Tente novamente.')
    } finally {
      setEnviandoDep(false)
    }
  }

  const nome = config.empresa_nome || 'LJV Construção'
  const email = (config.contato_email || '').trim() || 'contato@ljvconstrucao.com.br'
  const enderecoBruto = (config.contato_endereco || '').trim()
  const endereco = enderecoBruto && enderecoBruto !== SEED_IGNORAR.contato_endereco ? enderecoBruto : ''
  const telefoneBruto = (config.contato_telefone || '').trim()
  const telefone = telefoneBruto && telefoneBruto !== SEED_IGNORAR.contato_telefone ? telefoneBruto : ''
  const instagram = (config.relatorio_instagram || config.contato_instagram || '').trim()
  const instagramHref = instagram
    ? (instagram.includes('http') ? instagram : `https://instagram.com/${instagram.replace(/^@/, '')}`)
    : ''
  const tresD = qualidade !== 'estatica'
  const ponto = HOTSPOTS.find(h => h.id === hotspot) ?? HOTSPOTS[0]

  const fecharMenu = () => setMenuAberto(false)

  return (
    <div className={`lp${pronta ? ' is-pronta' : ''}${fino ? ' is-cursor' : ''}${menuAberto ? ' is-menu' : ''}`} data-tier={qualidade} data-hero={heroOn ? '1' : '0'}>
      <a className="lp-skip" href="#conteudo">Ir ao conteúdo</a>
      {fino && <div ref={cursorRef} className="lp-cursor" aria-hidden="true" />}

      <header className={`lp-header${scrolled ? ' is-scrolled' : ''}${menuAberto ? ' is-aberto' : ''}`}>
        <div className="lp-header-row">
          <a href="#topo" className="lp-marca" aria-label={nome}><Marca nome={nome} src="/images/logo-ljv-nav.png" /></a>
          <nav className="lp-nav" aria-label="Seções">
            {NAV.map(item => <a key={item.href} href={item.href}>{item.label}</a>)}
          </nav>
          <div className="lp-header-fim">
            <Zap mensagem={MENSAGENS.orcamento} className="lp-btn lp-btn-header">Solicitar orçamento</Zap>
            <button
              type="button"
              className="lp-burger"
              aria-expanded={menuAberto}
              aria-controls="menu-mobile"
              onClick={() => setMenuAberto(v => !v)}
            >
              {menuAberto ? <X size={22} /> : <Menu size={22} />}
              <span className="lp-sr">{menuAberto ? 'Fechar menu' : 'Abrir menu'}</span>
            </button>
          </div>
        </div>
      </header>

      {menuAberto && (
        <nav id="menu-mobile" className="lp-menu" aria-label="Menu">
          <div className="lp-menu-lista">
            {NAV.map(item => <a key={item.href} href={item.href} onClick={fecharMenu}>{item.label}</a>)}
          </div>
          <div className="lp-menu-acoes">
            <Zap mensagem={MENSAGENS.orcamento} className="lp-btn" onClick={fecharMenu}>Solicitar orçamento</Zap>
            <Link to="/login" className="lp-admin" onClick={fecharMenu}><Lock size={14} /> Admin</Link>
          </div>
        </nav>
      )}

      <main id="conteudo">
        <section id="topo" ref={heroRef} className="lp-hero">
          <div className="lp-cena" data-estado={tresD && heroOn ? 'webgl' : 'plano'} aria-hidden="true">
            {tresD && heroOn ? (
              <LimiteCena fallback={<MaqueteEstatica />}>
                <Suspense fallback={<MaqueteEstatica />}>
                  <HeroCena
                    qualidade={qualidade}
                    compact={compact}
                    jaViu={jaViu}
                    onReady={() => setPronta(true)}
                    onTerminou={() => setJaViu(true)}
                  />
                </Suspense>
              </LimiteCena>
            ) : (
              <MaqueteEstatica />
            )}
          </div>
          {!reduzido && (
            <div className="lp-abre" aria-hidden="true">
              <span /><span /><span /><i />
            </div>
          )}
          <div className="lp-hero-copy">
            <p className="lp-kicker lp-surge lp-d1">LJV Construção</p>
            <p className="lp-olho lp-surge lp-d2">Construção · Planejamento · Execução</p>
            <h1 className="lp-surge lp-d3">Seu projeto começa aqui.</h1>
            <p className="lp-lead lp-surge lp-d4">Construção com planejamento, transparência e acompanhamento em cada etapa.</p>
            <div className="lp-acoes lp-surge lp-d5">
              <Zap mensagem={MENSAGENS.hero} className="lp-btn">Solicitar orçamento</Zap>
              <a className="lp-btn lp-btn-ghost" href="#sobre">Conhecer a LJV</a>
            </div>
            <p className="lp-nota lp-surge lp-d5">Maquete digital conceitual. Não representa uma obra da LJV.</p>
          </div>
          <a className="lp-rolar" href="#narrativa">Rolar</a>
        </section>

        <section id="narrativa" ref={trilhaRef} className="lp-trilha">
          <div className="lp-nar">
            <div className="lp-cena" aria-hidden="true">
              {tresD && narOn ? (
                <LimiteCena fallback={<div ref={estaticaNar}><MaqueteEstatica modo="narrativa" /></div>}>
                  <Suspense fallback={<div ref={estaticaNar}><MaqueteEstatica modo="narrativa" /></div>}>
                    <NarrativaCena qualidade={qualidade} compact={compact} progressoRef={prog} />
                  </Suspense>
                </LimiteCena>
              ) : (
                <div ref={estaticaNar}><MaqueteEstatica modo="narrativa" /></div>
              )}
            </div>
            <div className="lp-nar-copy">
              <p className="lp-kicker">Sequência</p>
              <h2>Do projeto à realidade.</h2>
              <p className="lp-fase" ref={faseNome}>Projeto</p>
              <p className="lp-fase-texto" ref={faseTexto}>Linhas, medidas e a intenção do volume.</p>
              <p className="lp-nota">Representação conceitual do processo. Não é uma obra executada pela LJV.</p>
            </div>
            <div className="lp-rail" aria-hidden="true"><span ref={railRef} /></div>
            <p className="lp-sr">A maquete conceitual evolui com a rolagem: projeto, planejamento, estrutura, execução e entrega.</p>
          </div>
        </section>

        <Ponte />

        <section id="sobre" className="lp-sobre">
          <div className="lp-sobre-linhas" aria-hidden="true" />
          <p className="lp-kicker">Sobre</p>
          <h2>Construir pode ser mais simples.</h2>
          <p className="lp-lead">A LJV CONSTRUÇÃO nasceu com um propósito simples: tornar o processo de construir mais organizado, transparente e próximo do cliente.</p>
          <p>Do planejamento à execução, cada etapa importa.</p>
        </section>

        <Ponte />

        <section id="servicos" className="lp-sec">
          <div className="lp-sec-topo">
            <p className="lp-kicker">Serviços</p>
            <h2>O que a LJV conduz.</h2>
          </div>
          <div className="lp-serv">
            <div className="lp-serv-lista" role="list">
              {SERVICOS.map((item, i) => (
                <button
                  key={item.n}
                  type="button"
                  role="listitem"
                  className={`lp-serv-item${servico === i ? ' is-ativo' : ''}`}
                  onMouseEnter={() => setServico(i)}
                  onFocus={() => setServico(i)}
                  aria-pressed={servico === i}
                >
                  <span>{item.n}</span>
                  <strong>{item.titulo}</strong>
                  <em>{item.texto}</em>
                </button>
              ))}
            </div>
            <div className="lp-serv-palco">
              <Desenho i={servico} />
              <p>Estudo visual. Não é um projeto executado.</p>
              <Zap mensagem={MENSAGENS.servicos} className="lp-btn lp-btn-ghost">Falar sobre os serviços</Zap>
            </div>
          </div>
        </section>

        <section id="maquete" ref={modeloRef} className="lp-modelo">
          <div className="lp-modelo-copy">
            <p className="lp-kicker">Maquete</p>
            <h2>Um volume para olhar de perto.</h2>
            <p className="lp-lead">Gire o estudo e percorra três camadas de uma construção. É um modelo conceitual, não uma obra da LJV.</p>
            <div className="lp-hots" role="list">
              {HOTSPOTS.map(item => (
                <button
                  key={item.id}
                  type="button"
                  className={`lp-hot${hotspot === item.id ? ' is-ativo' : ''}`}
                  aria-pressed={hotspot === item.id}
                  onClick={() => setHotspot(item.id)}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <p className="lp-hot-texto">{ponto.texto}</p>
            <p className="lp-hint-touch">Arraste para girar a maquete.</p>
          </div>
          <div className="lp-cena lp-cena-hit" data-cursor="3d" aria-hidden="true">
            {tresD && modeloOn ? (
              <LimiteCena fallback={<MaqueteEstatica />}>
                <Suspense fallback={<MaqueteEstatica />}>
                  <ModeloInterativo qualidade={qualidade} compact={compact} ativo={hotspot} onEscolher={setHotspot} />
                </Suspense>
              </LimiteCena>
            ) : (
              <MaqueteEstatica />
            )}
          </div>
        </section>

        <section className="lp-sec lp-dif">
          <div className="lp-sec-topo">
            <p className="lp-kicker">Jeito de trabalhar</p>
            <h2>Mais do que construir. Acompanhamos.</h2>
          </div>
          <ol className="lp-dif-lista">
            {DIFERENCIAIS.map(item => (
              <li key={item.n}>
                <span>{item.n}</span>
                <strong>{item.titulo}</strong>
                <p>{item.texto}</p>
              </li>
            ))}
          </ol>
          <p className="lp-nota">Os números organizam a leitura. Não são estatísticas.</p>
        </section>

        <section id="processo" className="lp-sec">
          <div className="lp-sec-topo">
            <p className="lp-kicker">Processo</p>
            <h2>Da conversa à entrega.</h2>
          </div>
          <ol ref={tempoRef} className="lp-tempo">
            {PROCESSO.map(item => (
              <li key={item.n} className="lp-step">
                <span>{item.n}</span>
                <strong>{item.titulo}</strong>
                <p>{item.texto}</p>
              </li>
            ))}
          </ol>
          <Zap mensagem={MENSAGENS.hero} className="lp-btn">Conversar sobre um projeto</Zap>
        </section>

        <section id="contato" className="lp-contato">
          <div>
            <p className="lp-kicker">Contato</p>
            <h2>Conte o projeto.</h2>
            <p className="lp-lead">A mensagem abre no WhatsApp da LJV, com o que você escrever abaixo.</p>
            <form className="lp-form" onSubmit={enviarOrcamento}>
              <label>Nome<input name="nome" autoComplete="name" required /></label>
              <label>WhatsApp<input name="whatsapp" inputMode="tel" autoComplete="tel" required onChange={e => { e.target.value = maskPhone(e.target.value) }} /></label>
              <label>E-mail<input name="email" type="email" autoComplete="email" /></label>
              <label>Tipo de obra<input name="tipo" placeholder="Residencial, comercial, reforma" /></label>
              <label className="lp-largo">Projeto<textarea name="projeto" rows={3} /></label>
              <button className="lp-btn" type="submit">Enviar pelo WhatsApp</button>
            </form>
          </div>
          <aside>
            <a href={linkWhatsApp(MENSAGENS.orcamento)} onClick={e => { e.preventDefault(); openWhatsApp(MENSAGENS.orcamento) }}>WhatsApp</a>
            <a href={`mailto:${email}`}>{email}</a>
            {telefone && <p>{telefone}</p>}
            {endereco && <p>{endereco}</p>}
            {instagramHref && <a href={instagramHref} target="_blank" rel="noopener noreferrer">Instagram</a>}
            {depoimentos.length > 0 && (
              <ul className="lp-quotes">
                {depoimentos.map(d => (
                  <li key={d.id}>
                    <p>“{d.texto}”</p>
                    <span>{d.nome}{d.cidade ? ` · ${d.cidade}` : ''}</span>
                  </li>
                ))}
              </ul>
            )}
            <button type="button" className="lp-texto" onClick={() => setDepAberto(v => !v)}>
              {depAberto ? 'Fechar depoimento' : 'Enviar um depoimento'}
            </button>
            {depAberto && (
              depEnviado ? <p>Depoimento recebido. Ele só aparece se for aprovado.</p> : (
                <form className="lp-form" onSubmit={enviarDepoimento}>
                  <label>Nome<input required value={formDep.nome} onChange={e => setFormDep(f => ({ ...f, nome: e.target.value }))} /></label>
                  <label>Cidade<input value={formDep.cidade} onChange={e => setFormDep(f => ({ ...f, cidade: e.target.value }))} /></label>
                  <label className="lp-largo">Obra ou cargo<input value={formDep.cargo} onChange={e => setFormDep(f => ({ ...f, cargo: e.target.value }))} /></label>
                  <label className="lp-largo">Depoimento<textarea required rows={3} value={formDep.texto} onChange={e => setFormDep(f => ({ ...f, texto: e.target.value }))} /></label>
                  <div className="lp-estrelas" role="group" aria-label="Estrelas">
                    {[1, 2, 3, 4, 5].map(n => (
                      <button key={n} type="button" onClick={() => setFormDep(f => ({ ...f, estrelas: n }))} aria-label={`${n} estrelas`}>
                        <Star size={16} className={n <= formDep.estrelas ? 'is-on' : ''} />
                      </button>
                    ))}
                  </div>
                  {erroDep && <p role="alert">{erroDep}</p>}
                  <button className="lp-btn lp-btn-ghost" type="submit" disabled={enviandoDep}>{enviandoDep ? 'Enviando…' : 'Enviar depoimento'}</button>
                </form>
              )
            )}
          </aside>
        </section>

        <section ref={ctaRef} className="lp-cta">
          <div className="lp-cena" aria-hidden="true">
            {tresD && ctaOn ? (
              <LimiteCena fallback={null}>
                <Suspense fallback={null}>
                  <CtaCena qualidade={qualidade} compact={compact} />
                </Suspense>
              </LimiteCena>
            ) : (
              <div className="lp-cta-linhas" />
            )}
          </div>
          <div className="lp-cta-copy">
            <h2>Tem um projeto em mente?</h2>
            <p>Vamos conversar sobre como transformar sua ideia em realidade.</p>
            <Zap
              mensagem={MENSAGENS.orcamento}
              className="lp-btn lp-btn-claro"
              onMouseEnter={() => { ponteiro.hoverCta = 1 }}
              onMouseLeave={() => { ponteiro.hoverCta = 0 }}
            >
              Falar com a LJV
            </Zap>
          </div>
        </section>
      </main>

      <footer className="lp-foot">
        <a href="#topo" aria-label={nome}><Marca nome={nome} /></a>
        <div>
          <strong>LJV Construção</strong>
          <p>Construindo com planejamento, transparência e compromisso.</p>
        </div>
        <div className="lp-foot-links">
          {NAV.map(item => <a key={item.href} href={item.href}>{item.label}</a>)}
          <a href={linkWhatsApp(MENSAGENS.orcamento)} onClick={e => { e.preventDefault(); openWhatsApp(MENSAGENS.orcamento) }}>WhatsApp</a>
          <a href={`mailto:${email}`}>{email}</a>
          <Link to="/login" className="lp-admin"><Lock size={12} /> Admin</Link>
        </div>
      </footer>

      <Zap mensagem={MENSAGENS.orcamento} className="lp-wa" >
        <IconeWhats />
        <span className="lp-sr">WhatsApp</span>
      </Zap>
      <div className="lp-dock">
        <Zap mensagem={MENSAGENS.orcamento} className="lp-btn">Falar com a LJV</Zap>
      </div>
    </div>
  )
}
