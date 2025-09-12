import { NextRequest, NextResponse } from "next/server"
import { resolveRequestContext } from "@/utils/context/request-context"

export async function GET(request: NextRequest) {
  try {
    const ctx = await resolveRequestContext(request)
    const requestId = Math.random().toString(36).slice(2, 10)
    const env = process.env.NEXT_PUBLIC_ENV || process.env.NODE_ENV || 'development'
    const softDelete = (process.env.STUDENTS_USE_SOFT_DELETE ?? 'true') !== 'false'
    const commit = (process.env.VERCEL_GIT_COMMIT_SHA || process.env.COMMIT_SHA || 'dev').slice(0, 7)
    console.log(`[students:list] req=${requestId} tenant=${ctx?.tenantId} user=${ctx?.userId} softDelete=${softDelete}`)
    
    // Temporariamente permitir acesso sem autenticação para debug
    if (!ctx) {
      console.log('Usuário não autenticado, usando dados mock')
      // Retornar dados mock temporariamente
      const mockStudents = [
        {
          id: "1",
          name: "João Silva",
          email: "joao@email.com",
          phone: "(11) 99999-9999",
          status: "onboarding",
          created_at: "2025-01-10T10:00:00Z",
          trainer: {
            id: "trainer-1",
            name: "Carlos Trainer"
          }
        },
        {
          id: "2", 
          name: "Maria Santos",
          email: "maria@email.com",
          phone: "(11) 88888-8888",
          status: "active",
          created_at: "2025-01-09T15:30:00Z",
          trainer: {
            id: "trainer-2",
            name: "Ana Coach"
          }
        },
        {
          id: "3",
          name: "Pedro Costa",
          email: "pedro@email.com", 
          phone: "(11) 77777-7777",
          status: "onboarding",
          created_at: "2025-01-08T09:15:00Z",
          trainer: null
        },
        {
          id: "4",
          name: "Ana Oliveira",
          email: "ana@email.com",
          phone: "(11) 66666-6666",
          status: "paused",
          created_at: "2025-01-07T14:20:00Z",
          trainer: {
            id: "trainer-1",
            name: "Carlos Trainer"
          }
        },
        {
          id: "5",
          name: "Lucas Ferreira",
          email: "lucas@email.com",
          phone: "(11) 55555-5555",
          status: "onboarding",
          created_at: "2025-01-06T11:45:00Z",
          trainer: null
        }
      ]

      const { searchParams } = new URL(request.url)
      const page = parseInt(searchParams.get("page") || "1")
      const pageSize = parseInt(searchParams.get("page_size") || "20")
      const search = searchParams.get("search") || ""
      const status = searchParams.get("status") || ""
      const trainerId = searchParams.get("trainer_id") || ""

      // Aplicar filtros nos dados mock
      let filteredStudents = mockStudents

      if (search) {
        const searchLower = search.toLowerCase()
        filteredStudents = filteredStudents.filter(student => 
          student.name.toLowerCase().includes(searchLower) ||
          student.email.toLowerCase().includes(searchLower) ||
          student.phone.includes(search)
        )
      }

      if (status) {
        filteredStudents = filteredStudents.filter(student => student.status === status)
      }

      if (trainerId) {
        filteredStudents = filteredStudents.filter(student => 
          student.trainer?.id === trainerId
        )
      }

      // Aplicar paginação
      const total = filteredStudents.length
      const from = (page - 1) * pageSize
      const to = from + pageSize
      const paginatedStudents = filteredStudents.slice(from, to)

      console.log('Retornando dados mock:', {
        students: paginatedStudents.length,
        total,
        page,
        pageSize
      })

      return NextResponse.json({
        students: paginatedStudents,
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize)
        }
      }, {
        headers: {
          'Cache-Control': 'no-store',
          'Pragma': 'no-cache',
          'X-Debug-Env': env,
          'X-Debug-Commit': commit,
          'X-Debug-Tenant': 'no-ctx',
          'X-Debug-User': 'no-ctx',
          'X-Debug-Flags': `STUDENTS_USE_SOFT_DELETE=${softDelete}`,
        }
      })
    }

    const url = process.env.SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
    if (!url || !key) return NextResponse.json({ error: "service_unavailable" }, { status: 503 })

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1")
    const pageSize = parseInt(searchParams.get("page_size") || "20")
    const search = searchParams.get("search") || ""
    const status = searchParams.get("status") || ""
    const trainerId = searchParams.get("trainer_id") || ""

    // Construir filtros base unificados com item único
    const baseFilters = [`tenant_id=eq.${ctx.tenantId}`]
    if (softDelete) baseFilters.push(`deleted_at=is.null`)
    const trainerFilter = ctx.role === "trainer" ? `&trainer_id=eq.${ctx.userId}` : ""

    // Adicionar filtros específicos
    let filters = [...baseFilters]
    if (search) {
      filters.push(`or=(name.ilike.*${search}*,email.ilike.*${search}*,phone.ilike.*${search}*)`)
    }
    if (status) {
      filters.push(`status=eq.${status}`)
    }
    if (trainerId) {
      filters.push(`trainer_id=eq.${trainerId}`)
    }

    // Calcular offset para paginação
    const offset = (page - 1) * pageSize

    // Buscar alunos sem join para treinador (simplificado)
    const studentsUrl = `${url}/rest/v1/students?${filters.join("&")}${trainerFilter}&select=id,name,email,phone,status,created_at,trainer_id&order=created_at.desc&limit=${pageSize}&offset=${offset}`
    
    console.log('URL da consulta:', studentsUrl)
    
    const studentsResponse = await fetch(studentsUrl, {
      headers: { 
        apikey: key!, 
        Authorization: `Bearer ${key}`!, 
        Prefer: "count=exact" 
      },
      cache: "no-store",
    })

    if (!studentsResponse.ok) {
      const errorText = await studentsResponse.text()
      console.error('Erro na consulta de alunos:', studentsResponse.status, studentsResponse.statusText)
      console.error('Detalhes do erro:', errorText)
      return NextResponse.json({ error: "Erro ao buscar alunos" }, { status: 500 })
    }

    const students = await studentsResponse.json()
    const contentRange = studentsResponse.headers.get("content-range") || "*/0"
    const total = Number(contentRange.split("/").pop() || 0)

    console.log('Alunos encontrados:', students.length)
    console.log('Total de alunos:', total)

    // Formatar dados
    const formattedStudents = students.map((student: any) => ({
      id: student.id,
      name: student.name,
      email: student.email,
      phone: student.phone,
      status: student.status,
      created_at: student.created_at,
      trainer_id: student.trainer_id,
      trainer_name: null, // Será preenchido posteriormente se necessário
      trainer: student.trainer_id ? {
        id: student.trainer_id,
        name: null // Será preenchido posteriormente se necessário
      } : null
    }))

    return NextResponse.json({
      students: formattedStudents,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize)
      }
    }, {
      headers: {
        'Cache-Control': 'no-store',
        'Pragma': 'no-cache',
        'X-Debug-Env': env,
        'X-Debug-Commit': commit,
        'X-Debug-Tenant': String(ctx.tenantId || ''),
        'X-Debug-User': String(ctx.userId || ''),
        'X-Debug-Flags': `STUDENTS_USE_SOFT_DELETE=${softDelete}`,
      }
    })
  } catch (error) {
    console.error("Erro na API de alunos:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const ctx = await resolveRequestContext(request)
    console.log('Contexto de autenticação para POST:', ctx)
    
    if (!ctx) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const body = await request.json()
    console.log('Dados recebidos para criar aluno:', body)

    const url = process.env.SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
    if (!url || !key) return NextResponse.json({ error: "service_unavailable" }, { status: 503 })

    // Preparar dados para inserção
    const studentData = {
      tenant_id: ctx.tenantId,
      name: body.name,
      email: body.email,
      phone: body.phone,
      status: body.status || 'onboarding',
      trainer_id: body.trainer_id && body.trainer_id !== '4' ? body.trainer_id : null, // Corrigir trainer_id inválido
      created_at: new Date().toISOString()
    }

    console.log('Dados do aluno a serem inseridos:', studentData)

    const insertUrl = `${url}/rest/v1/students`
    
    const insertResponse = await fetch(insertUrl, {
      method: 'POST',
      headers: { 
        apikey: key!, 
        Authorization: `Bearer ${key}`!, 
        'Content-Type': 'application/json',
        Prefer: 'return=representation'
      },
      body: JSON.stringify(studentData)
    })

    if (!insertResponse.ok) {
      const errorText = await insertResponse.text()
      console.error('Erro ao criar aluno:', insertResponse.status, insertResponse.statusText)
      console.error('Detalhes do erro:', errorText)
      return NextResponse.json({ error: "Erro ao criar aluno" }, { status: 500 })
    }

    const newStudent = await insertResponse.json()
    console.log('Aluno criado com sucesso:', newStudent)

    return NextResponse.json({
      success: true,
      student: newStudent[0] || newStudent
    })

  } catch (error) {
    console.error("Erro na API de criação de aluno:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}