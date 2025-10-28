'use client'

import { useState, useEffect } from 'react'

export interface Template {
  id: string
  code: string
  title: string
  anchor: string
  touchpoint: string
  channel_default: string
  message_v1: string
  message_v2?: string
  active: boolean
  temporal_offset_days?: number | null
  temporal_anchor_field?: string | null
  created_at: string
  updated_at: string
}

export function useTemplates() {
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchTemplates = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/relationship/templates')
      const data = await response.json()
      
      if (response.ok) {
        setTemplates(Array.isArray(data.items) ? data.items : [])
      } else {
        setError('Erro ao buscar templates')
        setTemplates([])
      }
    } catch (error) {
      console.error('Erro ao buscar templates:', error)
      setError('Erro ao buscar templates')
      setTemplates([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTemplates()
  }, [])

  return {
    templates,
    loading,
    error,
    refetch: fetchTemplates
  }
}
