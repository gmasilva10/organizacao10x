import { NextRequest, NextResponse } from "next/server"
import { resolveRequestContext } from "@/utils/context/request-context"
import { withCache, CacheConfigs } from "@/lib/cache/middleware"
import { getCache, setCache } from "@/lib/cache/simple"
import { withRateLimit, RateLimitMiddlewareConfigs } from "@/lib/rate-limit/middleware"
// import { withCompression, CompressionConfigs } from "@/lib/compression/middleware"

async function getStudentsHandler(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    console.log('🔍 API Students - Iniciando requisição')
    
    const ctx = await resolveRequestContext(request)
    const requestId = Math.random().toString(36).slice(2, 10)
    const env = process.env.NEXT_PUBLIC_ENV || process.env.NODE_ENV || 'development'
    const softDelete = (process.env.STUDENTS_USE_SOFT_DELETE ?? 'true') !== 'false'
    const commit = (process.env.VERCEL_GIT_COMMIT_SHA || process.env.COMMIT_SHA || 'dev').slice(0, 7)

    // Debug de contexto de tenant
    console.log('🔍 API Students - Contexto de tenant:', {
      userId: ctx?.userId,
      org_id: ctx?.org_id,
      role: ctx?.role,
      env,
      requestId
    })

    // Em produção exigimos tenant; em dev permitimos fallback sem multi-tenant
    const isDev = process.env.NODE_ENV !== 'production'
    if ((!ctx || !ctx.org_id) && !isDev) {
      const queryTime = Date.now() - startTime
      console.error('❌ API Students - Tenant não resolvido:', { ctx, isDev })
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

    // Verificar cache primeiro
    const cacheKey = `students:${ctx?.org_id || 'dev'}:${page}:${limit}:${search}:${status}`
    const cachedData = await getCache(cacheKey, {
      ttl: 120, // 2 minutos para lista de estudantes
      prefix: 'students'
    })

    if (cachedData) {
      console.log('✅ [students] Cache HIT')
      const queryTime = Date.now() - startTime
      return NextResponse.json(cachedData, {
        headers: { 
          'X-Cache': 'HIT',
          'X-Query-Time': queryTime.toString(),
          'X-Request-ID': requestId,
          'X-Environment': env,
          'X-Commit': commit,
          'Cache-Control': 'public, max-age=120, stale-while-revalidate=240'
        }
      })
    }

    // Construir filtros (org_id apenas)
    const filters: string[] = []
    if (ctx?.org_id) filters.push(`org_id=eq.${ctx.org_id}`)
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
      // roles é um array JSON, usar operador @> para verificar se contém 'principal'
      const studentFilters = [`student_id=in.(${studentIds.join(',')})`, `roles=cs.{principal}`]
      if (ctx?.org_id) studentFilters.push(`org_id=eq.${ctx.org_id}`)
      
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

    const result = {
      success: true,
      students: enrichedStudents,
      data: enrichedStudents,
      items: enrichedStudents,
      total: enrichedStudents.length,
      page,
      pageSize: limit,
      queryTime
    }

    // Armazenar no cache
    await setCache(cacheKey, result, {
      ttl: 120, // 2 minutos
      prefix: 'students'
    })

    console.log('✅ [students] Cache MISS - dados armazenados')
    return NextResponse.json(result, {
      headers: { 
        'X-Query-Time': queryTime.toString(),
        'X-Request-ID': requestId,
        'X-Environment': env,
        'X-Commit': commit,
        'X-Cache': 'MISS',
        'Cache-Control': 'public, max-age=120, stale-while-revalidate=240'
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
  console.log('🔥 [API STUDENTS] POST request iniciada')
  try {
    const ctx = await resolveRequestContext(request)
    const isDev = process.env.NODE_ENV !== 'production'
    if ((!ctx || !ctx.org_id) && !isDev) {
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

    // Garantir consistência: status 'onboarding' deve ter onboard_opt 'enviar'
    let finalOnboardOpt = payload.onboard_opt
    console.log('[API STUDENTS] Valores iniciais:', { status, onboard_opt: payload.onboard_opt, finalOnboardOpt })
    
    if (status === 'onboarding' && (!finalOnboardOpt || finalOnboardOpt === 'nao_enviar')) {
      finalOnboardOpt = 'enviar'
      console.log('[API STUDENTS] Auto-corrigindo onboard_opt para "enviar" devido ao status onboarding')
    }
    
    console.log('[API STUDENTS] Valores finais:', { status, finalOnboardOpt })

    const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) {
      const t = Date.now() - startTime
      return NextResponse.json({ error: 'service_unavailable', message: 'Variáveis de ambiente do Supabase ausentes.' }, { status: 503, headers: { 'X-Query-Time': String(t) } })
    }

    // Montar corpo com todos os campos disponíveis
    const body: any = {
      name,
      email,
      phone: phoneDigits,
      status,
      org_id: ctx?.org_id || null,
    }

    // Campos opcionais - Informações Pessoais
    if (payload.birth_date) {
      const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(payload.birth_date))
      const year = m ? Number(m[1]) : NaN
      const currentYear = new Date().getFullYear()
      if (!m || !Number.isFinite(year) || year < 1900 || year > currentYear) {
        const t = Date.now() - startTime
        return NextResponse.json(
          { error: 'invalid_birth_date', message: 'Data de nascimento inválida. Use AAAA-MM-DD entre 1900 e o ano atual.' },
          { status: 400, headers: { 'X-Query-Time': String(t) } }
        )
      }
      body.birth_date = payload.birth_date
    }
    if (payload.gender) body.gender = payload.gender
    if (payload.marital_status) body.marital_status = payload.marital_status
    if (payload.nationality) body.nationality = payload.nationality
    if (payload.birth_place) body.birth_place = payload.birth_place
    if (payload.photo_url) body.photo_url = payload.photo_url

    // Campos opcionais - Configurações
    if (payload.trainer_id) body.trainer_id = payload.trainer_id
    if (finalOnboardOpt) body.onboard_opt = finalOnboardOpt

    // Endereço (salvar como JSONB)
    if (payload.address) {
      const addr = payload.address
      if (addr.zip_code || addr.street || addr.city) {
        body.address = addr
      }
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

    // Se aluno foi criado com onboard_opt = 'enviar', sincronizar com kanban
    console.log('[API STUDENTS] Verificando condição de resync:', { finalOnboardOpt, studentId: student?.id, condition: finalOnboardOpt === 'enviar' && student?.id })
    
    let resyncAttempted = false
    let resyncSuccess = false
    let resyncError = null
    
    if (finalOnboardOpt === 'enviar' && student?.id) {
      resyncAttempted = true
      try {
        // Construir URL correta para a API interna
        const baseUrl = request.url.split('/api/')[0] // http://localhost:3000
        const resyncUrl = `${baseUrl}/api/kanban/resync`
        
        console.log('[API STUDENTS] Tentando sincronizar aluno com kanban:', { studentId: student.id, resyncUrl })
        
        const resyncResponse = await fetch(resyncUrl, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'apikey': key,
            'Authorization': `Bearer ${key}`
          },
          body: JSON.stringify({ 
            student_id: student.id, 
            force_create: true,
            org_id: ctx?.org_id // Passar org_id no body para evitar dependência de cookies
          })
        })
        
        if (resyncResponse.ok) {
          resyncSuccess = true
          console.log('[API STUDENTS] ✅ Aluno sincronizado com kanban:', student.id)
        } else {
          const errorText = await resyncResponse.text()
          resyncError = { status: resyncResponse.status, error: errorText }
          console.warn('[API STUDENTS] ❌ Falha ao sincronizar com kanban:', resyncError)
        }
      } catch (e: any) {
        resyncError = { message: e?.message || 'Erro desconhecido' }
        console.warn('[API STUDENTS] ❌ Erro ao sincronizar com kanban:', e)
        // Não falhar a criação do aluno se o kanban falhar
      }
    }

    // Criar responsáveis se fornecidos
    if (payload.responsibles && Array.isArray(payload.responsibles) && payload.responsibles.length > 0) {
      const responsaveisData = payload.responsibles.map((resp: any) => ({
        student_id: student.id,
        professional_id: resp.professional_id,
        roles: resp.roles,
        org_id: ctx?.org_id || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }))

      const responsaveisResp = await fetch(`${url}/rest/v1/student_responsibles`, {
        method: 'POST',
        headers: {
          apikey: key,
          Authorization: `Bearer ${key}`,
          'Content-Type': 'application/json',
          Prefer: 'return=minimal'
        },
        body: JSON.stringify(responsaveisData)
      })

      if (!responsaveisResp.ok) {
        console.error('Erro ao criar responsáveis:', await responsaveisResp.text())
        // Não falhar a criação do aluno se houver erro nos responsáveis
      }
    }

    return NextResponse.json({ 
      success: true, 
      student,
      debug: {
        resyncAttempted,
        resyncSuccess,
        resyncError,
        finalOnboardOpt
      }
    }, { status: 201, headers: { 'X-Query-Time': String(t) } })
  } catch (e: any) {
    const t = Date.now() - startTime
    return NextResponse.json({ error: 'internal_error', message: e?.message || 'Erro interno' }, { status: 500, headers: { 'X-Query-Time': String(t) } })
  }
}

// Aplicar rate limiting e compressão nas exportações
const rateLimitedHandler = withRateLimit(getStudentsHandler, {
  ...RateLimitMiddlewareConfigs.API,
  getUserId: async (request) => {
    const ctx = await resolveRequestContext(request)
    return ctx?.userId || null
  },
  getOrgId: async (request) => {
    const ctx = await resolveRequestContext(request)
    return ctx?.org_id || null
  }
})

export const GET = rateLimitedHandler
// export const GET = withCompression(rateLimitedHandler, CompressionConfigs.API_LARGE)
