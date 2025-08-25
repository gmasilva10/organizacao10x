import { NextResponse } from "next/server"
import { resolveRequestContext } from "@/server/context"
import { sanitizeAddress } from "@/app/api/students/_utils"

export async function GET(request: Request) {
  const ctx = await resolveRequestContext(request)
  if (!ctx) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const url = process.env.SUPABASE_URL!
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
  const orgResp = await fetch(`${url}/rest/v1/tenants?id=eq.${ctx.tenantId}&select=display_name,legal_name,cnpj,address,timezone,currency,plan_code`, { headers: { apikey: key!, Authorization: `Bearer ${key}`! } })
  const org = (await orgResp.json().catch(()=>[]))?.[0] || null
  const reqCookie = (request.headers as Headers).get('cookie') || ''
  const caps = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/capabilities`, { headers: { cookie: reqCookie } }).then(r=>r.json()).catch(()=>null)
  return NextResponse.json({ organization: org, capabilities: caps })
}

export async function PATCH(request: Request) {
  const ctx = await resolveRequestContext(request)
  if (!ctx) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  type Body = { display_name?: unknown; legal_name?: unknown; cnpj?: unknown; address?: unknown; timezone?: unknown; currency?: unknown }
  const body: Body = await request.json().catch(()=>({}))
  // validações leves
  if (body?.address) {
    const addr = body.address as Record<string, unknown>
    const rawZip = String((addr?.zip as string|undefined)||'').replace(/\D/g,'')
    if (rawZip && rawZip.length !== 8) return NextResponse.json({ code:'validation', message:'CEP deve ter 8 dígitos.' }, { status: 422 })
    const rawState = String((addr?.state as string|undefined)||'')
    if (rawState && rawState.trim().length !== 2) return NextResponse.json({ code:'validation', message:'UF deve ter 2 letras.' }, { status: 422 })
  }
  if (body?.cnpj) {
    const digits = String(body.cnpj).replace(/\D/g,'')
    if (digits && digits.length !== 14) return NextResponse.json({ code:'validation', message:'CNPJ inválido.' }, { status: 422 })
  }
  const patchRow: Record<string, unknown> = {}
  if (body.display_name != null) patchRow.display_name = String(body.display_name)
  if (body.legal_name != null) patchRow.legal_name = String(body.legal_name)
  if (body.cnpj != null) patchRow.cnpj = String(body.cnpj)
  if (body.address != null) patchRow.address = sanitizeAddress(body.address as Record<string, unknown>)
  if (body.timezone != null) patchRow.timezone = String(body.timezone)
  if (body.currency != null) patchRow.currency = String(body.currency).toUpperCase().slice(0,3)
  const url = process.env.SUPABASE_URL!
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
  const resp = await fetch(`${url}/rest/v1/tenants?id=eq.${ctx.tenantId}`, { method: 'PATCH', headers: { apikey: key!, Authorization: `Bearer ${key}`!, 'Content-Type':'application/json', Prefer:'return=minimal' }, body: JSON.stringify(patchRow) })
  if (!resp.ok) return NextResponse.json({ error: 'update_failed' }, { status: 500 })
  return NextResponse.json({ ok: true })
}


