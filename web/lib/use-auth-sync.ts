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

    console.log('🔄 [AUTH SYNC HOOK] Iniciando sync...', {
      isPending: syncState.current.isPending,
      lastSync: syncState.current.lastSync,
      timeSinceLastSync: now - syncState.current.lastSync
    })

    // Verificar se já está em processo
    if (syncState.current.isPending) {
      console.log('🔄 [AUTH SYNC HOOK] Já em andamento, ignorando...')
      return { success: false, reason: 'already_pending' }
    }

    // Verificar debounce
    if (now - syncState.current.lastSync < DEBOUNCE_MS) {
      console.log('🔄 [AUTH SYNC HOOK] Muito recente, ignorando...')
      return { success: false, reason: 'debounced' }
    }

    // Verificar lock máximo - se muito antigo, forçar sincronização
    if (now - syncState.current.lastSync > LOCK_MS) {
      console.log('🔄 [AUTH SYNC HOOK] Lock muito antigo, forçando sync...')
    }

    syncState.current.isPending = true

    try {
      console.log('🔄 [AUTH SYNC HOOK] Fazendo requisição para /api/auth/sync...')
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

      console.log('🔄 [AUTH SYNC HOOK] Resposta recebida:', {
        status: res.status,
        ok: res.ok,
        statusText: res.statusText
      })

      syncState.current.lastSync = now
      
      if (!res.ok) {
        const errorText = await res.text().catch(() => 'Erro desconhecido')
        console.error('❌ [AUTH SYNC HOOK] Erro HTTP:', {
          status: res.status,
          statusText: res.statusText,
          errorText
        })
        throw new Error(`HTTP ${res.status}: ${errorText}`)
      }

      console.log('✅ [AUTH SYNC HOOK] Sync concluído com sucesso')
      return { success: true }
    } catch (error) {
      console.error('❌ [AUTH SYNC HOOK] Erro no auth sync:', error)
      return { success: false, reason: 'error', error }
    } finally {
      syncState.current.isPending = false
    }
  }, [])

  return { syncAuth }
}
