import { NextRequest, NextResponse } from "next/server"
import { resolveRequestContext } from "@/server/context"
import { logEvent } from "@/server/events"

function canWrite(role: string) { return ['admin','manager','trainer'].includes(role) }

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await resolveRequestContext(request)
  if (!ctx) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  if (!canWrite(ctx.role)) return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  
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
  
  const resp = await fetch(`${url}/rest/v1/relationship_templates?id=eq.${id}&org_id=eq.${ctx.tenantId}`, { 
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
  
  // Dual-write v2: tentar upsert pelo code extraído do content JSON
  try {
    const parsed = JSON.parse(String(body.content||''))
    if (parsed && parsed.code) {
      const rowV2 = {
        org_id: ctx.tenantId,
        code: String(parsed.code||''),
        anchor: String(parsed.anchor||''),
        touchpoint: String(parsed.touchpoint||''),
        suggested_offset: String(parsed.suggested_offset||''),
        channel_default: String(parsed.channel_default||'whatsapp'),
        message_v1: String(parsed.message_v1||''),
        message_v2: parsed.message_v2 ? String(parsed.message_v2) : null,
        active: Boolean(parsed.active),
        priority: Number(parsed.priority||0),
        audience_filter: parsed.audience_filter || {},
        variables: Array.isArray(parsed.variables) ? parsed.variables : []
      }
      await fetch(`${url}/rest/v1/relationship_templates_v2`, { 
        method: 'POST',
        headers: { apikey: key!, Authorization: `Bearer ${key}`!, 'Content-Type':'application/json', Prefer:'resolution=merge-duplicates,return=representation' },
        body: JSON.stringify(rowV2)
      })
    }
  } catch {}
  
  await logEvent({ 
    tenantId: ctx.tenantId, 
    userId: ctx.userId, 
    eventType: 'feature.used', 
    payload: { feature: 'relationship.template.updated', id } 
  })
  
  return NextResponse.json({ ok: true, id: data?.[0]?.id || null })
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await resolveRequestContext(request)
  if (!ctx) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  if (!canWrite(ctx.role)) return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  
  const { id } = await params
  const url = process.env.SUPABASE_URL!
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
  
  const resp = await fetch(`${url}/rest/v1/relationship_templates?id=eq.${id}&org_id=eq.${ctx.tenantId}`, { 
    method: 'DELETE',
    headers: { 
      apikey: key!, 
      Authorization: `Bearer ${key}`!
    }
  })
  
  if (!resp.ok) return NextResponse.json({ error: 'delete_failed' }, { status: 500 })
  
  // Dual-write v2: tentar identificar o code a partir do registro MVP
  try {
    const resGet = await fetch(`${url}/rest/v1/relationship_templates?id=eq.${id}&org_id=eq.${ctx.tenantId}`, { headers: { apikey: key!, Authorization: `Bearer ${key}`! } })
    const rows = await resGet.json().catch(()=>[])
    const content = rows?.[0]?.content
    const parsed = content ? JSON.parse(content) : null
    const code = parsed?.code
    if (code) {
      await fetch(`${url}/rest/v1/relationship_templates_v2?org_id=eq.${ctx.tenantId}&code=eq.${code}`, { method: 'DELETE', headers: { apikey: key!, Authorization: `Bearer ${key}`! } })
    }
  } catch {}

  await logEvent({ 
    tenantId: ctx.tenantId, 
    userId: ctx.userId, 
    eventType: 'feature.used', 
    payload: { feature: 'relationship.template.deleted', id } 
  })
  
  return NextResponse.json({ ok: true })
}
