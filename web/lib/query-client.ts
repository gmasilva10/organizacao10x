"use client"

import { QueryClient } from '@tanstack/react-query'

/**
 * QueryClient configurado para GATE 10.4.3 - Performance
 * Políticas de cache otimizadas para p95 < 400ms
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Políticas de Cache
      staleTime: 60 * 1000, // 60s para queries padrão
      gcTime: 10 * 60 * 1000, // 10 min para garbage collection
      
      // Configurações de Performance
      refetchOnWindowFocus: false, // Evitar refetch desnecessário
      refetchOnMount: true, // Refetch no mount para dados frescos
      retry: 2, // Máximo 2 tentativas
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Backoff exponencial
      
      // Network
      networkMode: 'online', // Só executar quando online
    },
    mutations: {
      // Configurações de Mutations
      retry: 1, // 1 tentativa para mutations
      networkMode: 'online',
    },
  },
})

/**
 * Query Keys normalizadas para GATE 10.4.3
 * Padrão: ['resource', 'action', params]
 */
export const queryKeys = {
  // Listas
  students: {
    all: ['students'] as const,
    lists: () => [...queryKeys.students.all, 'list'] as const,
    list: (filters: { page?: number; q?: string; status?: string }) => 
      [...queryKeys.students.lists(), filters] as const,
  },
  
  // Detalhe do Aluno
  student: {
    all: ['student'] as const,
    detail: (id: string) => [...queryKeys.student.all, id] as const,
    occurrences: (id: string) => [...queryKeys.student.detail(id), 'occurrences'] as const,
    anamnese: (id: string) => [...queryKeys.student.detail(id), 'anamnese'] as const,
    diretriz: (id: string) => [...queryKeys.student.detail(id), 'diretriz'] as const,
  },
  
  // Dados Estáticos (cache longo)
  static: {
    all: ['static'] as const,
    ufs: () => [...queryKeys.static.all, 'ufs'] as const,
    estadosCivis: () => [...queryKeys.static.all, 'estados-civis'] as const,
    status: () => [...queryKeys.static.all, 'status'] as const,
  },
} as const

/**
 * Configurações específicas de staleTime por tipo de dados
 */
export const staleTimeConfig = {
  // Listas (60-120s)
  lists: 60 * 1000, // 60s
  
  // Detalhes (60-120s)
  details: 60 * 1000, // 60s
  
  // Dados estáveis (300-600s)
  static: 300 * 1000, // 5min
  
  // Submódulos (30-60s)
  submodules: 30 * 1000, // 30s
} as const

/**
 * Configurações de gcTime (garbage collection)
 */
export const gcTimeConfig = {
  // Cache curto (10-15min)
  short: 10 * 60 * 1000, // 10min
  
  // Cache médio (15-30min)
  medium: 15 * 60 * 1000, // 15min
  
  // Cache longo (30-60min)
  long: 30 * 60 * 1000, // 30min
} as const

/**
 * Helper para criar query com configurações específicas
 */
export function createQueryConfig(type: 'list' | 'detail' | 'static' | 'submodule') {
  const configs = {
    list: {
      staleTime: staleTimeConfig.lists,
      gcTime: gcTimeConfig.short,
    },
    detail: {
      staleTime: staleTimeConfig.details,
      gcTime: gcTimeConfig.short,
    },
    static: {
      staleTime: staleTimeConfig.static,
      gcTime: gcTimeConfig.long,
    },
    submodule: {
      staleTime: staleTimeConfig.submodules,
      gcTime: gcTimeConfig.short,
    },
  }
  
  return configs[type]
}
