import 'dotenv/config'
import fs from 'node:fs'
import path from 'node:path'
import { createClient } from '@supabase/supabase-js'

const BASE_URL = process.env.QA_HOST || 'http://localhost:3000'
const SUPA_URL = (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://kkxlztopdmipldncduvj.supabase.co')
const SUPA_ANON = (process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtreGx6dG9wZG1pcGxkbmNkdXZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg3NzM0NTMsImV4cCI6MjA2NDM0OTQ1M30.s443KF6W-W9ojzyraQ5v4YHYruqO9F08AkFHr0n3WxQ')
const projectRef = SUPA_URL.split('https://')[1]?.split('.')[0] || 'kkxlztopdmipldncduvj'

const OUTPUT_DIR = path.resolve(process.cwd(), 'Estrutura', 'smoke_2025-08-20')

function ensureDir(p: string) { try { fs.mkdirSync(p, { recursive: true }) } catch {} }

async function getCookie(email: string, password: string): Promise<string> {
  const supa = createClient(SUPA_URL, SUPA_ANON, { auth: { autoRefreshToken: false, persistSession: false } })
  const { data, error } = await supa.auth.signInWithPassword({ email, password })
  if (error || !data.session) throw error || new Error('signin failed')
  const { access_token, refresh_token, expires_at, token_type } = data.session
  const cookieName = `sb-${projectRef}-auth-token`
  const cookieVal = encodeURIComponent(JSON.stringify({ access_token, refresh_token, expires_at, token_type }))
  // sync cookies into app
  await fetch(`${BASE_URL}/api/auth/sync`, { method:'POST', headers:{ 'Content-Type':'application/json' }, body: JSON.stringify({ access_token, refresh_token }) })
  return `${cookieName}=${cookieVal}`
}

async function http(method: 'GET'|'POST', pathUrl: string, body?: any, cookie?: string) {
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
  ensureDir(OUTPUT_DIR)
  // login como admin.basic
  const cookie = await getCookie('admin.basic@pg.local', 'Teste@123')

  // Board atual
  const board = await http('GET', '/api/kanban/board', undefined, cookie)
  fs.writeFileSync(path.join(OUTPUT_DIR, 'board_before.json'), JSON.stringify(board, null, 2))
  const columns: Array<{ id: string; title: string }> = board.body?.columns || []
  const cards: Array<{ id: string; student_id: string; column_id: string }> = board.body?.cards || []
  const doneColId = columns.at(-1)?.id
  const movable = cards.find(c => c.column_id && c.column_id !== doneColId)
  const targetCol = columns.find(c => c.id !== movable?.column_id && c.id !== doneColId)

  // Move sucesso
  if (movable && targetCol) {
    const moveOk = await http('POST', '/api/kanban/move', { studentId: movable.student_id, from: movable.column_id, to: targetCol.id }, cookie)
    fs.writeFileSync(path.join(OUTPUT_DIR, 'move_success_204.json'), JSON.stringify(moveOk, null, 2))
  }

  // Move falha (payload inválido)
  const moveFail = await http('POST', '/api/kanban/move', { studentId: '', from: '', to: '' }, cookie)
  fs.writeFileSync(path.join(OUTPUT_DIR, 'move_fail_network.txt'), `${moveFail.status}\n${JSON.stringify(moveFail.body)}`)

  // Board após
  const boardAfter = await http('GET', '/api/kanban/board', undefined, cookie)
  fs.writeFileSync(path.join(OUTPUT_DIR, 'board_after.json'), JSON.stringify(boardAfter, null, 2))

  // History API
  const hist = await http('GET', '/api/kanban/history', undefined, cookie)
  fs.writeFileSync(path.join(OUTPUT_DIR, 'history_api.json'), JSON.stringify(hist, null, 2))

  console.log('Smoke JSON evidence saved to', OUTPUT_DIR)
}

main().catch((e) => { console.error(e); process.exit(1) })
