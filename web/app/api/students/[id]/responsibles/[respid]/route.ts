import { NextResponse } from "next/server"
import { resolveRequestContext } from "@/server/context"

function canWrite(role: string) { return ['admin','manager'].includes(role) }

export async function DELETE(request: Request, ctxParam: { params: Promise<{ id: string; respid: string }> }) {
  const ctx = await resolveRequestContext(request)
  if (!ctx) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  if (!canWrite(ctx.role)) return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  const { id, respid } = await ctxParam.params
  const url = process.env.SUPABASE_URL!
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
  const del = await fetch(`${url}/rest/v1/student_responsibles?id=eq.${respid}&tenant_id=eq.${ctx.tenantId}&student_id=eq.${id}`, {
    method:'DELETE', headers: { apikey:key!, Authorization:`Bearer ${key}`! }
  })
  if (!del.ok) return NextResponse.json({ error:'delete_failed' }, { status: 500 })
  return NextResponse.json({ ok: true })
}


