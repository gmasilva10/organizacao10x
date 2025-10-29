/*
  Geração de evidências: RBAC Restore Default + Relationship (templates + message + timeline)
  - Faz login com Supabase (admin.basic@pg.local)
  - Chama endpoints locais com cookie sb-access-token
  - Salva JSONs em web/evidencias/
*/
import { createClient } from '@supabase/supabase-js'
import { writeFileSync, mkdirSync, readFileSync } from 'fs'
import { join } from 'path'

const BASE = process.env.BASE_URL || 'http://localhost:3000'
const OUTDIR = join(process.cwd(), 'web', 'evidencias')

async function main() {
  mkdirSync(OUTDIR, { recursive: true })

  let url = process.env.NEXT_PUBLIC_SUPABASE_URL
  let anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anon) {
    // fallback: ler de web/Estrutura/Credenciais_QA_Supabase.txt
    const credPath = join(process.cwd(), 'Estrutura', 'Credenciais_QA_Supabase.txt')
    const txt = readFileSync(credPath, 'utf-8')
    const mUrl = txt.match(/NEXT_PUBLIC_SUPABASE_URL=(\S+)/)
    const mAnon = txt.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(\S+)/)
    url = mUrl?.[1]
    anon = mAnon?.[1]
  }
  if (!url || !anon) throw new Error('Supabase URL/Anon key ausentes (env/credenciais)')
  const supabase = createClient(url, anon)

  // credenciais QA (fallback para arquivo de credenciais)
  let email = process.env.QA_EMAIL
  let password = process.env.QA_PASSWORD
  if (!email || !password) {
    const credPath = join(process.cwd(), 'Estrutura', 'Credenciais_QA_Supabase.txt')
    const txt = readFileSync(credPath, 'utf-8')
    const mUser = txt.match(/admin\.basic@pg\.local/)
    const mPass = txt.match(/senha:\s*(\S+)/)
    email = mUser ? 'admin.basic@pg.local' : undefined
    password = mPass?.[1]
  }
  email = email || 'admin.basic@pg.local'
  password = password || 'Teste@123'
  const { data: { session }, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error || !session) throw error || new Error('Falha no login QA')
  const token = session.access_token

  writeFileSync(join(OUTDIR, 'qa_session_admin_basic.json'), JSON.stringify({ email, token, expires_at: session.expires_at }, null, 2))

  const cookie = `sb-access-token=${token}`

  // RBAC — roles before
  const rolesBefore = await fetch(`${BASE}/api/settings/roles`, { headers: { cookie } })
  writeFileSync(join(OUTDIR, 'roles_get_before.json'), await rolesBefore.text())

  // restore-default
  const restore = await fetch(`${BASE}/api/settings/roles/restore-default`, { method: 'POST', headers: { cookie } })
  writeFileSync(join(OUTDIR, 'roles_restore_default.json'), await restore.text())

  // RBAC — roles after
  const rolesAfter = await fetch(`${BASE}/api/settings/roles`, { headers: { cookie } })
  writeFileSync(join(OUTDIR, 'roles_get_after.json'), await rolesAfter.text())

  // Relationship — templates CRUD
  const templatesLog: any[] = []
  const t1 = await fetch(`${BASE}/api/relationship/templates`, { method: 'POST', headers: { 'Content-Type':'application/json', cookie }, body: JSON.stringify({ title: 'Follow-up WhatsApp', type: 'whatsapp', content: 'Olá {{nome}}, tudo bem?' }) })
  templatesLog.push({ step: 'POST templates', status: t1.status, body: await safeText(t1) })
  const list1 = await fetch(`${BASE}/api/relationship/templates`, { headers: { cookie } })
  const listText = await safeText(list1)
  templatesLog.push({ step: 'GET templates', status: list1.status, body: listText })

  // Try to update first id
  const listJson = JSON.parse(listText || '{}') as { items?: Array<{id:string}> }
  const firstId = listJson.items?.[0]?.id
  if (firstId) {
    const patch = await fetch(`${BASE}/api/relationship/templates/${firstId}`, { method: 'PATCH', headers: { 'Content-Type':'application/json', cookie }, body: JSON.stringify({ title: 'Follow-up WhatsApp (v2)' }) })
    templatesLog.push({ step: 'PATCH template', status: patch.status, body: await safeText(patch) })
  }
  writeFileSync(join(OUTDIR, 'relationship_templates_crud.json'), JSON.stringify(templatesLog, null, 2))

  // Students — pick one or create
  const studentsRes = await fetch(`${BASE}/api/students?page=1&pageSize=1`, { headers: { cookie } })
  const students = await studentsRes.json().catch(()=>({ items: [] as Array<{ id:string }> }))
  let studentId: string | null = students.items?.[0]?.id || null
  if (!studentId) {
    const create = await fetch(`${BASE}/api/students`, { method: 'POST', headers: { 'Content-Type':'application/json', cookie }, body: JSON.stringify({ name: 'Aluno QA', email: `qa_${Date.now()}@example.com` }) })
    const created = await create.json().catch(()=>({})) as any
    studentId = created?.id || null
  }

  // Relationship — message log
  if (studentId) {
    const msg = await fetch(`${BASE}/api/relationship/messages`, { method: 'POST', headers: { 'Content-Type':'application/json', cookie }, body: JSON.stringify({ student_id: studentId, type: 'nota', channel: null, body: 'Contato inicial registrado via QA' }) })
    writeFileSync(join(OUTDIR, 'relationship_message_post.json'), await msg.text())
    const tl = await fetch(`${BASE}/api/relationship/students/${studentId}/timeline?page=1&pageSize=20`, { headers: { cookie } })
    writeFileSync(join(OUTDIR, 'relationship_timeline_sample.json'), await tl.text())
  }

  console.log('Evidências geradas em', OUTDIR)
}

async function safeText(res: Response) {
  try { return await res.text() } catch { return '' }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})


