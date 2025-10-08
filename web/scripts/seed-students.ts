import 'dotenv/config'

const BASIC_TENANT = 'f203156c-ed09-42d1-9593-86f4b2ee0c81'
const ENT_TENANT = '0f3ec75c-6eb9-4443-8c48-49eca6e6d00f'

type Student = {
  org_id: string
  name: string
  email: string
  phone: string | null
  status: 'onboarding' | 'active' | 'paused'
  trainer_id: string | null
}

async function getOneTrainerId(tenantId: string): Promise<string | null> {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  const resp = await fetch(`${url}/rest/v1/memberships?org_id=eq.${tenantId}&role=eq.trainer&select=user_id&limit=1`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  })
  const rows = await resp.json().catch(() => []) as Array<{ user_id: string }>
  return rows?.[0]?.user_id || null
}

function pickStatus(i: number): 'onboarding' | 'active' | 'paused' {
  const r = i % 20
  if (r < 14) return 'active'         // ~70%
  if (r < 19) return 'onboarding'     // ~25%
  return 'paused'                     // ~5%
}

function buildStudents(count: number, tenantId: string, trainerId: string | null, prefix: string): Student[] {
  const arr: Student[] = []
  for (let i = 1; i <= count; i++) {
    const status = pickStatus(i)
    const assigned = trainerId && i % 3 === 0 ? trainerId : null // ~33% atribuídos
    arr.push({
      org_id: tenantId,
      name: `${prefix.toUpperCase()} Aluno ${String(i).padStart(4,'0')}`,
      email: `aluno${String(i).padStart(4,'0')}.${prefix}@qa.local`,
      phone: `+55-11-9${String(10000000 + i).slice(-8)}`,
      status,
      trainer_id: assigned,
    })
  }
  return arr
}

async function upsertBatch(students: Student[]) {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Missing SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY')
  const resp = await fetch(`${url}/rest/v1/students?on_conflict=org_id,email`, {
    method: 'POST',
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates,return=minimal',
    },
    body: JSON.stringify(students),
  })
  if (!resp.ok) {
    const text = await resp.text()
    throw new Error(`Upsert failed: ${resp.status} ${text}`)
  }
}

async function main() {
  const basicTrainer = await getOneTrainerId(BASIC_TENANT)
  const entTrainer = await getOneTrainerId(ENT_TENANT)

  // Basic ~298 (margem para +2 nos testes)
  const basic = buildStudents(298, BASIC_TENANT, basicTrainer, 'basic')
  // Enterprise 10
  let ent = buildStudents(10, ENT_TENANT, entTrainer, 'ent')
  // garantir 1 aluno onboarding do trainer.ent para caso de PATCH 200
  if (entTrainer) {
    ent[0].status = 'onboarding'
    ent[0].trainer_id = entTrainer
  }

  const chunks = (arr: Student[], size: number) => Array.from({ length: Math.ceil(arr.length / size) }, (_, i) => arr.slice(i * size, i * size + size))
  for (const c of chunks(basic, 200)) await upsertBatch(c)
  for (const c of chunks(ent, 200)) await upsertBatch(c)

  console.log(JSON.stringify({ ok: true, basic: basic.length, enterprise: ent.length }, null, 2))
}

main().catch((e) => { console.error(e); process.exit(1) })


