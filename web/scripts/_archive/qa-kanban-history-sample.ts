import fs from 'node:fs'
import path from 'node:path'

async function main() {
  const host = process.env.HOST || 'http://localhost:3000'
  const params = new URLSearchParams()
  // últimos 7 dias por padrão
  const now = new Date()
  const past = new Date(now.getTime() - 6*24*60*60*1000)
  params.set('from', past.toISOString().slice(0,10))
  params.set('to', now.toISOString().slice(0,10))
  params.set('page', '1')
  params.set('pageSize', '20')

  const res = await fetch(`${host}/api/kanban/history?${params.toString()}`, { cache: 'no-store' })
  const data = await res.json().catch(()=>({ items: [] }))
  const outDir = path.join(process.cwd(), 'app', '..', 'Estrutura')
  const outPath = path.join(outDir, 'kanban_history_sample.json')
  fs.writeFileSync(outPath, JSON.stringify(data, null, 2), 'utf-8')
  console.log('Saved', outPath)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})


