import dotenv from 'dotenv'
import path from 'path'
import fs from 'fs'
// Carregar .env.local (Next) e .env padrão se existir
function loadEnvs() {
  const candidates = [
    path.resolve(process.cwd(), '.env.local'),
    path.resolve(process.cwd(), '.env'),
    path.resolve(process.cwd(), '..', '.env.local'),
    path.resolve(process.cwd(), '..', '.env'),
  ]
  for (const p of candidates) {
    if (fs.existsSync(p)) {
      dotenv.config({ path: p })
    }
  }
}

loadEnvs()
import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
const service = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!url || !service) {
  console.error('Faltam variáveis: NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

// Admin client (service role)
const admin = createClient(url, service, { auth: { autoRefreshToken: false, persistSession: false } })

type Role = 'admin' | 'manager' | 'seller' | 'support' | 'trainer'

const TENANT_A = 'f203156c-ed09-42d1-9593-86f4b2ee0c81' // Basic
const TENANT_B = '0f3ec75c-6eb9-4443-8c48-49eca6e6d00f' // Enterprise

// Senha QA padrão
const PWD = 'Teste@123'

// Lista de usuários por tenant
const basicUsers: Array<{ email: string; role: Role; attachMembership: boolean }> = [
  { email: 'admin.basic@pg.local', role: 'admin', attachMembership: true },
  { email: 'manager.basic@pg.local', role: 'manager', attachMembership: true },
  { email: 'seller.basic@pg.local', role: 'seller', attachMembership: true },
  { email: 'support.basic@pg.local', role: 'support', attachMembership: true },
  { email: 'trainer.basic@pg.local', role: 'trainer', attachMembership: true },
  { email: 'novo.trainer.basic@qa.local', role: 'trainer', attachMembership: false },
  { email: 'segundo.trainer.basic@qa.local', role: 'trainer', attachMembership: false },
]

const entUsers: Array<{ email: string; role: Role; attachMembership: boolean }> = [
  { email: 'admin.ent@pg.local', role: 'admin', attachMembership: true },
  { email: 'manager.ent@pg.local', role: 'manager', attachMembership: true },
  { email: 'seller.ent@pg.local', role: 'seller', attachMembership: true },
  { email: 'support.ent@pg.local', role: 'support', attachMembership: true },
  { email: 'trainer.ent@pg.local', role: 'trainer', attachMembership: true },
  ...Array.from({ length: 11 }).map((_, i) => ({
    email: `trainer${String(i + 1).padStart(2, '0')}.ent@qa.local`,
    role: 'trainer' as Role,
    attachMembership: false,
  })),
]

// Upsert de usuário no Auth (confirma email)
async function ensureUser(email: string, password: string) {
  // Admin API não tem "get by email" nativo; usamos listUsers com filtro
  const { data: list, error: listErr } = await admin.auth.admin.listUsers({
    page: 1, perPage: 1000,
  })
  if (listErr) throw listErr

  const found = list.users.find(u => u.email?.toLowerCase() === email.toLowerCase())
  if (found) return found.id as string

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })
  if (error) throw error
  return data.user?.id as string
}

async function upsertMembership(orgId: string, userId: string, role: Role) {
  const { error } = await admin
    .from('memberships')
    .upsert({ org_id: orgId, user_id: userId, role }, { onConflict: 'org_id,user_id' })
  if (error) throw error
}

async function run() {
  console.log('Seeding QA…')

  // Tenant A (Basic)
  for (const u of basicUsers) {
    const userId = await ensureUser(u.email, PWD)
    console.log(`[BASIC] ${u.email} -> ${userId}`)
    if (u.attachMembership) {
      await upsertMembership(TENANT_A, userId, u.role)
      console.log(`  membership OK (${u.role})`)
    }
  }

  // Tenant B (Enterprise)
  for (const u of entUsers) {
    const userId = await ensureUser(u.email, PWD)
    console.log(`[ENT] ${u.email} -> ${userId}`)
    if (u.attachMembership) {
      await upsertMembership(TENANT_B, userId, u.role)
      console.log(`  membership OK (${u.role})`)
    }
  }

  console.log('Seeds QA concluídos ✔')
}

run().catch(err => {
  console.error(err)
  process.exit(1)
})


