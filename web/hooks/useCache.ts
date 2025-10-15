import { useState, useEffect, useCallback, useRef } from 'react'

// Tipos para o hook de cache
interface CacheOptions {
  ttl?: number // Time to live em segundos
  staleWhileRevalidate?: boolean // Se deve retornar dados antigos enquanto revalida
  revalidateOnFocus?: boolean // Se deve revalidar quando a janela ganha foco
  revalidateOnReconnect?: boolean // Se deve revalidar quando reconecta
}

interface CacheState<T> {
  data: T | null
  error: Error | null
  isLoading: boolean
  isValidating: boolean
}

// Cache em memória para o frontend
const memoryCache = new Map<string, {
  data: any
  timestamp: number
  ttl: number
}>()

// Função para gerar chave de cache
function generateCacheKey(url: string, options?: any): string {
  const optionsStr = options ? JSON.stringify(options) : ''
  return `${url}:${optionsStr}`
}

// Função para verificar se cache é válido
function isCacheValid(timestamp: number, ttl: number): boolean {
  return Date.now() - timestamp < ttl * 1000
}

// Função para obter dados do cache
function getFromCache<T>(key: string): T | null {
  const cached = memoryCache.get(key)
  if (cached && isCacheValid(cached.timestamp, cached.ttl)) {
    return cached.data
  }
  return null
}

// Função para armazenar dados no cache
function setToCache<T>(key: string, data: T, ttl: number): void {
  memoryCache.set(key, {
    data,
    timestamp: Date.now(),
    ttl
  })
}

// Função para limpar cache expirado
function cleanExpiredCache(): void {
  const now = Date.now()
  for (const [key, value] of memoryCache.entries()) {
    if (!isCacheValid(value.timestamp, value.ttl)) {
      memoryCache.delete(key)
    }
  }
}

// Hook para cache de dados
export function useCache<T>(
  url: string,
  options: CacheOptions = {}
) {
  const {
    ttl = 300, // 5 minutos por padrão
    staleWhileRevalidate = true,
    revalidateOnFocus = true,
    revalidateOnReconnect = true
  } = options

  const [state, setState] = useState<CacheState<T>>({
    data: null,
    error: null,
    isLoading: true,
    isValidating: false
  })

  const cacheKey = useRef(generateCacheKey(url))
  const abortController = useRef<AbortController | null>(null)

  // Função para buscar dados
  const fetchData = useCallback(async (isRevalidation = false) => {
    try {
      // Cancelar requisição anterior se existir
      if (abortController.current) {
        abortController.current.abort()
      }

      abortController.current = new AbortController()

      setState(prev => ({
        ...prev,
        isLoading: !isRevalidation,
        isValidating: isRevalidation,
        error: null
      }))

      const response = await fetch(url, {
        signal: abortController.current.signal,
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()

      // Armazenar no cache
      setToCache(cacheKey.current, data, ttl)

      setState({
        data,
        error: null,
        isLoading: false,
        isValidating: false
      })

      return data
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return // Requisição foi cancelada
      }

      console.error('❌ Erro ao buscar dados:', error)
      
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error : new Error('Erro desconhecido'),
        isLoading: false,
        isValidating: false
      }))

      throw error
    }
  }, [url, ttl])

  // Função para revalidar dados
  const revalidate = useCallback(() => {
    return fetchData(true)
  }, [fetchData])

  // Função para limpar cache
  const clearCache = useCallback(() => {
    memoryCache.delete(cacheKey.current)
    setState(prev => ({
      ...prev,
      data: null
    }))
  }, [])

  // Função para mutar dados (otimistic update)
  const mutate = useCallback((newData: T | ((prev: T | null) => T)) => {
    const updatedData = typeof newData === 'function' ? newData(state.data) : newData
    
    setState(prev => ({
      ...prev,
      data: updatedData
    }))

    // Armazenar no cache
    setToCache(cacheKey.current, updatedData, ttl)
  }, [state.data, ttl])

  // Função para invalidar e revalidar
  const invalidate = useCallback(() => {
    clearCache()
    return revalidate()
  }, [clearCache, revalidate])

  // Efeito inicial para carregar dados
  useEffect(() => {
    // Verificar cache primeiro
    const cachedData = getFromCache<T>(cacheKey.current)
    if (cachedData) {
      setState(prev => ({
        ...prev,
        data: cachedData,
        isLoading: false
      }))

      // Se staleWhileRevalidate estiver ativo, revalidar em background
      if (staleWhileRevalidate) {
        fetchData(true)
      }
    } else {
      // Não há cache, buscar dados
      fetchData()
    }

    // Limpar cache expirado periodicamente
    const cleanInterval = setInterval(cleanExpiredCache, 60000) // A cada minuto

    return () => {
      clearInterval(cleanInterval)
      if (abortController.current) {
        abortController.current.abort()
      }
    }
  }, [url, fetchData, staleWhileRevalidate])

  // Efeito para revalidar quando a janela ganha foco
  useEffect(() => {
    if (!revalidateOnFocus) return

    const handleFocus = () => {
      if (state.data) {
        revalidate()
      }
    }

    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [revalidateOnFocus, revalidate, state.data])

  // Efeito para revalidar quando reconecta
  useEffect(() => {
    if (!revalidateOnReconnect) return

    const handleOnline = () => {
      if (state.data) {
        revalidate()
      }
    }

    window.addEventListener('online', handleOnline)
    return () => window.removeEventListener('online', handleOnline)
  }, [revalidateOnReconnect, revalidate, state.data])

  return {
    ...state,
    revalidate,
    clearCache,
    mutate,
    invalidate
  }
}

// Hook para cache de múltiplas requisições
export function useCacheMany<T>(
  requests: Array<{ url: string; options?: CacheOptions }>
) {
  const [state, setState] = useState<{
    data: (T | null)[]
    errors: (Error | null)[]
    isLoading: boolean
    isValidating: boolean
  }>({
    data: new Array(requests.length).fill(null),
    errors: new Array(requests.length).fill(null),
    isLoading: true,
    isValidating: false
  })

  const fetchAll = useCallback(async (isRevalidation = false) => {
    setState(prev => ({
      ...prev,
      isLoading: !isRevalidation,
      isValidating: isRevalidation,
      errors: new Array(requests.length).fill(null)
    }))

    const promises = requests.map(async (request, index) => {
      try {
        const response = await fetch(request.url)
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }
        return await response.json()
      } catch (error) {
        console.error(`❌ Erro ao buscar dados ${index}:`, error)
        throw error
      }
    })

    try {
      const results = await Promise.allSettled(promises)
      
      const data = results.map(result => 
        result.status === 'fulfilled' ? result.value : null
      )
      
      const errors = results.map(result => 
        result.status === 'rejected' ? result.reason : null
      )

      setState({
        data,
        errors,
        isLoading: false,
        isValidating: false
      })

      return data
    } catch (error) {
      console.error('❌ Erro ao buscar múltiplos dados:', error)
      setState(prev => ({
        ...prev,
        isLoading: false,
        isValidating: false
      }))
      throw error
    }
  }, [requests])

  const revalidate = useCallback(() => {
    return fetchAll(true)
  }, [fetchAll])

  const clearCache = useCallback(() => {
    requests.forEach(request => {
      const key = generateCacheKey(request.url, request.options)
      memoryCache.delete(key)
    })
    setState(prev => ({
      ...prev,
      data: new Array(requests.length).fill(null)
    }))
  }, [requests])

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  return {
    ...state,
    revalidate,
    clearCache
  }
}

// Função para limpar todo o cache
export function clearAllCache(): void {
  memoryCache.clear()
}

// Função para obter estatísticas do cache
export function getCacheStats() {
  return {
    size: memoryCache.size,
    keys: Array.from(memoryCache.keys())
  }
}
