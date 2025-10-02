import { NextRequest, NextResponse } from 'next/server'
import { createClientAdmin } from '@/utils/supabase/server'

// Forçar execução dinâmica para evitar problemas de renderização estática
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;


export async function POST(request: NextRequest) {
  // Guard: somente disponível em dev ou quando explicitamente habilitado
  if (
    process.env.NODE_ENV !== 'development' &&
    process.env.ENABLE_DEBUG_ROUTES !== '1'
  ) {
    return NextResponse.json({ error: 'Debug endpoint disabled' }, { status: 403 })
  }
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

