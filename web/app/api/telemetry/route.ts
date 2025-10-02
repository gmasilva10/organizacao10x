import { NextResponse } from "next/server"
import { resolveRequestContext } from "@/server/context"
import { logEvent } from "@/server/events"

// POST /api/telemetry — registra eventos leves do frontend
export async function POST(request: Request) {
  const ctx = await resolveRequestContext(request)
  if (!ctx) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const body = await request.json().catch(()=>({})) as { type?: string; payload?: Record<string, unknown> }
  const type = String(body?.type || '').trim() || 'app.event'
  try {
  await logEvent({ tenantId: ctx.tenantId, userId: ctx.userId, eventType: type as any, payload: body?.payload || {} })
  } catch {}
  return new NextResponse(null, { status: 204 })
}



