// web/scripts/qa-kanban-full.ts
import 'dotenv/config'
import fs from 'node:fs/promises'
import path from 'node:path'
import { createClient } from '@supabase/supabase-js'

const BASE_URL = process.env.QA_BASE_URL || 'http://localhost:3001'
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://kkxlztopdmipldncduvj.supabase.co'
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtreGx6dG9wZG1pcGxkbmNkdXZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg3NzM0NTMsImV4cCI6MjA2NDM0OTQ1M30.s443KF6W-W9ojzyraQ5v4YHYruqO9F08AkFHr0n3WxQ'

async function login(email: string, password: string) {
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON)
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
  const access = data.session?.access_token
  const refresh = data.session?.refresh_token
  if (!access || !refresh) throw new Error('no session tokens')
  const res = await fetch(`${BASE_URL}/api/auth/sync`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ access_token: access, refresh_token: refresh }) })
  const anyHeaders: any = res.headers as any
  const setCookieArr: string[] = (typeof anyHeaders.getSetCookie === 'function') ? anyHeaders.getSetCookie() : (res.headers.get('set-cookie') ? [res.headers.get('set-cookie') as string] : [])
  const cookie = setCookieArr.map(c=>c.split(';')[0]).join('; ')
  if (res.status !== 204) throw new Error('sync failed')
  return cookie
}

async function move(cookie: string, studentId: string, from: string, to: string) {
  const r = await fetch(`${BASE_URL}/api/kanban/move`, { method: 'POST', headers: { 'Content-Type':'application/json', Cookie: cookie }, body: JSON.stringify({ studentId, from, to }) })
  const body = await r.text().catch(()=> '')
  return { status: r.status, body }
}

async function getBoard(cookie: string, trainerId?: string) {
  const url = new URL(`${BASE_URL}/api/kanban/board`)
  if (trainerId) url.searchParams.set('trainerId', trainerId)
  const r = await fetch(url, { headers: { Cookie: cookie } })
  return r.json()
}

async function getHistory(cookie: string, from: string, to: string, trainerId?: string, page=1, pageSize=20) {
  const url = new URL(`${BASE_URL}/api/kanban/history`)
  url.searchParams.set('from', from)
  url.searchParams.set('to', to)
  if (trainerId) url.searchParams.set('trainerId', trainerId)
  url.searchParams.set('page', String(page))
  url.searchParams.set('pageSize', String(pageSize))
  const r = await fetch(url, { headers: { Cookie: cookie } })
  return r.json()
}

async function main() {
  const manager = await login('manager.basic@pg.local', 'Teste@123')
  const trainer = await login('trainer.basic@pg.local', 'Teste@123')
  const seller = await login('seller.basic@pg.local', 'Teste@123')

  // Board samples
  const boardAll = await getBoard(manager)
  const someTrainerId = boardAll.cards?.[0]?.trainer_id || ''
  const boardTrainer = await getBoard(manager, someTrainerId)

  // Simular move OK (se houver card e colunas)
  const fromCol = boardAll.columns?.[0]?.id
  const toCol = boardAll.columns?.[1]?.id
  const anyCard = boardAll.cards?.find((c: any) => c.column_id === fromCol)
  let moveOk: any = null
  if (fromCol && toCol && anyCard) {
    moveOk = await move(manager, String(anyCard.student_id), String(fromCol), String(toCol))
  }

  // Negado (seller)
  let moveDenied: any = null
  if (fromCol && toCol && anyCard) {
    moveDenied = await move(seller, String(anyCard.student_id), String(toCol), String(fromCol))
  }

  // Histórico (últimos 7 dias)
  const now = new Date()
  const past = new Date(now.getTime() - 6*24*60*60*1000)
  const from = past.toISOString().slice(0,10)
  const to = now.toISOString().slice(0,10)
  const historyAll = await getHistory(manager, from, to)
  const historyTrainer = someTrainerId ? await getHistory(manager, from, to, someTrainerId) : { items: [] }

  const outBoardPath = path.join(process.cwd(), 'Estrutura', 'kanban_board_sample.json')
  await fs.writeFile(outBoardPath, JSON.stringify({ boardAll, boardTrainer }, null, 2), 'utf-8')

  const outEventsPath = path.join(process.cwd(), 'Estrutura', `kanban_events_results_2025-08-19.json`)
  await fs.writeFile(outEventsPath, JSON.stringify({ ts: new Date().toISOString(), moveOk, moveDenied }, null, 2), 'utf-8')

  const outHistPath = path.join(process.cwd(), 'Estrutura', 'kanban_history_sample.json')
  await fs.writeFile(outHistPath, JSON.stringify({ ts: new Date().toISOString(), historyAll, historyTrainer }, null, 2), 'utf-8')

  // eslint-disable-next-line no-console
  console.log('Saved:', outBoardPath, outEventsPath, outHistPath)
}

main().catch((e) => { console.error(e); process.exitCode = 1 })
