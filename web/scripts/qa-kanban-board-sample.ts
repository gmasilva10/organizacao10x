import 'dotenv/config'
import fs from 'node:fs/promises'
import path from 'node:path'
import { createClient } from '@supabase/supabase-js'

const BASE_URL = process.env.QA_BASE_URL || 'http://localhost:3001'
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://kkxlztopdmipldncduvj.supabase.co'
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtreGx6dG9wZG1pcGxkbmNkdXZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg3NzM0NTMsImV4cCI6MjA2NDM0OTQ1M30.s443KF6W-W9ojzyraQ5v4YHYruqO9F08AkFHr0n3WxQ'

async function loginAsManagerGetCookies() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON)
  const { data } = await supabase.auth.signInWithPassword({ email: 'manager.basic@pg.local', password: 'Teste@123' })
  const access = data.session?.access_token
  const refresh = data.session?.refresh_token
  if (!access || !refresh) throw new Error('no session')
  const res = await fetch(`${BASE_URL}/api/auth/sync`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ access_token: access, refresh_token: refresh }) })
  const anyHeaders: any = res.headers as any
  const setCookieArr: string[] = (typeof anyHeaders.getSetCookie === 'function') ? anyHeaders.getSetCookie() : (res.headers.get('set-cookie') ? [res.headers.get('set-cookie') as string] : [])
  return setCookieArr.map(c=>c.split(';')[0]).join('; ')
}

async function main() {
  const cookie = await loginAsManagerGetCookies()
  const resp = await fetch(`${BASE_URL}/api/kanban/board`, { headers: { Cookie: cookie } })
  const json = await resp.json()
  const outPath = path.join(process.cwd(), 'Estrutura', 'kanban_board_sample.json')
  await fs.writeFile(outPath, JSON.stringify(json, null, 2), 'utf-8')
  // eslint-disable-next-line no-console
  console.log('Saved:', outPath)
}

main().catch((e) => { console.error(e); process.exitCode = 1 })


