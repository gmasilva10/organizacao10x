"use client"

import { useEffect, useMemo, useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, CheckCircle, User, Users } from "lucide-react"
import { normalizeToE164DigitsBR } from "@/lib/phone-normalize"

interface Trainer {
  id: string
  name: string
  phone?: string
  role?: string
}

interface Props {
  open: boolean
  onOpenChange: (v: boolean) => void
  studentId: string
  studentName: string
  studentPhone?: string
}

export default function WhatsAppCreateGroupModal({ open, onOpenChange, studentId, studentName, studentPhone }: Props) {
  const firstName = (studentName || '').split(' ')[0] || studentName
  const [groupName, setGroupName] = useState(`PG – ${firstName}`)
  const [autoInvite, setAutoInvite] = useState(true)
  const [consent, setConsent] = useState(false)
  const [trainers, setTrainers] = useState<Trainer[]>([])
  const [selected, setSelected] = useState<Record<string, boolean>>({})
  const [admins, setAdmins] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<any>(null)

  useEffect(() => {
    if (!open) return
    const load = async () => {
      try {
        const res = await fetch('/api/professionals?status=active', { cache: 'no-store' })
        const data = await res.json().catch(() => null)
        const list = data?.professionals || []
        const normalized: Trainer[] = list.map((p: any) => ({
          id: String(p.id),
          name: p.full_name || p.name,
          phone: p.whatsapp_work || '',
          role: 'trainer'
        }))
        setTrainers(normalized)
      } catch {
        setTrainers([])
      }
    }
    load()
  }, [open])

  const selectedPhones = useMemo(() => {
    return trainers
      .filter(t => selected[t.id])
      .map(t => (t.phone || (t as any).whatsapp_work || ''))
      .filter(Boolean)
  }, [selected, trainers])

  const adminPhones = useMemo(() => {
    return trainers
      .filter(t => admins[t.id])
      .map(t => (t.phone || (t as any).whatsapp_work || ''))
      .filter(Boolean)
  }, [admins, trainers])

  const handleCreate = async () => {
    setError(null)
    if (!consent) { setError('É necessário consentimento para prosseguir.'); return }
    if (!groupName.trim()) { setError('Informe um nome para o grupo.'); return }
    // valida servidor também, mas dá feedback precoce
    const normalized = selectedPhones.map(p => normalizeToE164DigitsBR(p)).filter(r => r.ok && r.value).map(r => r.value as string)
    if (normalized.length < 1) { setError('Selecione ao menos um participante válido.'); return }

    try {
      setLoading(true)
      const res = await fetch('/api/whatsapp/setup-group', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId, groupName, trainers: selectedPhones, admins: adminPhones, autoInvite, consentGiven: true, studentPhone })
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data?.success) {
        setError(data?.message || 'Falha na criação do grupo.')
      } else {
        setResult(data)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Criar Grupo WhatsApp</DialogTitle>
          <DialogDescription>Configurar grupo para {firstName}</DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {!result ? (
          <div className="space-y-6">
            {/* Passo 1 */}
            <div className="space-y-2">
              <Label>Nome do grupo</Label>
              <Input value={groupName} onChange={e => setGroupName(e.target.value)} placeholder={`PG – ${firstName}`} />
              <div className="flex items-center gap-2">
                <Checkbox checked={autoInvite} onCheckedChange={(v:any)=> setAutoInvite(!!v)} id="autoinvite" />
                <Label htmlFor="autoinvite" className="text-sm text-muted-foreground">Auto-invite ativo (quem não entrar receberá convite privado)</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox checked={consent} onCheckedChange={(v:any)=> setConsent(!!v)} id="consent" />
                <Label htmlFor="consent" className="text-sm">Tenho consentimento para adicionar os participantes ao grupo.</Label>
              </div>
            </div>

            {/* Passo 2 */}
            <div className="space-y-2">
              <Label>Participantes (treinadores)</Label>
              <div className="max-h-56 overflow-y-auto rounded-md border p-2 space-y-2">
                {trainers.map(t => {
                  const rawPhone = (t.phone || '').toString()
                  const hasPhone = rawPhone.replace(/\D/g, '').length >= 12
                  const disabled = !hasPhone
                  return (
                    <div key={t.id} className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-sm font-medium truncate">{t.name}</div>
                        <div className="text-xs text-muted-foreground truncate">{hasPhone ? rawPhone : 'sem WhatsApp cadastrado'}</div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <Checkbox checked={!!selected[t.id]} disabled={disabled} onCheckedChange={(v:any)=> setSelected(s => ({ ...s, [t.id]: !!v }))} id={`sel-${t.id}`} />
                          <Label htmlFor={`sel-${t.id}`} className="text-xs">Participar</Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <Checkbox checked={!!admins[t.id]} disabled={disabled} onCheckedChange={(v:any)=> setAdmins(a => ({ ...a, [t.id]: !!v }))} id={`adm-${t.id}`} />
                          <Label htmlFor={`adm-${t.id}`} className="text-xs">Admin</Label>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
              <div className="text-xs text-muted-foreground">Selecione ao menos um participante. Recomenda-se marcar ao menos um admin.</div>
            </div>

            <div className="flex justify-end gap-2">
              <Button onClick={handleCreate} disabled={loading}>{loading ? 'Criando…' : 'Criar grupo (API)'}</Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-green-700">
              <CheckCircle className="h-4 w-4" />
              Grupo criado
            </div>
            {result.invitationLink && (
              <div className="text-sm break-all">Convite: {result.invitationLink}</div>
            )}
            <div className="text-sm">Saímos do grupo: {result.orgLeft ? 'sim' : 'não'}</div>
            {result.partial && Array.isArray(result.pending) && result.pending.length > 0 && (
              <div className="text-sm">Pendentes: {result.pending.join(', ')}</div>
            )}
            <div className="flex justify-end">
              <Button onClick={() => { setResult(null); onOpenChange(false) }}>Fechar</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}


