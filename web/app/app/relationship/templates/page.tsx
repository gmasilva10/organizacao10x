"use client"

import { useEffect, useState } from "react"

type Template = { id: string; title: string; type: 'nota'|'ligacao'|'whatsapp'|'email'; content: string }

export default function RelationshipTemplatesPage() {
  const [items, setItems] = useState<Template[]>([])
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Template | null>(null)
  const [title, setTitle] = useState("")
  const [type, setType] = useState<Template['type']>('nota')
  const [content, setContent] = useState("")

  useEffect(() => { load() }, [])

  async function load() {
    const res = await fetch('/api/relationship/templates', { cache: 'no-store' })
    const data = await res.json()
    setItems(data.items || [])
  }

  function openNew() {
    setEditing(null); setTitle(""); setType('nota'); setContent(""); setOpen(true)
  }

  function openEdit(t: Template) {
    setEditing(t); setTitle(t.title); setType(t.type); setContent(t.content); setOpen(true)
  }

  async function save(e: React.FormEvent) {
    e.preventDefault()
    if (editing) {
      const res = await fetch(`/api/relationship/templates/${editing.id}`, { method: 'PATCH', headers: { 'Content-Type':'application/json' }, body: JSON.stringify({ title, type, content }) })
      if (res.ok) { setOpen(false); await load() }
    } else {
      const res = await fetch('/api/relationship/templates', { method: 'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify({ title, type, content }) })
      if (res.ok) { setOpen(false); await load() }
    }
  }

  async function remove(id: string) {
    if (!confirm('Excluir template?')) return
    const res = await fetch(`/api/relationship/templates/${id}`, { method: 'DELETE' })
    if (res.ok) load()
  }

  return (
    <div className="container py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Templates de Relacionamento</h1>
        <button onClick={openNew} className="rounded-md bg-primary px-3 py-2 text-sm text-white">Novo Template</button>
      </div>

      <div className="mt-4 overflow-x-auto rounded-md border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-3 py-2 text-left">Título</th>
              <th className="px-3 py-2 text-left">Tipo</th>
              <th className="px-3 py-2 text-left">Ações</th>
            </tr>
          </thead>
          <tbody>
            {items.map(t => (
              <tr key={t.id} className="border-t">
                <td className="px-3 py-2">{t.title}</td>
                <td className="px-3 py-2 capitalize">{t.type}</td>
                <td className="px-3 py-2">
                  <button onClick={()=>openEdit(t)} className="rounded-md border px-2 py-1 text-xs mr-2">Editar</button>
                  <button onClick={()=>remove(t.id)} className="rounded-md border px-2 py-1 text-xs">Excluir</button>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr><td className="px-3 py-6 text-center text-muted-foreground" colSpan={3}>Nenhum template ainda.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true" aria-labelledby="rel-template-title" onKeyDown={(e)=>{ if (e.key==='Escape') setOpen(false) }}>
          <div className="w-full max-w-lg rounded-lg bg-background p-5 shadow-lg ring-1 ring-border">
            <h2 id="rel-template-title" className="text-lg font-semibold">{editing?'Editar Template':'Novo Template'}</h2>
            <form onSubmit={save} onKeyDown={(e)=>{ if (e.ctrlKey && e.key==='Enter') save(e as unknown as React.FormEvent) }} className="mt-4 space-y-3">
              <div>
                <label htmlFor="tpl-title" className="text-sm">Título</label>
                <input id="tpl-title" value={title} onChange={e=>setTitle(e.target.value)} className="mt-1 w-full rounded-md border px-3 py-2 text-sm" required aria-required="true" />
              </div>
              <div>
                <label htmlFor="tpl-type" className="text-sm">Tipo</label>
                <select id="tpl-type" value={type} onChange={e=>setType(e.target.value as Template['type'])} className="mt-1 w-full rounded-md border px-3 py-2 text-sm">
                  <option value="nota">nota</option>
                  <option value="ligacao">ligação</option>
                  <option value="whatsapp">whatsapp</option>
                  <option value="email">email</option>
                </select>
              </div>
              <div>
                <label htmlFor="tpl-content" className="text-sm">Corpo</label>
                <textarea id="tpl-content" value={content} onChange={e=>setContent(e.target.value)} className="mt-1 h-40 w-full rounded-md border px-3 py-2 text-sm" />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={()=>setOpen(false)} className="rounded-md border px-4 py-2 text-sm">Cancelar</button>
                <button className="rounded-md bg-primary px-4 py-2 text-sm text-white">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

