import 'dotenv/config'
import fs from 'fs'
import path from 'path'
import { createClient } from '@supabase/supabase-js'

const baseUrl = process.env.QA_HOST || 'http://localhost:3000'
const projectRef = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').split('https://')[1]?.split('.')[0] || 'kkxlztopdmipldncduvj'

const url = (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL)!
const anon = (process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)!
const service = process.env.SUPABASE_SERVICE_ROLE_KEY

type Cred = { email: string; password: string }

const adminBasic: Cred = { email: 'admin.basic@pg.local', password: 'Teste@123' }
const managerEnt: Cred = { email: 'manager.ent@pg.local', password: 'Teste@123' }
const sellerBasic: Cred = { email: 'seller.basic@pg.local', password: 'Teste@123' }
const supportEnt: Cred = { email: 'support.ent@pg.local', password: 'Teste@123' }

const trainerBasic1 = 'novo.trainer.basic@qa.local'
const trainerBasic2 = 'segundo.trainer.basic@qa.local'
const trainerEnt = Array.from({ length: 11 }).map((_, i) => `trainer${String(i + 1).padStart(2, '0')}.ent@qa.local`)

async function getCookieForUser(cred: Cred) {
  const supa = createClient(url, anon, { auth: { autoRefreshToken: false, persistSession: false } })
  const { data, error } = await supa.auth.signInWithPassword({ email: cred.email, password: cred.password })
  if (error || !data.session) throw error || new Error('No session')
  const { access_token, refresh_token, expires_at, token_type } = data.session
  const cookieName = `sb-${projectRef}-auth-token`
  const cookieVal = encodeURIComponent(JSON.stringify({ access_token, refresh_token, expires_at, token_type }))
  return `${cookieName}=${cookieVal}`
}

async function httpGet(path: string, cookie?: string) {
  const res = await fetch(`${baseUrl}${path}`, { headers: cookie ? { Cookie: cookie } : undefined })
  const text = await res.text()
  let body: unknown = text
  try { body = JSON.parse(text) } catch {}
  return { status: res.status, body }
}

async function httpPost(path: string, json: unknown, cookie?: string) {
  const res = await fetch(`${baseUrl}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(cookie ? { Cookie: cookie } : {}) },
    body: JSON.stringify(json),
  })
  const text = await res.text()
  let body: unknown = text
  try { body = JSON.parse(text) } catch {}
  return { status: res.status, body }
}

async function run() {
  console.log('Iniciando smoke tests Bloco1/Etapa2…')
  const results: any = { steps: [] }
  const cAdminBasic = await getCookieForUser(adminBasic)
  const cManagerEnt = await getCookieForUser(managerEnt)
  const cSellerBasic = await getCookieForUser(sellerBasic)
  const cSupportEnt = await getCookieForUser(supportEnt)

  // 1) capabilities basic admin
  const capBasic = await httpGet('/api/capabilities', cAdminBasic)
  console.log('1) capabilities basic/admin →', capBasic.status, capBasic.body)
  results.steps.push({ id: 1, status: capBasic.status, body: capBasic.body })

  // 2) capabilities enterprise manager
  const capEnt = await httpGet('/api/capabilities', cManagerEnt)
  console.log('2) capabilities enterprise/manager →', capEnt.status, capEnt.body)
  results.steps.push({ id: 2, status: capEnt.status, body: capEnt.body })

  // 3) capabilities sem sessão
  const capNo = await httpGet('/api/capabilities')
  console.log('3) capabilities sem sessão →', capNo.status, capNo.body)
  results.steps.push({ id: 3, status: capNo.status, body: capNo.body })

  // 4) criar 1º trainer basic
  const r4 = await httpPost('/api/users/trainers', { email: trainerBasic1 }, cAdminBasic)
  console.log('4) basic 1º trainer →', r4.status, r4.body)
  results.steps.push({ id: 4, status: r4.status, body: r4.body })

  // 5) criar 2º trainer basic (espera 422)
  const r5 = await httpPost('/api/users/trainers', { email: trainerBasic2 }, cAdminBasic)
  console.log('5) basic 2º trainer →', r5.status, r5.body)
  results.steps.push({ id: 5, status: r5.status, body: r5.body })

  // 6) enterprise criar 10 trainers
  for (let i = 0; i < 10; i++) {
    const r = await httpPost('/api/users/trainers', { email: trainerEnt[i] }, cManagerEnt)
    console.log(`6.${i + 1}) ent trainer ${i + 1} →`, r.status)
    results.steps.push({ id: 600 + (i + 1), status: r.status, body: r.body })
  }
  // 7) 11º → 422
  const r7 = await httpPost('/api/users/trainers', { email: trainerEnt[10] }, cManagerEnt)
  console.log('7) ent 11º trainer →', r7.status, r7.body)
  results.steps.push({ id: 7, status: r7.status, body: r7.body })

  // 8) seller basic → 403
  const r8 = await httpPost('/api/users/trainers', { email: trainerBasic1 }, cSellerBasic)
  console.log('8) seller basic criar trainer →', r8.status, r8.body)
  results.steps.push({ id: 8, status: r8.status, body: r8.body })

  // 9) support ent → 403
  const r9 = await httpPost('/api/users/trainers', { email: trainerEnt[0] }, cSupportEnt)
  console.log('9) support ent criar trainer →', r9.status, r9.body)
  results.steps.push({ id: 9, status: r9.status, body: r9.body })

  console.log('Smoke tests concluídos.')

  // Snapshot rápido de eventos por tenant (se SERVICE_ROLE estiver disponível)
  if (service) {
    const tenants = [
      'f203156c-ed09-42d1-9593-86f4b2ee0c81',
      '0f3ec75c-6eb9-4443-8c48-49eca6e6d00f',
    ]
    const eventsByTenant: Record<string, any[]> = {}
    for (const t of tenants) {
      const resp = await fetch(`${url}/rest/v1/events?tenant_id=eq.${t}&select=tenant_id,user_id,event_type,payload,created_at&order=created_at.desc&limit=15`, {
        headers: { apikey: service, Authorization: `Bearer ${service}` },
      })
      const events = await resp.json()
      console.log(`EVENTS (tenant ${t}) →`, events)
      eventsByTenant[t] = events
    }
    results.events = eventsByTenant
  }

  const outDir = path.resolve(process.cwd(), 'Estrutura')
  try { fs.mkdirSync(outDir, { recursive: true }) } catch {}
  fs.writeFileSync(path.join(outDir, 'QA_SmokeTests_Bloco1_Etapa2_results.json'), JSON.stringify(results, null, 2))
}

run().catch((e) => {
  console.error(e)
  process.exit(1)
})


