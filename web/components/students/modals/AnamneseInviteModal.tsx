"use client"

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { Loader2, Send, Phone, User, Users, Info, FileText } from 'lucide-react'

interface AnamneseInviteModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  studentId: string
  studentName: string
  studentPhone?: string
}

type RelationshipGroup = {
  id: string
  name: string
  external_id?: string
  is_primary?: boolean
}

type RelationshipEntity = {
  id: string
  type: string
  name?: string | null
  phone_e164?: string | null
}


export function AnamneseInviteModal({ 
  open, 
  onOpenChange, 
  studentId, 
  studentName, 
  studentPhone 
}: AnamneseInviteModalProps) {
  console.log('ðŸ” [DEBUG] AnamneseInviteModal renderizado com open:', open)
  const loadingSend = false
  const [loadingGenerate, setLoadingGenerate] = useState(false)
  const [phone, setPhone] = useState(studentPhone || '')
  const [serviceId, setServiceId] = useState('')
  const [services, setServices] = useState<Array<{ id: string; name: string }>>([])
  const [customMessage, setCustomMessage] = useState('')
  const [generatedLink, setGeneratedLink] = useState<string | null>(null)
  const [destination, setDestination] = useState<'group' | 'student'>('group')
  const [groups, setGroups] = useState<RelationshipGroup[]>([])
  const [groupId, setGroupId] = useState<string>('')
  const [entities, setEntities] = useState<RelationshipEntity[]>([])

  useEffect(() => {
    // Tentativa de buscar grupos do aluno; se a API ainda n £o existir, falha silenciosa
    const fetchGroups = async () => {
      try {
        // Em Next.js (App Router), a pasta /app n £o entra na URL p  blica. Usar sempre /api/*
        const res = await fetch(`/api/relationship/whatsapp/groups?studentId=${studentId}`)
        if (res.ok) {
          const data = (await res.json()) as { groups?: RelationshipGroup[] }
          const list = Array.isArray(data.groups) ? data.groups : []
          setGroups(list)
          const primary = list.find((g) => g.is_primary)
          if (primary) setGroupId(primary.id)
        }
      } catch (e) {
        // silencioso: UI continua permitindo envio para aluno
      }
    }
    const fetchEntities = async () => {
      try {
        const res = await fetch(`/api/relationship/whatsapp/entities?studentId=${studentId}`)
        if (res.ok) {
          const data = (await res.json()) as { entities?: RelationshipEntity[] }
          setEntities(Array.isArray(data.entities) ? data.entities : [])
        }
      } catch {}
    }
    if (open) { fetchGroups(); fetchEntities() }
  }, [open, studentId])

  useEffect(() => {
    const loadServices = async () => {
      try {
        const res = await fetch('/api/services/list')
        const data = await res.json()
        if (res.ok && Array.isArray(data?.services)) {
          setServices(data.services)
        }
      } catch {}
    }
    if (open) loadServices()
  }, [open])

  const handleGenerate = async () => {
    const isUuid = (v: string) => /^[0-9a-fA-F-]{36}$/.test(v)
    // Servi  o    opcional neste fluxo (iremos gravar null se ausente)
    try {
      setLoadingGenerate(true)
      const response = await fetch('/api/anamnese/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          alunoId: studentId,
          serviceId: isUuid(serviceId || '') ? serviceId : undefined,
          destino: destination === 'group' ? 'GRUPO' : 'ALUNO'
        })
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data?.error || 'Erro ao gerar anexo da anamnese')
      toast.success('Anamnese gerada. Link copiado!')
      if (data?.public_link) {
        try { await navigator.clipboard.writeText(String(data.public_link)) } catch {}
        setGeneratedLink(String(data.public_link))
      }
    } catch (error) {
      console.error('Erro ao gerar vers £o:', error)
      toast.error(error instanceof Error ? error.message : 'Erro ao gerar vers £o')
    } finally {
      setLoadingGenerate(false)
    }
  }

  const handleOpenWhatsApp = async () => {
    try {
      const link = generatedLink
      if (!link) { toast.error('Gere a anamnese antes de enviar'); return }
      // Construir texto
      // Mensagem com link em linha pr ³pria para maximizar convers £o em hyperlink
      const text = customMessage?.trim().length
        ? `${customMessage}\n\n${link}`
        : `Ol ¡! Para personalizarmos seu treino, responda sua Anamnese:\n${link}\nLeva ~7   10 min. Obrigado!`

      // Abrir wa.me - normalizar telefone para E.164
      const phoneDigits = (phone || '').replace(/\D/g, '')
      let normalizedPhone = phoneDigits
      
      // Se tem 11 d ­gitos (DDD + n  mero), adicionar +55
      if (phoneDigits.length === 11) {
        normalizedPhone = `55${phoneDigits}`
      }
      // Se j ¡ tem 13 d ­gitos (55 + DDD + n  mero), usar como est ¡
      else if (phoneDigits.length === 13 && phoneDigits.startsWith('55')) {
        normalizedPhone = phoneDigits
      }
      
      const href = normalizedPhone
        ? `https://api.whatsapp.com/send?phone=${normalizedPhone}&text=${encodeURIComponent(text)}`
        : `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`
      window.open(href, '_blank')

      // Registrar hist ³rico
      await fetch('/api/relationship/whatsapp/history', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId,
          action: 'wa_share_clicked',
          target: { type: normalizedPhone ? 'CONTACT' : 'GROUP', name: studentName, phone_e164: normalizedPhone ? `+${normalizedPhone}` : null }
        })
      }).catch(() => {})

      toast.success('WhatsApp aberto para envio')
    } catch (e) {
      toast.error('Falha ao abrir WhatsApp')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-visible">
        <DialogHeader className="space-y-3">
          <DialogTitle className="flex items-center gap-3 text-xl font-semibold">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
              <Send className="h-5 w-5 text-blue-600" />
            </div>
            Gerar Anamnese
          </DialogTitle>
          <DialogDescription className="text-base text-muted-foreground">
            Envie ao aluno um link seguro para responder a anamnese personalizada.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 overflow-y-auto max-h-[calc(90vh-140px)] pr-2">
          {/* Identifica   £o do Aluno */}
          <div className="bg-card border rounded-lg p-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-foreground">Identifica   £o do Aluno</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Confirme o aluno para esta anamnese
                </p>
              </div>
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <User className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium text-foreground">{studentName}</p>
                  <p className="text-sm text-muted-foreground">Aluno selecionado</p>
                </div>
              </div>
            </div>
          </div>

          {/* Configura   £o do Envio */}
          <div className="bg-card border rounded-lg p-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-foreground">Configura   £o do Envio</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Escolha como a anamnese ser ¡ enviada ao aluno
                </p>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Destino do envio</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <label className="flex items-center space-x-3 p-4 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                      <input
                        type="radio"
                        name="destino"
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                        checked={destination === 'group'}
                        onChange={() => setDestination('group')}
                      />
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-blue-600" />
                        <div>
                          <p className="font-medium text-sm">Grupo WhatsApp</p>
                          <p className="text-xs text-muted-foreground">Recomendado</p>
                        </div>
                      </div>
                    </label>
                    <label className="flex items-center space-x-3 p-4 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                      <input
                        type="radio"
                        name="destino"
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                        checked={destination === 'student'}
                        onChange={() => setDestination('student')}
                      />
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-green-600" />
                        <div>
                          <p className="font-medium text-sm">Telefone do Aluno</p>
                          <p className="text-xs text-muted-foreground">Direto</p>
                        </div>
                      </div>
                    </label>
                  </div>
                </div>

                {destination === 'group' ? (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Grupo do WhatsApp *</Label>
                    <Select
                      value={groupId || (groups.length ? groupId : 'empty')}
                      onValueChange={(v: string) => setGroupId(v === 'empty' ? '' : v)}
                      disabled={!groups.length}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={groups.length ? 'Selecione um grupo' : 'Nenhum grupo vinculado'} />
                      </SelectTrigger>
                      <SelectContent>
                        {groups.length === 0 ? (
                          <SelectItem value="empty" disabled>Nenhum grupo encontrado</SelectItem>
                        ) : (
                          groups.map((g) => (
                            <SelectItem key={g.id} value={g.id}>
                              {g.name}{g.is_primary ? ' [Padr £o]' : ''}{g.external_id ? `   ” ${g.external_id}` : ''}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <div className="text-xs text-muted-foreground">
                      N £o encontrou? <button type="button" className="text-blue-600 underline hover:text-blue-700" onClick={() => toast.info('Abra o Criar Grupo no menu Processos     WhatsApp.')}>Criar grupo</button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-sm font-medium flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      Telefone para WhatsApp *
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="11999999999"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      disabled={loadingSend || loadingGenerate}
                    />
                    <p className="text-xs text-muted-foreground">Ser ¡ normalizado automaticamente para formato E.164</p>
                    {entities.filter(e => e.type === 'CONTACT').length > 0 && (
                      <div className="text-xs text-muted-foreground">
                        Contatos salvos:
                        <div className="mt-1 flex flex-wrap gap-2">
                          {entities.filter(e => e.type==='CONTACT').map((c) => (
                            <button key={c.id} type="button" className="px-2 py-1 rounded border hover:bg-muted/50 transition-colors" onClick={() => setPhone((c.phone_e164 || '').replace(/\D/g,''))}>
                              {c.name} {(c.phone_e164 || '').replace('+','')}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Personaliza   £o da Anamnese */}
          <div className="bg-card border rounded-lg p-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-foreground">Personaliza   £o da Anamnese</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Configure o servi  o e personalize a mensagem de convite
                </p>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="service" className="text-sm font-medium flex items-center gap-1">
                    Servi  o (opcional)
                    <Info className="h-3.5 w-3.5 text-muted-foreground" aria-label="Ajuda" />
                  </Label>
                  <Select
                    value={serviceId || ''}
                    onValueChange={(v: string) => setServiceId(v)}
                    disabled={loadingSend || loadingGenerate}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={services.length ? 'Selecione um servi  o' : 'Carregando servi  os...'} />
                    </SelectTrigger>
                    <SelectContent>
                      {services.map(s => (
                        <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">Personaliza o texto do convite e o cabe  alho do PDF.</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message" className="text-sm font-medium">Mensagem personalizada (opcional)</Label>
                  <Textarea
                    id="message"
                    placeholder="Deixe em branco para usar mensagem padr £o"
                    value={customMessage}
                    onChange={(e) => setCustomMessage(e.target.value)}
                    disabled={loadingSend || loadingGenerate}
                    rows={3}
                    className="resize-none"
                  />
                  <p className="text-xs text-muted-foreground">
                    Esta mensagem ser ¡ inclu ­da no convite enviado ao aluno
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Informa   µes do Processo */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 flex-shrink-0 mt-0.5">
                <Info className="h-3.5 w-3.5 text-blue-600" />
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-blue-900">Como funciona o processo:</p>
                <ul className="text-xs text-blue-800 space-y-1">
                  <li>  ¢ <strong>Gerar</strong> cria uma vers £o RASCUNHO com snapshot das perguntas</li>
                  <li>  ¢ <strong>Enviar</strong> manda o link (Grupo ou Aluno) via WhatsApp</li>
                  <li>  ¢ <strong>Aluno responde</strong> no celular (7   10 min) e o PDF    anexado automaticamente</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Bot µes de A   £o */}
          <div className="flex justify-between items-center pt-4 border-t">
            <div>
              <Button
                variant="outline"
                onClick={handleGenerate}
                disabled={loadingGenerate || loadingSend}
                className="flex items-center gap-2"
              >
                {loadingGenerate ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
                Gerar Anamnese
              </Button>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loadingSend || loadingGenerate}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleOpenWhatsApp}
                disabled={loadingSend || loadingGenerate || !generatedLink}
                className="flex items-center gap-2"
              >
                <Send className="h-4 w-4" />
                Enviar via WhatsApp
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}





