"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

type RelationshipGroup = {
  id: string
  name: string
  external_id: string
  is_primary?: boolean
}

type RelationshipMessage = {
  id: string
  channel: string
  direction: string
  status: string
  created_at: string
  template_id?: string | null
  group_id?: string | null
  to_text?: string | null
}

export default function RelacionamentoPage() {
  const params = useParams<{ id: string }>()
  const studentId = params?.id
  const [tab, setTab] = useState<'whatsapp' | 'historico'>('whatsapp')
  const [groups, setGroups] = useState<RelationshipGroup[]>([])
  const [messages, setMessages] = useState<RelationshipMessage[]>([])

  const loadGroups = useCallback(async () => {
    if (!studentId) return
    const res = await fetch(`/api/relationship/whatsapp/groups?studentId=${studentId}`)
    const data = (await res.json()) as { groups?: RelationshipGroup[] }
    if (!res.ok) {
      toast.error('Falha ao carregar grupos')
      return
    }
    setGroups(data.groups ?? [])
  }, [studentId])

  const loadMessages = useCallback(async () => {
    if (!studentId) return
    const res = await fetch(`/api/relationship/messages?studentId=${studentId}`)
    const data = (await res.json()) as { messages?: RelationshipMessage[] }
    if (!res.ok) {
      toast.error('Falha ao carregar historico')
      return
    }
    setMessages(data.messages ?? [])
  }, [studentId])

  useEffect(() => {
    if (studentId) {
      void loadGroups()
      void loadMessages()
    }
  }, [studentId, loadGroups, loadMessages])

  return (
    <div className="p-4 space-y-4">
      <nav className="text-sm text-gray-600">
        <span className="hover:underline"><Link href={`/students/${studentId}/edit`}>Alunos</Link></span>
        <span> / </span>
        <span className="font-medium">Relacionamento</span>
      </nav>

      <div className="flex gap-2">
        <Button variant={tab === 'whatsapp' ? 'default' : 'outline'} onClick={() => setTab('whatsapp')}>WhatsApp</Button>
        <Button variant={tab === 'historico' ? 'default' : 'outline'} onClick={() => setTab('historico')}>Historico</Button>
      </div>

      {tab === 'whatsapp' ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-medium">Grupos vinculados</h2>
            <Button variant="secondary" onClick={async () => {
              const externalId = prompt('External ID do grupo (Z-API)') || ''
              const name = prompt('Nome do grupo') || ''
              if (!externalId || !name) return
              const res = await fetch('/api/relationship/whatsapp/groups/link', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ studentId, externalId, name }) })
              if (!res.ok) {
                toast.error('Falha ao vincular grupo')
                return
              }
              toast.success('Grupo vinculado')
              void loadGroups()
            }}>Vincular Grupo</Button>
          </div>

          <div className="border rounded-md divide-y">
            {groups.length === 0 ? (
              <div className="p-3 text-sm text-gray-600">Nenhum grupo vinculado.</div>
            ) : groups.map((g) => (
              <div key={g.id} className="p-3 flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="font-medium">{g.name} {g.is_primary ? ' [Padrao]' : ''}</div>
                  <div className="text-xs text-gray-600">{g.external_id}</div>
                </div>
                <div className="flex gap-2">
                  {!g.is_primary && <Button variant="outline" onClick={async () => {
                    const res = await fetch('/api/relationship/whatsapp/groups/set-primary', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ studentId, groupId: g.id }) })
                    if (!res.ok) {
                      toast.error('Falha ao definir padrao')
                      return
                    }
                    toast.success('Definido como padrao')
                    void loadGroups()
                  }}>Definir como padrao</Button>}
                  <Button variant="outline" onClick={async () => {
                    const res = await fetch('/api/relationship/whatsapp/groups/unlink', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ studentId, groupId: g.id }) })
                    if (!res.ok) {
                      toast.error('Falha ao desvincular')
                      return
                    }
                    toast.success('Grupo desvinculado')
                    void loadGroups()
                  }}>Remover vinculo</Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <h2 className="font-medium">Historico</h2>
          <div className="border rounded-md divide-y">
            {messages.length === 0 ? (
              <div className="p-3 text-sm text-gray-600">Nenhum registro.</div>
            ) : messages.map((m) => (
              <div key={m.id} className="p-3 text-sm flex items-center justify-between">
                <div>
                  <div className="font-medium">{m.channel} · {m.direction} · {m.status}</div>
                  <div className="text-xs text-gray-600">{new Date(m.created_at).toLocaleString()} · {m.template_id ?? ''}</div>
                </div>
                <div className="text-xs text-gray-600">{m.group_id ? `grupo ${m.group_id}` : (m.to_text ?? '')}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
