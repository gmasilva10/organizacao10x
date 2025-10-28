/**
 * Cache em memória otimizado
 * SEM dependência de Redis
 * Com deduplicação, SWR, jitter e LRU
 */

// Configurações otimizadas
const MAX_ITEMS = 5_000          // limite LRU
const SWR_GRACE_SECONDS = 60     // janela para servir stale
const JITTER_PCT = 0.1           // ±10% no TTL

// Cache em memória
const cache = new Map<string, {
  data: any
  timestamp: number
  ttl: number
}>()

// Deduplicação de requisições em andamento
const inflight = new Map<string, Promise<any>>()

// Estatísticas de cache
const stats = {
  hits: 0,
  misses: 0,
  sets: 0,
  deletes: 0,
  errors: 0
}

// Configurações
export interface CacheOptions {
  ttl?: number // Time to live em segundos
  prefix?: string
}

// Função para gerar chave de cache
function generateCacheKey(key: string, prefix?: string): string {
  const env = process.env.NODE_ENV || 'development'
  const orgPrefix = prefix ? `${prefix}:` : ''
  return `${env}:${orgPrefix}${key}`
}

// Função para adicionar jitter ao TTL
function withJitter(ttl: number): number {
  const delta = ttl * JITTER_PCT
  const jitter = (Math.random() * 2 - 1) * delta // [-delta, +delta]
  return Math.max(1, Math.floor(ttl + jitter))
}

// Função para verificar se cache é válido
function isValid(timestamp: number, ttl: number): boolean {
  return Date.now() - timestamp < ttl * 1000
}

// Move item para o fim (efeito LRU na Map)
function touchAsMostRecent(key: string): void {
  const v = cache.get(key)
  if (v) { 
    cache.delete(key) 
    cache.set(key, v) 
  }
}

// Função para limpar cache expirado periodicamente (opcional)
export function cleanupExpiredCache(): number {
  let removed = 0
  const now = Date.now()
  
  for (const [key, value] of cache.entries()) {
    if (!isValid(value.timestamp, value.ttl)) {
      cache.delete(key)
      removed++
    }
  }
  
  return removed
}

// Limpar cache expirado a cada 5 minutos
setInterval(cleanupExpiredCache, 5 * 60 * 1000)

// ============================================================
// API SIMPLES E LIMPA - SEM REDIS
// ============================================================

export async function getCache<T>(key: string, options: CacheOptions = {}): Promise<T | null> {
  try {
    const cacheKey = generateCacheKey(key, options.prefix)
    const c = cache.get(cacheKey)
    
    if (!c) { 
      stats.misses++ 
      return null 
    }

    const ageMs = Date.now() - c.timestamp
    const valid = ageMs < c.ttl * 1000

    if (valid) {
      stats.hits++
      touchAsMostRecent(cacheKey) // LRU
      return c.data as T
    }

    // Expirado, mas dentro da janela SWR? Entrega stale
    if (ageMs < (c.ttl + SWR_GRACE_SECONDS) * 1000) {
      stats.hits++ // servimos algo útil
      return c.data as T
    }

    // Totalmente expirado
    cache.delete(cacheKey)
    stats.misses++
    return null
  } catch (error) {
    stats.errors++
    return null
  }
}

export async function setCache<T>(key: string, value: T, options: CacheOptions = {}): Promise<boolean> {
  try {
    const cacheKey = generateCacheKey(key, options.prefix)
    const ttl = withJitter(options.ttl || 300) // jitter aplicado

    cache.set(cacheKey, {
      data: value,
      timestamp: Date.now(),
      ttl
    })
    
    stats.sets++

    // LRU: se passar do limite, remove o mais antigo
    while (cache.size > MAX_ITEMS) {
      const oldestKey = cache.keys().next().value
      if (oldestKey) {
        cache.delete(oldestKey)
        stats.deletes++
      } else {
        break
      }
    }

    return true
  } catch (error) {
    stats.errors++
    return false
  }
}

export async function deleteCache(key: string, options: CacheOptions = {}): Promise<boolean> {
  try {
    const cacheKey = generateCacheKey(key, options.prefix)
    const deleted = cache.delete(cacheKey)
    
    if (deleted) {
      stats.deletes++
    }
    
    return deleted
  } catch (error) {
    stats.errors++
    return false
  }
}

export async function invalidateCachePattern(pattern: string, options: CacheOptions = {}): Promise<number> {
  let removed = 0
  const cachePattern = generateCacheKey(pattern, options.prefix)
  
  try {
    for (const [key] of cache.entries()) {
      if (key.includes(cachePattern)) {
        cache.delete(key)
        removed++
      }
    }
    
    stats.deletes += removed
    return removed
  } catch (error) {
    stats.errors++
    return 0
  }
}

export async function existsCache(key: string, options: CacheOptions = {}): Promise<boolean> {
  const cacheKey = generateCacheKey(key, options.prefix)
  const cached = cache.get(cacheKey)
  return cached ? isValid(cached.timestamp, cached.ttl) : false
}

export async function getCacheTTL(key: string, options: CacheOptions = {}): Promise<number> {
  const cacheKey = generateCacheKey(key, options.prefix)
  const cached = cache.get(cacheKey)
  
  if (!cached) {
    return -1
  }
  
  const remaining = cached.ttl * 1000 - (Date.now() - cached.timestamp)
  return Math.floor(remaining / 1000)
}

export async function clearAllCache(): Promise<boolean> {
  try {
    cache.clear()
    stats.deletes = 0
    return true
  } catch (error) {
    stats.errors++
    return false
  }
}

export function getCacheStats() {
  return { ...stats }
}

export function resetCacheStats(): void {
  stats.hits = 0
  stats.misses = 0
  stats.sets = 0
  stats.deletes = 0
  stats.errors = 0
}

// Função helper para cache com fallback + deduplicação
export async function getOrSetCache<T>(
  key: string,
  fallbackFn: () => Promise<T>,
  options: CacheOptions = {}
): Promise<T> {
  const cacheKey = generateCacheKey(key, options.prefix)
  
  // Tentar obter do cache primeiro
  const cached = await getCache<T>(key, options)
  if (cached !== null) {
    return cached
  }

  // Deduplicação: se já existe uma requisição em andamento, aguardar
  const running = inflight.get(cacheKey)
  if (running) {
    return running as Promise<T>
  }

  // Executar fallback e armazenar Promise para deduplicação
  const p = (async () => {
    try {
      const result = await fallbackFn()
      await setCache(key, result, options)
      return result
    } finally {
      inflight.delete(cacheKey)
    }
  })()

  inflight.set(cacheKey, p)
  return p
}

// Obter informações do cache
export async function getCacheInfo() {
  return {
    connected: true,
    stats: getCacheStats(),
    size: cache.size,
    type: 'memory'
  }
}

