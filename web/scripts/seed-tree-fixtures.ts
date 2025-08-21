import 'dotenv/config'
import fs from 'node:fs'
import path from 'node:path'
import { createClient } from '@supabase/supabase-js'

const BASE_URL = process.env.QA_HOST || 'http://localhost:3000'
const SUPA_URL = (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://kkxlztopdmipldncduvj.supabase.co')
const SUPA_ANON = (process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtreGx6dG9wZG1pcGxkbmNkdXZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg3NzM0NTMsImV4cCI6MjA2NDM0OTQ1M30.s443KF6W-W9ojzyraQ5v4YHYruqO9F08AkFHr0n3WxQ')
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY

const OUT_DIR = path.resolve(process.cwd(), 'Estrutura', 'val04')
function ensureDir(p: string) { try { fs.mkdirSync(p, { recursive: true }) } catch {} }

async function login(email: string, password: string) {
  const supa = createClient(SUPA_URL, SUPA_ANON, { auth: { autoRefreshToken: false, persistSession: false } })
  const { data, error } = await supa.auth.signInWithPassword({ email, password })
  if (error || !data.session) throw error || new Error('signin failed')
  const { access_token, refresh_token } = data.session
  await fetch(`${BASE_URL}/api/auth/sync`, { method:'POST', headers:{ 'Content-Type':'application/json' }, body: JSON.stringify({ access_token, refresh_token }) })
  return { access_token }
}

async function http(method: 'GET'|'POST'|'PATCH'|'DELETE', pathUrl: string, body?: any, cookie?: string) {
  const res = await fetch(`${BASE_URL}${pathUrl}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  })
  const text = await res.text().catch(()=> '')
  let data: any = text
  try { data = JSON.parse(text) } catch {}
  return { status: res.status, ok: res.ok, headers: Object.fromEntries(res.headers.entries()), body: data }
}

async function seed() {
  ensureDir(OUT_DIR)
  // Login como enterprise manager para evitar limite de trainers
  await login('manager.ent@pg.local', 'Teste@123')

  // Garantir colunas padrão
  await http('POST', '/api/kanban/board/init')
  const board = await http('GET', '/api/kanban/board')
  const columns: Array<{ id: string; title: string }> = board.body?.columns || []
  const novoAlunoId = columns.find(c=>c.title==='Novo Aluno')?.id

  // Criar 2 trainers
  const t1 = await http('POST', '/api/users/trainers', { email: 'trainer_01@qa.local' })
  const t2 = await http('POST', '/api/users/trainers', { email: 'trainer_02@qa.local' })

  // Obter lista de trainers (para pegar IDs)
  const trainers = await http('GET', '/api/users/trainers')
  const trainer1Id = (trainers.body?.items||[]).find((u:any)=>u.email==='trainer_01@qa.local')?.id
  const trainer2Id = (trainers.body?.items||[]).find((u:any)=>u.email==='trainer_02@qa.local')?.id

  // Criar 6 alunos alternando trainer
  const studentsCreated: any[] = []
  for (let i = 1; i <= 6; i++) {
    const name = `stu_${String(i).padStart(3,'0')}`
    const trainer_id = i % 2 === 0 ? trainer2Id : trainer1Id
    const r = await http('POST', '/api/students', { name, email: `${name}@qa.local`, trainer_id })
    studentsCreated.push({ name, status: r.status, body: r.body })
  }

  // Criar cards iniciais em Novo Aluno para cada student (via Postgrest)
  const resultsCards: any[] = []
  if (novoAlunoId && (SERVICE || SUPA_ANON)) {
    const key = SERVICE || SUPA_ANON
    for (const s of studentsCreated) {
      const stId = s?.body?.id || s?.body?.id
      if (!stId) continue
      const ins = await fetch(`${SUPA_URL}/rest/v1/onboarding_cards`, {
        method:'POST',
        headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type':'application/json', Prefer:'return=representation' },
        body: JSON.stringify({ tenant_id: undefined, student_id: stId, column_id: novoAlunoId })
      })
      const body = await ins.text().catch(()=> '')
      resultsCards.push({ student: s?.body, status: ins.status, body })
    }
  }

  const finalBoard = await http('GET', '/api/kanban/board')
  fs.writeFileSync(path.join(OUT_DIR, 'seed_result.json'), JSON.stringify({
    trainers: { t1: t1.status, t2: t2.status, list: trainers.body },
    students: studentsCreated,
    createdCards: resultsCards,
    board: finalBoard.body,
  }, null, 2))
}

seed().catch(e=>{ console.error(e); process.exit(1) })
