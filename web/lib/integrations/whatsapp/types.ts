/**
 * Tipos para integração WhatsApp
 */

export interface WhatsAppContact {
  phone: string
  name?: string
  isGroup?: boolean
  groupCode?: string
}

export interface WhatsAppMessage {
  text: string
  contact: WhatsAppContact
  scheduledFor?: Date
}

export interface WhatsAppServiceConfig {
  preferredMethod: 'desktop' | 'web' | 'api'
  desktopAppPath?: string
  webUrl?: string
  apiKey?: string
  phoneNumber?: string
}

export interface WhatsAppServiceResult {
  success: boolean
  method: 'desktop' | 'web' | 'api'
  error?: string
  messageId?: string
}

export interface WhatsAppService {
  sendMessage(message: WhatsAppMessage): Promise<WhatsAppServiceResult>
  openChat(contact: WhatsAppContact): Promise<WhatsAppServiceResult>
  isDesktopAvailable(): Promise<boolean>
  isWebAvailable(): Promise<boolean>
}

export type WhatsAppMethod = 'desktop' | 'web' | 'api'
