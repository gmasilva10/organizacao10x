/**
 * Utilitários para formatação de datas em campos de input
 * 
 * Converte entre formato ISO UTC (usado pela API) e formato YYYY-MM-DD (usado por input[type="date"])
 */

/**
 * Converte uma string ISO UTC para formato de data HTML (YYYY-MM-DD)
 * @param isoString - String ISO UTC (ex: "2025-10-20T03:00:00.000Z")
 * @returns String no formato YYYY-MM-DD ou string vazia se inválida
 */
export function formatDateForInput(isoString: string): string {
  if (!isoString || isoString.trim() === '') {
    return ''
  }
  
  try {
    const date = new Date(isoString)
    
    // Verificar se a data é válida
    if (isNaN(date.getTime())) {
      console.warn('Data inválida para formatação:', isoString)
      return ''
    }
    
    // Converter para formato YYYY-MM-DD
    return date.toISOString().split('T')[0]
  } catch (error) {
    console.error('Erro ao formatar data para input:', error, isoString)
    return ''
  }
}

/**
 * Converte uma string de data HTML (YYYY-MM-DD) para formato ISO UTC
 * @param dateString - String no formato YYYY-MM-DD
 * @returns String ISO UTC ou string vazia se inválida
 */
export function parseDateFromInput(dateString: string): string {
  if (!dateString || dateString.trim() === '') {
    return ''
  }
  
  try {
    // Adicionar horário para criar uma data válida
    const date = new Date(dateString + 'T00:00:00')
    
    // Verificar se a data é válida
    if (isNaN(date.getTime())) {
      console.warn('Data inválida para parsing:', dateString)
      return ''
    }
    
    return date.toISOString()
  } catch (error) {
    console.error('Erro ao fazer parse da data do input:', error, dateString)
    return ''
  }
}

/**
 * Converte um objeto Date para formato de data HTML (YYYY-MM-DD)
 * @param date - Objeto Date
 * @returns String no formato YYYY-MM-DD ou string vazia se inválida
 */
export function formatDateObjectForInput(date: Date): string {
  if (!date || isNaN(date.getTime())) {
    return ''
  }
  
  try {
    return date.toISOString().split('T')[0]
  } catch (error) {
    console.error('Erro ao formatar objeto Date para input:', error, date)
    return ''
  }
}

/**
 * Converte uma string de data HTML (YYYY-MM-DD) para objeto Date
 * @param dateString - String no formato YYYY-MM-DD
 * @returns Objeto Date ou null se inválida
 */
export function parseDateFromInputToObject(dateString: string): Date | null {
  if (!dateString || dateString.trim() === '') {
    return null
  }
  
  try {
    const date = new Date(dateString + 'T00:00:00')
    
    if (isNaN(date.getTime())) {
      console.warn('Data inválida para conversão para Date:', dateString)
      return null
    }
    
    return date
  } catch (error) {
    console.error('Erro ao converter string para Date:', error, dateString)
    return null
  }
}
