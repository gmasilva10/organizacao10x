import { NextResponse } from "next/server"
import { resolveRequestContext } from "@/utils/context/request-context"

export async function GET() {
  const env = process.env.NEXT_PUBLIC_DEBUG === 'true' ? 'debug' : 'nodev'
  if (process.env.NEXT_PUBLIC_DEBUG !== 'true') {
    return NextResponse.json({ error: 'disabled' }, { status: 404 })
  }
  const ctx = await resolveRequestContext()
  return NextResponse.json({
    env: process.env.NEXT_PUBLIC_ENV || process.env.NODE_ENV,
    userId: ctx.userId,
    tenantId: ctx.org_id,
    role: ctx.role,
  })
}



