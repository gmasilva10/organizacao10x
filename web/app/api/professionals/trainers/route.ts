import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { resolveRequestContext } from '@/server/context'

const READERS = new Set(['admin', 'manager', 'trainer', 'viewer'])

export async function GET(request: NextRequest) {
  const ctx = await resolveRequestContext(request)
  if (!ctx) return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  if (!READERS.has(ctx.role)) return NextResponse.json({ error: "forbidden" }, { status: 403 })

  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
  if (!url || !key) return NextResponse.json({ error: "service_unavailable" }, { status: 503 })

  const supabase = createClient(url, key)

  try {
    // Buscar profissionais do tenant
    const { data: professionals, error } = await supabase
      .from('professionals')
      .select('id, user_id, full_name, email')
      .eq('org_id', ctx.org_id)
      .not('user_id', 'is', null)
      .order('full_name')

    if (error) {
      console.error('Erro ao buscar profissionais:', error)
      return NextResponse.json({ error: "database_error" }, { status: 500 })
    }

    // Mapear para formato compatível com StudentFullModal
    const trainers = (professionals || []).map(p => ({
      id: String(p.id),
      user_id: p.user_id as string,
      name: p.full_name as string,
      email: p.email as string
    }))

    return NextResponse.json({ trainers })
  } catch (error) {
    console.error('Erro inesperado:', error)
    return NextResponse.json({ error: "internal_error" }, { status: 500 })
  }
}

