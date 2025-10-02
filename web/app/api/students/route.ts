import { NextRequest, NextResponse } from "next/server"
import { resolveRequestContext } from "@/utils/context/request-context"

export async function GET(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    console.log('🔍 API Students - Iniciando requisição')
    
    const ctx = await resolveRequestContext(request)
    const requestId = Math.random().toString(36).slice(2, 10)
    const env = process.env.NEXT_PUBLIC_ENV || process.env.NODE_ENV || 'development'
    const softDelete = (process.env.STUDENTS_USE_SOFT_DELETE ?? 'true') !== 'false'
    const commit = (process.env.VERCEL_GIT_COMMIT_SHA || process.env.COMMIT_SHA || 'dev').slice(0, 7)

    // Em produção exigimos tenant; em dev permitimos fallback sem multi-tenant
    const isDev = process.env.NODE_ENV !== 'production'
    if ((!ctx || !ctx.tenantId) && !isDev) {
      const queryTime = Date.now() - startTime
      return NextResponse.json(
        { error: 'unauthorized', message: 'Tenant não resolvido no contexto da requisição.' },
        { status: 401, headers: { 'X-Query-Time': queryTime.toString() } }
      )
    }

    const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) {
      const queryTime = Date.now() - startTime
      return NextResponse.json(
        { error: "service_unavailable", message: "Variáveis de ambiente do Supabase ausentes." },
        { status: 503, headers: { 'X-Query-Time': queryTime.toString() } }
      )
    }

    // Buscar parâmetros de query
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const search = searchParams.get('q') || ''
    const status = searchParams.get('status') || ''

    // Construir filtros (org_id apenas)
    const filters: string[] = []
    if (ctx?.tenantId) filters.push(`org_id=eq.${ctx.tenantId}`)
    if (softDelete) filters.push(`deleted_at=is.null`)
    if (status) filters.push(`status=eq.${status}`)
    
    // Filtro de busca por nome, email ou telefone
    if (search) {
      const searchFilter = `or=(name.ilike.*${search}*,email.ilike.*${search}*,phone.ilike.*${search}*)`
      filters.push(searchFilter)
    }

    // Seleção de campos
    const select = `select=id,name,email,phone,status,created_at`
    
    // Ordenação e paginação
    const order = `order=created_at.desc`
    const pagination = `limit=${limit}&offset=${(page - 1) * limit}`
    
    // Construir URL final
    const studentsUrl = `${url}/rest/v1/students?${filters.join('&')}&${select}&${order}&${pagination}`
    
    console.log('🔍 API Students - Buscando dados reais:', studentsUrl)
    
    let studentsResponse: Response
    try {
      studentsResponse = await fetch(studentsUrl, {
        headers: { 
          apikey: key!, 
          Authorization: `Bearer ${key}`!, 
          Accept: 'application/json'
        },
        cache: "no-store",
      })
    } catch (e: any) {
      const queryTime = Date.now() - startTime
      return NextResponse.json(
        { error: 'upstream_unreachable', message: e?.message || 'Falha ao contatar Supabase', url: studentsUrl },
        { status: 503, headers: { 'X-Query-Time': queryTime.toString() } }
      )
    }

    if (!studentsResponse.ok) {
      const text = await studentsResponse.text().catch(() => '')
      const queryTime = Date.now() - startTime
      return NextResponse.json(
        { error: 'upstream_error', message: 'Falha ao buscar estudantes', details: text },
        { status: studentsResponse.status, headers: { 'X-Query-Time': queryTime.toString() } }
      )
    }

    const students = await studentsResponse.json()
    
    // Buscar treinadores principais da tabela student_responsibles
    const studentIds = students.map((s: any) => s.id)
    const trainerMap: Record<string, any> = {}
    
    if (studentIds.length > 0) {
      const studentFilters = [`student_id=in.(${studentIds.join(',')})`, `role=eq.principal`]
      if (ctx?.tenantId) studentFilters.push(`org_id=eq.${ctx.tenantId}`)
      
      const responsibleUrl = `${url}/rest/v1/student_responsibles?${studentFilters.join('&')}&select=student_id,professional_id,professionals(id,full_name)`
      
      try {
        const responsibleResponse = await fetch(responsibleUrl, {
          headers: { 
            apikey: key!, 
            Authorization: `Bearer ${key}`, 
            Accept: 'application/json'
          },
          cache: "no-store",
        })
        
        if (responsibleResponse.ok) {
          const responsibles = await responsibleResponse.json()
          responsibles.forEach((responsible: any) => {
            if (responsible.professionals) {
              trainerMap[responsible.student_id] = {
                id: responsible.professional_id,
                name: responsible.professionals.full_name
              }
            }
          })
        }
      } catch (e) {
        console.warn('Falha ao buscar treinadores principais:', e)
      }
    }

    // Enriquecer dados com informações dos treinadores principais
    const enrichedStudents = students.map((student: any) => ({
      ...student,
      trainer: trainerMap[student.id] || null
    }))

    const queryTime = Date.now() - startTime
    console.log(`✅ API Students - ${enrichedStudents.length} estudantes encontrados em ${queryTime}ms`)

    return NextResponse.json({
      success: true,
      students: enrichedStudents,
      data: enrichedStudents,
      items: enrichedStudents,
      total: enrichedStudents.length,
      page,
      pageSize: limit,
      queryTime
    }, {
      headers: { 
        'X-Query-Time': queryTime.toString(),
        'X-Request-ID': requestId,
        'X-Environment': env,
        'X-Commit': commit
      }
    })

  } catch (error) {
    const queryTime = Date.now() - startTime
    console.error('❌ Erro na API de estudantes:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erro interno do servidor',
        queryTime 
      },
      { 
        status: 500,
        headers: { 'X-Query-Time': queryTime.toString() }
      }
    )
  }
}

// Criação de aluno (mínima e compatível com o modal atual)
export async function POST(request: NextRequest) {
  const startTime = Date.now()
  try {
    const ctx = await resolveRequestContext(request)
    const isDev = process.env.NODE_ENV !== 'production'
    if ((!ctx || !ctx.tenantId) && !isDev) {
      const t = Date.now() - startTime
      return NextResponse.json({ error: 'unauthorized' }, { status: 401, headers: { 'X-Query-Time': String(t) } })
    }

    const payload = await request.json().catch(() => ({})) as Record<string, any>
    const name = String(payload?.name || '').trim()
    const email = String(payload?.email || '').trim()
    if (!name || !email) {
      const t = Date.now() - startTime
      return NextResponse.json({ error: 'invalid_request', message: 'Nome e e-mail são obrigatórios.' }, { status: 400, headers: { 'X-Query-Time': String(t) } })
    }

    // Normalizar telefone para dígitos
    const phoneDigits = String(payload?.phone || '').replace(/\D/g, '') || null
    const status = (payload?.status as string) || 'onboarding'

    const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) {
      const t = Date.now() - startTime
      return NextResponse.json({ error: 'service_unavailable', message: 'Variáveis de ambiente do Supabase ausentes.' }, { status: 503, headers: { 'X-Query-Time': String(t) } })
    }

    // Montar corpo conforme schema (org_id apenas)
    const body = {
      name,
      email,
      phone: phoneDigits,
      status,
      org_id: ctx?.tenantId || null,
    }

    const resp = await fetch(`${url}/rest/v1/students`, {
      method: 'POST',
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation'
      },
      body: JSON.stringify(body)
    })

    const t = Date.now() - startTime
    if (!resp.ok) {
      const details = await resp.text().catch(() => '')
      return NextResponse.json({ error: 'upstream_error', details }, { status: resp.status, headers: { 'X-Query-Time': String(t) } })
    }
    const arr = await resp.json().catch(() => [])
    const student = Array.isArray(arr) ? arr[0] : arr
    return NextResponse.json({ success: true, student }, { status: 201, headers: { 'X-Query-Time': String(t) } })
  } catch (e: any) {
    const t = Date.now() - startTime
    return NextResponse.json({ error: 'internal_error', message: e?.message || 'Erro interno' }, { status: 500, headers: { 'X-Query-Time': String(t) } })
  }
}
