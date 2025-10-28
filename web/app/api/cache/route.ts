import { NextRequest, NextResponse } from "next/server"
import { 
  getRedisInfo, 
  clearAllCache, 
  getCacheStats, 
  resetCacheStats,
  invalidateCachePattern 
} from "@/lib/cache/redis"

// GET /api/cache - Obter informações do cache
export async function GET(request: NextRequest) {
  try {
    console.log('📊 API Cache - Obter informações')
    
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    
    switch (action) {
      case 'stats':
        // Obter estatísticas do cache
        const stats = getCacheStats()
        return NextResponse.json({
          success: true,
          data: stats
        })
        
      case 'info':
        // Obter informações do Redis
        const info = await getRedisInfo()
        return NextResponse.json({
          success: true,
          data: info
        })
        
      case 'health':
        // Verificar saúde do cache
        const health = await getRedisInfo()
        return NextResponse.json({
          success: true,
          data: {
            connected: health?.connected || false,
            stats: health?.stats || getCacheStats()
          }
        })
        
      default:
        // Retornar todas as informações
        const allInfo = await getRedisInfo()
        const allStats = getCacheStats()
        
        return NextResponse.json({
          success: true,
          data: {
            redis: allInfo,
            stats: allStats,
            timestamp: new Date().toISOString()
          }
        })
    }
  } catch (error) {
    console.error('❌ Erro na API Cache:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erro interno ao obter informações do cache' 
      },
      { status: 500 }
    )
  }
}

// POST /api/cache - Ações de cache
export async function POST(request: NextRequest) {
  try {
    console.log('🔧 API Cache - Executar ação')
    
    const body = await request.json().catch(() => ({}))
    const { action, pattern, prefix } = body
    
    switch (action) {
      case 'clear':
        // Limpar todo o cache
        const cleared = await clearAllCache()
        return NextResponse.json({
          success: true,
          message: 'Cache limpo com sucesso',
          data: { cleared }
        })
        
      case 'reset-stats':
        // Resetar estatísticas
        resetCacheStats()
        return NextResponse.json({
          success: true,
          message: 'Estatísticas resetadas com sucesso'
        })
        
      case 'invalidate':
        // Invalidar cache por padrão
        if (!pattern) {
          return NextResponse.json(
            { 
              success: false, 
              error: 'Padrão é obrigatório para invalidação' 
            },
            { status: 400 }
          )
        }
        
        const invalidated = await invalidateCachePattern(pattern, { prefix })
        return NextResponse.json({
          success: true,
          message: 'Cache invalidado com sucesso',
          data: { invalidated }
        })
        
      default:
        return NextResponse.json(
          { 
            success: false, 
            error: 'Ação não reconhecida' 
          },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('❌ Erro na API Cache:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erro interno ao executar ação no cache' 
      },
      { status: 500 }
    )
  }
}

// DELETE /api/cache - Limpar cache
export async function DELETE(request: NextRequest) {
  try {
    console.log('🗑️ API Cache - Limpar cache')
    
    const { searchParams } = new URL(request.url)
    const pattern = searchParams.get('pattern')
    const prefix = searchParams.get('prefix')
    
    if (pattern) {
      // Limpar cache por padrão
      const invalidated = await invalidateCachePattern(pattern, { prefix: prefix || undefined })
      return NextResponse.json({
        success: true,
        message: 'Cache limpo com sucesso',
        data: { invalidated }
      })
    } else {
      // Limpar todo o cache
      const cleared = await clearAllCache()
      return NextResponse.json({
        success: true,
        message: 'Todo o cache foi limpo com sucesso',
        data: { cleared }
      })
    }
  } catch (error) {
    console.error('❌ Erro na API Cache:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erro interno ao limpar cache' 
      },
      { status: 500 }
    )
  }
}
