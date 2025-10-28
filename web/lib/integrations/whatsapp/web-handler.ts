/**
 * WhatsApp Web Handler
 * 
 * Fallback para WhatsApp Web quando Desktop não está disponível
 */

import { WhatsAppContact, WhatsAppMessage, WhatsAppServiceResult } from './types'

export class WhatsAppWebHandler {
  private static readonly WHATSAPP_WEB_BASE = 'https://web.whatsapp.com/send'

  /**
   * Verifica se WhatsApp Web está disponível
   */
  static async isAvailable(): Promise<boolean> {
    try {
      // Testa conectividade básica
      const response = await fetch('https://web.whatsapp.com', { 
        method: 'HEAD',
        mode: 'no-cors'
      })
      return true
    } catch (error) {
      console.warn('WhatsApp Web não está disponível:', error)
      return false
    }
  }

  /**
   * Formata número de telefone para WhatsApp Web
   */
  private static formatPhoneNumber(phone: string): string {
    // Remove todos os caracteres não numéricos
    const cleanPhone = phone.replace(/\D/g, '')
    
    // Se não tem código do país, adiciona +55 (Brasil)
    if (cleanPhone.length === 11 && cleanPhone.startsWith('11')) {
      return `55${cleanPhone}`
    }
    
    // Se já tem código do país
    if (cleanPhone.length >= 12) {
      return cleanPhone
    }
    
    // Fallback: adiciona +55
    return `55${cleanPhone}`
  }

  /**
   * Codifica texto para URL
   */
  private static encodeText(text: string): string {
    return encodeURIComponent(text)
  }

  /**
   * Abre WhatsApp Web com mensagem pré-formatada
   */
  static async sendMessage(message: WhatsAppMessage): Promise<WhatsAppServiceResult> {
    try {
      const formattedPhone = this.formatPhoneNumber(message.contact.phone)
      const encodedText = this.encodeText(message.text)
      
      // URL do WhatsApp Web
      const whatsappUrl = `${this.WHATSAPP_WEB_BASE}?phone=${formattedPhone}&text=${encodedText}`
      
      console.log('🌐 [WhatsApp Web] Abrindo:', {
        phone: formattedPhone,
        text: message.text.substring(0, 50) + '...',
        url: whatsappUrl
      })

      // Abre em nova aba
      const newWindow = window.open(whatsappUrl, '_blank', 'noopener,noreferrer')
      
      if (!newWindow) {
        throw new Error('Não foi possível abrir nova janela. Verifique se pop-ups estão bloqueados.')
      }
      
      return {
        success: true,
        method: 'web',
        messageId: `web_${Date.now()}_${formattedPhone}`
      }
      
    } catch (error) {
      console.error('❌ [WhatsApp Web] Erro ao enviar:', error)
      return {
        success: false,
        method: 'web',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      }
    }
  }

  /**
   * Abre WhatsApp Web para chat específico (sem mensagem)
   */
  static async openChat(contact: WhatsAppContact): Promise<WhatsAppServiceResult> {
    try {
      const formattedPhone = this.formatPhoneNumber(contact.phone)
      
      // URL do WhatsApp Web para abrir chat
      const whatsappUrl = `${this.WHATSAPP_WEB_BASE}?phone=${formattedPhone}`
      
      console.log('🌐 [WhatsApp Web] Abrindo chat:', {
        phone: formattedPhone,
        name: contact.name,
        url: whatsappUrl
      })

      // Abre em nova aba
      const newWindow = window.open(whatsappUrl, '_blank', 'noopener,noreferrer')
      
      if (!newWindow) {
        throw new Error('Não foi possível abrir nova janela. Verifique se pop-ups estão bloqueados.')
      }
      
      return {
        success: true,
        method: 'web',
        messageId: `chat_${Date.now()}_${formattedPhone}`
      }
      
    } catch (error) {
      console.error('❌ [WhatsApp Web] Erro ao abrir chat:', error)
      return {
        success: false,
        method: 'web',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      }
    }
  }
}
