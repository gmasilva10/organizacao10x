"use client"

import { useEffect } from 'react'
import { clientTelemetry } from '@/lib/client-telemetry'

export function ClientTelemetryInit() {
  useEffect(() => {
    // Inicializar telemetria apenas no client
    console.log('📊 Client Telemetry inicializado')
    
    // Flush ao sair da página
    const handleBeforeUnload = () => {
      clientTelemetry.forceFlush()
    }
    
    window.addEventListener('beforeunload', handleBeforeUnload)
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      clientTelemetry.forceFlush()
    }
  }, [])

  return null // Componente invisível
}
