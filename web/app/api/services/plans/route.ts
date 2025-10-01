/**
 * GATE 10.9 - Plans API
 * Lista planos de venda para mapeamento com integrações
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClientAdmin } from '@/utils/supabase/server'
import { resolveRequestContext } from '@/server/context'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClientAdmin()
    
    // Obter org_id do contexto quando possível; fallback ao dev org
    const ctx = await resolveRequestContext(request).catch(() => null)
    const org_id = ctx?.tenantId || 'fb381d42-9cf8-41d9-b0ab-fdb706a85ae7'
    
    const { data, error } = await supabase
      .from('plans')
      .select('*')
      .eq('org_id', org_id)
      .eq('ativo', true)
      .order('nome')
    
    if (error) throw error
    
    return NextResponse.json({
      plans: data || []
    })
    
  } catch (error: any) {
    console.error('[PLANS API] Error:', error)
    return NextResponse.json({
      error: 'Erro ao buscar planos',
      details: error.message
    }, { status: 500 })
  }
}
