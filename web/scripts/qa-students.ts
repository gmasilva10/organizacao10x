import 'dotenv/config'
import fs from 'fs'
import path from 'path'
import { createClient } from '@supabase/supabase-js'

const baseUrl = process.env.QA_HOST || 'http://localhost:3000'
const url = (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL)!
const anon = (process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)!
const service = process.env.SUPABASE_SERVICE_ROLE_KEY

type Cred = { email: string; password: string }
const adminBasic: Cred = { email: 'admin.basic@pg.local', password: 'Teste@123' }
const managerEnt: Cred = { email: 'manager.ent@pg.local', password: 'Teste@123' }
const sellerBasic: Cred = { email: 'seller.basic@pg.local', password: 'Teste@123' }
const trainerBasic: Cred = { email: 'trainer.basic@pg.local', password: 'Teste@123' }
const trainerEnt: Cred = { email: 'trainer.ent@pg.local', password: 'Teste@123' }

async function cookieFor(cred: Cred) {
  const supa = createClient(url, anon, { auth: { autoRefreshToken: false, persistSession: false } })
  let { data, error } = await supa.auth.signInWithPassword(cred)
  if (error || !data.session) {
    // Auto-heal: tentar criar o usuário no Auth e repetir login
    const service = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!service) throw error || new Error('No session')
    const admin = createClient(url, service, { auth: { autoRefreshToken: false, persistSession: false } })
    // listar e criar se necessário
    const list = await admin.auth.admin.listUsers({ page: 1, perPage: 2000 })
    const exists = list.data.users.find(u => u.email?.toLowerCase() === cred.email.toLowerCase())
    if (!exists) {
      await admin.auth.admin.createUser({ email: cred.email, password: cred.password, email_confirm: true })
    }
    // segunda tentativa de login
    const retry = await supa.auth.signInWithPassword(cred)
    data = retry.data
    error = retry.error as any
    if (error || !data.session) throw error || new Error('No session after auto-heal')
  }
  const ref = (url.split('https://')[1] || '').split('.')[0]
  const cookieName = `sb-${ref}-auth-token`
  const { access_token, refresh_token, expires_at, token_type } = data.session
  const cookieVal = encodeURIComponent(JSON.stringify({ access_token, refresh_token, expires_at, token_type }))
  return `${cookieName}=${cookieVal}`
}

async function http(method: string, path: string, body?: unknown, cookie?: string) {
  const res = await fetch(`${baseUrl}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...(cookie ? { Cookie: cookie } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  })
  const text = await res.text()
  let json: any = text
  try { json = JSON.parse(text) } catch {}
  return { status: res.status, body: json }
}

async function run() {
  const results: any = { steps: [] }
  const cAdminBasic = await cookieFor(adminBasic)
  const cSellerBasic = await cookieFor(sellerBasic)
  const cTrainerBasic = await cookieFor(trainerBasic)
  const cManagerEnt = await cookieFor(managerEnt)
  const cTrainerEnt = await cookieFor(trainerEnt)

  // GET visibilidade (Basic)
  const r1 = await http('GET', '/api/students?page=1&pageSize=20', undefined, cAdminBasic)
  results.steps.push({ id: 'get-basic-admin', status: r1.status, total: r1.body?.total, items: r1.body?.items?.length })
  const r2 = await http('GET', '/api/students?page=1&pageSize=20', undefined, cTrainerBasic)
  results.steps.push({ id: 'get-basic-trainer', status: r2.status, total: r2.body?.total, items: r2.body?.items?.length })
  // filtros
  const r3 = await http('GET', '/api/students?q=aluno0001.basic@qa.local', undefined, cAdminBasic)
  results.steps.push({ id: 'get-q', status: r3.status, items: r3.body?.items?.length })
  const r4 = await http('GET', '/api/students?status=onboarding', undefined, cAdminBasic)
  results.steps.push({ id: 'get-status', status: r4.status, items: r4.body?.items?.length })

  // POST limite (Basic): seller cria antes do teto, depois admin cria 299, 300, e 301 → 422
  const pSeller = await http('POST', '/api/students', { name: 'Aluno Seller', email: 'aluno-seller.basic@qa.local' }, cSellerBasic)
  results.steps.push({ id: 'post-seller', status: pSeller.status })
  const p299 = await http('POST', '/api/students', { name: 'Aluno 299', email: 'aluno0299.basic@qa.local' }, cAdminBasic)
  results.steps.push({ id: 'post-299', status: p299.status, body: p299.body })
  const p300 = await http('POST', '/api/students', { name: 'Aluno 300', email: 'aluno0300.basic@qa.local' }, cAdminBasic)
  results.steps.push({ id: 'post-300', status: p300.status, body: p300.body })
  const p301 = await http('POST', '/api/students', { name: 'Aluno 301', email: 'aluno0301.basic@qa.local' }, cAdminBasic)
  results.steps.push({ id: 'post-301-limit', status: p301.status, body: p301.body })
  // trainer.basic negado
  const pTrainer = await http('POST', '/api/students', { name: 'Aluno Trainer', email: 'aluno-trainer.basic@qa.local' }, cTrainerBasic)
  results.steps.push({ id: 'post-trainer', status: pTrainer.status, body: pTrainer.body })

  // PATCH assign trainer (Enterprise)
  // Primeiro, pegar um aluno sem trainer via GET q=ent@
  const listEnt = await http('GET', '/api/students?q=ent@qa.local&page=1&pageSize=50', undefined, cManagerEnt)
  const target = (listEnt.body?.items || []).find((x: any) => !x.trainer_id)
  if (target) {
    // buscar trainer_id válido via Admin API
    const admin = createClient(url, service!, { auth: { autoRefreshToken: false, persistSession: false } })
    const { data: trainers } = await admin.from('memberships').select('user_id').eq('tenant_id','0f3ec75c-6eb9-4443-8c48-49eca6e6d00f').eq('role','trainer').limit(1)
    const trainerId = (trainers?.[0] as any)?.user_id
    const pa = await http('PATCH', `/api/students/${target.id}`, { trainer_id: trainerId }, cManagerEnt)
    results.steps.push({ id: 'patch-assign', status: pa.status })
  } else {
    results.steps.push({ id: 'patch-assign', note: 'sem aluno livre para assign' })
  }

  // PATCH trainer.ent: seu aluno onboarding→active (pegar um com trainer_id = trainer.ent)
  let listTrainer = await http('GET', '/api/students?page=1&pageSize=50', undefined, cTrainerEnt)
  let own = (listTrainer.body?.items || []).find((x: any) => x.status === 'onboarding')
  if (!own && service) {
    // preparar um aluno onboarding para o trainer.ent (auto-heal)
    const admin = createClient(url, service, { auth: { autoRefreshToken: false, persistSession: false } })
    const { data: trainers } = await admin.from('memberships').select('user_id').eq('tenant_id','0f3ec75c-6eb9-4443-8c48-49eca6e6d00f').eq('role','trainer').limit(1)
    const trainerId = (trainers?.[0] as any)?.user_id
    const { data: candidates } = await admin.from('students').select('id').eq('tenant_id', '0f3ec75c-6eb9-4443-8c48-49eca6e6d00f').is('deleted_at', null).limit(1)
    const candidate = (candidates || [])[0] as any
    if (candidate && trainerId) {
      await admin.from('students').update({ trainer_id: trainerId, status: 'onboarding' }).eq('id', candidate.id)
      listTrainer = await http('GET', '/api/students?page=1&pageSize=50', undefined, cTrainerEnt)
      own = (listTrainer.body?.items || []).find((x: any) => x.status === 'onboarding')
    }
  }
  if (own) {
    const pt = await http('PATCH', `/api/students/${own.id}`, { status: 'active' }, cTrainerEnt)
    results.steps.push({ id: 'patch-trainer-status', status: pt.status })
  } else {
    results.steps.push({ id: 'patch-trainer-status', note: 'sem aluno onboarding do trainer para testar' })
  }

  // Extrair eventos (telemetria) se service estiver disponível
  if (service) {
    const admin = createClient(url, service, { auth: { autoRefreshToken: false, persistSession: false } })
    const tenants = ['f203156c-ed09-42d1-9593-86f4b2ee0c81', '0f3ec75c-6eb9-4443-8c48-49eca6e6d00f']
    const events: Record<string, any[]> = {}
    for (const t of tenants) {
      const { data } = await admin
        .from('events')
        .select('tenant_id,user_id,event_type,payload,created_at')
        .eq('tenant_id', t)
        .order('created_at', { ascending: false })
        .limit(25)
      events[t] = data || []
    }
    results.events = events
  }

  // DELETE soft (manager.basic)
  // pegar um aluno básico
  const listBasic = await http('GET', '/api/students?page=1&pageSize=50', undefined, cAdminBasic)
  const victim = (listBasic.body?.items || [])[0]
  if (victim) {
    const d = await http('DELETE', `/api/students/${victim.id}`, undefined, cAdminBasic)
    results.steps.push({ id: 'delete-soft', status: d.status })
  }

  // Salvar resultados
  const out = path.resolve(process.cwd(), 'Estrutura', 'QA_Students_results.json')
  fs.writeFileSync(out, JSON.stringify(results, null, 2))
  console.log('QA Students salvo em', out)
}

run().catch((e) => { console.error(e); process.exit(1) })


