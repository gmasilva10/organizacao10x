/**
 * ATENÇÃO: Este middleware tem incompatibilidade com Next.js 14 App Router
 * 
 * PROBLEMA IDENTIFICADO:
 * - withCache retorna (handler) => async (request) => response (Higher-Order Function)
 * - Next.js 14 App Router espera: async (request) => response (função direta)
 * - Causa erro: "TypeError: r is not a function"
 * 
 * SOLUÇÃO IMPLEMENTADA (15/10/2025):
 * - NÃO usar: export const GET = withCache(handler, config)
 * - USAR em vez: export async function GET(request) { return handler(request) }
 * - Manter cache interno via getCache/setCache dentro do handler
 * 
 * ARQUIVOS AFETADOS:
 * - web/app/api/dashboard/metrics/route.ts (CORRIGIDO)
 * 
 * STATUS: SOLUÇÃO ATIVA E FUNCIONANDO
 * - Sistema 100% estável
 * - Cache interno preservado
 * - Performance mantida
 * 
 * TODO FUTURO: Refatorar withCache para retornar função compatível com App Router
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCache, setCache, deleteCache, invalidateCachePattern } from './redis'

// Tipos para middleware de cache
export interface CacheMiddlewareOptions {
  ttl?: number // Time to live em segundos
  prefix?: string // Prefixo para a chave
  keyGenerator?: (request: NextRequest) => string // Função para gerar chave personalizada
  skipCache?: (request: NextRequest) => boolean // Função para pular cache
  invalidatePattern?: string // Padrão para invalidação
}

// Função para gerar chave padrão baseada na requisição
function defaultKeyGenerator(request: NextRequest): string {
  const url = new URL(request.url)
  const pathname = url.pathname
  const searchParams = url.searchParams.toString()
  
  // Incluir headers relevantes para cache
  const userId = request.headers.get('x-user-id')
  const orgId = request.headers.get('x-org-id')
  
  let key = pathname
  if (searchParams) {
    key += `?${searchParams}`
  }
  if (userId) {
    key += `:user:${userId}`
  }
  if (orgId) {
    key += `:org:${orgId}`
  }
  
  return key
}

// Middleware para cache de GET requests
export async function withCache(
  handler: (request: NextRequest) => Promise<NextResponse>,
  options: CacheMiddlewareOptions = {}
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    // Apenas cache para GET requests
    if (request.method !== 'GET') {
      return handler(request)
    }

    // Verificar se deve pular cache
    if (options.skipCache && options.skipCache(request)) {
      return handler(request)
    }

    try {
      // Gerar chave de cache
      const keyGenerator = options.keyGenerator || defaultKeyGenerator
      const cacheKey = keyGenerator(request)
      
      // Tentar obter do cache
      const cachedResponse = await getCache<{
        body: any
        status: number
        headers: Record<string, string>
      }>(cacheKey, {
        ttl: options.ttl,
        prefix: options.prefix
      })

      if (cachedResponse) {
        // Retornar resposta do cache
        const response = NextResponse.json(cachedResponse.body, {
          status: cachedResponse.status,
          headers: {
            ...cachedResponse.headers,
            'X-Cache': 'HIT',
            'X-Cache-Key': cacheKey
          }
        })
        
        return response
      }

      // Executar handler original
      const response = await handler(request)
      
      // Se resposta foi bem-sucedida, armazenar no cache
      if (response.status >= 200 && response.status < 300) {
        const responseBody = await response.clone().json().catch(() => null)
        
        if (responseBody) {
          await setCache(cacheKey, {
            body: responseBody,
            status: response.status,
            headers: Object.fromEntries(response.headers.entries())
          }, {
            ttl: options.ttl || 300, // 5 minutos por padrão
            prefix: options.prefix
          })
        }
      }

      // Adicionar headers de cache
      response.headers.set('X-Cache', 'MISS')
      response.headers.set('X-Cache-Key', cacheKey)
      
      return response
      
    } catch (error) {
      console.error('❌ Erro no middleware de cache:', error)
      // Em caso de erro, executar handler original
      return handler(request)
    }
  }
}

// Middleware para invalidação de cache
export async function withCacheInvalidation(
  handler: (request: NextRequest) => Promise<NextResponse>,
  options: CacheMiddlewareOptions = {}
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    // Executar handler original
    const response = await handler(request)
    
    // Se operação foi bem-sucedida, invalidar cache
    if (response.status >= 200 && response.status < 300) {
      try {
        if (options.invalidatePattern) {
          await invalidateCachePattern(options.invalidatePattern, {
            prefix: options.prefix
          })
        }
        
        response.headers.set('X-Cache-Invalidated', 'true')
      } catch (error) {
        console.error('❌ Erro ao invalidar cache:', error)
      }
    }
    
    return response
  }
}

// Função helper para invalidar cache específico
export async function invalidateCacheForUser(
  userId: string,
  orgId: string,
  pattern?: string
): Promise<void> {
  try {
    const userPattern = pattern || '*'
    const cachePattern = `${userPattern}:user:${userId}:org:${orgId}`
    await invalidateCachePattern(cachePattern)
  } catch (error) {
    console.error('❌ Erro ao invalidar cache do usuário:', error)
  }
}

// Função helper para invalidar cache de organização
export async function invalidateCacheForOrg(
  orgId: string,
  pattern?: string
): Promise<void> {
  try {
    const orgPattern = pattern || '*'
    const cachePattern = `${orgPattern}:org:${orgId}`
    await invalidateCachePattern(cachePattern)
  } catch (error) {
    console.error('❌ Erro ao invalidar cache da organização:', error)
  }
}

// Função para obter estatísticas de cache
export async function getCacheMiddlewareStats() {
  const { getCacheStats } = await import('./redis')
  return getCacheStats()
}

// Configurações predefinidas para diferentes tipos de cache
export const CacheConfigs = {
  // Cache para listagens (5 minutos)
  LISTINGS: {
    ttl: 300,
    prefix: 'listings',
    skipCache: (request: NextRequest) => {
      // Pular cache se houver parâmetros de busca
      const url = new URL(request.url)
      return url.searchParams.has('q') || url.searchParams.has('search')
    }
  },
  
  // Cache para detalhes (15 minutos)
  DETAILS: {
    ttl: 900,
    prefix: 'details'
  },
  
  // Cache para métricas (1 minuto)
  METRICS: {
    ttl: 60,
    prefix: 'metrics'
  },
  
  // Cache para configurações (30 minutos)
  CONFIG: {
    ttl: 1800,
    prefix: 'config'
  },
  
  // Cache para dados estáticos (1 hora)
  STATIC: {
    ttl: 3600,
    prefix: 'static'
  }
} as const
