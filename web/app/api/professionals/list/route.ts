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
    const { data: professionals, error } = await supabase
      .from('professionals')
      .select(`
        id,
        full_name,
        email,
        professional_profiles!inner(name)
      `)
      .eq('org_id', ctx.org_id)
      .order('full_name', { ascending: true })

    if (error) {
      console.error('Erro ao buscar profissionais:', error)
      return NextResponse.json({ error: "database_error" }, { status: 500 })
    }

    return NextResponse.json({ professionals })
  } catch (error) {
    console.error('Erro inesperado:', error)
    return NextResponse.json({ error: "internal_error" }, { status: 500 })
  }
}

