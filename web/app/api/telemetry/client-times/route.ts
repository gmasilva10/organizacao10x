import { NextResponse } from "next/server"

interface TelemetryData {
  route: string
  method: string
  status: number
  duration: number
  timestamp: number
  environment: 'dev' | 'prod'
}

interface TelemetryRequest {
  data: TelemetryData[]
}

// POST /api/telemetry/client-times - Recebe dados de telemetria do client
export async function POST(request: Request) {
  try {
    const { data }: TelemetryRequest = await request.json()
    
    if (!Array.isArray(data) || data.length === 0) {
      return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
    }

    // Processar e agregar dados
    const stats = processTelemetryData(data)
    
    // Log para desenvolvimento (em produção, enviar para serviço de monitoramento)
    console.log('📊 Client Telemetry Stats:', {
      count: data.length,
      environment: data[0]?.environment || 'unknown',
      stats,
      sample: data.slice(0, 3) // Primeiros 3 registros como amostra
    })

    // Em produção, aqui enviaria para DataDog, New Relic, etc.
    // await sendToMonitoringService(stats)

    return NextResponse.json({ 
      success: true, 
      processed: data.length,
      stats 
    })

  } catch (error) {
    console.error('Erro ao processar telemetria:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

function processTelemetryData(data: TelemetryData[]) {
  const durations = data.map(d => d.duration).sort((a, b) => a - b)
  const count = durations.length
  
  if (count === 0) return null

  const p50 = durations[Math.floor(count * 0.5)]
  const p95 = durations[Math.floor(count * 0.95)]
  const p99 = durations[Math.floor(count * 0.99)]
  const avg = durations.reduce((a, b) => a + b, 0) / count

  // Agrupar por rota
  const byRoute = data.reduce((acc, item) => {
    const route = item.route.split('?')[0] // Remover query params
    if (!acc[route]) {
      acc[route] = []
    }
    acc[route].push(item.duration)
    return acc
  }, {} as Record<string, number[]>)

  // Calcular stats por rota
  const routeStats = Object.entries(byRoute).map(([route, durations]) => {
    const sorted = durations.sort((a, b) => a - b)
    const count = sorted.length
    return {
      route,
      count,
      p50: sorted[Math.floor(count * 0.5)],
      p95: sorted[Math.floor(count * 0.95)],
      p99: sorted[Math.floor(count * 0.99)],
      avg: sorted.reduce((a, b) => a + b, 0) / count
    }
  })

  return {
    global: { count, p50, p95, p99, avg },
    byRoute: routeStats
  }
}
