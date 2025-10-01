// Forçar execução dinâmica para evitar problemas de renderização estática
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * GATE 10.7 - Endpoint de Undo para Tarefas
 * 
 * Permite desfazer ações de:
 * - DELETE (soft delete) - restaura status anterior
 * - SKIP - restaura status anterior
 * 
 * Janela de tempo: 5 segundos
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClientAdmin } from '@/utils/supabase/server'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClientAdmin()
    const { previous_status, previous_scheduled_for } = await request.json()
    
    console.log(`🔄 Iniciando undo para tarefa: ${params.id}`)
    
    // 1. Buscar a tarefa atual
    const { data: task, error: fetchError } = await supabase
      .from('relationship_tasks')
      .select(`
        id,
        status,
        scheduled_for,
        deleted_at,
        updated_at,
        student_id,
        student:students(name, tenant_id)
      `)
      .eq('id', params.id)
      .single()
    
    if (fetchError || !task) {
      console.error('❌ Tarefa não encontrada:', fetchError)
      return NextResponse.json({ 
        error: 'Tarefa não encontrada' 
      }, { status: 404 })
    }
    
    // 2. Validar se a tarefa está em estado que permite undo
    const allowedStatuses = ['deleted', 'skipped']
    if (!allowedStatuses.includes(task.status)) {
      console.error(`❌ Status atual não permite undo: ${task.status}`)
      return NextResponse.json({ 
        error: 'Esta tarefa não pode ser restaurada',
        current_status: task.status
      }, { status: 400 })
    }
    
    // 3. Validar janela de tempo (5 segundos)
    const actionTimestamp = task.deleted_at || task.updated_at
    const actionTime = new Date(actionTimestamp).getTime()
    const now = new Date().getTime()
    const diffSeconds = (now - actionTime) / 1000
    
    const UNDO_WINDOW_SECONDS = 5
    
    if (diffSeconds > UNDO_WINDOW_SECONDS) {
      console.error(`❌ Janela de undo expirada: ${diffSeconds}s (máximo: ${UNDO_WINDOW_SECONDS}s)`)
      return NextResponse.json({ 
        error: 'Tempo para desfazer a ação expirou',
        elapsed_seconds: Math.floor(diffSeconds),
        max_seconds: UNDO_WINDOW_SECONDS
      }, { status: 400 })
    }
    
    // 4. Preparar dados de restauração
    const restoreData: any = {
      status: previous_status || 'pending',
      updated_at: new Date().toISOString()
    }
    
    // Se foi um delete, limpar deleted_at
    if (task.status === 'deleted') {
      restoreData.deleted_at = null
    }
    
    // Se fornecido scheduled_for anterior, restaurar
    if (previous_scheduled_for) {
      restoreData.scheduled_for = previous_scheduled_for
    }
    
    // 5. Restaurar a tarefa
    const { error: undoError } = await supabase
      .from('relationship_tasks')
      .update(restoreData)
      .eq('id', params.id)
    
    if (undoError) {
      console.error('❌ Erro ao desfazer ação:', undoError)
      return NextResponse.json({ 
        error: 'Erro ao desfazer ação' 
      }, { status: 500 })
    }
    
    // 6. Registrar log de auditoria
    await supabase
      .from('relationship_logs')
      .insert({
        student_id: task.student_id,
        task_id: params.id,
        action: 'undo',
        channel: 'system',
        meta: {
          undone_status: task.status,
          restored_status: restoreData.status,
          undone_scheduled_for: task.scheduled_for,
          restored_scheduled_for: restoreData.scheduled_for,
          undo_performed_by: 'dev-user-id', // TODO: pegar do contexto de autenticação
          elapsed_seconds: Math.floor(diffSeconds),
          student_name: task.student?.name
        }
      })
    
    console.log(`✅ Undo realizado: ${task.student?.name || 'Aluno'} - ${params.id}`)
    console.log(`   ${task.status} → ${restoreData.status}`)
    
    return NextResponse.json({ 
      success: true, 
      message: 'Ação desfeita com sucesso',
      task_id: params.id,
      previous_status: task.status,
      restored_status: restoreData.status,
      elapsed_seconds: Math.floor(diffSeconds)
    })
    
  } catch (error) {
    console.error('❌ Erro no undo:', error)
    return NextResponse.json({ 
      error: 'Erro interno',
      details: error.message 
    }, { status: 500 })
  }
}
