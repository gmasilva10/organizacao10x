"use client"

import { useEffect, useState } from 'react'

export type OccurrencesPermissions = {
  read: boolean
  write: boolean
  close: boolean
  manage: boolean
}

export function useOccurrencesPermissions() {
  const [permissions, setPermissions] = useState<OccurrencesPermissions>({
    read: false,
    write: false,
    close: false,
    manage: false
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let aborted = false
    async function fetchPermissions() {
      try {
        const response = await fetch('/api/occurrences/permissions', { cache: 'force-cache' })
        if (!aborted && response.ok) {
          const data = await response.json()
          setPermissions(data)
        }
      } catch (error) {
        if (!aborted) console.error('Erro ao buscar permissões de ocorrências:', error)
      } finally {
        if (!aborted) setLoading(false)
      }
    }

    fetchPermissions()
    return () => { aborted = true }
  }, [])

  return { permissions, loading }
}
