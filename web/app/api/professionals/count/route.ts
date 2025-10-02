import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { resolveRequestContext } from '@/server/context'

export async function GET(request: NextRequest) {
  const ctx = await resolveRequestContext(request)
  if (!ctx) return NextResponse.json({ error: "unauthorized" }, { status: 401 })

  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
  if (!url || !key) return NextResponse.json({ error: "service_unavailable" }, { status: 503 })

  const supabase = createClient(url, key)

  try {
    const { count, error } = await supabase
      .from('professionals')
      .select('*', { count: 'exact', head: true })
      .eq('org_id', ctx.tenantId)

    if (error) {
      console.error('Erro ao contar profissionais:', error)
      return NextResponse.json({ error: "database_error" }, { status: 500 })
    }

    const plan = (ctx as any).plan || 'basic'
    return NextResponse.json({ 
      count: count || 0,
      plan,
      canAddMore: plan === 'enterprise' || (plan === 'basic' && (count || 0) < 1)
    })
  } catch (error) {
    console.error('Erro inesperado:', error)
    return NextResponse.json({ error: "internal_error" }, { status: 500 })
  }
}

