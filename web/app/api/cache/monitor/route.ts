import { NextRequest, NextResponse } from 'next/server'
import { getCacheStats, getCacheInfo, clearAllCache } from '@/lib/cache/simple'

export async function GET(request: NextRequest) {
  try {
    console.log('📊 API Cache Monitor - Verificando status do cache')
    
    // Obter estatísticas do cache
    const stats = getCacheStats()
    
    // Obter informações do cache
    const cacheInfo = await getCacheInfo()
    
    // Verificar saúde geral
    const isHealthy = cacheInfo.connected
    const memoryUsage = `${cacheInfo.size} items`
    
    const health = {
      status: isHealthy ? 'healthy' : 'unhealthy',
      cache: {
        type: 'memory',
        connected: isHealthy,
        memory_usage: memoryUsage,
        size: cacheInfo.size
      },
      cache_stats: {
        hits: stats.hits,
        misses: stats.misses,
        sets: stats.sets,
        deletes: stats.deletes,
        errors: stats.errors,
        hit_rate: stats.hits + stats.misses > 0 ? 
          ((stats.hits / (stats.hits + stats.misses)) * 100).toFixed(2) + '%' : '0%'
      },
      performance: {
        avg_response_time: 'N/A', // Seria calculado com base nas métricas
        cache_efficiency: stats.hits + stats.misses > 0 ? 
          ((stats.hits / (stats.hits + stats.misses)) * 100).toFixed(2) + '%' : '0%'
      },
      timestamp: new Date().toISOString()
    }

    return NextResponse.json({
      success: true,
      data: health
    }, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Cache-Status': isHealthy ? 'OK' : 'ERROR'
      }
    })

  } catch (error) {
    console.error('❌ Erro na API Cache Monitor:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erro interno ao monitorar cache',
        data: {
          status: 'error',
          cache: { type: 'memory', connected: true },
          cache_stats: { hits: 0, misses: 0, sets: 0, deletes: 0, errors: 1 },
          timestamp: new Date().toISOString()
        }
      },
      { status: 500 }
    )
  }
}

// POST para forçar limpeza de cache
export async function POST(request: NextRequest) {
  try {
    const { action } = await request.json().catch(() => ({}))
    
    if (action === 'clear') {
      await clearAllCache()
      console.log('🧹 Cache limpo via API')
      
      return NextResponse.json({
        success: true,
        message: 'Cache limpo com sucesso'
      })
    }
    
    return NextResponse.json(
      { success: false, error: 'Ação não reconhecida' },
      { status: 400 }
    )
    
  } catch (error) {
    console.error('❌ Erro ao limpar cache:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao limpar cache' },
      { status: 500 }
    )
  }
}
