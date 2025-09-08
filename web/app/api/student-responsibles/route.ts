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
    const { data: responsibles, error } = await supabase
      .from('student_responsibles')
      .select(`
        *,
        students!inner(name, email),
        professionals!inner(full_name, email, professional_profiles!inner(name))
      `)
      .eq('students.tenant_id', ctx.tenantId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Erro ao buscar responsáveis:', error)
      return NextResponse.json({ error: "database_error" }, { status: 500 })
    }

    return NextResponse.json({ responsibles })
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
    student_id: string
    professional_id: number
  }>

  // Validações
  const student_id = String((b.student_id ?? "").toString()).trim()
  if (!student_id) {
    return NextResponse.json({ error: "invalid_student_id" }, { status: 400 })
  }

  const professional_id = Number(b.professional_id)
  if (!Number.isInteger(professional_id) || professional_id <= 0) {
    return NextResponse.json({ error: "invalid_professional_id" }, { status: 400 })
  }

  const supabase = createClient(url, key)

  try {
    // Verificar se aluno existe no tenant
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('id')
      .eq('id', student_id)
      .eq('tenant_id', ctx.tenantId)
      .single()

    if (studentError || !student) {
      return NextResponse.json({ error: "student_not_found" }, { status: 404 })
    }

    // Verificar se profissional existe no tenant
    const { data: professional, error: professionalError } = await supabase
      .from('professionals')
      .select('id')
      .eq('id', professional_id)
      .eq('tenant_id', ctx.tenantId)
      .single()

    if (professionalError || !professional) {
      return NextResponse.json({ error: "professional_not_found" }, { status: 404 })
    }

    // Verificar se já existe o vínculo
    const { data: existing, error: existingError } = await supabase
      .from('student_responsibles')
      .select('id')
      .eq('student_id', student_id)
      .eq('professional_id', professional_id)
      .single()

    if (existingError && existingError.code !== 'PGRST116') {
      console.error('Erro ao verificar vínculo existente:', existingError)
      return NextResponse.json({ error: "database_error" }, { status: 500 })
    }

    if (existing) {
      return NextResponse.json({ error: "relationship_already_exists" }, { status: 409 })
    }

    // Criar vínculo
    const { data: responsible, error } = await supabase
      .from('student_responsibles')
      .insert({
        student_id,
        professional_id
      })
      .select(`
        *,
        students!inner(name, email),
        professionals!inner(full_name, email, professional_profiles!inner(name))
      `)
      .single()

    if (error) {
      console.error('Erro ao criar vínculo:', error)
      return NextResponse.json({ error: "database_error" }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Responsável vinculado com sucesso',
      responsible 
    })
  } catch (error) {
    console.error('Erro inesperado:', error)
    return NextResponse.json({ error: "internal_error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const ctx = await resolveRequestContext(request)
  if (!ctx) return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  if (!WRITERS.has(ctx.role)) return NextResponse.json({ error: "forbidden" }, { status: 403 })

  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
  if (!url || !key) return NextResponse.json({ error: "service_unavailable" }, { status: 503 })

  const { searchParams } = new URL(request.url)
  const student_id = searchParams.get('student_id')
  const professional_id = searchParams.get('professional_id')

  if (!student_id || !professional_id) {
    return NextResponse.json({ error: "missing_parameters" }, { status: 400 })
  }

  const supabase = createClient(url, key)

  try {
    const { error } = await supabase
      .from('student_responsibles')
      .delete()
      .eq('student_id', student_id)
      .eq('professional_id', professional_id)

    if (error) {
      console.error('Erro ao remover vínculo:', error)
      return NextResponse.json({ error: "database_error" }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Responsável removido com sucesso'
    })
  } catch (error) {
    console.error('Erro inesperado:', error)
    return NextResponse.json({ error: "internal_error" }, { status: 500 })
  }
}
