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
    console.log(`🗑️ Excluindo tarefa: ${params.id}`)
    
    const supabase = await createClientAdmin()
    
    // 1. Buscar a tarefa para log
    const { data: taskToDelete } = await supabase
      .from('relationship_tasks')
      .select('student:students(name)')
      .eq('id', params.id)
      .single()
    
    // 2. Excluir a tarefa
    const { error } = await supabase
      .from('relationship_tasks')
      .delete()
      .eq('id', params.id)
    
    if (error) {
      console.error('❌ Erro ao excluir tarefa:', error)
      return NextResponse.json({ error: 'Erro ao excluir tarefa' }, { status: 500 })
    }
    
    console.log(`✅ Tarefa excluída: ${taskToDelete?.student?.name || 'Aluno'} - ${params.id}`)
    
    return NextResponse.json({ 
      success: true, 
      message: 'Tarefa excluída com sucesso' 
    })
    
  } catch (error) {
    console.error('❌ Erro na exclusão:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
