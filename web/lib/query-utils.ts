/**
 * Utilitários seguros para construção de querystrings
 * Evita erros de toString() em valores undefined/null
 */

/**
 * Constrói URLSearchParams de forma segura
 * Converte undefined/null para string vazia e garante tipos primitivos
 */
export function safeParams(input: Record<string, unknown>): URLSearchParams {
  const params = new URLSearchParams()
  
  Object.entries(input).forEach(([key, value]) => {
    if (value === undefined || value === null) return
    
    // Força conversão para string, evitando v?.toString()
    const stringValue = String(value)
    
    // Só adiciona se não for string vazia
    if (stringValue.trim() !== '') {
      params.set(key, stringValue)
    }
  })
  
  return params
}

/**
 * Constrói query string de forma segura
 */
export function safeQueryString(input: Record<string, unknown>): string {
  const params = safeParams(input)
  return params.toString()
}

/**
 * Valida e normaliza parâmetros de paginação
 */
export function normalizePagination(page?: unknown, limit?: unknown) {
  const normalizedPage = Math.max(1, parseInt(String(page || '1'), 10) || 1)
  const normalizedLimit = Math.min(100, Math.max(1, parseInt(String(limit || '20'), 10) || 20))
  
  return {
    page: normalizedPage,
    limit: normalizedLimit,
    offset: (normalizedPage - 1) * normalizedLimit
  }
}

/**
 * Valida e normaliza filtros de data
 */
export function normalizeDateFilters(dateFrom?: unknown, dateTo?: unknown) {
  const from = dateFrom ? String(dateFrom).trim() : undefined
  const to = dateTo ? String(dateTo).trim() : undefined
  
  return {
    date_from: from && from !== '' ? from : undefined,
    date_to: to && to !== '' ? to : undefined
  }
}

/**
 * Valida e normaliza filtros de string
 */
export function normalizeStringFilters(filters: Record<string, unknown>) {
  const normalized: Record<string, string | undefined> = {}
  
  Object.entries(filters).forEach(([key, value]) => {
    if (value === undefined || value === null) {
      normalized[key] = undefined
      return
    }
    
    const stringValue = String(value).trim()
    normalized[key] = stringValue !== '' ? stringValue : undefined
  })
  
  return normalized
}
