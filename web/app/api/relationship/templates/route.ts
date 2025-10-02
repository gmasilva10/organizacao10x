import { NextResponse } from "next/server"
import { resolveRequestContext } from "@/server/context"
import { logEvent } from "@/server/events"

function canRead(role: string) { return ['admin','manager','trainer','seller','support'].includes(role) }
function canWrite(role: string) { return ['admin','manager','trainer'].includes(role) }

export async function GET(request: Request) {
  // Para desenvolvimento, usar tenant fixo
  const tenantId = 'fb381d42-9cf8-41d9-b0ab-fdb706a85ae7'
  const role = 'admin'

  // TODO: Implementar autenticação real em produção
  // const ctx = await resolveRequestContext(request)
  // if (!ctx) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  // if (!canRead(ctx.role)) return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  const url = process.env.SUPABASE_URL!
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
  const readV2 = process.env.REL_TEMPLATES_V2_READ === '1'
  if (readV2) {
    const respV2 = await fetch(`${url}/rest/v1/relationship_templates_v2?tenant_id=eq.${tenantId}&order=priority.asc`, { headers: { apikey: key!, Authorization: `Bearer ${key}`! } })
    const itemsV2 = await respV2.json().catch(()=>[])
    return NextResponse.json({ items: itemsV2 })
  }
  const resp = await fetch(`${url}/rest/v1/relationship_templates?tenant_id=eq.${tenantId}&order=created_at.desc`, { headers: { apikey: key!, Authorization: `Bearer ${key}`! } })
  const items = await resp.json().catch(()=>[])
  
  // Processar items para extrair dados do content JSON
  const processedItems = items.map((item: any) => {
    try {
      const contentData = JSON.parse(item.content || '{}')
      return {
        id: item.id,
        tenant_id: item.tenant_id,
        created_at: item.created_at,
        updated_at: item.updated_at,
        ...contentData // Spread dos dados do content
      }
    } catch (e) {
      // Se não conseguir parsear, retornar dados básicos
      return {
        id: item.id,
        tenant_id: item.tenant_id,
        title: item.title,
        type: item.type,
        content: item.content,
        created_at: item.created_at,
        updated_at: item.updated_at
      }
    }
  })
  
  return NextResponse.json({ items: processedItems })
}

export async function POST(request: Request) {
  // Para desenvolvimento, usar tenant fixo
  const tenantId = 'fb381d42-9cf8-41d9-b0ab-fdb706a85ae7'
  const userId = 'dev-user-id'

  // TODO: Implementar autenticação real em produção
  // const ctx = await resolveRequestContext(request)
  // if (!ctx) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  // if (!canWrite(ctx.role)) return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  type Body = { 
    code?: string; 
    title?: string; 
    anchor?: string; 
    touchpoint?: string; 
    suggested_offset?: string; 
    channel_default?: string; 
    message_v1?: string; 
    message_v2?: string; 
    active?: boolean; 
    priority?: number; 
    audience_filter?: any; 
    variables?: any[] 
  }
  const body: Body = await request.json().catch(()=>({}))
  
  // Mapear para a estrutura da tabela relationship_templates
  const templateData = {
    code: String(body.code||''),
    title: String(body.title||''),
    anchor: String(body.anchor||''),
    touchpoint: String(body.touchpoint||''),
    suggested_offset: String(body.suggested_offset||''),
    channel_default: String(body.channel_default||'whatsapp'),
    message_v1: String(body.message_v1||''),
    message_v2: String(body.message_v2||''),
    active: Boolean(body.active),
    priority: Number(body.priority||0),
    audience_filter: body.audience_filter || {},
    variables: body.variables || []
  }
  
  const rowMVP = { 
    tenant_id: tenantId, 
    title: String(body.title||''), 
    type: 'whatsapp',
    content: JSON.stringify(templateData)
  }
  const url = process.env.SUPABASE_URL!
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
  const respMVP = await fetch(`${url}/rest/v1/relationship_templates`, { method: 'POST', headers: { apikey: key!, Authorization: `Bearer ${key}`!, 'Content-Type':'application/json', Prefer:'return=representation' }, body: JSON.stringify(rowMVP) })
  if (!respMVP.ok) return NextResponse.json({ error: 'insert_failed_mvp' }, { status: 500 })
  const dataMVP = await respMVP.json().catch(()=>[])
  
  // Dual-write v2 (best-effort)
  const rowV2 = {
    tenant_id: tenantId,
    code: templateData.code,
    anchor: templateData.anchor,
    touchpoint: templateData.touchpoint,
    suggested_offset: templateData.suggested_offset,
    channel_default: templateData.channel_default,
    message_v1: templateData.message_v1,
    message_v2: templateData.message_v2 || null,
    active: templateData.active,
    priority: templateData.priority,
    audience_filter: templateData.audience_filter,
    variables: templateData.variables
  }
  try {
    await fetch(`${url}/rest/v1/relationship_templates_v2`, { method: 'POST', headers: { apikey: key!, Authorization: `Bearer ${key}`!, 'Content-Type':'application/json', Prefer:'resolution=merge-duplicates,return=representation' }, body: JSON.stringify(rowV2) })
  } catch {}

  await logEvent({ tenantId: tenantId, userId: userId, eventType: 'feature.used', payload: { feature: 'relationship.template.created', id: dataMVP?.[0]?.id } })
  return NextResponse.json({ ok: true, id: dataMVP?.[0]?.id || null })
}



