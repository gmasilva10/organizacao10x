import 'dotenv/config'
import fs from 'node:fs/promises'
import path from 'node:path'
import { createClient } from '@supabase/supabase-js'

const BASE_URL = process.env.QA_BASE_URL || 'http://localhost:3001'
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://kkxlztopdmipldncduvj.supabase.co'
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtreGx6dG9wZG1pcGxkbmNkdXZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg3NzM0NTMsImV4cCI6MjA2NDM0OTQ1M30.s443KF6W-W9ojzyraQ5v4YHYruqO9F08AkFHr0n3WxQ'

async function login(email: string, password: string) {
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON)
  const { data } = await supabase.auth.signInWithPassword({ email, password })
  const access = data.session?.access_token
  const refresh = data.session?.refresh_token
  const res = await fetch(`${BASE_URL}/api/auth/sync`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ access_token: access, refresh_token: refresh }) })
  const anyHeaders: any = res.headers as any
  const setCookieArr: string[] = (typeof anyHeaders.getSetCookie === 'function') ? anyHeaders.getSetCookie() : (res.headers.get('set-cookie') ? [res.headers.get('set-cookie') as string] : [])
  return setCookieArr.map(c=>c.split(';')[0]).join('; ')
}

async function board(cookie: string) {
  const r = await fetch(`${BASE_URL}/api/kanban/board`, { headers:{ Cookie: cookie } })
  return r.json()
}

async function crudAndReorder() {
  const cookie = await login('manager.basic@pg.local', 'Teste@123')
  const created = await fetch(`${BASE_URL}/api/kanban/columns`, { method:'POST', headers:{ 'Content-Type':'application/json', Cookie: cookie }, body: JSON.stringify({ title: 'Coluna QA' }) }).then(r=>r.json())
  const upd = await fetch(`${BASE_URL}/api/kanban/columns/${created.id}`, { method:'PATCH', headers:{ 'Content-Type':'application/json', Cookie: cookie }, body: JSON.stringify({ title: 'Coluna QA Renomeada' }) }).then(r=>r.json()).catch(()=>({}))
  const b = await board(cookie)
  const col = (b.columns || []).find((c: any)=>c.title==='Coluna QA Renomeada')
  let reorderResp: any = null
  if (col) {
    const cards = (b.cards || []).filter((k: any)=>k.column_id===col.id)
    const ids = cards.map((k:any)=>k.id)
    if (ids.length>1) {
      ids.reverse()
      reorderResp = await fetch(`${BASE_URL}/api/kanban/reorder`, { method:'POST', headers:{ 'Content-Type':'application/json', Cookie: cookie }, body: JSON.stringify({ columnId: col.id, cardIds: ids }) }).then(r=>({ status:r.status }))
    }
  }
  const del = await fetch(`${BASE_URL}/api/kanban/columns/${created.id}`, { method:'DELETE', headers:{ Cookie: cookie } }).then(r=>({ status:r.status }))
  return { created, upd, reorderResp, del }
}

async function main() {
  const result = await crudAndReorder()
  const out = path.join(process.cwd(), 'Estrutura', 'kanban_crud_reorder_sample.json')
  await fs.writeFile(out, JSON.stringify({ ts: new Date().toISOString(), result }, null, 2), 'utf-8')
  console.log('Saved:', out)
}

main().catch(e=>{ console.error(e); process.exitCode = 1 })


