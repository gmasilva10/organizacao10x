"use client"

import { useEffect, useMemo, useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, CheckCircle, User, Users, AlertTriangle } from "lucide-react"
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
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [lastCreationTime, setLastCreationTime] = useState<number>(0)
  const RATE_LIMIT_MS = 60000 // 1 minuto entre criações

  useEffect(() => {
    if (!open) {
      // Resetar estado quando modal fecha
      setShowConfirmation(false)
      return
    }
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
    // Guard: não processar se modal fechado
    if (!open) return []
    
    // Sempre incluir o aluno como participante
    const participants = []
    
    // Adicionar o aluno se tiver telefone
    if (studentPhone) {
      participants.push(studentPhone)
    }
    
    // Adicionar treinadores selecionados (exceto o usuário logado)
    const selectedTrainers = trainers
      .filter(t => selected[t.id])
      .map(t => (t.phone || (t as any).whatsapp_work || ''))
      .filter(Boolean)
      .filter(phone => {
        const cleanPhone = phone.replace(/\D/g, '')
        const userPhone = '5517996693499' // Seu número
        return cleanPhone !== userPhone
      })
    
    participants.push(...selectedTrainers)
    
    return participants
  }, [selected, trainers, studentPhone, open])

  const adminPhones = useMemo(() => {
    if (!open) return []
    
    return trainers
      .filter(t => admins[t.id])
      .map(t => (t.phone || (t as any).whatsapp_work || ''))
      .filter(Boolean)
  }, [admins, trainers, open])

  const handleCreate = async () => {
    setError(null)
    if (!consent) { setError('É necessário consentimento para prosseguir.'); return }
    if (!groupName.trim()) { setError('Informe um nome para o grupo.'); return }
    // valida servidor também, mas dá feedback precoce
    const normalized = selectedPhones.map(p => normalizeToE164DigitsBR(p)).filter(r => r.ok && r.value).map(r => r.value as string)
    if (normalized.length < 1) { 
      setError('É necessário pelo menos um participante válido (aluno ou treinador).'); 
      return 
    }

    // NOVA VALIDAÇÃO: Rate limiting
    const now = Date.now()
    if (now - lastCreationTime < RATE_LIMIT_MS) {
      const remainingSeconds = Math.ceil((RATE_LIMIT_MS - (now - lastCreationTime)) / 1000)
      setError(`Aguarde ${remainingSeconds} segundos antes de criar outro grupo.`)
      return
    }

    // NOVA VALIDAÇÃO: Confirmação dupla
    if (!showConfirmation) {
      setShowConfirmation(true)
      return
    }

    try {
      setLoading(true)
      
      
      // Usar a nova API interna /api/wa/ que resolve CORS e garante Node runtime
      const res = await fetch('/api/wa/create-group', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: groupName,
          participants: normalized,
          instance: process.env.NEXT_PUBLIC_ZAPI_INSTANCE || '3E7608F78BA2405A08E5EE5C772D9ACD',
          token: process.env.NEXT_PUBLIC_ZAPI_TOKEN || 'F31db8854d41742a7a08625204dc7a618S'
        })
      })
      
      // Capturar resposta como texto primeiro
      const responseText = await res.text()
      
      let data = {}
      try {
        data = JSON.parse(responseText)
      } catch (parseError) {
        data = { error: 'Resposta inválida do servidor', raw: responseText }
      }
      
      if (!res.ok || !(data as any)?.success) {
        setError((data as any)?.error || 'Falha na criação do grupo')
      } else {
        setResult(data)
        // Após sucesso, atualizar timestamp para rate limiting
        setLastCreationTime(Date.now())
      }
    } catch (error) {
      console.error('❌ [WHATSAPP GROUP] Erro:', error)
      setError('Erro ao criar grupo: ' + (error as Error).message)
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
                <Checkbox checked={autoInvite} onCheckedChange={(v: boolean)=> setAutoInvite(!!v)} id="autoinvite" />
                <Label htmlFor="autoinvite" className="text-sm text-muted-foreground">Auto-invite ativo (quem não entrar receberá convite privado)</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox checked={consent} onCheckedChange={(v: boolean)=> setConsent(!!v)} id="consent" />
                <Label htmlFor="consent" className="text-sm">Tenho consentimento para adicionar os participantes ao grupo.</Label>
              </div>
            </div>

            {/* Passo 2 */}
            <div className="space-y-2">
              <Label>Participantes</Label>
              
              {/* Aluno (sempre incluído) */}
              {studentPhone && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm font-medium text-green-800">
                      {studentName} (aluno) - {studentPhone}
                    </span>
                  </div>
                  <div className="text-xs text-green-600 mt-1">
                    Será incluído automaticamente no grupo
                  </div>
                </div>
              )}
              
              <Label>Treinadores (opcional)</Label>
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
                          <Checkbox checked={!!selected[t.id]} disabled={disabled} onCheckedChange={(v: boolean)=> setSelected(s => ({ ...s, [t.id]: !!v }))} id={`sel-${t.id}`} />
                          <Label htmlFor={`sel-${t.id}`} className="text-xs">Participar</Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <Checkbox checked={!!admins[t.id]} disabled={disabled} onCheckedChange={(v: boolean)=> setAdmins(a => ({ ...a, [t.id]: !!v }))} id={`adm-${t.id}`} />
                          <Label htmlFor={`adm-${t.id}`} className="text-xs">Admin</Label>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
              <div className="text-xs text-muted-foreground">
                O aluno será incluído automaticamente. Treinadores são opcionais. Recomenda-se marcar ao menos um admin.
              </div>
            </div>

            {showConfirmation && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-semibold text-yellow-900 mb-1">Confirmar Criação de Grupo</h4>
                    <p className="text-sm text-yellow-800 mb-2">
                      Você está prestes a criar um grupo no WhatsApp com {selectedPhones.length} participante(s).
                      Esta ação não pode ser desfeita automaticamente.
                    </p>
                    <p className="text-xs text-yellow-700">
                      Grupo: <strong>{groupName}</strong>
                    </p>
                  </div>
                </div>
              </div>
            )}

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


