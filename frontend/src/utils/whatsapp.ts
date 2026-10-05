export function telefoneWhatsApp(pessoa?: { telefone?: string; celular?: string } | null) {
  const raw = pessoa?.celular || pessoa?.telefone || ''
  const digits = raw.replace(/\D/g, '')
  if (digits.length < 10) return ''
  return digits.startsWith('55') ? digits : `55${digits}`
}

export function baixarArquivo(file: File) {
  const url = URL.createObjectURL(file)
  const a = document.createElement('a')
  a.href = url
  a.download = file.name
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 2000)
}

export function urlWhatsApp(tel: string, texto: string) {
  return `https://wa.me/${tel}?text=${encodeURIComponent(texto)}`
}

/** Abre o WhatsApp já na conversa desse número. O link só leva texto, sem arquivo. */
export function abrirWhatsApp(tel: string, texto: string) {
  const url = urlWhatsApp(tel, texto)
  const janela = window.open(url, '_blank', 'noopener,noreferrer')
  if (!janela) window.location.assign(url)
}

export type ResultadoWhatsApp = 'compartilhado' | 'baixado'

function ehIOS() {
  if (typeof navigator === 'undefined') return false
  return /iPad|iPhone|iPod/.test(navigator.userAgent)
    || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
}

function opcoesDeAnexo(file: File, texto: string, titulo?: string): ShareData[] {
  const comTitulo: ShareData = { files: [file], text: texto, title: titulo || file.name }
  const comTexto: ShareData = { files: [file], text: texto }
  const soArquivo: ShareData = { files: [file] }
  // No iPhone, texto junto com arquivo faz o WhatsApp abrir sem o PDF.
  if (ehIOS()) return [soArquivo]
  return titulo ? [comTitulo, comTexto, soArquivo] : [comTexto, soArquivo]
}

function anexoCompativel(file: File, texto: string, titulo?: string): ShareData | null {
  if (typeof navigator === 'undefined' || !navigator.share || !navigator.canShare) return null
  for (const dados of opcoesDeAnexo(file, texto, titulo)) {
    try {
      if (navigator.canShare(dados)) return dados
    } catch {
      /* combinação não suportada neste navegador */
    }
  }
  return null
}

function pedirToqueParaAnexar(dados: ShareData): Promise<void> {
  return new Promise((resolve, reject) => {
    const fundo = document.createElement('div')
    fundo.className = 'fixed inset-0 z-[80] bg-black/40 flex items-end sm:items-center justify-center p-4'
    const caixa = document.createElement('div')
    caixa.className = 'bg-white rounded-2xl p-5 max-w-sm w-full shadow-xl text-center'
    const texto = document.createElement('p')
    texto.className = 'text-sm text-primary-700 leading-relaxed mb-4'
    texto.textContent = 'Toque em enviar. O WhatsApp abre com o PDF já anexado — escolha a conversa e confirme o envio.'
    const acoes = document.createElement('div')
    acoes.className = 'flex gap-3'
    const cancelar = document.createElement('button')
    cancelar.type = 'button'
    cancelar.className = 'flex-1 btn-outline min-h-[48px]'
    cancelar.textContent = 'Agora não'
    const enviar = document.createElement('button')
    enviar.type = 'button'
    enviar.className = 'flex-1 btn-primary min-h-[48px]'
    enviar.textContent = 'Enviar PDF'
    acoes.append(cancelar, enviar)
    caixa.append(texto, acoes)
    fundo.append(caixa)
    const fechar = () => fundo.remove()
    cancelar.addEventListener('click', () => {
      fechar()
      const cancelado = new Error('Envio cancelado')
      cancelado.name = 'AbortError'
      reject(cancelado)
    })
    enviar.addEventListener('click', async () => {
      try {
        await navigator.share(dados)
        fechar()
        resolve()
      } catch (err) {
        fechar()
        reject(err)
      }
    })
    document.body.appendChild(fundo)
  })
}

async function anexarNoWhatsApp(file: File, texto: string, titulo?: string): Promise<boolean> {
  const dados = anexoCompativel(file, texto, titulo)
  if (!dados || !navigator.share) return false
  try {
    await navigator.share(dados)
    return true
  } catch (err) {
    if ((err as Error).name === 'AbortError') throw err
    if ((err as Error).name === 'NotAllowedError') {
      await pedirToqueParaAnexar(dados)
      return true
    }
    return false
  }
}

export async function enviarArquivoWhatsApp(opts: {
  pessoa?: { telefone?: string; celular?: string } | null
  file: File
  texto: string
  titulo?: string
  /** A conversa já foi aberta no clique, com o número do cadastro. */
  conversaAberta?: boolean
}): Promise<ResultadoWhatsApp> {
  const tel = telefoneWhatsApp(opts.pessoa)
  if (!tel) {
    throw new Error('Cadastre o celular ou telefone para enviar no WhatsApp.')
  }

  if (await anexarNoWhatsApp(opts.file, opts.texto, opts.titulo)) {
    return 'compartilhado'
  }

  baixarArquivo(opts.file)
  if (!opts.conversaAberta) {
    const msg = `${opts.texto}\n\nO arquivo ${opts.file.name} foi baixado neste aparelho. Anexe esse PDF na conversa.`
    abrirWhatsApp(tel, msg)
  }
  return 'baixado'
}
