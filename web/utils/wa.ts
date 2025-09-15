/**
 * GATE A-10.2.5 - Utilitários WhatsApp
 * 
 * Geração de URLs seguras para WhatsApp Web
 * Click-to-chat e criação de grupos
 */

/**
 * Gera URL para chat individual no WhatsApp Web
 * 
 * @param e164 - Número em formato E.164 (ex: +5511999999999)
 * @param text - Mensagem pré-preenchida (opcional)
 * @returns URL segura para wa.me
 */
export function waChatUrl(e164: string, text?: string): string {
  if (!e164 || !e164.startsWith('+')) {
    throw new Error('Número deve estar em formato E.164 (+5511999999999)')
  }

  // Remover o + para a URL
  const number = e164.slice(1)
  
  // URL base do WhatsApp
  let url = `https://wa.me/${number}`
  
  // Adicionar texto se fornecido
  if (text && text.trim()) {
    const encodedText = encodeURIComponent(text.trim())
    url += `?text=${encodedText}`
  }
  
  return url
}

/**
 * Gera URL para WhatsApp Web (página principal)
 * 
 * @returns URL para web.whatsapp.com
 */
export function waWebUrl(): string {
  return 'https://web.whatsapp.com/'
}

/**
 * Abre chat no WhatsApp Web
 * 
 * @param e164 - Número em formato E.164
 * @param text - Mensagem pré-preenchida (opcional)
 * @returns Promise que resolve quando a janela é aberta
 */
export function openWhatsAppChat(e164: string, text?: string): Promise<Window | null> {
  try {
    const url = waChatUrl(e164, text)
    const windowRef = window.open(url, '_blank', 'noopener,noreferrer')
    
    if (!windowRef) {
      throw new Error('Popup bloqueado pelo navegador')
    }
    
    return Promise.resolve(windowRef)
  } catch (error) {
    console.error('Erro ao abrir WhatsApp:', error)
    return Promise.reject(error)
  }
}

/**
 * Abre WhatsApp Web
 * 
 * @returns Promise que resolve quando a janela é aberta
 */
export function openWhatsAppWeb(): Promise<Window | null> {
  try {
    const url = waWebUrl()
    const windowRef = window.open(url, '_blank', 'noopener,noreferrer')
    
    if (!windowRef) {
      throw new Error('Popup bloqueado pelo navegador')
    }
    
    return Promise.resolve(windowRef)
  } catch (error) {
    console.error('Erro ao abrir WhatsApp Web:', error)
    return Promise.reject(error)
  }
}

/**
 * Valida se o navegador suporta abertura de popups
 * 
 * @returns true se suporta, false caso contrário
 */
export function canOpenPopups(): boolean {
  try {
    // Teste simples de abertura de popup
    const testWindow = window.open('about:blank', '_blank', 'width=1,height=1')
    if (testWindow) {
      testWindow.close()
      return true
    }
    return false
  } catch {
    return false
  }
}

/**
 * Copia texto para área de transferência
 * 
 * @param text - Texto para copiar
 * @returns Promise que resolve quando copiado
 */
export async function copyToClipboard(text: string): Promise<void> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text)
    } else {
      // Fallback para navegadores mais antigos
      const textArea = document.createElement('textarea')
      textArea.value = text
      textArea.style.position = 'fixed'
      textArea.style.left = '-999999px'
      textArea.style.top = '-999999px'
      document.body.appendChild(textArea)
      textArea.focus()
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
    }
  } catch (error) {
    console.error('Erro ao copiar para área de transferência:', error)
    throw error
  }
}
