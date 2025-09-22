"use client"

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { Loader2, Send, Phone, User } from 'lucide-react'

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
  const [loading, setLoading] = useState(false)
  const [phone, setPhone] = useState(studentPhone || '')
  const [serviceId, setServiceId] = useState('')
  const [customMessage, setCustomMessage] = useState('')

  const handleSendInvite = async () => {
    if (!phone.trim()) {
      toast.error('Telefone é obrigatório')
      return
    }

    try {
      setLoading(true)

      const response = await fetch('/api/anamnese/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId,
          serviceId: serviceId || null,
          phone: phone.trim()
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

    } catch (error) {
      console.error('Erro ao enviar convite:', error)
      toast.error(error instanceof Error ? error.message : 'Erro ao enviar convite')
    } finally {
      setLoading(false)
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

          {/* Telefone */}
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
              disabled={loading}
            />
            <p className="text-xs text-gray-500">
              Será normalizado automaticamente para formato E.164
            </p>
          </div>

          {/* Serviço (opcional) */}
          <div className="space-y-2">
            <Label htmlFor="service">Serviço (opcional)</Label>
            <Select
              value={serviceId || 'default'}
              onValueChange={(v) => setServiceId(v === 'default' ? '' : v)}
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione um serviço" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">Usar serviço padrão</SelectItem>
                <SelectItem value="personal-training">Personal Training</SelectItem>
                <SelectItem value="group-training">Treino em Grupo</SelectItem>
                <SelectItem value="nutrition">Nutrição</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Mensagem personalizada (opcional) */}
          <div className="space-y-2">
            <Label htmlFor="message">Mensagem personalizada (opcional)</Label>
            <Textarea
              id="message"
              placeholder="Deixe em branco para usar mensagem padrão"
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              disabled={loading}
              rows={3}
            />
          </div>

          {/* Aviso */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-800">
              <strong>O que acontece:</strong>
            </p>
            <ul className="text-xs text-blue-700 mt-1 space-y-1">
              <li>• Link seguro será enviado via WhatsApp</li>
              <li>• Aluno responde no celular (7-10 min)</li>
              <li>• PDF será gerado e anexado automaticamente</li>
              <li>• Ocorrência será criada no sistema</li>
            </ul>
          </div>

          {/* Botões */}
          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSendInvite}
              disabled={loading || !phone.trim()}
              className="flex items-center gap-2"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              Enviar por WhatsApp
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
