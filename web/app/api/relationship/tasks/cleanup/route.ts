/**
 * Endpoint para limpeza completa das tarefas de relacionamento
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClientAdmin } from '@/utils/supabase/server'

export async function DELETE(request: NextRequest) {
  try {
    console.log('🧹 Iniciando limpeza completa das tarefas...')
    
    // Usar cliente admin para bypass RLS
    const supabase = await createClientAdmin()
    
    // 1. Limpar todas as tarefas
    const { error: tasksError } = await supabase
      .from('relationship_tasks')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all
    
    if (tasksError) {
      console.error('❌ Erro ao limpar tarefas:', tasksError)
      return NextResponse.json({ error: 'Erro ao limpar tarefas' }, { status: 500 })
    }
    
    // 2. Limpar todos os logs
    const { error: logsError } = await supabase
      .from('relationship_logs')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all
    
    if (logsError) {
      console.error('❌ Erro ao limpar logs:', logsError)
      return NextResponse.json({ error: 'Erro ao limpar logs' }, { status: 500 })
    }
    
    console.log('✅ Limpeza completa realizada com sucesso')
    
    return NextResponse.json({ 
      success: true, 
      message: 'Dados limpos com sucesso' 
    })
    
  } catch (error) {
    console.error('❌ Erro na limpeza:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
