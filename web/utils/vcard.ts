/**
 * Utilitários para geração de vCard (.vcf)
 */

export interface VCardData {
  firstName: string
  lastName?: string
  phone: string
  studentId: string
}

/**
 * Gera conteúdo vCard (.vcf) para contato WhatsApp
 */
export function generateVCard(data: VCardData): string {
  const { firstName, lastName = '', phone, studentId } = data
  
  // Normalizar telefone para E.164 se necessário
  const normalizedPhone = normalizePhoneForVCard(phone)
  
  // Construir vCard
  const vcard = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `FN:${firstName} ${lastName}`.trim(),
    `N:${lastName};${firstName};;;`,
    `TEL;TYPE=CELL:${normalizedPhone}`,
    `NOTE:ID: ${studentId}`,
    'END:VCARD'
  ].join('\r\n')
  
  return vcard
}

/**
 * Normaliza telefone para formato E.164
 */
function normalizePhoneForVCard(phone: string): string {
  // Remove todos os caracteres não numéricos
  let cleanPhone = phone.replace(/\D/g, '')
  
  // Se não começar com 55, adiciona
  if (!cleanPhone.startsWith('55')) {
    cleanPhone = '55' + cleanPhone
  }
  
  // Adiciona + no início
  return '+' + cleanPhone
}

/**
 * Faz download do vCard
 */
export function downloadVCard(vcardContent: string, filename: string = 'contato.vcf'): void {
  const blob = new Blob([vcardContent], { type: 'text/vcard;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  
  URL.revokeObjectURL(url)
}
