/**
 * Tipos TypeScript para Organização
 * Inclui campos para logomarca e dados da organização
 */

export interface Organization {
  id: string
  name: string
  logo_url?: string | null
  display_name?: string | null
  legal_name?: string | null
  cnpj?: string | null
  address?: any // JSONB
  timezone?: string
  currency?: string
  plan_code?: string
  created_at?: string
  updated_at?: string
}

export interface OrganizationUpdate {
  name?: string
  logo_url?: string | null
  display_name?: string | null
  legal_name?: string | null
  cnpj?: string | null
  address?: any
  timezone?: string
  currency?: string
}

export interface OrganizationLogoUpload {
  file: File
  organization_id: string
}

export interface OrganizationLogoUploadResponse {
  success: boolean
  logo_url?: string
  error?: string
  message?: string
}

export interface OrganizationApiResponse {
  success: boolean
  organization?: Organization
  error?: string
  message?: string
}
