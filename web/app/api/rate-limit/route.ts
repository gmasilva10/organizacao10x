import { NextRequest, NextResponse } from "next/server"
import { 
  getRateLimitInfo, 
  resetRateLimit, 
  getRateLimitStats,
  resetRateLimitStats 
} from "@/lib/rate-limit/limiter"

// GET /api/rate-limit - Obter informações de rate limiting
export async function GET(request: NextRequest) {
  try {
    console.log('📊 API Rate Limit - Obter informações')
    
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    const identifier = searchParams.get('identifier')
    
    switch (action) {
      case 'info':
        // Obter informações de rate limit para um identificador
        if (!identifier) {
          return NextResponse.json(
            { 
              success: false, 
              error: 'Identificador é obrigatório para obter informações' 
            },
            { status: 400 }
          )
        }
        
        const info = await getRateLimitInfo(identifier)
        return NextResponse.json({
          success: true,
          data: info
        })
        
      case 'stats':
        // Obter estatísticas globais
        const stats = getRateLimitStats()
        return NextResponse.json({
          success: true,
          data: stats
        })
        
      default:
        // Retornar todas as informações disponíveis
        const allStats = getRateLimitStats()
        
        return NextResponse.json({
          success: true,
          data: {
            stats: allStats,
            timestamp: new Date().toISOString()
          }
        })
    }
  } catch (error) {
    console.error('❌ Erro na API Rate Limit:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erro interno ao obter informações de rate limiting' 
      },
      { status: 500 }
    )
  }
}

// POST /api/rate-limit - Ações de rate limiting
export async function POST(request: NextRequest) {
  try {
    console.log('🔧 API Rate Limit - Executar ação')
    
    const body = await request.json().catch(() => ({}))
    const { action, identifier } = body
    
    switch (action) {
      case 'reset':
        // Resetar rate limit para um identificador
        if (!identifier) {
          return NextResponse.json(
            { 
              success: false, 
              error: 'Identificador é obrigatório para resetar' 
            },
            { status: 400 }
          )
        }
        
        const reset = await resetRateLimit(identifier)
        return NextResponse.json({
          success: true,
          message: 'Rate limit resetado com sucesso',
          data: { reset }
        })
        
      case 'reset-stats':
        // Resetar estatísticas globais
        resetRateLimitStats()
        return NextResponse.json({
          success: true,
          message: 'Estatísticas resetadas com sucesso'
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
    console.error('❌ Erro na API Rate Limit:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erro interno ao executar ação de rate limiting' 
      },
      { status: 500 }
    )
  }
}

// DELETE /api/rate-limit - Resetar rate limit
export async function DELETE(request: NextRequest) {
  try {
    console.log('🗑️ API Rate Limit - Resetar rate limit')
    
    const { searchParams } = new URL(request.url)
    const identifier = searchParams.get('identifier')
    
    if (!identifier) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Identificador é obrigatório para resetar' 
        },
        { status: 400 }
      )
    }
    
    const reset = await resetRateLimit(identifier)
    return NextResponse.json({
      success: true,
      message: 'Rate limit resetado com sucesso',
      data: { reset }
    })
  } catch (error) {
    console.error('❌ Erro na API Rate Limit:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erro interno ao resetar rate limit' 
      },
      { status: 500 }
    )
  }
}
