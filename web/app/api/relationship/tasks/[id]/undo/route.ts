// For  ar execu   £o din ¢mica para evitar problemas de renderiza   £o est ¡tica
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * GATE 10.7 - Endpoint de Undo para Tarefas
 * 
 * Permite desfazer a   µes de:
 * - DELETE (soft delete) - restaura status anterior
 * - SKIP - restaura status anterior
 * 
 * Janela de tempo: 5 segundos
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClientAdmin } from '@/utils/supabase/server'
import { resolveRequestContext } from '@/server/context'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Resolver contexto de autenticação
    const ctx = await resolveRequestContext(request)
    
    if (!ctx || !ctx.tenantId) {
      return NextResponse.json(
        { error: "unauthorized", message: "Tenant não resolvido no contexto da requisição." },
        { status: 401 }
      )
    }

    const supabase = await createClientAdmin()
    const { previous_status, previous_scheduled_for } = await request.json()
    
    console.log(`🔄 Iniciando undo para tarefa: ${params.id}`)
    
    // 1. Buscar a tarefa atual com validação de org_id
    const { data: task, error: fetchError } = await supabase
      .from('relationship_tasks')
      .select(`
        id,
        status,
        scheduled_for,
        deleted_at,
        updated_at,
        student_id,
        org_id,
        student:students(name, org_id)
      `)
      .eq('id', params.id)
      .eq('org_id', ctx.tenantId)
      .single()
    
    if (fetchError || !task) {
      console.error(' Œ Tarefa n £o encontrada:', fetchError)
      return NextResponse.json({ 
        error: 'Tarefa n £o encontrada' 
      }, { status: 404 })
    }
    
    // 2. Validar se a tarefa est ¡ em estado que permite undo
    const allowedStatuses = ['deleted', 'skipped']
    if (!allowedStatuses.includes(task.status)) {
      console.error(` Œ Status atual n £o permite undo: ${task.status}`)
      return NextResponse.json({ 
        error: 'Esta tarefa n £o pode ser restaurada',
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
      console.error(` Œ Janela de undo expirada: ${diffSeconds}s (m ¡ximo: ${UNDO_WINDOW_SECONDS}s)`)
      return NextResponse.json({ 
        error: 'Tempo para desfazer a a   £o expirou',
        elapsed_seconds: Math.floor(diffSeconds),
        max_seconds: UNDO_WINDOW_SECONDS
      }, { status: 400 })
    }
    
    // 4. Preparar dados de restaura   £o
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
      console.error(' Œ Erro ao desfazer a   £o:', undoError)
      return NextResponse.json({ 
        error: 'Erro ao desfazer a   £o' 
      }, { status: 500 })
    }
    
    // 6. Registrar log de auditoria
    await supabase
      .from('relationship_logs')
      .insert({
        org_id: ctx.tenantId,
        student_id: task.student_id,
        task_id: params.id,
        action: 'undo',
        channel: 'system',
        meta: {
          undone_status: task.status,
          restored_status: restoreData.status,
          undone_scheduled_for: task.scheduled_for,
          restored_scheduled_for: restoreData.scheduled_for,
          undo_performed_by: ctx.userId || 'system',
          elapsed_seconds: Math.floor(diffSeconds),
          student_name: (Array.isArray((task as any).student) ? (task as any).student[0]?.name : (task as any).student?.name)
        }
      })
    
    console.log(` œ  Undo realizado: ${Array.isArray((task as any).student) ? (task as any).student[0]?.name : (task as any).student?.name || 'Aluno'} - ${params.id}`)
    console.log(`   ${task.status}  †  ${restoreData.status}`)
    
    return NextResponse.json({ 
      success: true, 
      message: 'A   £o desfeita com sucesso',
      task_id: params.id,
      previous_status: task.status,
      restored_status: restoreData.status,
      elapsed_seconds: Math.floor(diffSeconds)
    })
    
  } catch (error) {
    console.error(' Œ Erro no undo:', error)
    return NextResponse.json({ 
      error: 'Erro interno',
      details: (error as any)?.message || String(error) 
    }, { status: 500 })
  }
}
