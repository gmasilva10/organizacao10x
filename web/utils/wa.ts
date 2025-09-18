/**
 * Utilitários para integração com WhatsApp
 */

/**
 * Normaliza telefone para formato E.164 (WhatsApp)
 */
export function normalizePhoneForWhatsApp(phone: string): string {
  // Remove todos os caracteres não numéricos
  let cleanPhone = phone.replace(/\D/g, '')
  
  // Se não começar com 55, adiciona
  if (!cleanPhone.startsWith('55')) {
    cleanPhone = '55' + cleanPhone
  }
  
  return cleanPhone
}

/**
 * Gera URL do WhatsApp (wa.me) com mensagem
 */
export function generateWhatsAppURL(phone: string, message?: string): string {
  const normalizedPhone = normalizePhoneForWhatsApp(phone)
  
  let url = `https://wa.me/${normalizedPhone}`
  
  if (message) {
    const encodedMessage = encodeURIComponent(message)
    url += `?text=${encodedMessage}`
  }
  
  return url
}

/**
 * Abre WhatsApp em nova aba
 */
export function openWhatsApp(phone: string, message?: string): void {
  const url = generateWhatsAppURL(phone, message)
  window.open(url, '_blank', 'noopener,noreferrer')
}

/**
 * Mensagens padrão para WhatsApp
 */
export const DEFAULT_WHATSAPP_MESSAGES = {
  greeting: 'Olá! Como está o treino hoje?',
  followUp: 'Precisa de alguma orientação?',
  checkIn: 'Tudo bem? Como foi a sessão?'
} as const

export type WhatsAppMessageType = keyof typeof DEFAULT_WHATSAPP_MESSAGES
