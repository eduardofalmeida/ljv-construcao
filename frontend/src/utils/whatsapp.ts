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

/** Abre o WhatsApp já na conversa desse número. */
export function abrirWhatsApp(tel: string, texto: string) {
  const url = urlWhatsApp(tel, texto)
  const janela = window.open(url, '_blank', 'noopener,noreferrer')
  if (!janela) window.location.assign(url)
}

export async function enviarArquivoWhatsApp(opts: {
  pessoa?: { telefone?: string; celular?: string } | null
  file: File
  texto: string
  titulo?: string
  /** A conversa já foi aberta no clique, com o número do cadastro. */
  conversaAberta?: boolean
}): Promise<'whatsapp'> {
  const tel = telefoneWhatsApp(opts.pessoa)
  if (!tel) {
    throw new Error('Cadastre o celular ou telefone para enviar no WhatsApp.')
  }

  baixarArquivo(opts.file)
  if (!opts.conversaAberta) {
    const msg = `${opts.texto}\n\nAnexe o arquivo ${opts.file.name} (já foi baixado neste aparelho).`
    abrirWhatsApp(tel, msg)
  }
  return 'whatsapp'
}
