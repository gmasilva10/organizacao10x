import { NextRequest, NextResponse } from 'next/server'
import { createClientAdmin } from '@/utils/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { sql } = await request.json()
    
    if (!sql) {
      return NextResponse.json({ 
        error: 'SQL é obrigatório' 
      }, { status: 400 })
    }
    
    const supabase = await createClientAdmin()
    
    // Executar SQL
    const { data, error } = await supabase.rpc('exec_sql', { sql })
    
    if (error) {
      console.error('❌ Erro ao executar SQL:', error)
      return NextResponse.json({ 
        error: 'Erro ao executar SQL',
        details: error.message 
      }, { status: 500 })
    }
    
    return NextResponse.json({
      success: true,
      message: 'SQL executado com sucesso',
      data
    })
    
  } catch (error) {
    console.error('❌ Erro geral:', error)
    return NextResponse.json({ 
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}
