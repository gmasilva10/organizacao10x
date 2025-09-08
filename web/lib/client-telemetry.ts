"use client"

interface TelemetryData {
  route: string
  method: string
  status: number
  duration: number
  timestamp: number
  environment: 'dev' | 'prod'
}

class ClientTelemetry {
  private data: TelemetryData[] = []
  private readonly maxBufferSize = 100
  private readonly flushInterval = 30000 // 30 segundos
  private flushTimer: NodeJS.Timeout | null = null

  constructor() {
    this.startFlushTimer()
    this.setupFetchInterceptor()
  }

  private getEnvironment(): 'dev' | 'prod' {
    return process.env.NODE_ENV === 'production' ? 'prod' : 'dev'
  }

  private setupFetchInterceptor() {
    const originalFetch = window.fetch
    const self = this

    window.fetch = async function(input: RequestInfo | URL, init?: RequestInit) {
      const startTime = performance.now()
      const url = typeof input === 'string' ? input : input.toString()
      
      try {
        const response = await originalFetch(input, init)
        const duration = performance.now() - startTime
        
        // Capturar apenas chamadas para APIs internas
        if (url.includes('/api/')) {
          self.record({
            route: url,
            method: init?.method || 'GET',
            status: response.status,
            duration: Math.round(duration),
            timestamp: Date.now(),
            environment: self.getEnvironment()
          })
        }
        
        return response
      } catch (error) {
        const duration = performance.now() - startTime
        
        if (url.includes('/api/')) {
          self.record({
            route: url,
            method: init?.method || 'GET',
            status: 0, // Network error
            duration: Math.round(duration),
            timestamp: Date.now(),
            environment: self.getEnvironment()
          })
        }
        
        throw error
      }
    }
  }

  private record(data: TelemetryData) {
    this.data.push(data)
    
    // Flush se buffer estiver cheio
    if (this.data.length >= this.maxBufferSize) {
      this.flush()
    }
  }

  private startFlushTimer() {
    this.flushTimer = setInterval(() => {
      if (this.data.length > 0) {
        this.flush()
      }
    }, this.flushInterval)
  }

  private async flush() {
    if (this.data.length === 0) return

    const dataToSend = [...this.data]
    this.data = []

    try {
      await fetch('/api/telemetry/client-times', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: dataToSend }),
        keepalive: true // Enviar mesmo se página estiver fechando
      })
    } catch (error) {
      console.warn('Falha ao enviar telemetria:', error)
      // Recolocar dados no buffer se falhou
      this.data.unshift(...dataToSend)
    }
  }

  // Método público para flush manual
  public forceFlush() {
    this.flush()
  }

  // Método para obter estatísticas locais
  public getStats() {
    if (this.data.length === 0) return null

    const durations = this.data.map(d => d.duration).sort((a, b) => a - b)
    const count = durations.length
    const p50 = durations[Math.floor(count * 0.5)]
    const p95 = durations[Math.floor(count * 0.95)]
    const p99 = durations[Math.floor(count * 0.99)]

    return {
      count,
      p50,
      p95,
      p99,
      avg: durations.reduce((a, b) => a + b, 0) / count
    }
  }
}

// Instância singleton
export const clientTelemetry = new ClientTelemetry()

// Hook para usar em componentes
export function useClientTelemetry() {
  return {
    getStats: () => clientTelemetry.getStats(),
    forceFlush: () => clientTelemetry.forceFlush()
  }
}
