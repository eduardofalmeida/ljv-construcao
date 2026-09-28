import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight, Lock, Phone, Mail, MapPin, ChevronDown,
  Home, Building2, Hammer, Layers, PaintbrushIcon, ClipboardList,
  ShieldCheck, Clock3, Award, Users, Star, CheckCircle, Menu, X as XIcon,
  MessageSquarePlus, Send, ThumbsUp
} from 'lucide-react'
import axios from 'axios'
import { maskPhone } from '../utils/masks'

interface DepoimentoAPI {
  id: number
  nome: string
  cidade?: string
  cargo?: string
  texto: string
  estrelas: number
}

type Config = Record<string, string>

// ─── Hooks ────────────────────────────────────────────────────
function useReveal(threshold = 0.1) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const el = ref.current; if (!el) return
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect() } },
      { threshold }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [threshold])
  return { ref, visible }
}

function useCounter(end: number, duration = 1800, active = false) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    if (!active) return
    let t0: number | null = null
    const step = (ts: number) => {
      if (!t0) t0 = ts
      const p = Math.min((ts - t0) / duration, 1)
      const ease = 1 - Math.pow(1 - p, 3)
      setCount(Math.floor(ease * end))
      if (p < 1) requestAnimationFrame(step); else setCount(end)
    }
    requestAnimationFrame(step)
  }, [end, duration, active])
  return count
}

// ─── Logo ─────────────────────────────────────────────────────
function Logo({ white = true, logo, nome, slogan }: { white?: boolean; logo?: string; nome?: string; slogan?: string }) {
  const n = nome || 'LJV'
  const s = slogan || 'Construção'
  return (
    <div className="flex items-center gap-2.5 select-none">
      {logo ? (
        <img src={logo} alt={n} className="w-9 h-9 rounded-lg object-cover bg-white" />
      ) : (
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-black text-lg ${white ? 'bg-accent-400 text-stone-950' : 'bg-stone-950 text-accent-400'}`}>
          {n.charAt(0).toUpperCase()}
        </div>
      )}
      <div>
        <div className={`font-black text-base leading-none tracking-tight ${white ? 'text-white' : 'text-stone-950'}`}>{n}</div>
        <div className={`text-[9px] uppercase tracking-[0.2em] leading-none mt-0.5 ${white ? 'text-stone-400' : 'text-stone-500'}`}>{s}</div>
      </div>
    </div>
  )
}

// ─── Counter animado ──────────────────────────────────────────
function StatNumber({ value, suffix, label, active }: { value: number; suffix?: string; label: string; active: boolean }) {
  const n = useCounter(value, 2000, active)
  return (
    <div className="text-center px-4">
      <div className="text-4xl md:text-5xl font-black text-white tabular-nums leading-none">
        {n}<span className="text-accent-400">{suffix}</span>
      </div>
      <div className="text-stone-400 text-sm mt-3 font-medium leading-snug">{label}</div>
    </div>
  )
}

// ─── Dados estáticos ──────────────────────────────────────────
const SERVICOS = [
  { icon: Home, titulo: 'Construção Residencial', desc: 'Casas e sobrados do zero, com projeto personalizado, materiais de qualidade e entrega no prazo garantida.', cor: 'bg-blue-500' },
  { icon: Building2, titulo: 'Obras Comerciais', desc: 'Escritórios, lojas, clínicas e galpões. Espaços funcionais que valorizam a identidade do seu negócio.', cor: 'bg-violet-500' },
  { icon: Hammer, titulo: 'Reformas & Renovações', desc: 'Ampliação, remodelação ou modernização. Transformamos qualquer espaço com planejamento e acabamento impecável.', cor: 'bg-accent-500' },
  { icon: Layers, titulo: 'Fundações & Estruturas', desc: 'Alvenaria estrutural, concreto armado e fundações seguras. A base certa para cada tipo de construção.', cor: 'bg-emerald-600' },
  { icon: PaintbrushIcon, titulo: 'Acabamento & Pintura', desc: 'Revestimentos, pisos, pintura e detalhes que fazem a diferença. Entregamos espaços prontos para morar.', cor: 'bg-rose-500' },
  { icon: ClipboardList, titulo: 'Gestão de Obras', desc: 'Gerenciamento completo: orçamento, cronograma, equipe e relatórios semanais. Você acompanha tudo.', cor: 'bg-orange-500' },
]

const DIFERENCIAIS = [
  {
    icon: ShieldCheck,
    titulo: 'Licenciada e Segurada',
    desc: 'Empresa registrada no CREA com todas as documentações em dia, seguro de responsabilidade civil e garantia em escritura.',
  },
  {
    icon: Clock3,
    titulo: 'Prazo Cumprido',
    desc: 'Cronograma detalhado desde o primeiro dia. Multa contratual em caso de atraso — porque seu tempo tem valor.',
  },
  {
    icon: Award,
    titulo: 'Qualidade Documentada',
    desc: 'Relatórios semanais com fotos, ART emitida por engenheiro responsável e vistoria final com laudo técnico.',
  },
]

const PROCESSO = [
  { n: '01', titulo: 'Visita e Diagnóstico', desc: 'Nossa equipe visita o local sem custo. Analisamos o terreno, a planta e entendemos exatamente o que você precisa.' },
  { n: '02', titulo: 'Proposta Detalhada', desc: 'Orçamento claro e transparente: mão de obra, materiais, cronograma e condições de pagamento sem letras miúdas.' },
  { n: '03', titulo: 'Execução com Supervisão', desc: 'Equipe própria treinada, mestre de obras presencial e engenheiro responsável. Você recebe atualizações semanais.' },
  { n: '04', titulo: 'Entrega com Garantia', desc: 'Vistoria final completa, manual da obra entregue e garantia de 5 anos na estrutura, documentada em contrato.' },
]

const DEPOIMENTOS_FALLBACK = [
  { id: 0, nome: 'Carlos Mendes', cidade: 'São Paulo, SP', cargo: 'Proprietário', texto: 'Construímos nossa casa com a LJV e foi uma experiência incrível. Cumpriram cada prazo, o acabamento foi perfeito e sempre estavam disponíveis para tirar dúvidas. Recomendo com os olhos fechados.', estrelas: 5 },
  { id: 0, nome: 'Ana Paula Ribeiro', cidade: 'Santo André, SP', cargo: 'Clínica médica', texto: 'Fizemos uma reforma completa na nossa clínica. Profissionalismo do começo ao fim — obra limpa, comunicação excelente e o resultado ficou muito acima do esperado.', estrelas: 5 },
  { id: 0, nome: 'Roberto Silva', cidade: 'São Bernardo, SP', cargo: 'Empresário', texto: 'Já é a segunda obra com a LJV. A primeira foi um galpão e agora uma residência. Equipe séria, preço justo e entrega garantida. Empresa de confiança de verdade.', estrelas: 5 },
]

// ─── Componentes utilitários ──────────────────────────────────
function SectionTag({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 text-xs font-bold text-accent-500 uppercase tracking-[0.2em]">
      <span className="w-6 h-px bg-accent-500" />{children}
    </span>
  )
}

// ─── Página principal ─────────────────────────────────────────
export default function LandingPage() {
  const [config, setConfig] = useState<Config>({})
  const [menuAberto, setMenuAberto] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [depoimentos, setDepoimentos] = useState<DepoimentoAPI[]>([])
  const [formDep, setFormDep] = useState({ nome: '', cidade: '', cargo: '', texto: '', estrelas: 5 })
  const [enviandoDep, setEnviandoDep] = useState(false)
  const [depEnviado, setDepEnviado] = useState(false)
  const [mostrarFormDep, setMostrarFormDep] = useState(false)

  useEffect(() => {
    axios.get('/api/config/site').then(r => setConfig(r.data)).catch(() => {})
    axios.get('/api/depoimentos/aprovados')
      .then(r => setDepoimentos(r.data))
      .catch(() => setDepoimentos([]))
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const enviarDepoimento = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formDep.nome.trim() || !formDep.texto.trim()) return
    setEnviandoDep(true)
    try {
      await axios.post('/api/depoimentos', formDep)
      setDepEnviado(true)
      setFormDep({ nome: '', cidade: '', cargo: '', texto: '', estrelas: 5 })
    } catch {
      alert('Erro ao enviar. Tente novamente.')
    } finally {
      setEnviandoDep(false)
    }
  }

  const listaDepoimentos = depoimentos.length > 0 ? depoimentos : DEPOIMENTOS_FALLBACK

  const c = (k: string, fb: string) => config[k] || fb

  const statsRef    = useReveal(0.2)
  const servicosRef = useReveal(0.08)
  const difRef      = useReveal(0.08)
  const processoRef = useReveal(0.08)
  const depRef      = useReveal(0.08)
  const ctaRef      = useReveal(0.15)
  const contatoRef  = useReveal(0.08)

  const navLinks = [
    { href: '#servicos', label: 'Serviços' },
    { href: '#diferenciais', label: 'Por que nós' },
    { href: '#processo', label: 'Como funciona' },
    { href: '#depoimentos', label: 'Depoimentos' },
    { href: '#contato', label: 'Contato' },
  ]

  return (
    <div className="bg-stone-50 text-stone-900 overflow-x-hidden selection:bg-accent-300/40">

      {/* ── NAV ───────────────────────────────────────────────── */}
      <nav className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-stone-950/98 backdrop-blur-md shadow-xl shadow-black/30' : 'bg-transparent'
      }`}>
        <div className="max-w-6xl mx-auto px-6 md:px-10 h-16 flex items-center justify-between">
          <Logo white logo={config.empresa_logo} nome={c('empresa_nome', 'LJV')} slogan={c('empresa_slogan', 'Construção')} />

          {/* Links desktop */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map(l => (
              <a key={l.href} href={l.href}
                className="text-sm text-stone-400 hover:text-white font-medium transition-colors">
                {l.label}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <a href="#contato"
              className="text-sm font-bold text-stone-950 bg-accent-400 hover:bg-accent-300 px-5 py-2.5 rounded-xl transition-all hover:scale-105 active:scale-95 shadow-lg shadow-accent-900/20">
              Solicitar orçamento
            </a>
            {/* Menu mobile */}
            <button onClick={() => setMenuAberto(!menuAberto)}
              className="md:hidden p-2 text-stone-400 hover:text-white transition-colors">
              {menuAberto ? <XIcon size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {menuAberto && (
          <div className="md:hidden bg-stone-950 border-t border-white/5 px-6 py-4 space-y-1">
            {navLinks.map(l => (
              <a key={l.href} href={l.href} onClick={() => setMenuAberto(false)}
                className="block py-3 text-stone-400 hover:text-white font-medium transition-colors border-b border-white/5 last:border-0">
                {l.label}
              </a>
            ))}
          </div>
        )}
      </nav>

      {/* ── HERO ──────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex flex-col justify-center bg-stone-950 pt-16 overflow-hidden">
        {/* Pattern blueprint */}
        <div className="absolute inset-0 opacity-[0.035]"
          style={{ backgroundImage: 'repeating-linear-gradient(0deg,#fff 0,#fff 1px,transparent 1px,transparent 60px),repeating-linear-gradient(90deg,#fff 0,#fff 1px,transparent 1px,transparent 60px)' }} />

        {/* Gradientes de luz */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full opacity-10 blur-[120px] pointer-events-none"
          style={{ background: 'radial-gradient(circle,#d4891a,transparent 70%)' }} />
        <div className="absolute bottom-0 left-0 w-[500px] h-[400px] rounded-full opacity-5 blur-[100px] pointer-events-none"
          style={{ background: 'radial-gradient(circle,#fff,transparent 70%)' }} />

        {/* Barra lateral decorativa */}
        <div className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-gradient-to-b from-transparent via-accent-400 to-transparent opacity-60" />

        <div className="max-w-6xl mx-auto w-full px-6 md:px-10 py-24">
          {/* Tag */}
          <div className="inline-flex items-center gap-2.5 border border-white/10 bg-white/5 rounded-full px-4 py-2 mb-10
            animate-fade-in">
            <span className="w-2 h-2 rounded-full bg-accent-400 animate-pulse" />
            <span className="text-xs text-stone-400 font-semibold tracking-widest uppercase">
              {c('hero_tag', 'Empresa de construção civil — Desde 2014')}
            </span>
          </div>

          {/* Título principal */}
          <h1 className="font-black leading-[0.88] tracking-tight text-white
            text-[clamp(3.2rem,10vw,8.5rem)]
            animate-fade-in [animation-delay:120ms] [animation-fill-mode:both]">
            <span className="block">{c('hero_linha1', 'Construção')}</span>
            <span className="block" style={{ WebkitTextStroke: '1px rgba(255,255,255,0.25)', color: 'transparent' }}>
              {c('hero_linha2', 'de Excelência')}
            </span>
            <span className="block text-accent-400">{c('hero_linha3', 'com Garantia.')}</span>
          </h1>

          {/* Subtítulo */}
          <p className="mt-10 text-stone-400 text-lg md:text-xl leading-relaxed max-w-xl
            animate-fade-in [animation-delay:280ms] [animation-fill-mode:both]">
            {c('hero_sub', 'Do projeto ao acabamento, entregamos obras residenciais e comerciais com rigor técnico, prazo cumprido e transparência em cada etapa.')}
          </p>

          {/* CTAs */}
          <div className="mt-12 flex flex-col sm:flex-row gap-4
            animate-fade-in [animation-delay:400ms] [animation-fill-mode:both]">
            <a href="#contato"
              className="inline-flex items-center justify-center gap-2.5 bg-accent-400 hover:bg-accent-300
                text-stone-950 font-black px-8 py-4 rounded-xl text-sm transition-all hover:scale-105 active:scale-95
                shadow-2xl shadow-accent-900/30">
              Solicitar orçamento grátis <ArrowRight size={16} />
            </a>
            <a href="#servicos"
              className="inline-flex items-center justify-center gap-2.5 border border-white/15 text-white
                font-semibold px-8 py-4 rounded-xl text-sm transition-all hover:bg-white/5 active:scale-95">
              Ver nossos serviços
            </a>
          </div>

          {/* Badges de confiança */}
          <div className="mt-16 flex flex-wrap gap-4
            animate-fade-in [animation-delay:550ms] [animation-fill-mode:both]">
            {['✓ Empresa registrada no CREA', '✓ Seguro de responsabilidade civil', '✓ Garantia de 5 anos', '✓ Orçamento sem compromisso'].map(b => (
              <span key={b} className="text-xs text-stone-500 font-medium flex items-center gap-1">{b}</span>
            ))}
          </div>
        </div>

        {/* Scroll hint */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-stone-600 animate-bounce [animation-duration:2.5s]">
          <span className="text-[10px] uppercase tracking-widest font-medium">Saiba mais</span>
          <ChevronDown size={15} />
        </div>
      </section>

      {/* ── STATS ─────────────────────────────────────────────── */}
      <div ref={statsRef.ref}>
        <section className="bg-stone-950 border-t border-white/5">
          <div className={`max-w-6xl mx-auto px-6 md:px-10 py-16 transition-all duration-700
            ${statsRef.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-0 md:divide-x md:divide-white/8">
              {[
                { v: Number(c('stat_obras','240')), s:'+', l: 'Obras entregues' },
                { v: Number(c('stat_anos','11')), s:'', l: 'Anos de experiência' },
                { v: Number(c('stat_clientes','98')), s:'%', l: 'Clientes satisfeitos' },
                { v: Number(c('stat_equipe','60')), s:'+', l: 'Profissionais na equipe' },
              ].map((st, i) => (
                <div key={i} className="md:px-10 first:pl-0 last:pr-0">
                  <StatNumber value={st.v} suffix={st.s} label={st.l} active={statsRef.visible} />
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>

      {/* ── DIFERENCIAIS ─────────────────────────────────────── */}
      <div ref={difRef.ref} id="diferenciais">
        <section className="py-24 px-6 md:px-10 bg-white">
          <div className="max-w-6xl mx-auto">
            <div className={`mb-14 transition-all duration-600 ${difRef.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
              <SectionTag>Por que nos escolher</SectionTag>
              <h2 className="text-3xl md:text-5xl font-black text-stone-900 mt-5 leading-tight">
                Uma empresa que você<br className="hidden md:block" /> pode confiar
              </h2>
              <p className="text-stone-500 mt-4 max-w-xl text-base leading-relaxed">
                Somos uma construtora que preza pela seriedade, documentação e comunicação em cada obra.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {DIFERENCIAIS.map((d, i) => (
                <div
                  key={d.titulo}
                  className={`rounded-2xl border border-stone-100 p-8 hover:border-accent-200 hover:shadow-lg transition-all duration-500 group
                    ${difRef.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                  style={{ transitionDelay: `${i * 100}ms` }}
                >
                  <div className="w-12 h-12 rounded-2xl bg-accent-50 flex items-center justify-center mb-6 group-hover:bg-accent-100 transition-colors">
                    <d.icon size={22} className="text-accent-600" />
                  </div>
                  <h3 className="text-lg font-black text-stone-900 mb-3">{d.titulo}</h3>
                  <p className="text-stone-500 text-sm leading-relaxed">{d.desc}</p>
                </div>
              ))}
            </div>

            {/* Faixa de credenciais */}
            <div className="mt-12 rounded-2xl bg-stone-950 px-8 py-6 flex flex-col md:flex-row items-center justify-between gap-6">
              {[
                { icon: ShieldCheck, text: 'CREA/SP Registrado' },
                { icon: Award, text: 'ISO 9001 — Qualidade' },
                { icon: Users, text: '+240 obras concluídas' },
                { icon: CheckCircle, text: 'Garantia em contrato' },
              ].map(item => (
                <div key={item.text} className="flex items-center gap-3">
                  <item.icon size={18} className="text-accent-400 flex-shrink-0" />
                  <span className="text-white font-semibold text-sm">{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>

      {/* ── SERVIÇOS ──────────────────────────────────────────── */}
      <div ref={servicosRef.ref} id="servicos">
        <section className="py-24 px-6 md:px-10 bg-stone-50">
          <div className="max-w-6xl mx-auto">
            <div className={`mb-14 transition-all duration-600 ${servicosRef.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
              <SectionTag>O que fazemos</SectionTag>
              <h2 className="text-3xl md:text-5xl font-black text-stone-900 mt-5 leading-tight">
                Soluções completas em<br className="hidden md:block" /> construção civil
              </h2>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {SERVICOS.map((s, i) => (
                <div
                  key={s.titulo}
                  className={`bg-white rounded-2xl p-7 border border-stone-100 hover:border-stone-200 hover:shadow-xl transition-all duration-500 group cursor-default
                    ${servicosRef.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                  style={{ transitionDelay: `${i * 80}ms` }}
                >
                  <div className={`w-11 h-11 rounded-xl ${s.cor} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform`}>
                    <s.icon size={20} className="text-white" />
                  </div>
                  <h3 className="text-base font-black text-stone-900 mb-2.5">{s.titulo}</h3>
                  <p className="text-stone-500 text-sm leading-relaxed">{s.desc}</p>
                  <div className="mt-5 flex items-center gap-1.5 text-xs font-bold text-accent-600 group-hover:gap-2.5 transition-all">
                    Saiba mais <ArrowRight size={13} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>

      {/* ── PROCESSO ──────────────────────────────────────────── */}
      <div ref={processoRef.ref} id="processo">
        <section className="py-24 px-6 md:px-10 bg-stone-950 relative overflow-hidden">
          {/* Decoração */}
          <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-5"
            style={{ background: 'linear-gradient(to left,#d4891a,transparent)' }} />

          <div className="max-w-6xl mx-auto relative">
            <div className={`mb-16 transition-all duration-600 ${processoRef.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
              <SectionTag>Como funciona</SectionTag>
              <h2 className="text-3xl md:text-5xl font-black text-white mt-5 leading-tight">
                Do primeiro contato<br className="hidden md:block" /> à entrega das chaves
              </h2>
            </div>

            <div className="grid md:grid-cols-2 gap-5">
              {PROCESSO.map((p, i) => (
                <div
                  key={p.n}
                  className={`relative border border-white/8 rounded-2xl p-8 hover:border-accent-400/30 hover:bg-white/3 transition-all duration-500 group
                    ${processoRef.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                  style={{ transitionDelay: `${i * 100}ms` }}
                >
                  <div className="flex items-start gap-5">
                    <span className="text-5xl font-black text-stone-800 group-hover:text-accent-400/60 transition-colors leading-none flex-shrink-0 select-none">
                      {p.n}
                    </span>
                    <div>
                      <h3 className="text-lg font-black text-white mb-2">{p.titulo}</h3>
                      <p className="text-stone-500 text-sm leading-relaxed">{p.desc}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* CTA interno */}
            <div className={`mt-12 text-center transition-all duration-700 [transition-delay:400ms]
              ${processoRef.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
              <a href="#contato"
                className="inline-flex items-center gap-2.5 bg-accent-400 hover:bg-accent-300 text-stone-950 font-black px-8 py-4 rounded-xl text-sm transition-all hover:scale-105">
                Comece agora — é grátis <ArrowRight size={16} />
              </a>
            </div>
          </div>
        </section>
      </div>

      {/* ── DEPOIMENTOS ───────────────────────────────────────── */}
      <div ref={depRef.ref} id="depoimentos">
        <section className="py-24 px-6 md:px-10 bg-white">
          <div className="max-w-6xl mx-auto">
            <div className={`mb-14 transition-all duration-600 ${depRef.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
              <SectionTag>Depoimentos reais</SectionTag>
              <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mt-5">
                <h2 className="text-3xl md:text-5xl font-black text-stone-900 leading-tight">
                  O que nossos clientes<br className="hidden md:block" /> dizem sobre nós
                </h2>
                <button
                  onClick={() => setMostrarFormDep(!mostrarFormDep)}
                  className="flex-shrink-0 inline-flex items-center gap-2 border-2 border-stone-200 hover:border-accent-400 text-stone-700 hover:text-accent-600 font-semibold px-5 py-2.5 rounded-xl text-sm transition-all"
                >
                  <MessageSquarePlus size={16} />
                  {mostrarFormDep ? 'Fechar' : 'Deixar depoimento'}
                </button>
              </div>
            </div>

            {/* Cards de depoimentos */}
            <div className="grid md:grid-cols-3 gap-6">
              {listaDepoimentos.map((d, i) => (
                <div
                  key={`${d.id}-${i}`}
                  className={`bg-stone-50 border border-stone-100 rounded-2xl p-7 hover:shadow-lg hover:border-stone-200 transition-all duration-500
                    ${depRef.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                  style={{ transitionDelay: `${i * 100}ms` }}
                >
                  {/* Estrelas */}
                  <div className="flex gap-1 mb-4">
                    {Array.from({ length: d.estrelas }).map((_, j) => (
                      <Star key={j} size={14} className="fill-accent-400 text-accent-400" />
                    ))}
                    {Array.from({ length: 5 - d.estrelas }).map((_, j) => (
                      <Star key={j} size={14} className="text-stone-300" />
                    ))}
                  </div>
                  {/* Texto */}
                  <p className="text-stone-700 text-sm leading-relaxed mb-6 line-clamp-5">
                    "{d.texto}"
                  </p>
                  {/* Autor */}
                  <div className="flex items-center gap-3 pt-5 border-t border-stone-200">
                    <div className="w-9 h-9 rounded-full bg-stone-900 flex items-center justify-center flex-shrink-0">
                      <span className="text-accent-400 font-black text-xs">
                        {d.nome.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-stone-900 text-sm truncate">{d.nome}</div>
                      <div className="text-xs text-stone-400 flex items-center gap-1">
                        {d.cidade && <><MapPin size={10} className="flex-shrink-0" /><span className="truncate">{d.cidade}</span></>}
                        {d.cargo && <><span className="text-stone-300 mx-1">·</span><span className="truncate">{d.cargo}</span></>}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Formulário de depoimento */}
            {mostrarFormDep && (
              <div className="mt-12 border-t border-stone-100 pt-12">
                <div className="max-w-2xl mx-auto">
                  <div className="text-center mb-8">
                    <h3 className="text-2xl font-black text-stone-900">Compartilhe sua experiência</h3>
                    <p className="text-stone-500 text-sm mt-2">
                      Seu depoimento será analisado pela equipe antes de aparecer no site.
                    </p>
                  </div>

                  {depEnviado ? (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-10 text-center">
                      <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <ThumbsUp size={28} className="text-emerald-600" />
                      </div>
                      <h4 className="text-xl font-black text-emerald-800 mb-2">Obrigado pelo depoimento!</h4>
                      <p className="text-emerald-700 text-sm leading-relaxed">
                        Recebemos sua avaliação. Nossa equipe irá analisá-la e, se aprovada, ela aparecerá aqui em breve.
                      </p>
                      <button
                        onClick={() => { setDepEnviado(false); setMostrarFormDep(false) }}
                        className="mt-6 text-sm font-semibold text-emerald-700 hover:text-emerald-900 underline underline-offset-2 transition-colors"
                      >
                        Fechar
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={enviarDepoimento} className="bg-stone-50 border border-stone-200 rounded-2xl p-7 space-y-4">
                      {/* Nome + Cidade */}
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs font-bold text-stone-500 uppercase tracking-wider block mb-2">
                            Seu nome *
                          </label>
                          <input
                            type="text" required
                            placeholder="Nome completo"
                            className="input"
                            value={formDep.nome}
                            onChange={e => setFormDep(f => ({ ...f, nome: e.target.value }))}
                          />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-stone-500 uppercase tracking-wider block mb-2">
                            Cidade / Estado
                          </label>
                          <input
                            type="text"
                            placeholder="Ex: São Paulo, SP"
                            className="input"
                            value={formDep.cidade}
                            onChange={e => setFormDep(f => ({ ...f, cidade: e.target.value }))}
                          />
                        </div>
                      </div>

                      {/* Cargo / Contexto */}
                      <div>
                        <label className="text-xs font-bold text-stone-500 uppercase tracking-wider block mb-2">
                          Contexto da obra
                        </label>
                        <input
                          type="text"
                          placeholder="Ex: Proprietário de residência, Dono de empresa..."
                          className="input"
                          value={formDep.cargo}
                          onChange={e => setFormDep(f => ({ ...f, cargo: e.target.value }))}
                        />
                      </div>

                      {/* Avaliação (estrelas) */}
                      <div>
                        <label className="text-xs font-bold text-stone-500 uppercase tracking-wider block mb-2">
                          Avaliação
                        </label>
                        <div className="flex gap-2">
                          {[1, 2, 3, 4, 5].map(n => (
                            <button
                              key={n} type="button"
                              onClick={() => setFormDep(f => ({ ...f, estrelas: n }))}
                              className="p-1 transition-transform hover:scale-125"
                            >
                              <Star
                                size={28}
                                className={n <= formDep.estrelas
                                  ? 'fill-accent-400 text-accent-400'
                                  : 'text-stone-300 hover:text-stone-400'
                                }
                              />
                            </button>
                          ))}
                          <span className="text-sm text-stone-500 self-center ml-2 font-semibold">
                            {['', 'Ruim', 'Regular', 'Bom', 'Ótimo', 'Excelente!'][formDep.estrelas]}
                          </span>
                        </div>
                      </div>

                      {/* Depoimento */}
                      <div>
                        <label className="text-xs font-bold text-stone-500 uppercase tracking-wider block mb-2">
                          Seu depoimento *
                        </label>
                        <textarea
                          required rows={4}
                          placeholder="Conte como foi a sua experiência com a LJV Construção: o serviço contratado, o atendimento, a qualidade da obra..."
                          className="input resize-none"
                          value={formDep.texto}
                          onChange={e => setFormDep(f => ({ ...f, texto: e.target.value }))}
                        />
                        <div className="text-xs text-stone-400 mt-1 text-right">{formDep.texto.length} caracteres</div>
                      </div>

                      {/* Aviso de privacidade */}
                      <p className="text-xs text-stone-400 bg-stone-100 rounded-xl px-4 py-3 leading-relaxed">
                        🔒 Seus dados são usados apenas para identificação no depoimento. Não compartilhamos informações com terceiros. O depoimento passará por análise antes de ser publicado.
                      </p>

                      <div className="flex gap-3 pt-2">
                        <button
                          type="button"
                          onClick={() => setMostrarFormDep(false)}
                          className="flex-1 btn-outline"
                        >
                          Cancelar
                        </button>
                        <button
                          type="submit"
                          disabled={enviandoDep || !formDep.nome.trim() || !formDep.texto.trim()}
                          className="flex-1 inline-flex items-center justify-center gap-2 bg-stone-900 hover:bg-stone-950 text-white font-bold py-3 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {enviandoDep
                            ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            : <Send size={16} />
                          }
                          {enviandoDep ? 'Enviando...' : 'Enviar depoimento'}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* ── CTA FINAL ─────────────────────────────────────────── */}
      <div ref={ctaRef.ref}>
        <section className="relative py-24 px-6 md:px-10 bg-accent-400 overflow-hidden">
          <div className="absolute inset-0 opacity-[0.06]"
            style={{ backgroundImage: 'repeating-linear-gradient(45deg,#000 0,#000 1px,transparent 1px,transparent 20px)' }} />
          <div className={`max-w-3xl mx-auto text-center relative transition-all duration-700
            ${ctaRef.visible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
            <SectionTag>Pronto para construir?</SectionTag>
            <h2 className="text-4xl md:text-6xl font-black text-stone-950 mt-6 leading-tight">
              {c('cta_titulo', 'Seu projeto começa com uma conversa')}
            </h2>
            <p className="mt-5 text-stone-800 text-lg max-w-xl mx-auto leading-relaxed">
              Fale com nossa equipe hoje mesmo. Orçamento detalhado, sem compromisso e sem enrolação.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
              <a href="#contato"
                className="inline-flex items-center justify-center gap-2.5 bg-stone-950 hover:bg-stone-900 text-white
                  font-black px-8 py-4 rounded-xl transition-all hover:scale-105 active:scale-95 shadow-xl">
                Solicitar orçamento grátis <ArrowRight size={16} />
              </a>
              <a href={`tel:${c('contato_telefone','(11) 9 9999-9999')}`}
                className="inline-flex items-center justify-center gap-2.5 border-2 border-stone-950/20 text-stone-950
                  font-bold px-8 py-4 rounded-xl transition-all hover:bg-stone-950/5 active:scale-95">
                <Phone size={16} /> Ligar agora
              </a>
            </div>
          </div>
        </section>
      </div>

      {/* ── CONTATO ───────────────────────────────────────────── */}
      <div ref={contatoRef.ref} id="contato">
        <section className="py-24 px-6 md:px-10 bg-stone-950">
          <div className="max-w-6xl mx-auto">
            <div className={`mb-14 transition-all duration-600 ${contatoRef.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
              <SectionTag>Entre em contato</SectionTag>
              <h2 className="text-3xl md:text-5xl font-black text-white mt-5 leading-tight">
                Vamos conversar sobre<br className="hidden md:block" /> o seu projeto
              </h2>
            </div>

            <div className={`grid md:grid-cols-5 gap-12 transition-all duration-700 ${contatoRef.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
              {/* Informações — 2/5 */}
              <div className="md:col-span-2 space-y-6">
                {[
                  {
                    icon: Phone,
                    label: 'Telefone / WhatsApp',
                    value: c('contato_telefone', '(11) 9 9999-9999'),
                    href: `tel:${c('contato_telefone', '11999999999')}`,
                  },
                  {
                    icon: Mail,
                    label: 'E-mail',
                    value: c('contato_email', 'contato@ljvconstrucao.com.br'),
                    href: `mailto:${c('contato_email', 'contato@ljvconstrucao.com.br')}`,
                  },
                  {
                    icon: MapPin,
                    label: 'Localização',
                    value: c('contato_endereco', 'São Paulo, SP — Brasil'),
                    href: undefined,
                  },
                ].map(item => (
                  <div key={item.label} className="flex items-start gap-4 group">
                    <div className="w-11 h-11 rounded-xl bg-white/5 group-hover:bg-accent-400/10 flex items-center justify-center flex-shrink-0 transition-colors">
                      <item.icon size={18} className="text-stone-400 group-hover:text-accent-400 transition-colors" />
                    </div>
                    <div>
                      <div className="text-xs text-stone-600 font-semibold uppercase tracking-wider mb-1">{item.label}</div>
                      {item.href
                        ? <a href={item.href} className="font-bold text-white hover:text-accent-400 transition-colors">{item.value}</a>
                        : <div className="font-bold text-white">{item.value}</div>
                      }
                    </div>
                  </div>
                ))}

                {/* Horário */}
                <div className="mt-8 border-t border-white/8 pt-8">
                  <div className="text-xs text-stone-600 font-semibold uppercase tracking-wider mb-3">Horário de atendimento</div>
                  <div className="space-y-1.5 text-sm">
                    <div className="flex justify-between text-stone-300">
                      <span>Segunda a sexta</span><span className="font-bold text-white">08h às 18h</span>
                    </div>
                    <div className="flex justify-between text-stone-300">
                      <span>Sábado</span><span className="font-bold text-white">08h às 12h</span>
                    </div>
                    <div className="flex justify-between text-stone-500">
                      <span>Domingo</span><span>Fechado</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Formulário — 3/5 */}
              <form
                onSubmit={e => { e.preventDefault(); alert('Mensagem enviada! Nossa equipe entrará em contato em breve.') }}
                className="md:col-span-3 space-y-4"
              >
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-stone-500 uppercase tracking-wider block mb-2">Nome completo *</label>
                    <input required type="text" placeholder="Seu nome" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-stone-600 text-sm focus:outline-none focus:border-accent-400/50 focus:bg-white/8 transition-all" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-stone-500 uppercase tracking-wider block mb-2">WhatsApp *</label>
                    <input type="tel" placeholder="(00) 0 0000-0000" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-stone-600 text-sm focus:outline-none focus:border-accent-400/50 focus:bg-white/8 transition-all"
                      onChange={e => { e.target.value = maskPhone(e.target.value) }} />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-stone-500 uppercase tracking-wider block mb-2">E-mail</label>
                  <input type="email" placeholder="seu@email.com" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-stone-600 text-sm focus:outline-none focus:border-accent-400/50 focus:bg-white/8 transition-all" />
                </div>
                <div>
                  <label className="text-xs font-bold text-stone-500 uppercase tracking-wider block mb-2">Tipo de obra</label>
                  <select className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-stone-400 text-sm focus:outline-none focus:border-accent-400/50 transition-all appearance-none">
                    <option value="">Selecione o tipo de projeto</option>
                    <option>Construção residencial</option>
                    <option>Construção comercial</option>
                    <option>Reforma / Renovação</option>
                    <option>Fundação e estrutura</option>
                    <option>Acabamento e pintura</option>
                    <option>Outro</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-stone-500 uppercase tracking-wider block mb-2">Descreva seu projeto *</label>
                  <textarea required rows={4} placeholder="Conte-nos sobre sua obra: localização, tamanho aproximado, prazo desejado e o que você espera da LJV..." className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-stone-600 text-sm focus:outline-none focus:border-accent-400/50 focus:bg-white/8 transition-all resize-none" />
                </div>
                <button type="submit"
                  className="w-full inline-flex items-center justify-center gap-2.5 bg-accent-400 hover:bg-accent-300 text-stone-950 font-black py-4 rounded-xl text-sm transition-all hover:scale-[1.01] active:scale-95 shadow-lg shadow-accent-900/20">
                  Enviar mensagem — orçamento gratuito <ArrowRight size={16} />
                </button>
                <p className="text-center text-stone-600 text-xs">
                  Respondemos em até 24 horas. Seus dados são protegidos.
                </p>
              </form>
            </div>
          </div>
        </section>
      </div>

      {/* ── FOOTER ────────────────────────────────────────────── */}
      <footer className="bg-stone-950 border-t border-white/5 py-10 px-6 md:px-10">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex flex-col items-center md:items-start gap-2">
              <Logo white logo={config.empresa_logo} nome={c('empresa_nome', 'LJV')} slogan={c('empresa_slogan', 'Construção')} />
              <p className="text-stone-600 text-xs">
                {c('rodape_copy', '© 2024 LJV Construção. Todos os direitos reservados.')}
              </p>
            </div>
            <div className="flex flex-wrap gap-6 justify-center">
              {navLinks.map(l => (
                <a key={l.href} href={l.href} className="text-stone-600 hover:text-stone-400 text-xs font-medium transition-colors">
                  {l.label}
                </a>
              ))}
            </div>
            <Link to="/login" className="text-stone-800 hover:text-stone-600 transition-colors" aria-label="Acesso administrativo">
              <Lock size={13} />
            </Link>
          </div>
          <div className="mt-8 pt-6 border-t border-white/5 text-center text-stone-700 text-xs">
            Empresa registrada no CREA/SP · Obras com ART · Seguro de responsabilidade civil ativo
          </div>
        </div>
      </footer>
    </div>
  )
}
