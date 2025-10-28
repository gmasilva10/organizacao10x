/**
 * WhatsApp Service
 * 
 * Camada principal de integração com WhatsApp
 * Gerencia automaticamente entre Desktop e Web baseado na disponibilidade
 */

import { 
  WhatsAppContact, 
  WhatsAppMessage, 
  WhatsAppServiceResult, 
  WhatsAppServiceConfig,
  WhatsAppMethod 
} from './types'
import { WhatsAppDesktopHandler } from './desktop-handler'
import { WhatsAppWebHandler } from './web-handler'

export class WhatsAppService {
  private config: WhatsAppServiceConfig

  constructor(config: WhatsAppServiceConfig = { preferredMethod: 'desktop' }) {
    this.config = config
  }

  /**
   * Verifica qual método está disponível
   */
  async getAvailableMethods(): Promise<WhatsAppMethod[]> {
    const methods: WhatsAppMethod[] = []
    
    // Verifica Desktop
    if (await this.isDesktopAvailable()) {
      methods.push('desktop')
    }
    
    // Verifica Web
    if (await this.isWebAvailable()) {
      methods.push('web')
    }
    
    return methods
  }

  /**
   * Verifica se WhatsApp Desktop está disponível
   */
  async isDesktopAvailable(): Promise<boolean> {
    return WhatsAppDesktopHandler.isAvailable() && 
           WhatsAppDesktopHandler.isProtocolSupported()
  }

  /**
   * Verifica se WhatsApp Web está disponível
   */
  async isWebAvailable(): Promise<boolean> {
    return WhatsAppWebHandler.isAvailable()
  }

  /**
   * Envia mensagem usando o método preferido ou fallback
   */
  async sendMessage(message: WhatsAppMessage): Promise<WhatsAppServiceResult> {
    const availableMethods = await this.getAvailableMethods()
    
    if (availableMethods.length === 0) {
      return {
        success: false,
        method: 'web',
        error: 'Nenhum método de WhatsApp disponível'
      }
    }

    // Tenta usar método preferido primeiro
    const preferredMethod = this.config.preferredMethod
    if (availableMethods.includes(preferredMethod)) {
      return this.sendWithMethod(message, preferredMethod)
    }

    // Fallback para primeiro método disponível
    const fallbackMethod = availableMethods[0]
    console.warn(`⚠️ [WhatsApp Service] Método preferido '${preferredMethod}' não disponível. Usando '${fallbackMethod}'.`)
    
    return this.sendWithMethod(message, fallbackMethod)
  }

  /**
   * Abre chat usando o método preferido ou fallback
   */
  async openChat(contact: WhatsAppContact): Promise<WhatsAppServiceResult> {
    const availableMethods = await this.getAvailableMethods()
    
    if (availableMethods.length === 0) {
      return {
        success: false,
        method: 'web',
        error: 'Nenhum método de WhatsApp disponível'
      }
    }

    // Tenta usar método preferido primeiro
    const preferredMethod = this.config.preferredMethod
    if (availableMethods.includes(preferredMethod)) {
      return this.openChatWithMethod(contact, preferredMethod)
    }

    // Fallback para primeiro método disponível
    const fallbackMethod = availableMethods[0]
    console.warn(`⚠️ [WhatsApp Service] Método preferido '${preferredMethod}' não disponível. Usando '${fallbackMethod}'.`)
    
    return this.openChatWithMethod(contact, fallbackMethod)
  }

  /**
   * Envia mensagem com método específico
   */
  private async sendWithMethod(message: WhatsAppMessage, method: WhatsAppMethod): Promise<WhatsAppServiceResult> {
    switch (method) {
      case 'desktop':
        return WhatsAppDesktopHandler.sendMessage(message)
      
      case 'web':
        return WhatsAppWebHandler.sendMessage(message)
      
      case 'api':
        // TODO: Implementar quando tivermos API key
        return {
          success: false,
          method: 'api',
          error: 'WhatsApp API não implementada ainda'
        }
      
      default:
        return {
          success: false,
          method: 'web',
          error: `Método '${method}' não suportado`
        }
    }
  }

  /**
   * Abre chat com método específico
   */
  private async openChatWithMethod(contact: WhatsAppContact, method: WhatsAppMethod): Promise<WhatsAppServiceResult> {
    switch (method) {
      case 'desktop':
        return WhatsAppDesktopHandler.openChat(contact)
      
      case 'web':
        return WhatsAppWebHandler.openChat(contact)
      
      case 'api':
        // TODO: Implementar quando tivermos API key
        return {
          success: false,
          method: 'api',
          error: 'WhatsApp API não implementada ainda'
        }
      
      default:
        return {
          success: false,
          method: 'web',
          error: `Método '${method}' não suportado`
        }
    }
  }

  /**
   * Atualiza configuração do serviço
   */
  updateConfig(newConfig: Partial<WhatsAppServiceConfig>): void {
    this.config = { ...this.config, ...newConfig }
  }

  /**
   * Obtém configuração atual
   */
  getConfig(): WhatsAppServiceConfig {
    return { ...this.config }
  }

  /**
   * Detecta automaticamente o melhor método disponível
   */
  async detectBestMethod(): Promise<WhatsAppMethod> {
    const availableMethods = await this.getAvailableMethods()
    
    if (availableMethods.includes('desktop')) {
      return 'desktop'
    }
    
    if (availableMethods.includes('web')) {
      return 'web'
    }
    
    return 'web' // Fallback padrão
  }

  /**
   * Configura automaticamente o melhor método
   */
  async autoConfigure(): Promise<void> {
    const bestMethod = await this.detectBestMethod()
    this.config.preferredMethod = bestMethod
    
    console.log(`✅ [WhatsApp Service] Configurado automaticamente para: ${bestMethod}`)
  }
}

// Instância singleton para uso global
export const whatsappService = new WhatsAppService()

// Auto-configura na inicialização
if (typeof window !== 'undefined') {
  whatsappService.autoConfigure().catch(console.error)
}
