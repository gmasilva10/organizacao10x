/**
 * Seed Templates - Endpoint para popular templates padrão
 * 
 * POST /api/relationship/seed-templates
 * Popula o banco com templates prontos para uso
 */

import { NextRequest, NextResponse } from 'next/server'
import { DEFAULT_TEMPLATES } from '@/lib/relationship/default-templates'
import { createClient } from '@supabase/supabase-js'
import { resolveRequestContext } from '@/server/context'

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    const ctx = await resolveRequestContext(request)
    if (!ctx) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    }
    
    // Apenas admins podem popular templates
    if (ctx.role !== 'admin') {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 })
    }
    
    const orgId = ctx.org_id
    const supabase = createClient(supabaseUrl, supabaseKey)
    
    // Verificar se já existem templates
    const { data: existingTemplates } = await supabase
      .from('relationship_templates_v2')
      .select('code')
      .eq('org_id', orgId)
    
    const existingCodes = new Set((existingTemplates || []).map((t: any) => t.code))
    
    // Filtrar apenas templates que ainda não existem
    const templatesToInsert = DEFAULT_TEMPLATES
      .filter(t => !existingCodes.has(t.code))
      .map(t => ({
        ...t,
        org_id: orgId
      }))
    
    if (templatesToInsert.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'Todos os templates padrão já existem',
        inserted: 0,
        skipped: DEFAULT_TEMPLATES.length,
        duration_ms: Date.now() - startTime
      })
    }
    
    // Inserir templates em lote
    const { data, error } = await supabase
      .from('relationship_templates_v2')
      .insert(templatesToInsert)
      .select()
    
    if (error) {
      console.error('Erro ao inserir templates:', error)
      return NextResponse.json({
        success: false,
        error: 'insert_failed',
        details: error.message,
        duration_ms: Date.now() - startTime
      }, { status: 500 })
    }
    
    const duration = Date.now() - startTime
    
    return NextResponse.json({
      success: true,
      message: `${templatesToInsert.length} templates padrão inseridos com sucesso`,
      inserted: templatesToInsert.length,
      skipped: existingCodes.size,
      templates: data,
      duration_ms: duration
    })
    
  } catch (error) {
    console.error('Erro ao popular templates:', error)
    return NextResponse.json({
      success: false,
      error: 'internal_error',
      details: (error as any)?.message || String(error),
      duration_ms: Date.now() - startTime
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