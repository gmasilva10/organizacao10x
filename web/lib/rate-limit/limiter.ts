import { getCache, setCache } from '@/lib/cache/simple'

// Tipos para rate limiting
export interface RateLimitConfig {
  maxRequests: number // Número máximo de requisições
  windowMs: number // Janela de tempo em milissegundos
  skipSuccessfulRequests?: boolean // Se deve pular requisições bem-sucedidas
  skipFailedRequests?: boolean // Se deve pular requisições falhadas
  keyGenerator?: (identifier: string) => string // Gerador de chave personalizado
}

export interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  resetTime: number
  retryAfter?: number
}

// Configurações padrão de rate limiting
export const RateLimitConfigs = {
  // Strict: 10 requisições por minuto
  STRICT: {
    maxRequests: 10,
    windowMs: 60000
  },
  
  // Moderate: 30 requisições por minuto
  MODERATE: {
    maxRequests: 30,
    windowMs: 60000
  },
  
  // Generous: 100 requisições por minuto
  GENEROUS: {
    maxRequests: 100,
    windowMs: 60000
  },
  
  // API: 1000 requisições por hora
  API: {
    maxRequests: 1000,
    windowMs: 3600000
  },
  
  // Auth: 5 tentativas por 15 minutos
  AUTH: {
    maxRequests: 5,
    windowMs: 900000
  },
  
  // Public: 60 requisições por hora
  PUBLIC: {
    maxRequests: 60,
    windowMs: 3600000
  }
} as const

// Função para gerar chave padrão
function defaultKeyGenerator(identifier: string): string {
  return `rate-limit:${identifier}`
}

// Função para verificar rate limit
export async function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  try {
    const keyGenerator = config.keyGenerator || defaultKeyGenerator
    const key = keyGenerator(identifier)
    const now = Date.now()
    
    // Obter dados do cache
    const data = await getCache<{
      count: number
      resetTime: number
    }>(key, {
      prefix: 'rate-limit'
    })

    // Se não há dados ou a janela expirou, criar nova janela
    if (!data || now >= data.resetTime) {
      const resetTime = now + config.windowMs
      
      await setCache(key, {
        count: 1,
        resetTime
      }, {
        ttl: Math.ceil(config.windowMs / 1000),
        prefix: 'rate-limit'
      })

      return {
        success: true,
        limit: config.maxRequests,
        remaining: config.maxRequests - 1,
        resetTime
      }
    }

    // Incrementar contador
    const newCount = data.count + 1

    // Verificar se excedeu o limite
    if (newCount > config.maxRequests) {
      const retryAfter = Math.ceil((data.resetTime - now) / 1000)
      
      return {
        success: false,
        limit: config.maxRequests,
        remaining: 0,
        resetTime: data.resetTime,
        retryAfter
      }
    }

    // Atualizar contador
    await setCache(key, {
      count: newCount,
      resetTime: data.resetTime
    }, {
      ttl: Math.ceil((data.resetTime - now) / 1000),
      prefix: 'rate-limit'
    })

    return {
      success: true,
      limit: config.maxRequests,
      remaining: config.maxRequests - newCount,
      resetTime: data.resetTime
    }
  } catch (error) {
    console.error('❌ Erro ao verificar rate limit:', error)
    
    // Em caso de erro, permitir a requisição mas logar o erro
    return {
      success: true,
      limit: config.maxRequests,
      remaining: config.maxRequests,
      resetTime: Date.now() + config.windowMs
    }
  }
}

// Função para resetar rate limit
export async function resetRateLimit(identifier: string): Promise<boolean> {
  try {
    const { deleteCache } = await import('@/lib/cache/simple')
    const key = `rate-limit:${identifier}`
    return await deleteCache(key, { prefix: 'rate-limit' })
  } catch (error) {
    console.error('❌ Erro ao resetar rate limit:', error)
    return false
  }
}

// Função para obter informações de rate limit
export async function getRateLimitInfo(
  identifier: string
): Promise<{
  count: number
  resetTime: number
  timeRemaining: number
} | null> {
  try {
    const key = `rate-limit:${identifier}`
    const data = await getCache<{
      count: number
      resetTime: number
    }>(key, {
      prefix: 'rate-limit'
    })

    if (!data) {
      return null
    }

    const now = Date.now()
    const timeRemaining = Math.max(0, Math.ceil((data.resetTime - now) / 1000))

    return {
      count: data.count,
      resetTime: data.resetTime,
      timeRemaining
    }
  } catch (error) {
    console.error('❌ Erro ao obter informações de rate limit:', error)
    return null
  }
}

// Função para criar identificador baseado em IP e User-Agent
export function createIdentifier(
  ip: string | null,
  userAgent: string | null,
  userId?: string,
  orgId?: string
): string {
  const parts = []
  
  if (userId) {
    parts.push(`user:${userId}`)
  }
  
  if (orgId) {
    parts.push(`org:${orgId}`)
  }
  
  if (ip) {
    parts.push(`ip:${ip}`)
  }
  
  if (userAgent) {
    // Hash do user agent para economizar espaço
    const hash = simpleHash(userAgent)
    parts.push(`ua:${hash}`)
  }
  
  return parts.join(':') || 'anonymous'
}

// Função auxiliar para hash simples
function simpleHash(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return Math.abs(hash).toString(36)
}

// Estatísticas de rate limiting
interface RateLimitStats {
  totalRequests: number
  blockedRequests: number
  allowedRequests: number
  uniqueIdentifiers: Set<string>
}

const stats: RateLimitStats = {
  totalRequests: 0,
  blockedRequests: 0,
  allowedRequests: 0,
  uniqueIdentifiers: new Set()
}

// Função para registrar estatísticas
export function recordRateLimitStats(
  identifier: string,
  result: RateLimitResult
): void {
  stats.totalRequests++
  stats.uniqueIdentifiers.add(identifier)
  
  if (result.success) {
    stats.allowedRequests++
  } else {
    stats.blockedRequests++
  }
}

// Função para obter estatísticas
export function getRateLimitStats() {
  return {
    totalRequests: stats.totalRequests,
    blockedRequests: stats.blockedRequests,
    allowedRequests: stats.allowedRequests,
    uniqueIdentifiers: stats.uniqueIdentifiers.size,
    blockRate: stats.totalRequests > 0 
      ? Math.round((stats.blockedRequests / stats.totalRequests) * 100 * 100) / 100 
      : 0
  }
}

// Função para resetar estatísticas
export function resetRateLimitStats(): void {
  stats.totalRequests = 0
  stats.blockedRequests = 0
  stats.allowedRequests = 0
  stats.uniqueIdentifiers.clear()
}
