import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 [DEBUG] API Kanban Complete Simple - Iniciando')
    
    const { cardId } = await request.json()
    
    console.log('🔍 [DEBUG] API Kanban Complete Simple - Card ID:', cardId)
    
    if (!cardId) {
      return NextResponse.json({ error: 'Card ID é obrigatório' }, { status: 400 })
    }

    // Simular sucesso
    return NextResponse.json({ 
      success: true, 
      message: 'Onboarding encerrado com sucesso',
      cardId: cardId
    })
    
  } catch (error) {
    console.error('❌ [DEBUG] API Kanban Complete Simple - Erro:', error)
    return NextResponse.json({ 
      error: 'Erro interno',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}
