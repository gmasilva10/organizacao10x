import { NextRequest, NextResponse } from 'next/server'
import { resolveRequestContext } from '@/server/context'

export async function GET(request: NextRequest) {
  const ctx = await resolveRequestContext(request)
  if (!ctx) return NextResponse.json({ error: "unauthorized" }, { status: 401 })

  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
  if (!url || !key) return NextResponse.json({ error: "service_unavailable" }, { status: 503 })

  const headers = { apikey: key!, Authorization: `Bearer ${key}`! }

  try {
    // Verificar se é apenas contagem
    const { searchParams } = new URL(request.url)
    const countOnly = searchParams.get('count_only') === 'true'

    if (countOnly) {
      // Retornar apenas a contagem de itens
      const countResp = await fetch(`${url}/rest/v1/kanban_items?org_id=eq.${ctx.tenantId}&select=count`, {
        headers: { ...headers, 'Prefer': 'count=exact' },
        cache: 'no-store'
      })
      
      if (!countResp.ok) {
        return NextResponse.json({ count: 0 })
      }

      const count = countResp.headers.get('content-range')?.split('/')[1] || '0'
      return NextResponse.json({ count: parseInt(count) })
    }

    // Buscar itens completos
    const itemsResp = await fetch(`${url}/rest/v1/kanban_items?org_id=eq.${ctx.tenantId}&select=id,student_id,stage_id,position,meta,created_at&order=position.asc`, {
      headers,
      cache: 'no-store'
    })

    if (!itemsResp.ok) {
      return NextResponse.json({ items: [], total: 0 })
    }

    const items = await itemsResp.json().catch(() => [])
    
    return NextResponse.json({
      items,
      total: items.length
    })

  } catch (error: any) {
    console.error('Erro na API /kanban/items:', error)
    return NextResponse.json({ 
      error: 'Erro interno do servidor',
      details: error.message 
    }, { status: 500 })
  }
}
