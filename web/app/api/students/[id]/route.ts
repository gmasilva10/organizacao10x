import { NextRequest, NextResponse } from "next/server"
import { resolveRequestContext } from "@/utils/context/request-context"

// GET: Buscar detalhes de um aluno específico
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const startTime = Date.now()
  
  try {
    const ctx = await resolveRequestContext(request)
    const isDev = process.env.NODE_ENV !== 'production'
    
    if ((!ctx || !ctx.org_id) && !isDev) {
      const queryTime = Date.now() - startTime
      return NextResponse.json(
        { error: 'unauthorized', message: 'Tenant não resolvido' },
        { status: 401, headers: { 'X-Query-Time': queryTime.toString() } }
      )
    }

    const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    if (!url || !key) {
      const queryTime = Date.now() - startTime
      return NextResponse.json(
        { error: 'service_unavailable', message: 'Variáveis de ambiente do Supabase ausentes' },
        { status: 503, headers: { 'X-Query-Time': queryTime.toString() } }
      )
    }

    const studentId = params.id
    const filters: string[] = [`id=eq.${studentId}`]
    if (ctx?.org_id) filters.push(`org_id=eq.${ctx.org_id}`)
    
    const studentUrl = `${url}/rest/v1/students?${filters.join('&')}&select=*`
    
    const response = await fetch(studentUrl, {
      headers: { 
        apikey: key, 
        Authorization: `Bearer ${key}`,
        Accept: 'application/json'
      },
      cache: "no-store",
    })

    if (!response.ok) {
      const text = await response.text().catch(() => '')
      const queryTime = Date.now() - startTime
      return NextResponse.json(
        { error: 'upstream_error', message: 'Falha ao buscar aluno', details: text },
        { status: response.status, headers: { 'X-Query-Time': queryTime.toString() } }
      )
    }

    const students = await response.json()
    const student = Array.isArray(students) && students.length > 0 ? students[0] : null
    
    if (!student) {
      const queryTime = Date.now() - startTime
      return NextResponse.json(
        { error: 'not_found', message: 'Aluno não encontrado' },
        { status: 404, headers: { 'X-Query-Time': queryTime.toString() } }
      )
    }

    const queryTime = Date.now() - startTime
    return NextResponse.json(
      { success: true, student },
      { headers: { 'X-Query-Time': queryTime.toString() } }
    )

  } catch (error) {
    const queryTime = Date.now() - startTime
    console.error('❌ Erro ao buscar aluno:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor', queryTime },
      { status: 500, headers: { 'X-Query-Time': queryTime.toString() } }
    )
  }
}

// PATCH: Atualizar dados de um aluno
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const startTime = Date.now()
  
  try {
    const ctx = await resolveRequestContext(request)
    const isDev = process.env.NODE_ENV !== 'production'
    
    if ((!ctx || !ctx.org_id) && !isDev) {
      const queryTime = Date.now() - startTime
      return NextResponse.json(
        { error: 'unauthorized' },
        { status: 401, headers: { 'X-Query-Time': queryTime.toString() } }
      )
    }

    const payload = await request.json().catch(() => ({}))
    const studentId = params.id

    const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    if (!url || !key) {
      const queryTime = Date.now() - startTime
      return NextResponse.json(
        { error: 'service_unavailable' },
        { status: 503, headers: { 'X-Query-Time': queryTime.toString() } }
      )
    }

    // Construir corpo da requisição removendo campos que não devem ser atualizados
    const updateBody: any = { ...payload }
    delete updateBody.id
    delete updateBody.created_at
    updateBody.updated_at = new Date().toISOString()

    const filters: string[] = [`id=eq.${studentId}`]
    if (ctx?.org_id) filters.push(`org_id=eq.${ctx.org_id}`)

    const updateUrl = `${url}/rest/v1/students?${filters.join('&')}`
    
    const response = await fetch(updateUrl, {
      method: 'PATCH',
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation'
      },
      body: JSON.stringify(updateBody)
    })

    if (!response.ok) {
      const text = await response.text().catch(() => '')
      const queryTime = Date.now() - startTime
      return NextResponse.json(
        { error: 'upstream_error', details: text },
        { status: response.status, headers: { 'X-Query-Time': queryTime.toString() } }
      )
    }

    const updated = await response.json()
    const student = Array.isArray(updated) && updated.length > 0 ? updated[0] : updated

    const queryTime = Date.now() - startTime
    return NextResponse.json(
      { success: true, student },
      { headers: { 'X-Query-Time': queryTime.toString() } }
    )

  } catch (error: any) {
    const queryTime = Date.now() - startTime
    console.error('❌ Erro ao atualizar aluno:', error)
    return NextResponse.json(
      { error: 'internal_error', message: error?.message || 'Erro interno' },
      { status: 500, headers: { 'X-Query-Time': queryTime.toString() } }
    )
  }
}

// DELETE: Excluir (soft delete) um aluno
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const startTime = Date.now()
  
  try {
    console.log('🗑️ DELETE Student - Iniciando exclusão:', params.id)
    
    const ctx = await resolveRequestContext(request)
    const isDev = process.env.NODE_ENV !== 'production'
    
    // Validação de autenticação e tenant
    if ((!ctx || !ctx.org_id) && !isDev) {
      const queryTime = Date.now() - startTime
      console.error('❌ DELETE Student - Não autorizado:', { ctx, isDev })
      return NextResponse.json(
        { 
          success: false,
          error: 'unauthorized', 
          message: 'Tenant não resolvido. Faça login novamente.' 
        },
        { status: 401, headers: { 'X-Query-Time': queryTime.toString() } }
      )
    }

    // Validação de permissões (RBAC)
    // Em produção, apenas admin e manager podem excluir
    const allowedRoles = ['admin', 'manager']
    if (!isDev && ctx?.role && !allowedRoles.includes(ctx.role)) {
      const queryTime = Date.now() - startTime
      console.error('❌ DELETE Student - Sem permissão:', { role: ctx.role, allowedRoles })
      return NextResponse.json(
        { 
          success: false,
          error: 'forbidden', 
          message: 'Você não tem permissão para excluir alunos.' 
        },
        { status: 403, headers: { 'X-Query-Time': queryTime.toString() } }
      )
    }

    const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    if (!url || !key) {
      const queryTime = Date.now() - startTime
      return NextResponse.json(
        { 
          success: false,
          error: 'service_unavailable', 
          message: 'Serviço temporariamente indisponível' 
        },
        { status: 503, headers: { 'X-Query-Time': queryTime.toString() } }
      )
    }

    const studentId = params.id
    const softDelete = (process.env.STUDENTS_USE_SOFT_DELETE ?? 'true') !== 'false'

    if (softDelete) {
      // SOFT DELETE: Marcar como excluído
      console.log('🗑️ DELETE Student - Executando soft delete')
      
      const filters: string[] = [`id=eq.${studentId}`]
      if (ctx?.org_id) filters.push(`org_id=eq.${ctx.org_id}`)

      const updateUrl = `${url}/rest/v1/students?${filters.join('&')}`
      
      const response = await fetch(updateUrl, {
        method: 'PATCH',
        headers: {
          apikey: key,
          Authorization: `Bearer ${key}`,
          'Content-Type': 'application/json',
          Prefer: 'return=minimal'
        },
        body: JSON.stringify({
          deleted_at: new Date().toISOString(),
          status: 'inactive',
          updated_at: new Date().toISOString()
        })
      })

      if (!response.ok) {
        const text = await response.text().catch(() => '')
        const queryTime = Date.now() - startTime
        console.error('❌ DELETE Student - Erro no soft delete:', text)
        return NextResponse.json(
          { 
            success: false,
            error: 'upstream_error', 
            message: 'Falha ao excluir aluno',
            details: text 
          },
          { status: response.status, headers: { 'X-Query-Time': queryTime.toString() } }
        )
      }

      const queryTime = Date.now() - startTime
      console.log(`✅ DELETE Student - Soft delete concluído em ${queryTime}ms`)
      
      return NextResponse.json(
        { 
          success: true, 
          message: 'Aluno excluído com sucesso',
          deleted: true,
          method: 'soft_delete'
        },
        { headers: { 'X-Query-Time': queryTime.toString() } }
      )
    } else {
      // HARD DELETE: Remover permanentemente
      console.log('🗑️ DELETE Student - Executando hard delete')
      
      const filters: string[] = [`id=eq.${studentId}`]
      if (ctx?.org_id) filters.push(`org_id=eq.${ctx.org_id}`)

      const deleteUrl = `${url}/rest/v1/students?${filters.join('&')}`
      
      const response = await fetch(deleteUrl, {
        method: 'DELETE',
        headers: {
          apikey: key,
          Authorization: `Bearer ${key}`,
          Prefer: 'return=minimal'
        }
      })

      if (!response.ok) {
        const text = await response.text().catch(() => '')
        const queryTime = Date.now() - startTime
        console.error('❌ DELETE Student - Erro no hard delete:', text)
        return NextResponse.json(
          { 
            success: false,
            error: 'upstream_error', 
            message: 'Falha ao excluir aluno',
            details: text 
          },
          { status: response.status, headers: { 'X-Query-Time': queryTime.toString() } }
        )
      }

      const queryTime = Date.now() - startTime
      console.log(`✅ DELETE Student - Hard delete concluído em ${queryTime}ms`)
      
      return NextResponse.json(
        { 
          success: true, 
          message: 'Aluno excluído permanentemente',
          deleted: true,
          method: 'hard_delete'
        },
        { headers: { 'X-Query-Time': queryTime.toString() } }
      )
    }

  } catch (error: any) {
    const queryTime = Date.now() - startTime
    console.error('❌ DELETE Student - Erro interno:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'internal_error', 
        message: error?.message || 'Erro interno do servidor',
        queryTime 
      },
      { status: 500, headers: { 'X-Query-Time': queryTime.toString() } }
    )
  }
}
