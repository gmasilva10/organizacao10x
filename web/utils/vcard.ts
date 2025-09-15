/**
 * GATE A-10.2.5 - Utilitários para geração de vCard
 * 
 * Geração de vCard 3.0 para contatos de alunos
 * Formato compatível com WhatsApp e outros clientes
 */

export interface VCardResult {
  filename: string
  blob: Blob
  content: string
}

/**
 * Gera vCard 3.0 para um aluno
 * 
 * @param student - Dados do aluno
 * @param phoneE164 - Telefone normalizado em E.164
 * @returns vCard como Blob para download
 */
export function buildStudentVCard(
  student: { 
    id: string
    name: string
    email?: string | null
  },
  phoneE164: string
): VCardResult {
  const firstName = student.name.split(' ')[0] || ''
  const lastName = student.name.split(' ').slice(1).join(' ') || ''
  const displayName = `${firstName} ${lastName} (Aluno)`
  
  // vCard 3.0 format
  const vcardContent = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `N:${lastName};${firstName};;;`,
    `FN:${displayName}`,
    `TEL;TYPE=CELL:${phoneE164}`,
    ...(student.email ? [`EMAIL:${student.email}`] : []),
    `NOTE:studentId=${student.id}`,
    'END:VCARD'
  ].join('\r\n')

  // Gerar nome do arquivo
  const shortId = student.id.slice(-8) // Últimos 8 caracteres do UUID
  const filename = `Contato - ${firstName} ${lastName} - ${shortId}.vcf`

  // Criar Blob
  const blob = new Blob([vcardContent], { 
    type: 'text/vcard;charset=utf-8' 
  })

  return {
    filename,
    blob,
    content: vcardContent
  }
}

/**
 * Faz download do vCard
 */
export function downloadVCard(vcard: VCardResult): void {
  const url = URL.createObjectURL(vcard.blob)
  const link = document.createElement('a')
  link.href = url
  link.download = vcard.filename
  link.style.display = 'none'
  
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  
  // Limpar URL após download
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/**
 * Gera vCard para múltiplos contatos (ZIP)
 */
export function buildMultipleVCards(
  contacts: Array<{
    student?: { id: string; name: string; email?: string | null }
    professional?: { id: string; name: string; email?: string | null }
    phone: string
    type: 'student' | 'professional'
  }>
): VCardResult[] {
  return contacts
    .filter(contact => contact.phone)
    .map(contact => {
      const entity = contact.type === 'student' ? contact.student : contact.professional
      if (!entity) return null

      const firstName = entity.name.split(' ')[0] || ''
      const lastName = entity.name.split(' ').slice(1).join(' ') || ''
      const displayName = `${firstName} ${lastName} (${contact.type === 'student' ? 'Aluno' : 'Profissional'})`
      
      const vcardContent = [
        'BEGIN:VCARD',
        'VERSION:3.0',
        `N:${lastName};${firstName};;;`,
        `FN:${displayName}`,
        `TEL;TYPE=CELL:${contact.phone}`,
        ...(entity.email ? [`EMAIL:${entity.email}`] : []),
        `NOTE:${contact.type}Id=${entity.id}`,
        'END:VCARD'
      ].join('\r\n')

      const shortId = entity.id.slice(-8)
      const filename = `Contato - ${firstName} ${lastName} - ${shortId}.vcf`

      const blob = new Blob([vcardContent], { 
        type: 'text/vcard;charset=utf-8' 
      })

      return {
        filename,
        blob,
        content: vcardContent
      }
    })
    .filter(Boolean) as VCardResult[]
}
