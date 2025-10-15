import { NextRequest, NextResponse } from 'next/server'
import { 
  checkRateLimit, 
  createIdentifier, 
  recordRateLimitStats,
  RateLimitConfig,
  RateLimitResult 
} from './limiter'

// Tipos para middleware de rate limiting
export interface RateLimitMiddlewareOptions extends RateLimitConfig {
  message?: string // Mensagem de erro personalizada
  statusCode?: number // Código de status HTTP personalizado
  headers?: Record<string, string> // Headers adicionais
  onLimitReached?: (identifier: string, result: RateLimitResult) => void // Callback quando limite é atingido
  getUserId?: (request: NextRequest) => Promise<string | null> // Função para obter user ID
  getOrgId?: (request: NextRequest) => Promise<string | null> // Função para obter org ID
}

// Função para obter IP da requisição
function getClientIp(request: NextRequest): string | null {
  // Tentar obter de headers de proxy
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }

  const realIp = request.headers.get('x-real-ip')
  if (realIp) {
    return realIp
  }

  // Fallback para IP direto (pode não estar disponível em algumas plataformas)
  return null
}

// Função para obter User-Agent
function getUserAgent(request: NextRequest): string | null {
  return request.headers.get('user-agent')
}

// Middleware para rate limiting
export function withRateLimit(
  handler: (request: NextRequest) => Promise<NextResponse>,
  options: RateLimitMiddlewareOptions
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    try {
      // Obter informações da requisição
      const ip = getClientIp(request)
      const userAgent = getUserAgent(request)
      
      // Obter user ID e org ID se fornecido
      let userId: string | null = null
      let orgId: string | null = null
      
      if (options.getUserId) {
        userId = await options.getUserId(request)
      }
      
      if (options.getOrgId) {
        orgId = await options.getOrgId(request)
      }

      // Criar identificador
      const identifier = createIdentifier(ip, userAgent, userId || undefined, orgId || undefined)

      // Verificar rate limit
      const result = await checkRateLimit(identifier, options)

      // Registrar estatísticas
      recordRateLimitStats(identifier, result)

      // Se limite foi excedido
      if (!result.success) {
        console.warn(`🚫 Rate limit excedido para ${identifier}`, {
          limit: result.limit,
          resetTime: new Date(result.resetTime).toISOString(),
          retryAfter: result.retryAfter
        })

        // Chamar callback se fornecido
        if (options.onLimitReached) {
          options.onLimitReached(identifier, result)
        }

        // Retornar erro 429 Too Many Requests
        return NextResponse.json(
          {
            error: 'rate_limit_exceeded',
            message: options.message || 'Muitas requisições. Por favor, tente novamente mais tarde.',
            limit: result.limit,
            remaining: result.remaining,
            resetTime: result.resetTime,
            retryAfter: result.retryAfter
          },
          {
            status: options.statusCode || 429,
            headers: {
              'X-RateLimit-Limit': result.limit.toString(),
              'X-RateLimit-Remaining': result.remaining.toString(),
              'X-RateLimit-Reset': result.resetTime.toString(),
              'Retry-After': (result.retryAfter || 60).toString(),
              ...options.headers
            }
          }
        )
      }

      // Executar handler original
      const response = await handler(request)

      // Adicionar headers de rate limit
      response.headers.set('X-RateLimit-Limit', result.limit.toString())
      response.headers.set('X-RateLimit-Remaining', result.remaining.toString())
      response.headers.set('X-RateLimit-Reset', result.resetTime.toString())

      return response

    } catch (error) {
      console.error('❌ Erro no middleware de rate limit:', error)
      // Em caso de erro, permitir a requisição
      return handler(request)
    }
  }
}

// Função helper para aplicar rate limit em rotas
export function rateLimit(
  config: RateLimitMiddlewareOptions
) {
  return (handler: (request: NextRequest) => Promise<NextResponse>) => {
    return withRateLimit(handler, config)
  }
}

// Configurações predefinidas para diferentes tipos de rotas
export const RateLimitMiddlewareConfigs = {
  // Rotas de autenticação (strict)
  AUTH: {
    maxRequests: 5,
    windowMs: 900000, // 15 minutos
    message: 'Muitas tentativas de autenticação. Por favor, aguarde antes de tentar novamente.',
    statusCode: 429
  },
  
  // Rotas de API (moderate)
  API: {
    maxRequests: 100,
    windowMs: 60000, // 1 minuto
    message: 'Limite de requisições excedido. Por favor, aguarde antes de fazer novas requisições.',
    statusCode: 429
  },
  
  // Rotas públicas (generous)
  PUBLIC: {
    maxRequests: 60,
    windowMs: 60000, // 1 minuto
    message: 'Muitas requisições. Por favor, aguarde um momento.',
    statusCode: 429
  },
  
  // Rotas de upload (strict)
  UPLOAD: {
    maxRequests: 10,
    windowMs: 3600000, // 1 hora
    message: 'Limite de uploads excedido. Por favor, aguarde antes de fazer novos uploads.',
    statusCode: 429
  },
  
  // Rotas de busca (moderate)
  SEARCH: {
    maxRequests: 30,
    windowMs: 60000, // 1 minuto
    message: 'Muitas buscas realizadas. Por favor, aguarde um momento.',
    statusCode: 429
  },
  
  // Rotas de webhook (generous)
  WEBHOOK: {
    maxRequests: 1000,
    windowMs: 3600000, // 1 hora
    message: 'Limite de webhooks excedido.',
    statusCode: 429
  }
} as const
