import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import { KanbanMoveSchema } from '@/lib/schemas/kanban'

// Forçar execução dinâmica para evitar problemas de renderização estática
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;


export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID()
  console.log(`🔍 [${requestId}] API /api/kanban/move POST chamada`)
  
  try {
    const cookieStore = cookies()
    const supabase = await createClient()
    
    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      console.warn(`⚠️ [${requestId}] Auth falhou:`, authError)
      return NextResponse.json({ 
        error: 'Unauthorized', 
        code: 'AUTH_FAILED',
        requestId 
      }, { status: 401 })
    }

    // Validar payload com Zod
    const body = await request.json()
    const validationResult = KanbanMoveSchema.safeParse(body)
    
    if (!validationResult.success) {
      console.warn(`⚠️ [${requestId}] Validação falhou:`, validationResult.error.issues)
      return NextResponse.json({ 
        error: 'Dados inválidos', 
        code: 'VALIDATION_ERROR',
        details: validationResult.error.issues,
        requestId 
      }, { status: 422 })
    }

    const { cardId, fromColumnId, toColumnId, toIndex } = validationResult.data
    console.log(`📝 [${requestId}] Payload validado:`, { cardId, fromColumnId, toColumnId, toIndex })

    // Buscar informações do card e colunas em paralelo
    const [cardResult, fromStageResult, toStageResult] = await Promise.all([
      supabase
        .from('kanban_items')
        .select('id, org_id, student_id, stage_id, position')
        .eq('id', cardId)
        .single(),
      
      supabase
        .from('kanban_stages')
        .select('id, name, position, stage_code, org_id')
        .eq('id', fromColumnId)
        .single(),
      
      supabase
        .from('kanban_stages')
        .select('id, name, position, stage_code, org_id')
        .eq('id', toColumnId)
        .single()
    ])

    // Verificar se o card existe
    if (cardResult.error || !cardResult.data) {
      console.error(`❌ [${requestId}] Card não encontrado:`, { cardError: cardResult.error, card: cardResult.data })
      return NextResponse.json({ 
        error: 'Card não encontrado', 
        code: 'CARD_NOT_FOUND',
        detail: cardResult.error?.message,
        requestId 
      }, { status: 404 })
    }

    // Verificar se as colunas existem
    if (fromStageResult.error || !fromStageResult.data) {
      console.error(`❌ [${requestId}] Coluna origem não encontrada:`, { fromColumnId, fromStageError: fromStageResult.error, fromStage: fromStageResult.data })
      return NextResponse.json({ 
        error: 'Coluna origem não encontrada', 
        code: 'FROM_STAGE_NOT_FOUND',
        detail: fromStageResult.error?.message,
        requestId 
      }, { status: 404 })
    }

    if (toStageResult.error || !toStageResult.data) {
      console.error(`❌ [${requestId}] Coluna destino não encontrada:`, { toColumnId, toStageError: toStageResult.error, toStage: toStageResult.data })
      return NextResponse.json({ 
        error: 'Coluna destino não encontrada', 
        code: 'TO_STAGE_NOT_FOUND',
        detail: toStageResult.error?.message,
        requestId 
      }, { status: 404 })
    }

    const card = cardResult.data
    const fromStage = fromStageResult.data
    const toStage = toStageResult.data

    // Verificar se todas as colunas pertencem à mesma organização
    if (card.org_id !== fromStage.org_id || card.org_id !== toStage.org_id) {
      console.error(`❌ [${requestId}] Inconsistência de organização:`, { 
        cardOrgId: card.org_id, 
        fromStageOrgId: fromStage.org_id, 
        toStageOrgId: toStage.org_id 
      })
      return NextResponse.json({ 
        error: 'Inconsistência de organização', 
        code: 'ORG_MISMATCH',
        requestId 
      }, { status: 409 })
    }

    console.log(`✅ [${requestId}] Dados validados:`, { 
      card: { id: card.id, org_id: card.org_id }, 
      fromStage: { id: fromStage.id, name: fromStage.name }, 
      toStage: { id: toStage.id, name: toStage.name } 
    })

    // Se for a mesma coluna, apenas reordenar
    if (fromColumnId === toColumnId) {
      console.log(`🔄 [${requestId}] Reordenação na mesma coluna`)
      // TODO: Implementar reordenação se necessário
      return NextResponse.json({ 
        success: true, 
        message: 'Card reordenado na mesma coluna',
        requestId 
      })
    }

    // Transação atômica via RPC; se indisponível, aplicar fallback simples
    const { error: transactionError } = await supabase.rpc('move_kanban_card', {
      p_card_id: cardId,
      p_from_stage_id: fromColumnId,
      p_to_stage_id: toColumnId,
      p_to_index: toIndex || 0,
      p_actor_id: user.id
    })

    if (transactionError) {
      console.warn(`⚠️ [${requestId}] RPC move_kanban_card falhou, aplicando fallback:`, transactionError?.message)
      // Fallback: atualizar stage_id diretamente e posicionar no final da coluna destino
      const { data: maxPosData } = await supabase
        .from('kanban_items')
        .select('position')
        .eq('org_id', card.org_id)
        .eq('stage_id', toColumnId)
        .order('position', { ascending: false })
        .limit(1)
        .maybeSingle()
      const nextPos = (maxPosData?.position || 0) + 1
      const { error: updErr } = await supabase
        .from('kanban_items')
        .update({ stage_id: toColumnId, position: nextPos })
        .eq('id', cardId)
        .eq('org_id', card.org_id)
      if (updErr) {
        console.error(`❌ [${requestId}] Fallback também falhou:`, updErr)
        return NextResponse.json({ 
          error: 'Erro interno', 
          code: 'TRANSACTION_FAILED',
          detail: updErr.message,
          requestId 
        }, { status: 500 })
      }
    }

    console.log(`✅ [${requestId}] Card movido com sucesso:`, { 
      cardId, 
      from: fromStage.id, 
      to: toStage.id 
    })

    return NextResponse.json({ 
      success: true, 
      message: `Card movido de "${fromStage.name}" para "${toStage.name}"`,
      requestId 
    })

  } catch (error) {
    console.error(`❌ [${requestId}] Erro inesperado:`, error)
    return NextResponse.json({ 
      error: 'Erro interno', 
      code: 'INTERNAL_ERROR',
      requestId 
    }, { status: 500 })
  }
}

