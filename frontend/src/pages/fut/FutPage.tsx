import { useEffect } from 'react'
import { CampoFundo } from '../../fut/components/CampoFundo'
import { DialogoRachao } from '../../fut/components/DialogoRachao'
import { Passos } from '../../fut/components/Passos'
import { TelaAvaliacao } from '../../fut/components/TelaAvaliacao'
import { TelaConfig } from '../../fut/components/TelaConfig'
import { TelaJogadores } from '../../fut/components/TelaJogadores'
import { TelaSorteio } from '../../fut/components/TelaSorteio'
import { TelaTimes } from '../../fut/components/TelaTimes'
import { FutProvider, useFut } from '../../fut/estado/FutContext'
import '../../fut/fut.css'

export default function FutPage() {
  useEffect(() => {
    const titulo = document.title
    document.title = 'Sorteio de Times'
    document.body.classList.add('fut-body')

    const tema = document.querySelector('meta[name="theme-color"]')
    const temaAnterior = tema?.getAttribute('content') ?? null
    tema?.setAttribute('content', '#07110d')

    let fonte = document.getElementById('fonte-fut-vkk') as HTMLLinkElement | null
    if (!fonte) {
      fonte = document.createElement('link')
      fonte.id = 'fonte-fut-vkk'
      fonte.rel = 'stylesheet'
      fonte.href = 'https://fonts.googleapis.com/css2?family=Oswald:wght@500;600;700&family=Outfit:wght@400;500;600;700&display=swap'
      document.head.appendChild(fonte)
    }

    const robots = document.createElement('meta')
    robots.name = 'robots'
    robots.content = 'noindex, nofollow'
    document.head.appendChild(robots)

    return () => {
      document.title = titulo
      document.body.classList.remove('fut-body')
      if (temaAnterior) tema?.setAttribute('content', temaAnterior)
      robots.remove()
    }
  }, [])

  return (
    <FutProvider>
      <Conteudo />
    </FutProvider>
  )
}

function Conteudo() {
  const { etapa } = useFut()

  useEffect(() => {
    const reduzir = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    window.scrollTo({ top: 0, behavior: reduzir ? 'auto' : 'smooth' })
  }, [etapa])

  return (
    <div className="fut-raiz">
      <CampoFundo />
      <div className="fut-miolo">
        <header className="fut-topo">
          <Escudo />
          <h1 className="fut-titulo">⚽ Sorteio de times</h1>
          <p className="fut-subtitulo">Monte times equilibrados de forma rápida e justa.</p>
        </header>
        <Passos />
        <main>
          {etapa === 'jogadores' && <TelaJogadores />}
          {etapa === 'avaliacao' && <TelaAvaliacao />}
          {etapa === 'config' && <TelaConfig />}
          {etapa === 'sorteio' && <TelaSorteio />}
          {etapa === 'times' && <TelaTimes />}
        </main>
      </div>
      <DialogoRachao />
    </div>
  )
}

function Escudo() {
  return (
    <svg className="fut-escudo" viewBox="0 0 72 84" aria-hidden>
      <path d="M36 3l28 10v26c0 20-12 34-28 42C20 73 8 59 8 39V13L36 3z" fill="#101814" stroke="#e8c97a" strokeWidth="3" />
      <circle cx="36" cy="40" r="12" fill="none" stroke="#e8c97a" strokeWidth="2" />
      <path d="M36 31l4 3-1.4 4.2h-5.2L32 34l4-3zM28 38l2.6.8.8 3.4-3 2.4-3.2-2 .2-3.6 2.6-1zM44 38l-2.6.8-.8 3.4 3 2.4 3.2-2-.2-3.6-2.6-1z" fill="#e8c97a" />
    </svg>
  )
}
