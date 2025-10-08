import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { resolveRequestContext } from '@/server/context'

const WRITERS = new Set(['admin', 'manager'])

export async function GET(request: NextRequest) {
  const ctx = await resolveRequestContext(request)
  if (!ctx) return NextResponse.json({ error: "unauthorized" }, { status: 401 })

  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
  if (!url || !key) return NextResponse.json({ error: "service_unavailable" }, { status: 503 })

  const supabase = createClient(url, key)

  try {
    const { data: profiles, error } = await supabase
      .from('professional_profiles')
      .select('*')
      .eq('org_id', ctx.tenantId)
      .order('name', { ascending: true })

    if (error) {
      console.error('Erro ao buscar perfis profissionais:', error)
      return NextResponse.json({ error: "database_error" }, { status: 500 })
    }

    return NextResponse.json({ profiles })
  } catch (error) {
    console.error('Erro inesperado:', error)
    return NextResponse.json({ error: "internal_error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const ctx = await resolveRequestContext(request)
  if (!ctx) return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  if (!WRITERS.has(ctx.role)) return NextResponse.json({ error: "forbidden" }, { status: 403 })

  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
  if (!url || !key) return NextResponse.json({ error: "service_unavailable" }, { status: 503 })

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 })
  }

  const b = (body || {}) as Partial<{
    name: string
    description?: string
  }>

  // Validações
  const name = String((b.name ?? "").toString()).trim()
  if (name.length < 2 || name.length > 100) {
    return NextResponse.json({ error: "invalid_name" }, { status: 400 })
  }

  const supabase = createClient(url, key)

  try {
    // Verificar se nome já existe no tenant
    const { data: existingProfile, error: checkError } = await supabase
      .from('professional_profiles')
      .select('id')
      .eq('org_id', ctx.tenantId)
      .eq('name', name)
      .single()

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Erro ao verificar nome do perfil:', checkError)
      return NextResponse.json({ error: "database_error" }, { status: 500 })
    }

    if (existingProfile) {
      return NextResponse.json({ error: "profile_name_already_exists" }, { status: 409 })
    }

    // Criar perfil
    const { data: profile, error } = await supabase
      .from('professional_profiles')
      .insert({
        name,
        description: b.description || null,
        org_id: ctx.tenantId
      })
      .select()
      .single()

    if (error) {
      console.error('Erro ao criar perfil:', error)
      return NextResponse.json({ error: "database_error" }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Perfil profissional criado com sucesso',
      profile 
    })
  } catch (error) {
    console.error('Erro inesperado:', error)
    return NextResponse.json({ error: "internal_error" }, { status: 500 })
  }
}

