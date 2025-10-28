
// Forçar execução dinâmica para evitar problemas de renderização estática
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * Endpoint para operações individuais de tarefas de relacionamento
 * GET, PATCH, DELETE
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClientAdmin } from '@/utils/supabase/server'
import { resolveRequestContext } from '@/server/context'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClientAdmin()
    
    const { data: task, error } = await supabase
      .from('relationship_tasks')
      .select(`
        *,
        student:students(name, phone, email)
      `)
      .eq('id', params.id)
      .single()
    
    if (error) {
      return NextResponse.json({ error: 'Tarefa não encontrada' }, { status: 404 })
    }
    
    return NextResponse.json({ task })
    
  } catch (error) {
    console.error('Erro ao buscar tarefa:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const supabase = await createClientAdmin()
    
    const { data: task, error } = await supabase
      .from('relationship_tasks')
      .update(body)
      .eq('id', params.id)
      .select(`
        *,
        student:students(name, phone, email)
      `)
      .single()
    
    if (error) {
      return NextResponse.json({ error: 'Erro ao atualizar tarefa' }, { status: 500 })
    }
    
    return NextResponse.json({ task })
    
  } catch (error) {
    console.error('Erro ao atualizar tarefa:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log(`🗑️ Soft delete tarefa: ${params.id}`)
    
    // Resolver contexto de autenticação
    const ctx = await resolveRequestContext(request)
    
    if (!ctx || !ctx.org_id) {
      return NextResponse.json(
        { error: "unauthorized", message: "Tenant não resolvido no contexto da requisição." },
        { status: 401 }
      )
    }
    
    const supabase = await createClientAdmin()
    
    // 1. Buscar a tarefa para log
    const { data: task, error: fetchError } = await supabase
      .from('relationship_tasks')
      .select('id, student_id, status, scheduled_for, student:students(name)')
      .eq('id', params.id)
      .eq('org_id', ctx.org_id)
      .single()
    
    if (fetchError) {
      console.error('❌ Erro ao buscar tarefa:', fetchError)
      return NextResponse.json({ error: 'Erro ao buscar tarefa' }, { status: 500 })
    }
    
    if (!task) {
      return NextResponse.json({ error: 'Tarefa não encontrada' }, { status: 404 })
    }
    
    // 2. Soft delete - marcar como deleted
    const { error: updateError } = await supabase
      .from('relationship_tasks')
      .update({ 
        status: 'deleted',
        deleted_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', params.id)
      .eq('org_id', ctx.org_id)
    
    if (updateError) {
      console.error('❌ Erro ao deletar tarefa:', updateError)
      return NextResponse.json({ 
        error: 'Erro ao deletar tarefa', 
        details: updateError.message 
      }, { status: 500 })
    }
    
    // 3. Log de auditoria (opcional - não falhar se a tabela não existir)
    try {
      await supabase
        .from('relationship_logs')
        .insert({
          student_id: task.student_id,
          task_id: params.id,
          action: 'deleted',
          channel: 'manual',
          meta: {
            previous_status: task.status,
            previous_scheduled_for: task.scheduled_for,
            deleted_by: ctx.userId || 'dev-user-id'
          }
        })
    } catch (logError) {
      console.warn('⚠️ Erro ao registrar log de auditoria (não crítico):', logError)
    }
    
    const studentName = Array.isArray((task as any).student) 
      ? (task as any).student[0]?.name 
      : (task as any).student?.name || 'Aluno'
    
    console.log(`✅ Tarefa deletada (soft): ${studentName} - ${params.id}`)
    
    return NextResponse.json({ 
      success: true, 
      message: 'Tarefa excluída com sucesso',
      can_undo: true,
      undo_window_seconds: 5,
      previous_status: task.status,
      previous_scheduled_for: task.scheduled_for
    })
    
  } catch (error) {
    console.error('❌ Erro na exclusão:', error)
    return NextResponse.json({ 
      error: 'Erro interno do servidor', 
      details: (error as any)?.message 
    }, { status: 500 })
  }
}
