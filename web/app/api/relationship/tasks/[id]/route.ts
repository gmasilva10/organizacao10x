
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
    
    const supabase = await createClientAdmin()
    
    // 1. Buscar a tarefa para log
    const { data: task } = await supabase
      .from('relationship_tasks')
      .select('id, student_id, status, scheduled_for, student:students(name)')
      .eq('id', params.id)
      .single()
    
    if (!task) {
      return NextResponse.json({ error: 'Tarefa não encontrada' }, { status: 404 })
    }
    
    // 2. Soft delete - marcar como deleted
    const { error } = await supabase
      .from('relationship_tasks')
      .update({ 
        status: 'deleted',
        deleted_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', params.id)
    
    if (error) {
      console.error('❌ Erro ao deletar tarefa:', error)
      return NextResponse.json({ error: 'Erro ao deletar tarefa' }, { status: 500 })
    }
    
    // 3. Log de auditoria
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
          deleted_by: 'dev-user-id' // TODO: usar userId real
        }
      })
    
    console.log(`✅ Tarefa deletada (soft): ${task.student?.name || 'Aluno'} - ${params.id}`)
    
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
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
