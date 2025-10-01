import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { resolveRequestContext } from '@/server/context'

export async function GET(request: NextRequest) {
  // Guard: somente disponível em dev ou quando explicitamente habilitado
  if (
    process.env.NODE_ENV !== 'development' &&
    process.env.ENABLE_DEBUG_ROUTES !== '1'
  ) {
    return NextResponse.json({ error: 'Debug endpoint disabled' }, { status: 403 })
  }
  const ctx = await resolveRequestContext(request)
  if (!ctx) return NextResponse.json({ error: "unauthorized" }, { status: 401 })

  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
  if (!url || !key) return NextResponse.json({ error: "service_unavailable" }, { status: 503 })

  const supabase = createClient(url, key)

  try {
    // Buscar todos os profissionais ativos
    const { data: professionals, error } = await supabase
      .from('professionals')
      .select(`
        id,
        full_name,
        whatsapp_work,
        is_active,
        professional_profiles!inner(name)
      `)
      .eq('tenant_id', ctx.tenantId)
      .eq('is_active', true)
      .order('full_name', { ascending: true })

    if (error) {
      console.error('Erro ao buscar profissionais:', error)
      return NextResponse.json({ error: "database_error" }, { status: 500 })
    }

    // Verificar se o número do usuário está na lista
    const userPhone = '5517996693499'
    const userInList = professionals?.find(p => {
      const cleanPhone = (p.whatsapp_work || '').replace(/\D/g, '')
      return cleanPhone === userPhone
    })

    return NextResponse.json({ 
      professionals: professionals || [],
      userInList: !!userInList,
      userPhone,
      tenantId: ctx.tenantId,
      total: professionals?.length || 0
    })
  } catch (error) {
    console.error('Erro inesperado:', error)
    return NextResponse.json({ error: "internal_error" }, { status: 500 })
  }
}
