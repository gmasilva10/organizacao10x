import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { resolveRequestContext } from '@/server/context'

const WRITERS = new Set(['admin', 'manager'])

export async function GET(request: NextRequest) {
  const ctx = await resolveRequestContext(request)
  if (!ctx) return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  if (!WRITERS.has(ctx.role)) return NextResponse.json({ error: "forbidden" }, { status: 403 })

  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
  if (!url || !key) return NextResponse.json({ error: "service_unavailable" }, { status: 503 })

  const supabase = createClient(url, key)

  try {
    // Buscar defaults do tenant
    const { data: defaults, error } = await supabase
      .from('team_defaults')
      .select(`
        *,
        owner_professional:professionals!owner_professional_id(id, full_name),
        trainer_primary_professional:professionals!trainer_primary_professional_id(id, full_name),
        trainer_support_professional:professionals!trainer_support_professional_id(id, full_name)
      `)
      .eq('tenant_id', ctx.tenantId)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('Erro ao buscar defaults:', error)
      return NextResponse.json({ error: "database_error" }, { status: 500 })
    }

    // Se não existir defaults, retornar objeto vazio
    if (!defaults) {
      return NextResponse.json({ defaults: null })
    }

    return NextResponse.json({ defaults })
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

  const supabase = createClient(url, key)

  try {
    const body = await request.json()
    const { 
      owner_professional_id, 
      trainer_primary_professional_id, 
      trainer_support_professional_id 
    } = body

    // Validações básicas
    if (!owner_professional_id || !trainer_primary_professional_id) {
      return NextResponse.json({ error: "missing_required_fields" }, { status: 400 })
    }

    // Verificar se os profissionais pertencem ao mesmo tenant
    const { data: professionals, error: professionalsError } = await supabase
      .from('professionals')
      .select('id')
      .eq('tenant_id', ctx.tenantId)
      .in('id', [
        owner_professional_id, 
        trainer_primary_professional_id,
        ...(trainer_support_professional_id ? [trainer_support_professional_id] : [])
      ])

    if (professionalsError) {
      console.error('Erro ao verificar profissionais:', professionalsError)
      return NextResponse.json({ error: "database_error" }, { status: 500 })
    }

    const professionalIds = professionals?.map(p => p.id) || []
    const requiredIds = [owner_professional_id, trainer_primary_professional_id]
    const optionalIds = trainer_support_professional_id ? [trainer_support_professional_id] : []

    // Verificar se todos os IDs obrigatórios existem
    if (!requiredIds.every(id => professionalIds.includes(id))) {
      return NextResponse.json({ error: "invalid_professional_ids" }, { status: 400 })
    }

    // Verificar se ID opcional existe (se fornecido)
    if (trainer_support_professional_id && !professionalIds.includes(trainer_support_professional_id)) {
      return NextResponse.json({ error: "invalid_support_professional_id" }, { status: 400 })
    }

    // Verificar se já existe defaults para este tenant
    const { data: existingDefaults, error: checkError } = await supabase
      .from('team_defaults')
      .select('id')
      .eq('tenant_id', ctx.tenantId)
      .single()

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Erro ao verificar defaults existentes:', checkError)
      return NextResponse.json({ error: "database_error" }, { status: 500 })
    }

    let result

    if (existingDefaults) {
      // Atualizar defaults existentes
      const { data: updatedDefaults, error: updateError } = await supabase
        .from('team_defaults')
        .update({
          owner_professional_id,
          trainer_primary_professional_id,
          trainer_support_professional_id,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingDefaults.id)
        .eq('tenant_id', ctx.tenantId)
        .select(`
          *,
          owner_professional:professionals!owner_professional_id(id, full_name),
          trainer_primary_professional:professionals!trainer_primary_professional_id(id, full_name),
          trainer_support_professional:professionals!trainer_support_professional_id(id, full_name)
        `)
        .single()

      if (updateError) {
        console.error('Erro ao atualizar defaults:', updateError)
        return NextResponse.json({ error: "database_error" }, { status: 500 })
      }

      result = updatedDefaults
    } else {
      // Criar novos defaults
      const { data: newDefaults, error: createError } = await supabase
        .from('team_defaults')
        .insert({
          tenant_id: ctx.tenantId,
          owner_professional_id,
          trainer_primary_professional_id,
          trainer_support_professional_id
        })
        .select(`
          *,
          owner_professional:professionals!owner_professional_id(id, full_name),
          trainer_primary_professional:professionals!trainer_primary_professional_id(id, full_name),
          trainer_support_professional:professionals!trainer_support_professional_id(id, full_name)
        `)
        .single()

      if (createError) {
        console.error('Erro ao criar defaults:', createError)
        return NextResponse.json({ error: "database_error" }, { status: 500 })
      }

      result = newDefaults
    }

    return NextResponse.json({ 
      success: true,
      message: 'Defaults salvos com sucesso',
      defaults: result
    })

  } catch (error) {
    console.error('Erro inesperado:', error)
    return NextResponse.json({ error: "internal_error" }, { status: 500 })
  }
}
