import { NextResponse } from "next/server"
import { resolveRequestContext } from "@/server/context"

export async function GET(request: Request) {
  const ctx = await resolveRequestContext(request)
  if (!ctx) return NextResponse.json({ error: "unauthorized" }, { status: 401 })

  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
  if (!url || !key) return NextResponse.json({ error: "service_unavailable" }, { status: 503 })

  const { searchParams } = new URL(request.url)
  const trainerId = (searchParams.get('trainerId') || '').trim()

  // Columns
  const colsResp = await fetch(`${url}/rest/v1/onboarding_columns?tenant_id=eq.${ctx.tenantId}&select=id,title,sort,created_at&order=sort.asc`, {
    headers: { apikey: key!, Authorization: `Bearer ${key}`! }, cache: 'no-store'
  })
  const columns = await colsResp.json().catch(()=>[])

  // Cards
  const trainerFilter = trainerId ? `&trainer_id=eq.${trainerId}` : (ctx.role === 'trainer' ? `&trainer_id=eq.${ctx.userId}` : '')
  const cardsResp = await fetch(`${url}/rest/v1/onboarding_cards?tenant_id=eq.${ctx.tenantId}${trainerFilter}&select=id,student_id,column_id,trainer_id,sort,created_at,completed_at&order=sort.asc`, {
    headers: { apikey: key!, Authorization: `Bearer ${key}`! }, cache: 'no-store'
  })
  const cards: Array<{ id: string; student_id: string; column_id: string; trainer_id?: string | null; sort?: number; created_at?: string; completed_at?: string | null }> = await cardsResp.json().catch(()=>[])

  // Enriquecer com status do aluno
  const studentIds = Array.from(new Set(cards.map(c => c.student_id))).filter(Boolean)
  const studentsMap: Record<string, { status?: string }> = {}
  if (studentIds.length > 0) {
    const inList = studentIds.map(encodeURIComponent).join(',')
    const stuResp = await fetch(`${url}/rest/v1/students?tenant_id=eq.${ctx.tenantId}&id=in.(${inList})&select=id,status`, {
      headers: { apikey: key!, Authorization: `Bearer ${key}`! }, cache: 'no-store'
    })
    const rows: Array<{ id: string; status?: string }> = await stuResp.json().catch(()=>[])
    for (const r of rows) studentsMap[r.id] = { status: r.status }
  }

  const enriched = cards.map(c => ({ ...c, student_status: studentsMap[c.student_id]?.status || 'onboarding' }))

  return NextResponse.json({ columns, cards: enriched })
}


