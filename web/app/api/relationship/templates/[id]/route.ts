import { NextRequest, NextResponse } from "next/server"
import { resolveRequestContext } from "@/server/context"
import { logEvent } from "@/server/events"

function canWrite(role: string) { return ['admin','manager','trainer'].includes(role) }

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await resolveRequestContext(request)
  if (!ctx) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  if (!canWrite(ctx.role)) return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  
  const { id } = await params
  
  // Tipos corretos baseados no frontend
  type Body = { 
    title?: string
    anchor?: string
    channel_default?: string
    message_v1?: string
    message_v2?: string
    active?: boolean
    temporal_offset_days?: number | null
    temporal_anchor_field?: string | null
  }
  
  const body: Body = await request.json().catch(()=>({}))
  
  const url = process.env.SUPABASE_URL!
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
  
  // Atualizar diretamente na tabela v2 (relationship_templates_v2)
  const updateData = {
    touchpoint: String(body.title || ''),
    anchor: String(body.anchor || ''),
    channel_default: String(body.channel_default || 'whatsapp'),
    message_v1: String(body.message_v1 || ''),
    message_v2: body.message_v2 ? String(body.message_v2) : null,
    active: Boolean(body.active),
    temporal_offset_days: body.temporal_offset_days !== undefined ? body.temporal_offset_days : null,
    temporal_anchor_field: body.temporal_anchor_field || null,
    updated_at: new Date().toISOString()
  }
  
  console.log('🔄 [template-update] Atualizando template:', {
    id,
    org_id: ctx.org_id,
    updateData
  })
  
  const resp = await fetch(`${url}/rest/v1/relationship_templates_v2?id=eq.${id}&org_id=eq.${ctx.org_id}`, { 
    method: 'PATCH', 
    headers: { 
      apikey: key!, 
      Authorization: `Bearer ${key}`!, 
      'Content-Type':'application/json',
      Prefer:'return=representation'
    }, 
    body: JSON.stringify(updateData) 
  })
  
  if (!resp.ok) {
    const errorText = await resp.text()
    console.error('❌ [template-update] Erro na atualização:', {
      status: resp.status,
      statusText: resp.statusText,
      error: errorText
    })
    return NextResponse.json({ error: 'update_failed', details: errorText }, { status: 500 })
  }
  
  const data = await resp.json().catch(()=>[])
  console.log('✅ [template-update] Template atualizado com sucesso:', data?.[0])
  
  await logEvent({ 
    orgId: ctx.org_id, 
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
  
  const resp = await fetch(`${url}/rest/v1/relationship_templates?id=eq.${id}&org_id=eq.${ctx.org_id}`, { 
    method: 'DELETE',
    headers: { 
      apikey: key!, 
      Authorization: `Bearer ${key}`!
    }
  })
  
  if (!resp.ok) return NextResponse.json({ error: 'delete_failed' }, { status: 500 })
  
  // Dual-write v2: tentar identificar o code a partir do registro MVP
  try {
    const resGet = await fetch(`${url}/rest/v1/relationship_templates?id=eq.${id}&org_id=eq.${ctx.org_id}`, { headers: { apikey: key!, Authorization: `Bearer ${key}`! } })
    const rows = await resGet.json().catch(()=>[])
    const content = rows?.[0]?.content
    const parsed = content ? JSON.parse(content) : null
    const code = parsed?.code
    if (code) {
      await fetch(`${url}/rest/v1/relationship_templates_v2?org_id=eq.${ctx.org_id}&code=eq.${code}`, { method: 'DELETE', headers: { apikey: key!, Authorization: `Bearer ${key}`! } })
    }
  } catch {}

  await logEvent({ 
    orgId: ctx.org_id, 
    userId: ctx.userId, 
    eventType: 'feature.used', 
    payload: { feature: 'relationship.template.deleted', id } 
  })
  
  return NextResponse.json({ ok: true })
}
