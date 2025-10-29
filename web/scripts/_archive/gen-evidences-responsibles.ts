import { createClient } from '@supabase/supabase-js'
import { mkdirSync, writeFileSync, readFileSync } from 'fs'
import { join } from 'path'

const BASE = process.env.BASE_URL || 'http://localhost:3000'
const OUTDIR = join(process.cwd(), 'web', 'evidencias')

async function login(email: string, password: string) {
  let url = process.env.NEXT_PUBLIC_SUPABASE_URL
  let anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anon) {
    const credPath = join(process.cwd(), 'Estrutura', 'Credenciais_QA_Supabase.txt')
    const txt = readFileSync(credPath, 'utf-8')
    url = txt.match(/NEXT_PUBLIC_SUPABASE_URL=(\S+)/)?.[1]
    anon = txt.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(\S+)/)?.[1]
  }
  if (!url || !anon) throw new Error('Supabase URL/Anon key ausentes')
  const supabase = createClient(url, anon)
  const { data: { session }, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error || !session) throw error || new Error('Falha no login')
  return session.access_token
}

async function getActiveOrg(cookie: string): Promise<string | null> {
  const r = await fetch(`${BASE}/api/profile`, { headers: { cookie }, cache: 'no-store' })
  const j = await r.json().catch(()=>({ profile:{ memberships: [] as Array<{organization_id:string}> } }))
  const id = j?.profile?.memberships?.[0]?.organization_id || null
  return id
}

async function ensureStudent(cookie: string) {
  const r = await fetch(`${BASE}/api/students?page=1&pageSize=1`, { headers: { cookie }, cache: 'no-store' })
  const j = await r.json().catch(()=>({ items: [] as Array<{id:string}> }))
  let id = j.items?.[0]?.id as string | undefined
  if (!id) {
    const c = await fetch(`${BASE}/api/students`, { method:'POST', headers: { 'Content-Type':'application/json', cookie }, body: JSON.stringify({ name: `Aluno Resp ${Date.now()}`, email: `aluno_resp_${Date.now()}@qa.local` }) })
    const bodyText = await c.text().catch(()=> '')
    try { writeFileSync(join(OUTDIR, 'responsibles_seed_student_post.json'), bodyText) } catch {}
    const cj = JSON.parse(bodyText || '{}') as any
    id = cj?.id
  }
  if (!id) throw new Error('Não foi possível criar/obter aluno para testes')
  return id
}

async function getTwoUserIds(cookie: string): Promise<{ a: string; b: string }> {
  const r = await fetch(`${BASE}/api/settings/users`, { headers: { cookie } })
  const j = await r.json().catch(()=>({ items: [] as Array<{ user_id: string }> }))
  const ids = (j.items || []).map((x: any) => x.user_id).filter(Boolean)
  if (ids.length < 2) throw new Error('Menos de 2 usuários disponíveis para teste de responsibles')
  return { a: ids[0], b: ids[1] }
}

async function main() {
  mkdirSync(OUTDIR, { recursive: true })

  // Basic — tentar criar 2 supports
  const basicToken = await login('admin.basic@pg.local', 'Teste@123')
  let basicCookie = `sb-access-token=${basicToken}`
  const basicOrg = await getActiveOrg(basicCookie)
  if (basicOrg) basicCookie = `${basicCookie}; pg.active_org=${basicOrg}`
  const basicStudent = await ensureStudent(basicCookie)
  const basicUsers = await getTwoUserIds(basicCookie)

  const logsBasic: any[] = []
  // limpar: nenhuma rota específica para limpar; seguiremos com POST idempotente
  const s1 = await fetch(`${BASE}/api/students/${basicStudent}/responsibles`, { method:'POST', headers:{ 'Content-Type':'application/json', cookie: basicCookie }, body: JSON.stringify({ user_id: basicUsers.a, role: 'trainer_support' }) })
  logsBasic.push({ step: 'POST support #1', status: s1.status, body: await s1.text() })
  const s2 = await fetch(`${BASE}/api/students/${basicStudent}/responsibles`, { method:'POST', headers:{ 'Content-Type':'application/json', cookie: basicCookie }, body: JSON.stringify({ user_id: basicUsers.b, role: 'trainer_support' }) })
  logsBasic.push({ step: 'POST support #2', status: s2.status, body: await s2.text() })
  writeFileSync(join(OUTDIR, 'responsibles_assign_basic.json'), JSON.stringify(logsBasic, null, 2))

  // Enterprise — permitir múltiplos supports
  const entToken = await login('admin.ent@pg.local', 'Teste@123')
  let entCookie = `sb-access-token=${entToken}`
  const entOrg = await getActiveOrg(entCookie)
  if (entOrg) entCookie = `${entCookie}; pg.active_org=${entOrg}`
  const entStudent = await ensureStudent(entCookie)
  const entUsers = await getTwoUserIds(entCookie)

  const logsEnt: any[] = []
  const e1 = await fetch(`${BASE}/api/students/${entStudent}/responsibles`, { method:'POST', headers:{ 'Content-Type':'application/json', cookie: entCookie }, body: JSON.stringify({ user_id: entUsers.a, role: 'trainer_support' }) })
  logsEnt.push({ step: 'POST support #1', status: e1.status, body: await e1.text() })
  const e2 = await fetch(`${BASE}/api/students/${entStudent}/responsibles`, { method:'POST', headers:{ 'Content-Type':'application/json', cookie: entCookie }, body: JSON.stringify({ user_id: entUsers.b, role: 'trainer_support' }) })
  logsEnt.push({ step: 'POST support #2', status: e2.status, body: await e2.text() })
  writeFileSync(join(OUTDIR, 'responsibles_assign_enterprise.json'), JSON.stringify(logsEnt, null, 2))

  console.log('Evidências responsibles geradas em', OUTDIR)
}

main().catch((err) => { console.error(err); process.exit(1) })
