import { NextRequest, NextResponse } from "next/server"
import { resolveRequestContext } from "@/server/context"
import { logEvent } from "@/server/events"

function canWrite(role: string) { return ['admin','manager','trainer'].includes(role) }

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  // Para desenvolvimento, usar tenant fixo
  const tenantId = 'fb381d42-9cf8-41d9-b0ab-fdb706a85ae7'
  const userId = 'dev-user-id'

  // TODO: Implementar autenticação real em produção
  // const ctx = await resolveRequestContext(request)
  // if (!ctx) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  // if (!canWrite(ctx.role)) return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  
  const { id } = await params
  type Body = { title?: unknown; type?: unknown; content?: unknown }
  const body: Body = await request.json().catch(()=>({}))
  
  const url = process.env.SUPABASE_URL!
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
  
  const updateData = {
    title: String(body.title||''),
    type: String(body.type||'nota'),
    content: String(body.content||''),
    updated_at: new Date().toISOString()
  }
  
  const resp = await fetch(`${url}/rest/v1/relationship_templates?id=eq.${id}&tenant_id=eq.${tenantId}`, { 
    method: 'PATCH', 
    headers: { 
      apikey: key!, 
      Authorization: `Bearer ${key}`!, 
      'Content-Type':'application/json',
      Prefer:'return=representation'
    }, 
    body: JSON.stringify(updateData) 
  })
  
  if (!resp.ok) return NextResponse.json({ error: 'update_failed' }, { status: 500 })
  const data = await resp.json().catch(()=>[])
  
  await logEvent({ 
    tenantId: tenantId, 
    userId: userId, 
    eventType: 'feature.used', 
    payload: { feature: 'relationship.template.updated', id } 
  })
  
  return NextResponse.json({ ok: true, id: data?.[0]?.id || null })
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  // Para desenvolvimento, usar tenant fixo
  const tenantId = 'fb381d42-9cf8-41d9-b0ab-fdb706a85ae7'
  const userId = 'dev-user-id'

  // TODO: Implementar autenticação real em produção
  // const ctx = await resolveRequestContext(request)
  // if (!ctx) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  // if (!canWrite(ctx.role)) return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  
  const { id } = await params
  const url = process.env.SUPABASE_URL!
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
  
  const resp = await fetch(`${url}/rest/v1/relationship_templates?id=eq.${id}&tenant_id=eq.${tenantId}`, { 
    method: 'DELETE',
    headers: { 
      apikey: key!, 
      Authorization: `Bearer ${key}`!
    }
  })
  
  if (!resp.ok) return NextResponse.json({ error: 'delete_failed' }, { status: 500 })
  
  await logEvent({ 
    tenantId: tenantId, 
    userId: userId, 
    eventType: 'feature.used', 
    payload: { feature: 'relationship.template.deleted', id } 
  })
  
  return NextResponse.json({ ok: true })
}