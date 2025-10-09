import { NextRequest, NextResponse } from "next/server"
import { resolveRequestContext } from "@/utils/context/request-context"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const startTime = Date.now()
  
  try {
    const ctx = await resolveRequestContext(request)
    const requestId = Math.random().toString(36).slice(2, 10)
    const env = process.env.NEXT_PUBLIC_ENV || process.env.NODE_ENV || 'development'
    const softDelete = (process.env.STUDENTS_USE_SOFT_DELETE ?? 'true') !== 'false'
    const commit = (process.env.VERCEL_GIT_COMMIT_SHA || process.env.COMMIT_SHA || 'dev').slice(0, 7)
    const { id: studentId } = await params

    // Debug de contexto de tenant
    console.log('🔍 API Student Detail - Contexto de tenant:', {
      userId: ctx?.userId,
      org_id: ctx?.org_id,
      role: ctx?.role,
      studentId,
      env,
      requestId
    })

    // Em produção exigimos tenant; em dev permitimos fallback sem multi-tenant
    const isDev = process.env.NODE_ENV !== 'production'
    if ((!ctx || !ctx.org_id) && !isDev) {
      const queryTime = Date.now() - startTime
      console.error('❌ API Student Detail - Tenant não resolvido:', { ctx, isDev, studentId })
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

    // Buscar aluno específico com feature-flag de soft-delete
    const filters: string[] = []
    filters.push(`id=eq.${studentId}`)
    if (ctx?.org_id) filters.push(`org_id=eq.${ctx.org_id}`)
    if (softDelete) filters.push(`deleted_at=is.null`)
    const select = `select=id,name,email,phone,status,created_at,trainer_id,photo_url,birth_date,gender,marital_status,nationality,birth_place,address`
    const studentUrl = `${url}/rest/v1/students?${filters.join('&')}&${select}`
    
    let studentResponse: Response
    try {
      studentResponse = await fetch(studentUrl, {
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
        { error: 'upstream_unreachable', message: e?.message || 'Falha ao contatar Supabase', url: studentUrl },
        { status: 503, headers: { 'X-Query-Time': queryTime.toString() } }
      )
    }

    if (!studentResponse.ok) {
      const text = await studentResponse.text().catch(() => '')
      const lowered = (text || '').toLowerCase()
      const isMissingColumn = lowered.includes('column') && lowered.includes('does not exist')
      const isUuidError = lowered.includes('invalid input syntax for type uuid')
      if (studentResponse.status === 404 || lowered.includes('not found')) {
        return NextResponse.json({ code: 'STUDENT_NOT_FOUND' }, { status: 404 })
      }
      if (isUuidError) {
        return NextResponse.json({ code: 'STUDENT_NOT_FOUND' }, { status: 404 })
      }
      const status = isMissingColumn ? 400 : 500
      return NextResponse.json(
        { error: status === 400 ? 'BAD_REQUEST' : 'INTERNAL_ERROR', details: text || undefined },
        { status }
      )
    }

    const students = await studentResponse.json()
    
    if (!students || students.length === 0) {
      return NextResponse.json({ code: "STUDENT_NOT_FOUND" }, { status: 404 })
    }

    const student = students[0]
    
    // Buscar dados do treinador se existir
    let trainer = null
    if (student.trainer_id) {
      const trainerTenant = ctx?.org_id ? `&org_id=eq.${ctx.org_id}` : ''
      const trainerUrl = `${url}/rest/v1/profiles?id=eq.${student.trainer_id}${trainerTenant}&select=id,full_name`
      
      try {
        const trainerResponse = await fetch(trainerUrl, {
          headers: { 
            apikey: key!, 
            Authorization: `Bearer ${key}`!, 
            Accept: 'application/json'
          },
          cache: "no-store",
        })
        
        if (trainerResponse.ok) {
          const trainers = await trainerResponse.json()
          if (trainers && trainers.length > 0) {
            trainer = {
              id: trainers[0].id,
              name: trainers[0].full_name
            }
          }
        }
      } catch (error) {
        console.error('Erro ao buscar treinador:', error)
      }
    }

    // Formatar dados
    const formattedStudent = {
      id: student.id,
      name: student.name,
      email: student.email,
      phone: student.phone,
      status: student.status,
      created_at: student.created_at,
      photo_url: student.photo_url,
      birth_date: student.birth_date,
      gender: student.gender,
      marital_status: student.marital_status,
      nationality: student.nationality,
      birth_place: student.birth_place,
      trainer_id: student.trainer_id,
      trainer_name: trainer?.name || null,
      trainer: trainer,
      address: student.address
    }

    const queryTime = Date.now() - startTime
    return NextResponse.json(formattedStudent, {
      headers: {
        'X-Query-Time': queryTime.toString(),
        'Cache-Control': 'no-store',
        'Pragma': 'no-cache',
        'X-Debug-Env': env,
        'X-Debug-Commit': commit,
        'X-Debug-Tenant': String(ctx.org_id || ''),
        'X-Debug-User': String(ctx.userId || ''),
        'X-Debug-Flags': `STUDENTS_USE_SOFT_DELETE=${softDelete}`,
      }
    })

  } catch (error) {
    console.error("Erro na API de aluno específico:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const startTime = Date.now()
  
  try {
    const ctx = await resolveRequestContext(request)
    
    if (!ctx || !ctx.org_id) {
      const queryTime = Date.now() - startTime
      return NextResponse.json(
        { error: "unauthorized", message: "Tenant não resolvido no contexto da requisição." },
        { status: 401, headers: { 'X-Query-Time': queryTime.toString() } }
      )
    }

    const { id: studentId } = await params
    const body = await request.json()

    const url = process.env.SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
    if (!url || !key) {
      return NextResponse.json({ error: "service_unavailable" }, { status: 503 })
    }

    // Preparar dados para atualização (apenas campos essenciais por enquanto)
    const updateData: any = {
      name: body.name,
      email: body.email,
      phone: body.phone,
      status: body.status,
      trainer_id: body.trainer_id && body.trainer_id !== '4' ? body.trainer_id : null,
      onboard_opt: body.onboard_opt, // Adicionar campo onboard_opt
      updated_at: new Date().toISOString()
    }

    // Adicionar campos opcionais apenas se existirem e não forem vazios
    if (body.photo_url && !body.photo_url.startsWith('blob:')) {
      updateData.photo_url = body.photo_url
    }
    if (body.birth_date) {
      updateData.birth_date = body.birth_date
    }
    if (body.gender) {
      updateData.gender = body.gender
    }
    if (body.marital_status) {
      updateData.marital_status = body.marital_status
    }
    if (body.nationality) {
      updateData.nationality = body.nationality
    }
    if (body.birth_place) {
      updateData.birth_place = body.birth_place
    }

    // Processar campos de endereço (campo JSONB)
    if (body.address) {
      updateData.address = body.address
    }

    // Log para debug
    console.log('Dados sendo enviados para atualização:', JSON.stringify(updateData, null, 2))

    const updateUrl = `${url}/rest/v1/students?id=eq.${studentId}&org_id=eq.${ctx.org_id}`
    
    const updateResponse = await fetch(updateUrl, {
      method: 'PATCH',
      headers: { 
        apikey: key!, 
        Authorization: `Bearer ${key}`!, 
        'Content-Type': 'application/json',
        Prefer: 'return=representation'
      },
      body: JSON.stringify(updateData)
    })

    if (!updateResponse.ok) {
      return NextResponse.json({ error: "Erro ao atualizar aluno" }, { status: 500 })
    }

    const updatedStudent = await updateResponse.json()
    const queryTime = Date.now() - startTime

    return NextResponse.json({
      success: true,
      student: updatedStudent[0] || updatedStudent
    }, {
      headers: { 'X-Query-Time': queryTime.toString() }
    })

  } catch (error) {
    console.error("Erro na API de atualização de aluno:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
