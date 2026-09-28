import clsx from 'clsx'
import { useConfigSite } from '../../contexts/ConfigSiteContext'

interface LogoEmpresaProps {
  variant?: 'light' | 'dark'
  size?: 'sm' | 'md' | 'lg'
  showName?: boolean
}

export default function LogoEmpresa({ variant = 'dark', size = 'md', showName = true }: LogoEmpresaProps) {
  const { config } = useConfigSite()
  const logo = config.empresa_logo
  const nome = config.empresa_nome || 'LJV'
  const slogan = config.empresa_slogan || 'Construção'
  const inicial = nome.trim().charAt(0).toUpperCase() || 'L'

  const box = {
    sm: 'w-8 h-8 rounded-lg text-base',
    md: 'w-10 h-10 rounded-xl text-lg',
    lg: 'w-11 h-11 rounded-xl text-xl',
  }[size]

  const titulo = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-xl',
  }[size]

  const claro = variant === 'light'

  return (
    <div className="flex items-center gap-2.5 min-w-0">
      {logo ? (
        <img
          src={logo}
          alt={nome}
          className={clsx(box, 'object-cover flex-shrink-0 bg-white')}
        />
      ) : (
        <div className={clsx(
          box,
          'flex items-center justify-center flex-shrink-0 font-black',
          claro
            ? 'bg-accent-500/10 border border-accent-500/20 text-accent-400'
            : 'bg-primary-900 text-accent-400'
        )}>
          {inicial}
        </div>
      )}
      {showName && (
        <div className="min-w-0">
          <div className={clsx('font-black leading-tight truncate', titulo, claro ? 'text-white' : 'text-primary-900')}>
            {nome}
          </div>
          {slogan && (
            <div className={clsx(
              'text-[10px] tracking-widest uppercase leading-tight truncate',
              claro ? 'text-white/40' : 'text-primary-400'
            )}>
              {slogan}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
