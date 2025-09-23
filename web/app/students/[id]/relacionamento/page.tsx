"use client"

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

export default function RelacionamentoPage() {
  const params = useParams<{ id: string }>()
  const studentId = params?.id
  const [tab, setTab] = useState<'whatsapp' | 'historico'>('whatsapp')
  const [groups, setGroups] = useState<any[]>([])
  const [messages, setMessages] = useState<any[]>([])

  const loadGroups = async () => {
    const res = await fetch(`/api/relacionamento/whatsapp/groups?studentId=${studentId}`)
    const data = await res.json()
    if (!res.ok) { toast.error('Falha ao carregar grupos'); return }
    setGroups(data.groups || [])
  }
  const loadMessages = async () => {
    const res = await fetch(`/api/relacionamento/messages?studentId=${studentId}`)
    const data = await res.json()
    if (!res.ok) { toast.error('Falha ao carregar histórico'); return }
    setMessages(data.messages || [])
  }

  useEffect(() => {
    if (studentId) { loadGroups(); loadMessages() }
  }, [studentId])

  return (
    <div className="p-4 space-y-4">
      <nav className="text-sm text-gray-600">
        <span className="hover:underline"><Link href={`/students/${studentId}/edit`}>Alunos</Link></span>
        <span> / </span>
        <span className="font-medium">Relacionamento</span>
      </nav>

      <div className="flex gap-2">
        <Button variant={tab==='whatsapp'?'default':'outline'} onClick={() => setTab('whatsapp')}>WhatsApp</Button>
        <Button variant={tab==='historico'?'default':'outline'} onClick={() => setTab('historico')}>Histórico</Button>
      </div>

      {tab === 'whatsapp' ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-medium">Grupos vinculados</h2>
            <Button variant="secondary" onClick={async () => {
              const externalId = prompt('External ID do grupo (Z-API)') || ''
              const name = prompt('Nome do grupo') || ''
              if (!externalId || !name) return
              const res = await fetch('/api/relacionamento/whatsapp/groups/link', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ studentId, externalId, name }) })
              if (!res.ok) return toast.error('Falha ao vincular grupo')
              toast.success('Grupo vinculado')
              loadGroups()
            }}>Vincular Grupo</Button>
          </div>

          <div className="border rounded-md divide-y">
            {groups.length === 0 ? (
              <div className="p-3 text-sm text-gray-600">Nenhum grupo vinculado.</div>
            ) : groups.map((g) => (
              <div key={g.id} className="p-3 flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="font-medium">{g.name} {g.is_primary ? ' [Padrão]' : ''}</div>
                  <div className="text-xs text-gray-600">{g.external_id}</div>
                </div>
                <div className="flex gap-2">
                  {!g.is_primary && <Button variant="outline" onClick={async () => {
                    const res = await fetch('/api/relacionamento/whatsapp/groups/set-primary', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ studentId, groupId: g.id }) })
                    if (!res.ok) return toast.error('Falha ao definir padrão')
                    toast.success('Definido como padrão')
                    loadGroups()
                  }}>Definir como padrão</Button>}
                  <Button variant="outline" onClick={async () => {
                    const res = await fetch('/api/relacionamento/whatsapp/groups/unlink', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ studentId, groupId: g.id }) })
                    if (!res.ok) return toast.error('Falha ao desvincular')
                    toast.success('Grupo desvinculado')
                    loadGroups()
                  }}>Remover vínculo</Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <h2 className="font-medium">Histórico</h2>
          <div className="border rounded-md divide-y">
            {messages.length === 0 ? (
              <div className="p-3 text-sm text-gray-600">Nenhum registro.</div>
            ) : messages.map((m) => (
              <div key={m.id} className="p-3 text-sm flex items-center justify-between">
                <div>
                  <div className="font-medium">{m.channel} • {m.direction} • {m.status}</div>
                  <div className="text-xs text-gray-600">{new Date(m.created_at).toLocaleString()} — {m.template_id || ''}</div>
                </div>
                <div className="text-xs text-gray-600">{m.group_id ? `grupo ${m.group_id}` : (m.to_text || '')}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}


