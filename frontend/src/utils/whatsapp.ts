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

export async function enviarArquivoWhatsApp(opts: {
  pessoa?: { telefone?: string; celular?: string } | null
  file: File
  texto: string
  titulo?: string
}): Promise<'compartilhado' | 'whatsapp'> {
  const tel = telefoneWhatsApp(opts.pessoa)
  if (!tel) {
    throw new Error('Cadastre o celular ou telefone para enviar no WhatsApp.')
  }

  const podeCompartilhar = typeof navigator.canShare === 'function' && navigator.canShare({ files: [opts.file] })
  if (podeCompartilhar) {
    await navigator.share({
      files: [opts.file],
      title: opts.titulo || opts.file.name,
      text: opts.texto,
    })
    return 'compartilhado'
  }

  baixarArquivo(opts.file)
  const msg = `${opts.texto}\n\nAnexe o arquivo ${opts.file.name} (já foi baixado neste aparelho).`
  window.open(`https://wa.me/${tel}?text=${encodeURIComponent(msg)}`, '_blank', 'noopener,noreferrer')
  return 'whatsapp'
}
