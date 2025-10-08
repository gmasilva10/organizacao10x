"use client"

import { useState, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { Organization, OrganizationUpdate, OrganizationLogoUploadResponse } from '@/types/organization'

interface UseOrganizationOptions {
  enabled?: boolean
}

interface UploadLogoOptions {
  file: File
  onSuccess?: (response: OrganizationLogoUploadResponse) => void
  onError?: (error: string) => void
}

export function useOrganization(options: UseOrganizationOptions = {}) {
  const queryClient = useQueryClient()
  const [isUploading, setIsUploading] = useState(false)

  // Query para buscar dados da organização
  const {
    data: organization,
    isLoading,
    error,
    refetch
  } = useQuery<Organization>({
    queryKey: ['organization'],
    queryFn: async (): Promise<Organization> => {
      const response = await fetch('/api/organization', {
        credentials: 'include',
        cache: 'no-store'
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || 'Erro ao buscar dados da organização')
      }

      const data = await response.json()
      return data.organization
    },
    enabled: options.enabled !== false,
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos (garbage collection time)
  })

  // Mutation para atualizar dados da organização
  const updateOrganizationMutation = useMutation({
    mutationFn: async (updateData: OrganizationUpdate): Promise<Organization> => {
      const response = await fetch('/api/organization', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(updateData),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || 'Erro ao atualizar dados da organização')
      }

      const data = await response.json()
      return data.organization
    },
    onSuccess: (updatedOrg) => {
      // Invalidar cache e atualizar dados
      queryClient.setQueryData(['organization'], updatedOrg)
      queryClient.invalidateQueries({ queryKey: ['organization'] })
    },
  })

  // Função para fazer upload da logomarca
  const uploadLogo = useCallback(async ({ file, onSuccess, onError }: UploadLogoOptions): Promise<void> => {
    if (!file) {
      onError?.('Arquivo não fornecido')
      return
    }

    // Validações client-side
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      onError?.('Apenas arquivos JPG, PNG e WEBP são permitidos')
      return
    }

    const maxSize = 2 * 1024 * 1024 // 2MB
    if (file.size > maxSize) {
      onError?.('Arquivo deve ter no máximo 2MB')
      return
    }

    setIsUploading(true)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/organization/logo', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      })

      const result: OrganizationLogoUploadResponse = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Erro no upload da logomarca')
      }

      // Invalidar cache para buscar dados atualizados
      queryClient.invalidateQueries({ queryKey: ['organization'] })
      
      onSuccess?.(result)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro inesperado no upload'
      onError?.(errorMessage)
    } finally {
      setIsUploading(false)
    }
  }, [queryClient])

  // Função para remover logomarca
  const removeLogo = useCallback(async (): Promise<void> => {
    try {
      const response = await fetch('/api/organization', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ logo_url: null }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || 'Erro ao remover logomarca')
      }

      // Invalidar cache para buscar dados atualizados
      queryClient.invalidateQueries({ queryKey: ['organization'] })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro inesperado ao remover logomarca'
      throw new Error(errorMessage)
    }
  }, [queryClient])

  return {
    // Dados
    organization,
    isLoading,
    error,
    isUploading,
    
    // Ações
    refetch,
    updateOrganization: updateOrganizationMutation.mutateAsync,
    isUpdating: updateOrganizationMutation.isPending,
    updateError: updateOrganizationMutation.error,
    uploadLogo,
    removeLogo,
  }
}
