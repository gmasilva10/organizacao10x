import 'dotenv/config'
import fs from 'node:fs'
import path from 'node:path'
import { createClient } from '@supabase/supabase-js'

const BASE_URL = process.env.QA_HOST || 'http://localhost:3000'
const SUPA_URL = (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://kkxlztopdmipldncduvj.supabase.co')
const SUPA_ANON = (process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtreGx6dG9wZG1pcGxkbmNkdXZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg3NzM0NTMsImV4cCI6MjA2NDM0OTQ1M30.s443KF6W-W9ojzyraQ5v4YHYruqO9F08AkFHr0n3WxQ')
const projectRef = SUPA_URL.split('https://')[1]?.split('.')[0] || 'kkxlztopdmipldncduvj'

const OUT_DIR = path.resolve(process.cwd(), 'Estrutura', 'val03')
function ensureDir(p: string) { try { fs.mkdirSync(p, { recursive: true }) } catch {} }

async function getCookie(email: string, password: string): Promise<string> {
  const supa = createClient(SUPA_URL, SUPA_ANON, { auth: { autoRefreshToken: false, persistSession: false } })
  const { data, error } = await supa.auth.signInWithPassword({ email, password })
  if (error || !data.session) throw error || new Error('signin failed')
  const { access_token, refresh_token, expires_at, token_type } = data.session
  const cookieName = `sb-${projectRef}-auth-token`
  const cookieVal = encodeURIComponent(JSON.stringify({ access_token, refresh_token, expires_at, token_type }))
  await fetch(`${BASE_URL}/api/auth/sync`, { method:'POST', headers:{ 'Content-Type':'application/json' }, body: JSON.stringify({ access_token, refresh_token }) })
  return `${cookieName}=${cookieVal}`
}

async function http(method: 'GET'|'POST'|'PATCH'|'DELETE', pathUrl: string, body?: any, cookie?: string) {
  const res = await fetch(`${BASE_URL}${pathUrl}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...(cookie ? { Cookie: cookie } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  })
  const text = await res.text().catch(()=> '')
  let data: any = text
  try { data = JSON.parse(text) } catch {}
  return { status: res.status, ok: res.ok, headers: Object.fromEntries(res.headers.entries()), body: data }
}

async function main() {
  ensureDir(OUT_DIR)
  const cookie = await getCookie('admin.basic@pg.local', 'Teste@123')

  // Board before
  const before = await http('GET', '/api/kanban/board', undefined, cookie)
  fs.writeFileSync(path.join(OUT_DIR, 'create_preserva_cards_before.json'), JSON.stringify(before, null, 2))

  // Create two intermediates
  const cA = await http('POST', '/api/kanban/columns', { title: 'Interim A' }, cookie)
  const cB = await http('POST', '/api/kanban/columns', { title: 'Interim B' }, cookie)

  const afterCreate = await http('GET', '/api/kanban/board', undefined, cookie)
  fs.writeFileSync(path.join(OUT_DIR, 'create_preserva_cards_after.json'), JSON.stringify(afterCreate, null, 2))

  // Rename Interim A -> Interim A Renamed
  const colAId: string | undefined = (cA.body && cA.body.id) || (afterCreate.body?.columns||[]).find((c: any)=> c.title==='Interim A')?.id
  if (colAId) {
    const rnBefore = await http('GET', '/api/kanban/board', undefined, cookie)
    await http('PATCH', `/api/kanban/columns/${colAId}`, { title: 'Interim A Renamed' }, cookie)
    const rnAfter = await http('GET', '/api/kanban/board', undefined, cookie)
    fs.writeFileSync(path.join(OUT_DIR, 'rename_ok_empty.json'), JSON.stringify({ before: rnBefore.body?.columns, after: rnAfter.body?.columns }, null, 2))
  }

  // Delete Interim B (empty)
  const colBId: string | undefined = (cB.body && cB.body.id) || (afterCreate.body?.columns||[]).find((c: any)=> c.title==='Interim B')?.id
  if (colBId) {
    const delBefore = await http('GET', '/api/kanban/board', undefined, cookie)
    const delRes = await http('DELETE', `/api/kanban/columns/${colBId}`, undefined, cookie)
    const delAfter = await http('GET', '/api/kanban/board', undefined, cookie)
    fs.writeFileSync(path.join(OUT_DIR, 'delete_ok_empty.json'), JSON.stringify({ delete: delRes.status, before: delBefore.body?.columns, after: delAfter.body?.columns }, null, 2))
  }

  // Reorder intermediates: swap order of any two non-fixed
  const boardForReorder = await http('GET', '/api/kanban/board', undefined, cookie)
  const cols: Array<{ id: string; title: string }> = boardForReorder.body?.columns || []
  const fixedFirst = cols.find(c=>c.title==='Novo Aluno')?.id
  const fixedLast = cols.find(c=>c.title==='Entrega do Treino')?.id
  const middle = cols.map(c=>c.id).filter(id=> id!==fixedFirst && id!==fixedLast)
  if (middle.length >= 2) {
    const swapped = [middle[1], middle[0], ...middle.slice(2)]
    const payload = { columnIds: swapped }
    fs.writeFileSync(path.join(OUT_DIR, 'reorder_payload.json'), JSON.stringify(payload, null, 2))
    await http('POST', '/api/kanban/columns/reorder', payload, cookie)
    const boardAfterReorder = await http('GET', '/api/kanban/board', undefined, cookie)
    fs.writeFileSync(path.join(OUT_DIR, 'reorder_board_after.json'), JSON.stringify(boardAfterReorder, null, 2))
  }
}

main().catch(e=>{ console.error(e); process.exit(1) })
