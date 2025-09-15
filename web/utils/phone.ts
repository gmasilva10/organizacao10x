/**
 * GATE A-10.2.5 - Utilitários de normalização de telefone
 * 
 * Normalização para E.164 (padrão internacional)
 * Regras específicas para Brasil (+55)
 */

export interface PhoneNormalizationResult {
  e164?: string
  source: 'explicit' | 'org_default_ddd' | 'fallback_11'
  masked?: string
}

/**
 * Normaliza número de telefone para formato E.164
 * 
 * Regras BR:
 * - Aceitar: +5511..., (11) 9..., 119..., 9...
 * - Remover não-dígitos, manter + quando presente
 * - Se já com + e comprimento válido → usar como está
 * - Se sem DDI e 11 dígitos (DDD+celular) → prefixar +55
 * - Se só 9 dígitos (sem DDD) → usar ORG_DEFAULT_DDD
 */
export function normalizeToE164(
  input: string, 
  defaultCountry: string = 'BR',
  orgDefaultDDD: string = '11'
): PhoneNormalizationResult {
  if (!input || typeof input !== 'string') {
    return { source: 'fallback_11' }
  }

  // Remover tudo que não for dígito ou +
  const cleaned = input.replace(/[^\d+]/g, '')
  
  if (!cleaned) {
    return { source: 'fallback_11' }
  }

  // Se já começa com + e tem pelo menos 10 dígitos após o código do país
  if (cleaned.startsWith('+')) {
    const digitsAfterPlus = cleaned.slice(1)
    if (digitsAfterPlus.length >= 10) {
      const masked = maskPhoneNumber(cleaned)
      return {
        e164: cleaned,
        source: 'explicit',
        masked
      }
    }
  }

  // Remover + se presente para processar
  const digitsOnly = cleaned.replace(/^\+/, '')
  
  // Se tem 11 dígitos (DDD + celular BR), prefixar +55
  if (digitsOnly.length === 11 && defaultCountry === 'BR') {
    const e164 = `+55${digitsOnly}`
    const masked = maskPhoneNumber(e164)
    return {
      e164,
      source: 'explicit',
      masked
    }
  }
  
  // Se tem 9 dígitos (sem DDD), usar DDD padrão da organização
  if (digitsOnly.length === 9 && defaultCountry === 'BR') {
    const e164 = `+55${orgDefaultDDD}${digitsOnly}`
    const masked = maskPhoneNumber(e164)
    return {
      e164,
      source: 'org_default_ddd',
      masked
    }
  }

  // Se tem 10 dígitos (DDD + celular sem 9), prefixar +55
  if (digitsOnly.length === 10 && defaultCountry === 'BR') {
    const e164 = `+55${digitsOnly}`
    const masked = maskPhoneNumber(e164)
    return {
      e164,
      source: 'explicit',
      masked
    }
  }

  // Fallback: tentar com DDD padrão se tem 9 dígitos
  if (digitsOnly.length === 9) {
    const e164 = `+55${orgDefaultDDD}${digitsOnly}`
    const masked = maskPhoneNumber(e164)
    return {
      e164,
      source: 'fallback_11',
      masked
    }
  }

  return { source: 'fallback_11' }
}

/**
 * Mascara número de telefone para logs (mostra apenas últimos 4 dígitos)
 */
function maskPhoneNumber(phone: string): string {
  if (!phone || phone.length < 4) return '***'
  
  const digits = phone.replace(/\D/g, '')
  if (digits.length < 4) return '***'
  
  const last4 = digits.slice(-4)
  const masked = '*'.repeat(Math.max(0, digits.length - 4)) + last4
  
  return phone.startsWith('+') ? `+${masked}` : masked
}

/**
 * Valida se número E.164 é válido para WhatsApp
 * WhatsApp funciona melhor com números de celular (11 dígitos no BR)
 */
export function isValidForWhatsApp(e164: string): boolean {
  if (!e164 || !e164.startsWith('+')) return false
  
  const digits = e164.slice(1) // Remove o +
  
  // Para BR: +55 + DDD (2) + celular (9) = 13 dígitos total
  if (e164.startsWith('+55')) {
    return digits.length === 13
  }
  
  // Para outros países: pelo menos 10 dígitos
  return digits.length >= 10
}
