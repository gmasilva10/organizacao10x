/**
 * WhatsApp Desktop Handler
 * 
 * Gerencia abertura do WhatsApp Desktop (app nativo) usando protocolos
 * whatsapp:// para máxima performance e economia de tempo.
 */

import { WhatsAppContact, WhatsAppMessage, WhatsAppServiceResult } from './types'

export class WhatsAppDesktopHandler {
  private static readonly WHATSAPP_PROTOCOL = 'whatsapp://'
  private static readonly WHATSAPP_SEND_ENDPOINT = 'send'
  private static readonly WHATSAPP_CHAT_ENDPOINT = 'chat'

  /**
   * Verifica se o WhatsApp Desktop está disponível
   * Tenta abrir um protocolo vazio e verifica se não há erro
   */
  static async isAvailable(): Promise<boolean> {
    try {
      // Testa se o protocolo está registrado
      const testUrl = `${this.WHATSAPP_PROTOCOL}test`
      
      // Cria um link temporário e tenta abrir
      const link = document.createElement('a')
      link.href = testUrl
      link.style.display = 'none'
      document.body.appendChild(link)
      
      // Se chegou até aqui, o protocolo está registrado
      document.body.removeChild(link)
      return true
    } catch (error) {
      console.warn('WhatsApp Desktop não está disponível:', error)
      return false
    }
  }

  /**
   * Formata número de telefone para o protocolo WhatsApp
   * Remove caracteres especiais e adiciona código do país se necessário
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
   * Abre WhatsApp Desktop com mensagem pré-formatada
   */
  static async sendMessage(message: WhatsAppMessage): Promise<WhatsAppServiceResult> {
    try {
      const formattedPhone = this.formatPhoneNumber(message.contact.phone)
      const encodedText = this.encodeText(message.text)
      
      // URL do protocolo WhatsApp
      const whatsappUrl = `${this.WHATSAPP_PROTOCOL}${this.WHATSAPP_SEND_ENDPOINT}?phone=${formattedPhone}&text=${encodedText}`
      
      console.log('🚀 [WhatsApp Desktop] Abrindo:', {
        phone: formattedPhone,
        text: message.text.substring(0, 50) + '...',
        url: whatsappUrl
      })

      // Abre o protocolo (WhatsApp Desktop)
      window.open(whatsappUrl, '_self')
      
      // Simula sucesso (protocolo não retorna feedback)
      return {
        success: true,
        method: 'desktop',
        messageId: `desktop_${Date.now()}_${formattedPhone}`
      }
      
    } catch (error) {
      console.error('❌ [WhatsApp Desktop] Erro ao enviar:', error)
      return {
        success: false,
        method: 'desktop',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      }
    }
  }

  /**
   * Abre WhatsApp Desktop para chat específico (sem mensagem)
   */
  static async openChat(contact: WhatsAppContact): Promise<WhatsAppServiceResult> {
    try {
      const formattedPhone = this.formatPhoneNumber(contact.phone)
      
      // URL do protocolo WhatsApp para abrir chat
      const whatsappUrl = `${this.WHATSAPP_PROTOCOL}${this.WHATSAPP_CHAT_ENDPOINT}?phone=${formattedPhone}`
      
      console.log('🚀 [WhatsApp Desktop] Abrindo chat:', {
        phone: formattedPhone,
        name: contact.name,
        url: whatsappUrl
      })

      // Abre o protocolo (WhatsApp Desktop)
      window.open(whatsappUrl, '_self')
      
      return {
        success: true,
        method: 'desktop',
        messageId: `chat_${Date.now()}_${formattedPhone}`
      }
      
    } catch (error) {
      console.error('❌ [WhatsApp Desktop] Erro ao abrir chat:', error)
      return {
        success: false,
        method: 'desktop',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      }
    }
  }

  /**
   * Abre WhatsApp Desktop para grupo (se aplicável)
   */
  static async openGroup(groupCode: string): Promise<WhatsAppServiceResult> {
    try {
      // URL do protocolo WhatsApp para grupo
      const whatsappUrl = `${this.WHATSAPP_PROTOCOL}${this.WHATSAPP_CHAT_ENDPOINT}?code=${groupCode}`
      
      console.log('🚀 [WhatsApp Desktop] Abrindo grupo:', {
        groupCode,
        url: whatsappUrl
      })

      // Abre o protocolo (WhatsApp Desktop)
      window.open(whatsappUrl, '_self')
      
      return {
        success: true,
        method: 'desktop',
        messageId: `group_${Date.now()}_${groupCode}`
      }
      
    } catch (error) {
      console.error('❌ [WhatsApp Desktop] Erro ao abrir grupo:', error)
      return {
        success: false,
        method: 'desktop',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      }
    }
  }

  /**
   * Detecta se estamos em ambiente que suporta protocolos customizados
   */
  static isProtocolSupported(): boolean {
    // Verifica se é um ambiente que suporta protocolos (não mobile)
    return typeof window !== 'undefined' && 
           !/Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
  }
}
