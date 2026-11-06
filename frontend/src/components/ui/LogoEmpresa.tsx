import clsx from 'clsx'
import { useConfigSite } from '../../contexts/ConfigSiteContext'

interface LogoEmpresaProps {
  variant?: 'light' | 'dark'
  size?: 'sm' | 'md' | 'lg'
  showName?: boolean
  /** Imagem maior, para a tela de login. */
  destaque?: boolean
}

export default function LogoEmpresa({ variant = 'dark', size = 'md', showName = true, destaque = false }: LogoEmpresaProps) {
  const { config } = useConfigSite()
  const logo = config.empresa_logo?.trim()
  const nome = config.empresa_nome || 'LJV'
  const slogan = config.empresa_slogan || 'Construção'
  const inicial = nome.trim().charAt(0).toUpperCase() || 'L'

  const box = {
    sm: 'w-8 h-8 rounded-lg text-base',
    md: 'w-10 h-10 rounded-xl text-lg',
    lg: 'w-11 h-11 rounded-xl text-xl',
  }[size]

  const imagem = {
    sm: 'h-8 max-w-[7.5rem] rounded-lg p-1',
    md: 'h-10 max-w-[10rem] rounded-lg p-1',
    lg: 'h-12 max-w-[12rem] rounded-xl p-1.5',
  }[size]

  const titulo = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-xl',
  }[size]

  const claro = variant === 'light'

  const marca = logo ? (
    <img
      src={logo}
      alt={nome}
      className={clsx(
        'object-contain bg-white flex-shrink-0',
        destaque ? 'h-28 sm:h-32 w-auto max-w-full rounded-2xl p-3 shadow-lg' : imagem
      )}
    />
  ) : (
    <div className={clsx(
      destaque ? 'w-16 h-16 rounded-2xl text-3xl' : box,
      'flex items-center justify-center flex-shrink-0 font-black',
      claro
        ? 'bg-accent-500/10 border border-accent-500/20 text-accent-400'
        : 'bg-primary-900 text-accent-400'
    )}>
      {inicial}
    </div>
  )

  const nomeSlogan = showName && (
    <div className="min-w-0">
      <div className={clsx(
        'font-black leading-tight truncate',
        destaque ? 'text-2xl' : titulo,
        claro ? 'text-white' : 'text-primary-900'
      )}>
        {nome}
      </div>
      {slogan && (
        <div className={clsx(
          'tracking-widest uppercase leading-tight truncate',
          destaque ? 'text-xs mt-1' : 'text-[10px]',
          claro ? 'text-white/40' : 'text-primary-400'
        )}>
          {slogan}
        </div>
      )}
    </div>
  )

  if (destaque) {
    return (
      <div className="flex flex-col items-start gap-3 min-w-0 max-w-full">
        {marca}
        {nomeSlogan}
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2.5 min-w-0">
      {marca}
      {nomeSlogan}
    </div>
  )
}
