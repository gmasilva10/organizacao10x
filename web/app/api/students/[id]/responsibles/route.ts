import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { resolveRequestContext } from '@/server/context'

// GET /api/students/[id]/responsibles - Listar responsáveis do aluno
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await resolveRequestContext(request)
  if (!ctx) return NextResponse.json({ error: "unauthorized" }, { status: 401 })

  try {
    const { id: studentId } = await params
    const url = process.env.SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
    if (!url || !key) return NextResponse.json({ error: "service_unavailable" }, { status: 503 })

    const supabase = createClient(url, key)

    // Verificar se o aluno pertence ao tenant
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('id, name, tenant_id')
      .eq('id', studentId)
      .eq('org_id', ctx.tenantId)
      .single()

    if (studentError || !student) {
      return NextResponse.json({ error: 'Aluno não encontrado' }, { status: 404 })
    }

    // Buscar responsáveis com dados do profissional
    const { data: responsibles, error: responsiblesError } = await supabase
      .from('student_responsibles')
      .select(`
        id,
        roles,
        note,
        created_at,
        updated_at,
        professional_id,
        professionals!inner(
          id,
          full_name,
          email,
          whatsapp_work,
          is_active
        )
      `)
      .eq('student_id', studentId)
      .eq('org_id', ctx.tenantId)
      .order('created_at', { ascending: true })

    if (responsiblesError) {
      console.error('Erro ao buscar responsáveis:', responsiblesError)
      return NextResponse.json({ error: 'Erro ao buscar responsáveis' }, { status: 500 })
    }

    // Organizar por papel (usando roles[])
    const organized = {
      principal: responsibles?.filter(r => r.roles?.includes('principal')) || [],
      apoio: responsibles?.filter(r => r.roles?.includes('apoio')) || [],
      especificos: responsibles?.filter(r => r.roles?.includes('especifico')) || []
    }

    return NextResponse.json({
      student: { id: student.id, name: student.name },
      responsibles: organized,
      total: responsibles?.length || 0
    })

  } catch (error: any) {
    console.error('Erro na API /students/[id]/responsibles:', error)
    return NextResponse.json({ 
      error: 'Erro interno do servidor',
      details: error.message 
    }, { status: 500 })
  }
}

// POST /api/students/[id]/responsibles - Criar/atualizar responsável
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await resolveRequestContext(request)
  if (!ctx) return NextResponse.json({ error: "unauthorized" }, { status: 401 })

  try {
    const { id: studentId } = await params
    const body = await request.json()
    const { roles, professional_id, note } = body

    if (!roles || !Array.isArray(roles) || roles.length === 0) {
      return NextResponse.json({ error: 'Roles é obrigatório e deve ser um array não vazio' }, { status: 400 })
    }

    if (!professional_id) {
      return NextResponse.json({ error: 'Professional_id é obrigatório' }, { status: 400 })
    }

    // Validar roles
    const validRoles = ['principal', 'apoio', 'especifico']
    const invalidRoles = roles.filter(role => !validRoles.includes(role))
    if (invalidRoles.length > 0) {
      return NextResponse.json({ 
        error: `Roles inválidos: ${invalidRoles.join(', ')}. Válidos: ${validRoles.join(', ')}` 
      }, { status: 400 })
    }

    const url = process.env.SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
    if (!url || !key) return NextResponse.json({ error: "service_unavailable" }, { status: 503 })

    const supabase = createClient(url, key)

    // Verificar se o aluno pertence ao tenant
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('id, name, tenant_id')
      .eq('id', studentId)
      .eq('org_id', ctx.tenantId)
      .single()

    if (studentError || !student) {
      return NextResponse.json({ error: 'Aluno não encontrado' }, { status: 404 })
    }

    // Verificar se o profissional existe e está ativo
    const { data: professional, error: professionalError } = await supabase
      .from('professionals')
      .select('id, full_name, is_active, tenant_id')
      .eq('id', professional_id)
      .eq('org_id', ctx.tenantId)
      .single()

    if (professionalError || !professional) {
      return NextResponse.json({ error: 'Profissional não encontrado' }, { status: 404 })
    }

    if (!professional.is_active) {
      return NextResponse.json({ error: 'Profissional inativo não pode ser associado' }, { status: 400 })
    }

    // Se for principal, verificar se já existe outro principal
    if (roles.includes('principal')) {
      const { data: existingPrincipal, error: principalError } = await supabase
        .from('student_responsibles')
        .select('id, professional_id')
        .eq('student_id', studentId)
        .eq('org_id', ctx.tenantId)
        .contains('roles', ['principal'])
        .neq('professional_id', professional_id)
        .single()

      if (principalError && principalError.code !== 'PGRST116') {
        console.error('Erro ao verificar principal existente:', principalError)
        return NextResponse.json({ error: 'Erro ao verificar principal existente' }, { status: 500 })
      }

      if (existingPrincipal) {
        return NextResponse.json({ 
          error: 'Já existe um treinador principal para este aluno' 
        }, { status: 409 })
      }
    }

    // Upsert responsável (atualizar ou criar)
    const { data: responsible, error: upsertError } = await supabase
      .from('student_responsibles')
      .upsert({
        student_id: studentId,
        professional_id: professional_id,
        roles,
        note: note || null,
        tenant_id: ctx.tenantId
      }, {
        onConflict: 'tenant_id,student_id,professional_id'
      })
      .select(`
        id,
        roles,
        note,
        created_at,
        updated_at,
        professional_id,
        professionals!inner(
          id,
          full_name,
          email,
          whatsapp_work,
          is_active
        )
      `)
      .single()

    if (upsertError) {
      console.error('Erro ao upsert responsável:', upsertError)
      return NextResponse.json({ error: 'Erro ao salvar responsável' }, { status: 500 })
    }

    return NextResponse.json({
      responsible,
      message: 'Responsável associado com sucesso'
    })

  } catch (error: any) {
    console.error('Erro na API POST /students/[id]/responsibles:', error)
    return NextResponse.json({ 
      error: 'Erro interno do servidor',
      details: error.message 
    }, { status: 500 })
  }
}