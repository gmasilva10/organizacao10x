"use client"

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { Loader2, Send, Phone, User, Users, Info } from 'lucide-react'

interface AnamneseInviteModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  studentId: string
  studentName: string
  studentPhone?: string
}

export function AnamneseInviteModal({ 
  open, 
  onOpenChange, 
  studentId, 
  studentName, 
  studentPhone 
}: AnamneseInviteModalProps) {
  console.log('🔍 [DEBUG] AnamneseInviteModal renderizado com open:', open)
  const [loadingSend, setLoadingSend] = useState(false)
  const [loadingGenerate, setLoadingGenerate] = useState(false)
  const [phone, setPhone] = useState(studentPhone || '')
  const [serviceId, setServiceId] = useState('')
  const [services, setServices] = useState<{id:string,name:string}[]>([])
  const [customMessage, setCustomMessage] = useState('')
  const [generatedLink, setGeneratedLink] = useState<string | null>(null)
  const [destination, setDestination] = useState<'group' | 'student'>('group')
  const [groups, setGroups] = useState<{ id: string; name: string; external_id?: string; is_primary?: boolean }[]>([])
  const [groupId, setGroupId] = useState<string>('')
  const [entities, setEntities] = useState<any[]>([])

  useEffect(() => {
    // Tentativa de buscar grupos do aluno; se a API ainda não existir, falha silenciosa
    const fetchGroups = async () => {
      try {
        // Em Next.js (App Router), a pasta /app não entra na URL pública. Usar sempre /api/*
        const res = await fetch(`/api/relacionamento/whatsapp/groups?studentId=${studentId}`)
        if (res.ok) {
          const data = await res.json()
          const list = Array.isArray(data?.groups) ? data.groups : []
          setGroups(list)
          const primary = list.find((g: any) => g.is_primary)
          if (primary) setGroupId(primary.id)
        }
      } catch (e) {
        // silencioso: UI continua permitindo envio para aluno
      }
    }
    const fetchEntities = async () => {
      try {
        const res = await fetch(`/api/relacionamento/whatsapp/entities?studentId=${studentId}`)
        if (res.ok) {
          const data = await res.json()
          setEntities(Array.isArray(data?.entities) ? data.entities : [])
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
    // Serviço é opcional neste fluxo (iremos gravar null se ausente)
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
      console.error('Erro ao gerar versão:', error)
      toast.error(error instanceof Error ? error.message : 'Erro ao gerar versão')
    } finally {
      setLoadingGenerate(false)
    }
  }

  const handleOpenWhatsApp = async () => {
    try {
      const link = generatedLink
      if (!link) { toast.error('Gere a anamnese antes de enviar'); return }
      // Construir texto
      // Mensagem com link em linha própria para maximizar conversão em hyperlink
      const text = customMessage?.trim().length
        ? `${customMessage}\n\n${link}`
        : `Olá! Para personalizarmos seu treino, responda sua Anamnese:\n${link}\nLeva ~7–10 min. Obrigado!`

      // Abrir wa.me - normalizar telefone para E.164
      const phoneDigits = (phone || '').replace(/\D/g, '')
      let normalizedPhone = phoneDigits
      
      // Se tem 11 dígitos (DDD + número), adicionar +55
      if (phoneDigits.length === 11) {
        normalizedPhone = `55${phoneDigits}`
      }
      // Se já tem 13 dígitos (55 + DDD + número), usar como está
      else if (phoneDigits.length === 13 && phoneDigits.startsWith('55')) {
        normalizedPhone = phoneDigits
      }
      
      const href = normalizedPhone
        ? `https://api.whatsapp.com/send?phone=${normalizedPhone}&text=${encodeURIComponent(text)}`
        : `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`
      window.open(href, '_blank')

      // Registrar histórico
      await fetch('/api/relacionamento/whatsapp/history', {
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

  const handleSendInvite = async () => {
    if (destination === 'student' && !phone.trim()) {
      toast.error('Telefone é obrigatório para enviar ao aluno')
      return
    }
    if (destination === 'group' && !groupId) {
      toast.error('Selecione um grupo para enviar')
      return
    }

    try {
      setLoadingSend(true)

      const response = await fetch(`/api/anamnese/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId,
          serviceId: serviceId || null,
          phone: destination === 'student' ? phone.trim() : null,
          destination,
          groupId: destination === 'group' ? groupId : null,
          customMessage: customMessage || null
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao enviar convite')
      }

      toast.success('Convite de anamnese enviado com sucesso!')
      onOpenChange(false)

      // Reset form
      setPhone(studentPhone || '')
      setServiceId('')
      setCustomMessage('')
      setDestination('group')
      setGroupId('')

    } catch (error) {
      console.error('Erro ao enviar convite:', error)
      toast.error(error instanceof Error ? error.message : 'Erro ao enviar convite')
    } finally {
      setLoadingSend(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Gerar Anamnese
          </DialogTitle>
          <DialogDescription>
            Envie ao aluno um link seguro para responder a anamnese.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Informações do aluno */}
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <User className="h-4 w-4" />
              <span className="font-medium">{studentName}</span>
            </div>
          </div>

          {/* Destino do envio */}
          <div className="space-y-2">
            <Label>Destino do envio</Label>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="radio"
                  name="destino"
                  className="accent-blue-600"
                  checked={destination === 'group'}
                  onChange={() => setDestination('group')}
                />
                <span className="flex items-center gap-1">
                  <Users className="h-4 w-4" /> Grupo (padrão)
                </span>
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="radio"
                  name="destino"
                  className="accent-blue-600"
                  checked={destination === 'student'}
                  onChange={() => setDestination('student')}
                />
                <span className="flex items-center gap-1">
                  <Phone className="h-4 w-4" /> Aluno (telefone)
                </span>
              </label>
            </div>
          </div>

          {destination === 'group' ? (
            <div className="space-y-2">
              <Label>Grupo do WhatsApp</Label>
              <Select
                value={groupId || (groups.length ? groupId : 'empty')}
                onValueChange={(v) => setGroupId(v === 'empty' ? '' : v)}
                disabled={!groups.length}
              >
                <SelectTrigger className="bg-white focus:ring-2 focus:ring-blue-500">
                  <SelectValue placeholder={groups.length ? 'Selecione um grupo' : 'Nenhum grupo vinculado'} />
                </SelectTrigger>
                <SelectContent>
                  {groups.length === 0 ? (
                    <SelectItem value="empty" disabled>Nenhum grupo encontrado</SelectItem>
                  ) : (
                    groups.map((g) => (
                      <SelectItem key={g.id} value={g.id}>
                        {g.name}{g.is_primary ? '  [Padrão]' : ''}{g.external_id ? ` — ${g.external_id}` : ''}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <div className="text-xs text-gray-500">Não encontrou? <button type="button" className="text-blue-600 underline" onClick={() => toast.info('Abra o Criar Grupo no menu Processos › WhatsApp.')}>Criar grupo</button></div>
            </div>
          ) : (
            // Telefone do aluno
            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center gap-2">
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
              <p className="text-xs text-gray-500">Será normalizado automaticamente para formato E.164</p>
              {entities.filter(e => e.type === 'CONTACT').length > 0 && (
                <div className="text-xs text-gray-600">
                  Contatos salvos:
                  <div className="mt-1 flex flex-wrap gap-2">
                    {entities.filter(e => e.type==='CONTACT').map((c) => (
                      <button key={c.id} type="button" className="px-2 py-1 rounded border hover:bg-gray-50" onClick={() => setPhone((c.phone_e164 || '').replace(/\D/g,''))}>
                        {c.name} {(c.phone_e164 || '').replace('+','')}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Serviço (opcional) */}
          <div className="space-y-2">
            <Label htmlFor="service" className="flex items-center gap-1">
              Serviço (opcional)
              <Info className="h-3.5 w-3.5 text-gray-500" aria-label="Ajuda" title="Usado para personalizar a mensagem e o protocolo gerado" />
            </Label>
            <Select
              value={serviceId || ''}
              onValueChange={(v) => setServiceId(v)}
              disabled={loadingSend || loadingGenerate}
            >
              <SelectTrigger className="bg-white border border-gray-300 focus:ring-2 focus:ring-blue-500">
                <SelectValue placeholder={services.length ? 'Selecione um serviço' : 'Carregando serviços...'} />
              </SelectTrigger>
              <SelectContent className="bg-white border border-gray-200 shadow-md">
                {services.map(s => (
                  <SelectItem key={s.id} className="text-gray-900" value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500">Personaliza o texto do convite e o cabeçalho do PDF.</p>
          </div>

          {/* Mensagem personalizada (opcional) */}
          <div className="space-y-2">
            <Label htmlFor="message">Mensagem personalizada (opcional)</Label>
            <Textarea
              id="message"
              placeholder="Deixe em branco para usar mensagem padrão"
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              disabled={loadingSend || loadingGenerate}
              rows={3}
            />
          </div>

          {/* Aviso */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-800"><strong>O que acontece:</strong></p>
            <ul className="text-xs text-blue-700 mt-1 space-y-1">
              <li>• Gerar cria uma versão RASCUNHO com snapshot</li>
              <li>• Enviar manda o link (Grupo ou Aluno) via WhatsApp</li>
              <li>• Aluno responde no celular (7–10 min) e o PDF é anexado</li>
            </ul>
          </div>

          {/* Botões */}
          <div className="flex justify-between gap-2 pt-4">
            <div>
              <Button
                variant="secondary"
                onClick={handleGenerate}
                disabled={loadingGenerate || loadingSend}
                className="flex items-center gap-2"
              >
                {loadingGenerate ? (<Loader2 className="h-4 w-4 animate-spin" />) : null}
                Gerar
              </Button>
            </div>
            <div className="flex gap-2">
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
