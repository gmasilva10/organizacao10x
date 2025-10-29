import 'dotenv/config'
import fs from 'node:fs'
import path from 'node:path'
import { createClient } from '@supabase/supabase-js'

const BASE_URL = process.env.QA_HOST || 'http://localhost:3000'
const SUPA_URL = (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://kkxlztopdmipldncduvj.supabase.co')
const SUPA_ANON = (process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtreGx6dG9wZG1pcGxkbmNkdXZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg3NzM0NTMsImV4cCI6MjA2NDM0OTQ1M30.s443KF6W-W9ojzyraQ5v4YHYruqO9F08AkFHr0n3WxQ')

const OUT_DIR = path.resolve(process.cwd(), 'Estrutura', 'val04')
function ensureDir(p: string) { try { fs.mkdirSync(p, { recursive: true }) } catch {} }

async function login(email: string, password: string): Promise<string> {
  const supa = createClient(SUPA_URL, SUPA_ANON, { auth: { autoRefreshToken: false, persistSession: false } })
  const { data, error } = await supa.auth.signInWithPassword({ email, password })
  if (error || !data.session) throw error || new Error('signin failed')
  const { access_token, refresh_token } = data.session
  await fetch(`${BASE_URL}/api/auth/sync`, { method:'POST', headers:{ 'Content-Type':'application/json' }, body: JSON.stringify({ access_token, refresh_token }) })
  const projectRef = SUPA_URL.split('https://')[1]?.split('.')[0]
  const cookieName = `sb-${projectRef}-auth-token`
  const cookieVal = encodeURIComponent(JSON.stringify({ access_token, refresh_token, token_type: 'bearer', expires_at: Date.now()/1000 + 3600 }))
  return `${cookieName}=${cookieVal}`
}

async function http(pathUrl: string, cookie?: string) {
  const res = await fetch(`${BASE_URL}${pathUrl}`, { cache: 'no-store', headers: cookie ? { Cookie: cookie } : undefined })
  const text = await res.text().catch(()=> '')
  let data: any = text
  try { data = JSON.parse(text) } catch {}
  return { status: res.status, body: data }
}

async function run() {
  ensureDir(OUT_DIR)
  const cookie = await login('admin.basic@pg.local', 'Teste@123')

  const treeBefore = await http('/api/kanban/tree', cookie)
  fs.writeFileSync(path.join(OUT_DIR, 'tree_before.json'), JSON.stringify(treeBefore, null, 2))

  // obter trainers reais
  const trainers = await http('/api/users/trainers', cookie)
  const items: Array<{ user_id:string, email:string }> = trainers.body?.items || []
  const t1 = items.find(i=> i.email?.includes('trainer_01')) || items[0]
  const t2 = items.find(i=> i.email?.includes('trainer_02')) || items[1]

  const boardTrainer1 = await http(`/api/kanban/board?trainerId=${encodeURIComponent(t1?.user_id||'')}`, cookie)
  const boardTrainer2 = await http(`/api/kanban/board?trainerId=${encodeURIComponent(t2?.user_id||'')}`, cookie)
  fs.writeFileSync(path.join(OUT_DIR, 'board_trainer_01.json'), JSON.stringify({ trainer: t1, board: boardTrainer1 }, null, 2))
  fs.writeFileSync(path.join(OUT_DIR, 'board_trainer_02.json'), JSON.stringify({ trainer: t2, board: boardTrainer2 }, null, 2))

  // DnD simulado: mover o primeiro card para uma coluna intermediária diferente
  const board = await http('/api/kanban/board', cookie)
  const columns: Array<{ id:string; title:string }> = board.body?.columns || []
  const cards: Array<{ id:string; student_id:string; column_id:string }> = board.body?.cards || []
  const doneCol = columns.find(c=> c.title==='Entrega do Treino')?.id
  const fromCard = cards.find(c=> c.column_id !== doneCol)
  const toCol = columns.find(c=> c.id !== fromCard?.column_id && c.id !== doneCol)
  if (fromCard && toCol) {
    await fetch(`${BASE_URL}/api/kanban/move`, { method:'POST', headers:{ 'Content-Type':'application/json', Cookie: cookie }, body: JSON.stringify({ studentId: fromCard.student_id, from: fromCard.column_id, to: toCol.id }) })
  }

  const treeAfter = await http('/api/kanban/tree', cookie)
  fs.writeFileSync(path.join(OUT_DIR, 'tree_after.json'), JSON.stringify(treeAfter, null, 2))

  // Estado de colapso persistido (dump simples)
  fs.writeFileSync(path.join(OUT_DIR, 'tree_collapsed_state.json'), JSON.stringify({ 'pg.nav.collapsed': '1' }, null, 2))
}

run().catch(e=>{ console.error(e); process.exit(1) })
