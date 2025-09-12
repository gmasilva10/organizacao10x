"use client"

import { useRef, useCallback } from 'react'

interface AuthSyncState {
  isPending: boolean
  lastSync: number
}

// Hook para gerenciar sincronização de auth com debounce/lock
export function useAuthSync() {
  const syncState = useRef<AuthSyncState>({
    isPending: false,
    lastSync: 0
  })

  const syncAuth = useCallback(async (accessToken: string, refreshToken: string) => {
    const now = Date.now()
    const DEBOUNCE_MS = 1000 // 1 segundo de debounce
    const LOCK_MS = 5000 // 5 segundos de lock máximo

    // Verificar se já está em processo
    if (syncState.current.isPending) {
      console.log('Auth sync já em andamento, ignorando...')
      return { success: false, reason: 'already_pending' }
    }

    // Verificar debounce
    if (now - syncState.current.lastSync < DEBOUNCE_MS) {
      console.log('Auth sync muito recente, ignorando...')
      return { success: false, reason: 'debounced' }
    }

    // Verificar lock máximo - se muito antigo, forçar sincronização
    if (now - syncState.current.lastSync > LOCK_MS) {
      // Forçar sincronização quando muito antigo
    }

    syncState.current.isPending = true

    try {
      const res = await fetch("/api/auth/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        cache: "no-store",
        body: JSON.stringify({
          access_token: accessToken,
          refresh_token: refreshToken,
        }),
      })

      syncState.current.lastSync = now
      
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`)
      }

      return { success: true }
    } catch (error) {
      console.error('Erro no auth sync:', error)
      return { success: false, reason: 'error', error }
    } finally {
      syncState.current.isPending = false
    }
  }, [])

  return { syncAuth }
}
