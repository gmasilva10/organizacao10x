import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

// API de debug para testar sem autenticação
export async function POST(request: NextRequest) {
  try {
    console.log('🔍 [DEBUG] API Kanban Complete Debug - Iniciando')
    
    const { cardId } = await request.json()
    
    console.log('🔍 [DEBUG] API Kanban Complete Debug - Request:', {
      cardId,
      hasCardId: !!cardId,
      cardIdType: typeof cardId,
      url: request.url,
      method: request.method
    })
    
    if (!cardId) {
      console.log('❌ [DEBUG] API Kanban Complete Debug - Card ID ausente')
      return NextResponse.json({ error: 'Card ID é obrigatório' }, { status: 400 })
    }

    // Simular sucesso para teste
    console.log('✅ [DEBUG] API Kanban Complete Debug - Simulando sucesso')
    return NextResponse.json({ 
      success: true, 
      message: 'API de debug funcionando',
      cardId: cardId,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('❌ [DEBUG] API Kanban Complete Debug - Erro:', error)
    return NextResponse.json({ 
      error: 'Erro na API de debug',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}
