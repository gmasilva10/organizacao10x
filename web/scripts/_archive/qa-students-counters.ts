import 'dotenv/config'
import fs from 'node:fs/promises'
import path from 'node:path'
import { createClient } from '@supabase/supabase-js'

type TestUser = { email: string; password: string; role: 'manager' }
const BASE_URL = process.env.QA_BASE_URL || 'http://localhost:3001'
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://kkxlztopdmipldncduvj.supabase.co'
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtreGx6dG9wZG1pcGxkbmNkdXZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg3NzM0NTMsImV4cCI6MjA2NDM0OTQ1M30.s443KF6W-W9ojzyraQ5v4YHYruqO9F08AkFHr0n3WxQ'

async function loginAndSync(user: TestUser, cookieJar: Map<string, string>) {
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON)
  const { data, error } = await supabase.auth.signInWithPassword({ email: user.email, password: user.password })
  if (error) throw new Error(`Login failed for ${user.email}: ${error.message}`)
  const accessToken = data.session?.access_token
  const refreshToken = data.session?.refresh_token
  if (!accessToken || !refreshToken) throw new Error('Missing tokens after login')
  const res = await fetch(`${BASE_URL}/api/auth/sync`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ access_token: accessToken, refresh_token: refreshToken }),
    redirect: 'manual',
  })
  const anyHeaders: any = res.headers as any
  const setCookieArr: string[] = (typeof anyHeaders.getSetCookie === 'function')
    ? anyHeaders.getSetCookie()
    : (res.headers.get('set-cookie') ? [res.headers.get('set-cookie') as string] : [])
  for (const c of setCookieArr) {
    const [pair] = c.split(';')
    const eqIdx = pair.indexOf('=')
    if (eqIdx > 0) {
      const name = pair.slice(0, eqIdx)
      const value = pair.slice(eqIdx + 1)
      cookieJar.set(name.trim(), value.trim())
    }
  }
  if (res.status !== 204) throw new Error(`/api/auth/sync returned ${res.status}`)
}

function cookieHeader(cookieJar: Map<string, string>): string {
  return Array.from(cookieJar.entries()).map(([k, v]) => `${k}=${v}`).join('; ')
}

async function main() {
  const user: TestUser = { email: 'manager.basic@pg.local', password: 'Teste@123', role: 'manager' }
  const cookieJar = new Map<string, string>()
  await loginAndSync(user, cookieJar)

  const summaryResp = await fetch(`${BASE_URL}/api/students/summary`, { headers: { Cookie: cookieHeader(cookieJar) } })
  const summary = await summaryResp.json().catch(() => ({}))

  const listResp = await fetch(`${BASE_URL}/api/students?page=1&pageSize=20`, { headers: { Cookie: cookieHeader(cookieJar) } })
  const list = await listResp.json().catch(() => ({}))

  const out = { ts: new Date().toISOString(), summary, list }
  const outPath = path.join(process.cwd(), 'Estrutura', 'students_counters_list.json')
  await fs.writeFile(outPath, JSON.stringify(out, null, 2), 'utf-8')
  // eslint-disable-next-line no-console
  console.log('Saved:', outPath)
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err)
  process.exitCode = 1
})


