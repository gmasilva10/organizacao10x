import { NextResponse } from "next/server"
import { resolveRequestContext } from "@/server/context"
import { createClient } from "@/utils/supabase/server"

// GET /api/anamnesis/audit-logs - Buscar logs de auditoria

// Forçar execução dinâmica para evitar problemas de renderização estática
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: Request) {
  const ctx = await resolveRequestContext(request)
  if (!ctx) return NextResponse.json({ error: "unauthorized" }, { status: 401 })

  const supabase = await createClient()
  const url = new URL(request.url)
  const page = parseInt(url.searchParams.get('page') || '1')
  const limit = parseInt(url.searchParams.get('limit') || '20')
  const action = url.searchParams.get('action')
  const resourceType = url.searchParams.get('resource_type')
  const resourceId = url.searchParams.get('resource_id')
  const startDate = url.searchParams.get('start_date')
  const endDate = url.searchParams.get('end_date')

  try {
    let query = supabase
      .from('anamnesis_audit_logs')
      .select(`
        *,
        user:auth.users(
          id,
          email,
          raw_user_meta_data
        )
      `)
      .eq('organization_id', ctx.tenantId)
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1)

    // Aplicar filtros
    if (action) {
      query = query.eq('action', action)
    }
    if (resourceType) {
      query = query.eq('resource_type', resourceType)
    }
    if (resourceId) {
      query = query.eq('resource_id', resourceId)
    }
    if (startDate) {
      query = query.gte('created_at', startDate)
    }
    if (endDate) {
      query = query.lte('created_at', endDate)
    }

    const { data: logs, error } = await query

    if (error) {
      console.error('Erro ao buscar logs de auditoria:', error)
      return NextResponse.json({ error: "Erro ao buscar logs de auditoria" }, { status: 500 })
    }

    // Buscar total de registros para paginação
    let countQuery = supabase
      .from('anamnesis_audit_logs')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', ctx.tenantId)

    if (action) countQuery = countQuery.eq('action', action)
    if (resourceType) countQuery = countQuery.eq('resource_type', resourceType)
    if (resourceId) countQuery = countQuery.eq('resource_id', resourceId)
    if (startDate) countQuery = countQuery.gte('created_at', startDate)
    if (endDate) countQuery = countQuery.lte('created_at', endDate)

    const { count, error: countError } = await countQuery

    if (countError) {
      console.error('Erro ao contar logs de auditoria:', countError)
      return NextResponse.json({ error: "Erro ao contar logs de auditoria" }, { status: 500 })
    }

    return NextResponse.json({
      data: logs || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        total_pages: Math.ceil((count || 0) / limit)
      }
    }, {
      headers: {
        'Cache-Control': 'no-cache',
        'X-Query-Time': '0' // TODO: implementar medição real
      }
    })

  } catch (error) {
    console.error('Erro interno:', error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
