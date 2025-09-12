"use client"

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys, createQueryConfig } from '@/lib/query-client'
import { perf } from '@/lib/perfClient'

// Types
interface Student {
  id: string
  name: string
  email: string
  phone: string
  status: string
  created_at: string
  trainer?: {
    id: string
    name: string
  } | null
}

interface StudentsResponse {
  students: Student[]
  total: number
  page: number
  page_size: number
  total_pages: number
}

interface StudentsFilters {
  page?: number
  q?: string
  status?: string
}

// Hook para listar alunos
export function useStudents(filters: StudentsFilters = {}) {
  const queryClient = useQueryClient()
  
  return useQuery({
    queryKey: queryKeys.students.list(filters),
    queryFn: async (): Promise<StudentsResponse> => {
      // Performance mark: TTFB
      perf.markAlunosListTTFB()
      
      const params = new URLSearchParams()
      if (filters.page) params.append('page', filters.page.toString())
      if (filters.q) params.append('q', filters.q)
      if (filters.status) params.append('status', filters.status)
      
      const response = await fetch(`/api/students?${params.toString()}`, {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-store' }
      })
      
      if (!response.ok) {
        throw new Error('Falha ao carregar alunos')
      }
      
      const data = await response.json()
      
      // Performance mark: Data Ready
      perf.markAlunosListDataReady()
      
      return data
    },
    ...createQueryConfig('list'),
    // keepPreviousData para paginação suave
    keepPreviousData: true,
  })
}

// Hook para detalhe do aluno
export function useStudent(id: string) {
  return useQuery({
    queryKey: queryKeys.student.detail(id),
    queryFn: async (): Promise<Student> => {
      // Performance mark: TTFB
      perf.markAlunosListTTFB()
      
      const response = await fetch(`/api/students/${id}`, {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-store' }
      })
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Aluno não encontrado')
        }
        throw new Error('Erro ao carregar dados do aluno')
      }
      
      const data = await response.json()
      
      // Performance mark: Interactive
      perf.markAlunosEditInteractive()
      
      return data
    },
    ...createQueryConfig('detail'),
    enabled: !!id, // Só executa se tiver ID
  })
}

// Hook para ocorrências do aluno
export function useStudentOccurrences(id: string) {
  return useQuery({
    queryKey: queryKeys.student.occurrences(id),
    queryFn: async () => {
      const response = await fetch(`/api/students/${id}/occurrences`)
      
      if (!response.ok) {
        throw new Error('Falha ao carregar ocorrências')
      }
      
      const data = await response.json()
      
      // Performance mark: Tab Data Ready
      perf.markOccurrencesTabDataReady()
      
      return data
    },
    ...createQueryConfig('submodule'),
    enabled: !!id,
  })
}

// Hook para anamnese do aluno
export function useStudentAnamnese(id: string) {
  return useQuery({
    queryKey: queryKeys.student.anamnese(id),
    queryFn: async () => {
      const response = await fetch(`/api/students/${id}/anamnese`)
      
      if (!response.ok) {
        throw new Error('Falha ao carregar anamnese')
      }
      
      const data = await response.json()
      
      // Performance mark: Tab Data Ready
      perf.markOccurrencesTabDataReady() // Reutilizando o mark
      
      return data
    },
    ...createQueryConfig('submodule'),
    enabled: !!id,
  })
}

// Hook para diretriz do aluno
export function useStudentDiretriz(id: string) {
  return useQuery({
    queryKey: queryKeys.student.diretriz(id),
    queryFn: async () => {
      const response = await fetch(`/api/students/${id}/diretriz`)
      
      if (!response.ok) {
        throw new Error('Falha ao carregar diretriz')
      }
      
      const data = await response.json()
      
      // Performance mark: Tab Data Ready
      perf.markOccurrencesTabDataReady() // Reutilizando o mark
      
      return data
    },
    ...createQueryConfig('submodule'),
    enabled: !!id,
  })
}

// Hook para salvar aluno (mutation)
export function useSaveStudent() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Student> }) => {
      const response = await fetch(`/api/students/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })
      
      if (!response.ok) {
        throw new Error('Erro ao salvar aluno')
      }
      
      return response.json()
    },
    onSuccess: (data, variables) => {
      // Invalidate queries relacionadas
      queryClient.invalidateQueries({ queryKey: queryKeys.student.detail(variables.id) })
      queryClient.invalidateQueries({ queryKey: queryKeys.students.lists() })
      
      // Optimistic update no cache
      queryClient.setQueryData(
        queryKeys.student.detail(variables.id),
        (old: Student | undefined) => old ? { ...old, ...data } : data
      )
    },
  })
}

// Hook para prefetch de aluno (onHover)
export function usePrefetchStudent() {
  const queryClient = useQueryClient()
  
  return (id: string) => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.student.detail(id),
      queryFn: async () => {
        const response = await fetch(`/api/students/${id}`)
        if (!response.ok) throw new Error('Falha ao carregar aluno')
        return response.json()
      },
      ...createQueryConfig('detail'),
    })
  }
}

// Hook para prefetch de submódulos (onHover)
export function usePrefetchStudentSubmodules() {
  const queryClient = useQueryClient()
  
  return {
    prefetchOccurrences: (id: string) => {
      queryClient.prefetchQuery({
        queryKey: queryKeys.student.occurrences(id),
        queryFn: async () => {
          const response = await fetch(`/api/students/${id}/occurrences`)
          if (!response.ok) throw new Error('Falha ao carregar ocorrências')
          return response.json()
        },
        ...createQueryConfig('submodule'),
      })
    },
    
    prefetchAnamnese: (id: string) => {
      queryClient.prefetchQuery({
        queryKey: queryKeys.student.anamnese(id),
        queryFn: async () => {
          const response = await fetch(`/api/students/${id}/anamnese`)
          if (!response.ok) throw new Error('Falha ao carregar anamnese')
          return response.json()
        },
        ...createQueryConfig('submodule'),
      })
    },
    
    prefetchDiretriz: (id: string) => {
      queryClient.prefetchQuery({
        queryKey: queryKeys.student.diretriz(id),
        queryFn: async () => {
          const response = await fetch(`/api/students/${id}/diretriz`)
          if (!response.ok) throw new Error('Falha ao carregar diretriz')
          return response.json()
        },
        ...createQueryConfig('submodule'),
      })
    },
  }
}
