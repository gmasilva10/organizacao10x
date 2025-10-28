import { createClient, RedisClientType } from 'redis'
import { logger } from '../logger'

// Configuração do Redis
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379'
const REDIS_PASSWORD = process.env.REDIS_PASSWORD
const REDIS_DB = process.env.REDIS_DB || '0'

// Cliente Redis singleton
let redisClient: RedisClientType | null = null

// Função para criar cliente Redis
function createRedisClient(): RedisClientType {
  const client = createClient({
    url: REDIS_URL,
    password: REDIS_PASSWORD,
    database: parseInt(REDIS_DB),
    socket: {
      reconnectStrategy: (retries) => {
        if (retries > 10) {
          console.error('❌ Redis: Máximo de tentativas de reconexão atingido')
          return new Error('Máximo de tentativas de reconexão atingido')
        }
        return Math.min(retries * 100, 3000)
      }
    }
  })

  client.on('error', (err) => {
    console.error('❌ Redis Client Error:', err)
  })

  client.on('connect', () => {
    console.log('✅ Redis Client Connected')
  })

  client.on('ready', () => {
    console.log('✅ Redis Client Ready')
  })

  client.on('reconnecting', () => {
    console.log('🔄 Redis Client Reconnecting...')
  })

  return client as any
}

// Função para obter cliente Redis
export async function getRedisClient(): Promise<RedisClientType | null> {
  try {
    // Verificar se Redis está disponível
    if (!process.env.REDIS_URL && process.env.NODE_ENV === 'development') {
      logger.debug('⚠️ Redis não configurado, usando cache em memória')
      return null
    }

    if (!redisClient) {
      redisClient = createRedisClient()
      await redisClient.connect()
    }
    
    // Verificar se está conectado
    if (!redisClient.isReady) {
      await redisClient.connect()
    }
    
    return redisClient
  } catch (error) {
    logger.error('❌ Erro ao conectar Redis:', error)
    logger.warn('⚠️ Redis não disponível, usando cache em memória')
    return null
  }
}

// Função para fechar conexão Redis
export async function closeRedisClient(): Promise<void> {
  try {
    if (redisClient && redisClient.isReady) {
      await redisClient.quit()
      redisClient = null
    }
  } catch (error) {
    logger.error('❌ Erro ao fechar Redis:', error)
  }
}

// Tipos para cache
export interface CacheOptions {
  ttl?: number // Time to live em segundos
  prefix?: string // Prefixo para a chave
  serialize?: boolean // Se deve serializar/deserializar automaticamente
}

export interface CacheStats {
  hits: number
  misses: number
  sets: number
  deletes: number
  errors: number
}

// Cache em memória como fallback
const memoryCache = new Map<string, {
  data: any
  timestamp: number
  ttl: number
}>()

// Função para verificar se cache em memória é válido
function isMemoryCacheValid(timestamp: number, ttl: number): boolean {
  return Date.now() - timestamp < ttl * 1000
}

// Função para obter dados do cache em memória
function getFromMemoryCache<T>(key: string): T | null {
  const cached = memoryCache.get(key)
  if (cached && isMemoryCacheValid(cached.timestamp, cached.ttl)) {
    return cached.data
  }
  return null
}

// Função para armazenar dados no cache em memória
function setToMemoryCache<T>(key: string, data: T, ttl: number): void {
  memoryCache.set(key, {
    data,
    timestamp: Date.now(),
    ttl
  })
}

// Função para deletar dados do cache em memória
function deleteFromMemoryCache(key: string): boolean {
  return memoryCache.delete(key)
}

// Estatísticas de cache
const cacheStats: CacheStats = {
  hits: 0,
  misses: 0,
  sets: 0,
  deletes: 0,
  errors: 0
}

// Função para obter estatísticas
export function getCacheStats(): CacheStats {
  return { ...cacheStats }
}

// Função para resetar estatísticas
export function resetCacheStats(): void {
  cacheStats.hits = 0
  cacheStats.misses = 0
  cacheStats.sets = 0
  cacheStats.deletes = 0
  cacheStats.errors = 0
}

// Função para gerar chave de cache
function generateCacheKey(key: string, prefix?: string): string {
  const env = process.env.NODE_ENV || 'development'
  const orgPrefix = prefix ? `${prefix}:` : ''
  return `${env}:${orgPrefix}${key}`
}

// Função para serializar dados
function serialize(data: any): string {
  try {
    return JSON.stringify(data)
  } catch (error) {
    logger.error('❌ Erro ao serializar dados:', error)
    cacheStats.errors++
    throw error
  }
}

// Função para deserializar dados
function deserialize<T>(data: string): T {
  try {
    return JSON.parse(data)
  } catch (error) {
    logger.error('❌ Erro ao deserializar dados:', error)
    cacheStats.errors++
    throw error
  }
}

// Função para obter dados do cache
export async function getCache<T>(
  key: string, 
  options: CacheOptions = {}
): Promise<T | null> {
  try {
    const cacheKey = generateCacheKey(key, options.prefix)
    
    // Tentar Redis primeiro
    const client = await getRedisClient()
    if (client) {
      const data = await client.get(cacheKey)
      
      if (data !== null) {
        cacheStats.hits++
        if (options.serialize !== false) {
          return deserialize<T>(data)
        }
        return data as T
      }
    }

    // Fallback para cache em memória
    const memoryData = getFromMemoryCache<T>(cacheKey)
    if (memoryData !== null) {
      cacheStats.hits++
      return memoryData
    }

    cacheStats.misses++
    return null
  } catch (error) {
    logger.error('❌ Erro ao obter cache:', error)
    cacheStats.errors++
    cacheStats.misses++
    return null
  }
}

// Função para definir dados no cache
export async function setCache<T>(
  key: string, 
  value: T, 
  options: CacheOptions = {}
): Promise<boolean> {
  try {
    const cacheKey = generateCacheKey(key, options.prefix)
    const ttl = options.ttl || 300 // 5 minutos por padrão
    
    // Tentar Redis primeiro
    const client = await getRedisClient()
    if (client) {
      const serializedValue = options.serialize !== false ? serialize(value) : String(value)
      
      if (options.ttl) {
        await client.setEx(cacheKey, options.ttl, serializedValue)
      } else {
        await client.set(cacheKey, serializedValue)
      }
    } else {
      // Fallback para cache em memória
      setToMemoryCache(cacheKey, value, ttl)
    }

    cacheStats.sets++
    return true
  } catch (error) {
    logger.error('❌ Erro ao definir cache:', error)
    cacheStats.errors++
    
    // Em caso de erro, tentar cache em memória
    try {
      const cacheKey = generateCacheKey(key, options.prefix)
      const ttl = options.ttl || 300
      setToMemoryCache(cacheKey, value, ttl)
      cacheStats.sets++
      return true
    } catch (memoryError) {
      logger.error('❌ Erro ao definir cache em memória:', memoryError)
      return false
    }
  }
}

// Função para deletar dados do cache
export async function deleteCache(
  key: string, 
  options: CacheOptions = {}
): Promise<boolean> {
  try {
    const client = await getRedisClient()
    if (!client) {
      logger.warn('⚠️ Redis não disponível, cache não deletado')
      return false
    }

    const cacheKey = generateCacheKey(key, options.prefix)
    const result = await client.del(cacheKey)
    
    cacheStats.deletes++
    return result > 0
  } catch (error) {
    logger.error('❌ Erro ao deletar cache:', error)
    cacheStats.errors++
    return false
  }
}

// Função para invalidar cache por padrão
export async function invalidateCachePattern(
  pattern: string, 
  options: CacheOptions = {}
): Promise<number> {
  try {
    const client = await getRedisClient()
    if (!client) {
      logger.warn('⚠️ Redis não disponível, cache não invalidado')
      return 0
    }

    const cachePattern = generateCacheKey(pattern, options.prefix)
    const keys = await client.keys(cachePattern)
    
    if (keys.length === 0) {
      return 0
    }

    const result = await client.del(keys)
    cacheStats.deletes += result
    return result
  } catch (error) {
    logger.error('❌ Erro ao invalidar cache por padrão:', error)
    cacheStats.errors++
    return 0
  }
}

// Função para verificar se chave existe no cache
export async function existsCache(
  key: string, 
  options: CacheOptions = {}
): Promise<boolean> {
  try {
    const client = await getRedisClient()
    if (!client) {
      return false
    }

    const cacheKey = generateCacheKey(key, options.prefix)
    const result = await client.exists(cacheKey)
    return result === 1
  } catch (error) {
    logger.error('❌ Erro ao verificar existência no cache:', error)
    cacheStats.errors++
    return false
  }
}

// Função para obter TTL de uma chave
export async function getCacheTTL(
  key: string, 
  options: CacheOptions = {}
): Promise<number> {
  try {
    const client = await getRedisClient()
    if (!client) {
      return -1
    }

    const cacheKey = generateCacheKey(key, options.prefix)
    return await client.ttl(cacheKey)
  } catch (error) {
    logger.error('❌ Erro ao obter TTL do cache:', error)
    cacheStats.errors++
    return -1
  }
}

// Função para limpar todo o cache (cuidado!)
export async function clearAllCache(): Promise<boolean> {
  try {
    const client = await getRedisClient()
    if (!client) {
      return false
    }

    await client.flushDb()
    logger.info('🗑️ Todo o cache Redis foi limpo')
    return true
  } catch (error) {
    logger.error('❌ Erro ao limpar cache:', error)
    cacheStats.errors++
    return false
  }
}

// Função helper para cache com fallback
export async function getOrSetCache<T>(
  key: string,
  fallbackFn: () => Promise<T>,
  options: CacheOptions = {}
): Promise<T> {
  // Tentar obter do cache
  const cached = await getCache<T>(key, options)
  if (cached !== null) {
    return cached
  }

  // Executar função fallback
  const result = await fallbackFn()
  
  // Armazenar no cache
  await setCache(key, result, options)
  
  return result
}

// Função para obter informações do Redis
export async function getRedisInfo(): Promise<any> {
  try {
    const client = await getRedisClient()
    if (!client) {
      return null
    }

    const info = await client.info()
    return {
      connected: client.isReady,
      stats: getCacheStats(),
      info: info
    }
  } catch (error) {
    logger.error('❌ Erro ao obter informações do Redis:', error)
    return null
  }
}
