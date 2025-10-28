/**
 * Seed Templates - Endpoint para popular templates padrão
 * 
 * POST /api/relationship/seed-templates
 * Popula o banco com templates prontos para uso
 */

import { NextRequest, NextResponse } from 'next/server'
import { DEFAULT_TEMPLATES } from '@/lib/relationship/default-templates'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    console.log('🔍 [SEED-TEMPLATES] Iniciando processo de seed...')
    
    // Verificar variáveis de ambiente
    if (!supabaseUrl || !supabaseKey) {
      console.error('❌ [SEED-TEMPLATES] Variáveis de ambiente faltando')
      return NextResponse.json({
        success: false,
        error: 'missing_env_vars',
        details: 'SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não configuradas',
        duration_ms: Date.now() - startTime
      }, { status: 500 })
    }
    
    console.log('✅ [SEED-TEMPLATES] Variáveis de ambiente OK')
    
    // Criar cliente Supabase
    const supabase = createClient(supabaseUrl, supabaseKey)
    console.log('✅ [SEED-TEMPLATES] Cliente Supabase criado')
    
    // Usar org_id que existe no banco
    const orgId = 'e9b223b3-f300-4d28-8a2c-0e8064d00d1a'
    console.log('🔍 [SEED-TEMPLATES] Usando org_id:', orgId)
    
    // Verificar se já existem templates
    console.log('🔍 [SEED-TEMPLATES] Verificando templates existentes...')
    const { data: existingTemplates, error: selectError } = await supabase
      .from('relationship_templates_v2')
      .select('code')
      .eq('org_id', orgId)
    
    if (selectError) {
      console.error('❌ [SEED-TEMPLATES] Erro ao verificar templates existentes:', selectError)
      return NextResponse.json({
        success: false,
        error: 'database_error',
        details: selectError.message,
        duration_ms: Date.now() - startTime
      }, { status: 500 })
    }
    
    console.log('✅ [SEED-TEMPLATES] Templates existentes verificados:', existingTemplates?.length || 0)
    
    const existingCodes = new Set((existingTemplates || []).map((t: any) => t.code))
    
    // Filtrar apenas templates que ainda não existem
    const templatesToInsert = DEFAULT_TEMPLATES
      .filter(t => !existingCodes.has(t.code))
      .map(t => ({
        ...t,
        org_id: orgId
      }))
    
    console.log('🔍 [SEED-TEMPLATES] Templates para inserir:', templatesToInsert.length)
    
    if (templatesToInsert.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'Todos os templates padrão já existem',
        inserted: 0,
        skipped: existingCodes.size,
        duration_ms: Date.now() - startTime
      })
    }
    
    // Inserir templates em lote
    console.log('🔍 [SEED-TEMPLATES] Inserindo templates...')
    const { data, error } = await supabase
      .from('relationship_templates_v2')
      .insert(templatesToInsert)
      .select()
    
    if (error) {
      console.error('❌ [SEED-TEMPLATES] Erro ao inserir templates:', error)
      return NextResponse.json({
        success: false,
        error: 'insert_failed',
        details: error.message,
        duration_ms: Date.now() - startTime
      }, { status: 500 })
    }
    
    const duration = Date.now() - startTime
    console.log('✅ [SEED-TEMPLATES] Templates inseridos com sucesso:', data?.length || 0)
    
    return NextResponse.json({
      success: true,
      message: `${templatesToInsert.length} templates padrão inseridos com sucesso`,
      inserted: templatesToInsert.length,
      skipped: existingCodes.size,
      templates: data,
      duration_ms: duration
    })
    
  } catch (error) {
    console.error('❌ [SEED-TEMPLATES] Erro geral:', error)
    console.error('❌ [SEED-TEMPLATES] Stack trace:', (error as any)?.stack)
    
    return NextResponse.json({
      success: false,
      error: 'internal_error',
      details: (error as any)?.message || String(error),
      duration_ms: Date.now() - startTime,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

/**
 * GET - Lista templates padrão disponíveis (sem inserir)
 */
export async function GET(request: NextRequest) {
  try {
    return NextResponse.json({
      templates: DEFAULT_TEMPLATES,
      count: DEFAULT_TEMPLATES.length
    })
    
  } catch (error) {
    return NextResponse.json({
      error: 'internal_error',
      details: (error as any)?.message || String(error)
    }, { status: 500 })
  }
}