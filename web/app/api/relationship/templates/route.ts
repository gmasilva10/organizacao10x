import { NextResponse } from "next/server"
import { resolveRequestContext } from "@/server/context"
import { logEvent } from "@/server/events"
import { generateNextTemplateCode } from "@/lib/relationship/code-generator"

function canRead(role: string) { return ['admin','manager','trainer','seller','support'].includes(role) }
function canWrite(role: string) { return ['admin','manager','trainer'].includes(role) }

export async function GET(request: Request) {
  const ctx = await resolveRequestContext(request)
  if (!ctx) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  if (!canRead(ctx.role)) return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  const orgId = ctx.org_id
  const url = process.env.SUPABASE_URL!
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
  // Always use V2 templates now
  const respV2 = await fetch(`${url}/rest/v1/relationship_templates_v2?org_id=eq.${orgId}&order=created_at.desc`, { headers: { apikey: key!, Authorization: `Bearer ${key}`! } })
  const itemsV2 = await respV2.json().catch(()=>[])
  return NextResponse.json({ items: itemsV2 })
}

export async function POST(request: Request) {
  const ctx = await resolveRequestContext(request)
  if (!ctx) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  if (!canWrite(ctx.role)) return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  const orgId = ctx.org_id
  const userId = ctx.userId
  
  type Body = { 
    title?: string; 
    anchor?: string; 
    touchpoint?: string; 
    suggested_offset?: string; 
    channel_default?: string; 
    message_v1?: string; 
    message_v2?: string; 
    active?: boolean; 
    temporal_offset_days?: number | null; 
    temporal_anchor_field?: string | null; 
    audience_filter?: any; 
    variables?: any[] 
  }
  const body: Body = await request.json().catch(()=>({}))
  
  // Gerar código sequencial automaticamente (4 dígitos)
  const code = await generateNextTemplateCode(orgId)
  
  // Usar apenas V2 - sem dual-write
  const rowV2 = {
    org_id: orgId,
    code: code, // Gerado automaticamente
    anchor: String(body.anchor || ''),
    touchpoint: String(body.touchpoint || ''),
    suggested_offset: String(body.suggested_offset || '+0d'),
    channel_default: String(body.channel_default || 'whatsapp'),
    message_v1: String(body.message_v1 || ''),
    message_v2: body.message_v2 ? String(body.message_v2) : null,
    active: Boolean(body.active),
    temporal_offset_days: body.temporal_offset_days ?? null,
    temporal_anchor_field: body.temporal_anchor_field ?? null,
    audience_filter: body.audience_filter || {},
    variables: Array.isArray(body.variables) ? body.variables : []
  }
  
  const url = process.env.SUPABASE_URL!
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
  
  const respV2 = await fetch(`${url}/rest/v1/relationship_templates_v2`, { 
    method: 'POST', 
    headers: { 
      apikey: key!, 
      Authorization: `Bearer ${key}`!, 
      'Content-Type':'application/json', 
      Prefer:'return=representation' 
    }, 
    body: JSON.stringify(rowV2) 
  })
  
  if (!respV2.ok) {
    const errorText = await respV2.text()
    console.error('Failed to create template V2:', errorText)
    return NextResponse.json({ error: 'insert_failed', details: errorText }, { status: 500 })
  }
  
  const dataV2 = await respV2.json().catch(()=>[])
  const newTemplate = Array.isArray(dataV2) ? dataV2[0] : dataV2

  await logEvent({ 
    orgId: orgId, 
    userId: userId, 
    eventType: 'feature.used', 
    payload: { feature: 'relationship.template.created', id: newTemplate?.id } 
  })
  
  return NextResponse.json({ ok: true, id: newTemplate?.id || null, template: newTemplate })
}



