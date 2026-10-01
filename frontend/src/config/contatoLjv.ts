/** Número já usado pela LJV no site. */
export const WHATSAPP_NUMBER = '5518997640623'

export const MENSAGENS = {
  flutuante: 'Olá! Gostaria de solicitar um orçamento para meu projeto com a LJV CONSTRUÇÃO.',
  hero: 'Olá! Gostaria de conversar sobre um projeto de construção.',
  servicos: 'Olá! Gostaria de conhecer os serviços da LJV CONSTRUÇÃO.',
  processo: 'Olá! Tenho um projeto e gostaria de conversar com a LJV CONSTRUÇÃO.',
  orcamento: 'Olá! Gostaria de solicitar um orçamento para meu projeto.',
} as const

export function openWhatsApp(message: string) {
  const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`
  window.open(url, '_blank', 'noopener,noreferrer')
}

export function linkWhatsApp(message: string) {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`
}
