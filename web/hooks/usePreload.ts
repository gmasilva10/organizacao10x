"use client"

import { useCallback, useRef } from 'react'

interface PreloadOptions {
  timeout?: number
  priority?: 'high' | 'low'
}

/**
 * Hook para pré-carregamento inteligente de módulos
 * Implementa modulePreload onHover/onFocus para pré-aquecer chunks
 */
export function usePreload() {
  const preloadedModules = useRef<Set<string>>(new Set())
  const preloadTimeouts = useRef<Map<string, NodeJS.Timeout>>(new Map())

  const preloadModule = useCallback(async (
    modulePath: string, 
    options: PreloadOptions = {}
  ) => {
    const { timeout = 200, priority = 'low' } = options

    // Evitar pré-carregamento duplicado
    if (preloadedModules.current.has(modulePath)) {
      return Promise.resolve()
    }

    // Limpar timeout anterior se existir
    const existingTimeout = preloadTimeouts.current.get(modulePath)
    if (existingTimeout) {
      clearTimeout(existingTimeout)
    }

    return new Promise<void>((resolve) => {
      const timeoutId = setTimeout(async () => {
        try {
          // Marcar como pré-carregado
          preloadedModules.current.add(modulePath)
          
          // Pré-carregar o módulo
          await import(/* webpackChunkName: "[request]" */ modulePath)
          
          console.log(`[PRELOAD] Módulo pré-carregado: ${modulePath}`)
          resolve()
        } catch (error) {
          console.warn(`[PRELOAD] Erro ao pré-carregar ${modulePath}:`, error)
          // Remover do cache em caso de erro para permitir nova tentativa
          preloadedModules.current.delete(modulePath)
          resolve()
        } finally {
          preloadTimeouts.current.delete(modulePath)
        }
      }, timeout)

      preloadTimeouts.current.set(modulePath, timeoutId)
    })
  }, [])

  const preloadOnHover = useCallback((
    modulePath: string,
    options: PreloadOptions = {}
  ) => {
    return {
      onMouseEnter: () => preloadModule(modulePath, { ...options, priority: 'high' }),
      onFocus: () => preloadModule(modulePath, { ...options, priority: 'high' })
    }
  }, [preloadModule])

  const preloadOnFocus = useCallback((
    modulePath: string,
    options: PreloadOptions = {}
  ) => {
    return {
      onFocus: () => preloadModule(modulePath, { ...options, priority: 'high' })
    }
  }, [preloadModule])

  const isPreloaded = useCallback((modulePath: string) => {
    return preloadedModules.current.has(modulePath)
  }, [])

  const clearPreloadCache = useCallback(() => {
    preloadedModules.current.clear()
    preloadTimeouts.current.forEach(timeout => clearTimeout(timeout))
    preloadTimeouts.current.clear()
  }, [])

  return {
    preloadModule,
    preloadOnHover,
    preloadOnFocus,
    isPreloaded,
    clearPreloadCache
  }
}

/**
 * Hook específico para pré-carregamento de abas de aluno
 */
export function useStudentTabPreload() {
  const { preloadOnHover, preloadOnFocus } = usePreload()

  const preloadOcorrencias = useCallback(() => {
    return preloadOnHover('../tabs/OcorrenciasTab', { timeout: 100 })
  }, [preloadOnHover])

  const preloadAnamnese = useCallback(() => {
    return preloadOnHover('../tabs/AnamneseTab', { timeout: 100 })
  }, [preloadOnHover])

  const preloadDiretriz = useCallback(() => {
    return preloadOnHover('../tabs/DiretrizTab', { timeout: 100 })
  }, [preloadOnHover])

  return {
    preloadOcorrencias,
    preloadAnamnese,
    preloadDiretriz
  }
}
