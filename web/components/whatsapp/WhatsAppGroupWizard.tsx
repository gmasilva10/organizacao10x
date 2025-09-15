/**
 * GATE A-10.2.5 - Wizard para criar grupo WhatsApp assistido
 * 
 * 3 etapas: Participantes → Nome/Mensagem → Executar
 * A11y completo, deduplicação, ações de copiar
 */

"use client"

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { 
  Users, 
  MessageSquare, 
  CheckCircle, 
  Copy, 
  Download, 
  ExternalLink,
  AlertCircle,
  UserX
} from 'lucide-react'
import { toast } from 'sonner'
import { normalizeToE164, isValidForWhatsApp } from '@/utils/phone'
import { buildMultipleVCards, downloadVCard } from '@/utils/vcard'
import { openWhatsAppWeb, copyToClipboard } from '@/utils/wa'
import { 
  DEFAULT_GROUP_NAME_TEMPLATE, 
  DEFAULT_GROUP_WELCOME, 
  WHATSAPP_ACTIONS, 
  WHATSAPP_CHANNEL, 
  WHATSAPP_ORIGIN 
} from '@/constants/whatsapp'

interface WhatsAppGroupWizardProps {
  open: boolean
  onClose: () => void
  student: {
    id: string
    name: string
    phone?: string | null
  }
  responsibles?: Array<{
    id: string
    name: string
    phone?: string | null
    email?: string | null
    roles: string[]
    is_active: boolean
  }>
  organizationName?: string
}

interface Participant {
  id: string
  name: string
  phone?: string | null
  email?: string | null
  type: 'student' | 'professional'
  roles?: string[]
  selected: boolean
  hasValidPhone: boolean
  phoneE164?: string
}

export function WhatsAppGroupWizard({ 
  open, 
  onClose, 
  student, 
  responsibles = [], 
  organizationName = 'Personal Global' 
}: WhatsAppGroupWizardProps) {
  const [step, setStep] = useState(1)
  const [participants, setParticipants] = useState<Participant[]>([])
  const [groupName, setGroupName] = useState('')
  const [welcomeMessage, setWelcomeMessage] = useState('')
  const [consentGiven, setConsentGiven] = useState(false)
  const [loading, setLoading] = useState(false)

  // Inicializar participantes
  useEffect(() => {
    if (!open) return

    const studentParticipant: Participant = {
      id: student.id,
      name: student.name,
      phone: student.phone,
      type: 'student',
      selected: true, // Sempre selecionado
      hasValidPhone: false,
      phoneE164: undefined
    }

    // Normalizar telefone do aluno
    if (student.phone) {
      const phoneResult = normalizeToE164(student.phone)
      if (phoneResult.e164 && isValidForWhatsApp(phoneResult.e164)) {
        studentParticipant.hasValidPhone = true
        studentParticipant.phoneE164 = phoneResult.e164
      }
    }

    // Processar responsáveis ativos
    const activeResponsibles = responsibles.filter(r => r.is_active)
    const professionalParticipants: Participant[] = activeResponsibles.map(prof => {
      const participant: Participant = {
        id: prof.id,
        name: prof.name,
        phone: prof.phone,
        email: prof.email,
        type: 'professional',
        roles: prof.roles,
        selected: false,
        hasValidPhone: false,
        phoneE164: undefined
      }

      // Normalizar telefone do profissional
      if (prof.phone) {
        const phoneResult = normalizeToE164(prof.phone)
        if (phoneResult.e164 && isValidForWhatsApp(phoneResult.e164)) {
          participant.hasValidPhone = true
          participant.phoneE164 = phoneResult.e164
        }
      }

      return participant
    })

    // Deduplicar por número de telefone
    const uniqueParticipants = [studentParticipant]
    const phoneNumbers = new Set([studentParticipant.phoneE164].filter(Boolean))

    for (const prof of professionalParticipants) {
      if (prof.phoneE164 && !phoneNumbers.has(prof.phoneE164)) {
        phoneNumbers.add(prof.phoneE164)
        uniqueParticipants.push(prof)
      } else if (!prof.phoneE164) {
        // Incluir mesmo sem telefone (desabilitado)
        uniqueParticipants.push(prof)
      }
    }

    setParticipants(uniqueParticipants)

    // Gerar nome sugerido do grupo
    const firstName = student.name.split(' ')[0] || 'Aluno'
    const lastName = student.name.split(' ').slice(1).join(' ') || ''
    const initialLastName = lastName.charAt(0) || ''
    const suggestedName = DEFAULT_GROUP_NAME_TEMPLATE
      .replace('{OrgCurta}', organizationName)
      .replace('{PrimeiroNome}', firstName)
      .replace('{InicialSobrenome}', initialLastName)
      .substring(0, 30) // Limitar a ~30 chars

    setGroupName(suggestedName)

    // Gerar mensagem de boas-vindas
    const welcomeMsg = DEFAULT_GROUP_WELCOME.replace('{PrimeiroNome}', firstName)
    setWelcomeMessage(welcomeMsg)

  }, [open, student, responsibles, organizationName])

  const selectedParticipants = participants.filter(p => p.selected && p.hasValidPhone)
  const participantsWithoutPhone = participants.filter(p => !p.hasValidPhone)

  const handleParticipantToggle = (participantId: string) => {
    setParticipants(prev => 
      prev.map(p => 
        p.id === participantId && p.type !== 'student' // Aluno sempre selecionado
          ? { ...p, selected: !p.selected }
          : p
      )
    )
  }

  const handleSelectAll = () => {
    setParticipants(prev => 
      prev.map(p => ({ 
        ...p, 
        selected: p.hasValidPhone // Selecionar apenas os com telefone válido
      }))
    )
  }

  const handleCopyNumbers = async () => {
    const numbers = selectedParticipants
      .map(p => p.phoneE164)
      .filter(Boolean)
      .join('\n')

    if (!numbers) {
      toast.error('Nenhum número selecionado')
      return
    }

    try {
      await copyToClipboard(numbers)
      toast.success('Números copiados para área de transferência')
    } catch (error) {
      toast.error('Erro ao copiar números')
    }
  }

  const handleGenerateVCards = () => {
    const vcards = buildMultipleVCards(
      selectedParticipants.map(p => ({
        student: p.type === 'student' ? { id: p.id, name: p.name, email: p.email } : undefined,
        professional: p.type === 'professional' ? { id: p.id, name: p.name, email: p.email } : undefined,
        phone: p.phoneE164!,
        type: p.type
      }))
    )

    vcards.forEach(vcard => downloadVCard(vcard))
    toast.success(`${vcards.length} vCard(s) gerado(s)`)
  }

  const handleCopyGroupName = async () => {
    try {
      await copyToClipboard(groupName)
      toast.success('Nome do grupo copiado')
    } catch (error) {
      toast.error('Erro ao copiar nome')
    }
  }

  const handleCopyWelcomeMessage = async () => {
    try {
      await copyToClipboard(welcomeMessage)
      toast.success('Mensagem copiada')
    } catch (error) {
      toast.error('Erro ao copiar mensagem')
    }
  }

  const handleOpenWhatsApp = async () => {
    if (!consentGiven) {
      toast.error('Você deve concordar com os termos para continuar')
      return
    }

    setLoading(true)
    try {
      await openWhatsAppWeb()
      toast.success('WhatsApp Web aberto')
    } catch (error) {
      toast.error('Erro ao abrir WhatsApp Web')
    } finally {
      setLoading(false)
    }
  }

  const handleComplete = async () => {
    setLoading(true)
    try {
      // Log: whatsapp_group_assisted_completed
      await logRelationshipAction({
        action: WHATSAPP_ACTIONS.WHATSAPP_GROUP_ASSISTED_COMPLETED,
        student_id: student.id,
        meta: {
          participants_count: selectedParticipants.length,
          participant_ids: selectedParticipants.map(p => p.id),
          missing_phones_count: participantsWithoutPhone.length,
          group_name: groupName,
          origin: WHATSAPP_ORIGIN
        }
      })

      toast.success('Processo de criação de grupo concluído')
      onClose()
    } catch (error) {
      console.error('Erro ao finalizar processo:', error)
      toast.error('Erro ao finalizar processo')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setStep(1)
    setConsentGiven(false)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="w-[95vw] sm:max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-green-600" />
            Criar Grupo WhatsApp (Assistido)
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-1">
          {/* Indicador de etapas */}
          <div className="flex items-center justify-center mb-6">
            <div className="flex items-center space-x-4">
              {[1, 2, 3].map((stepNumber) => (
                <div key={stepNumber} className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    step >= stepNumber 
                      ? 'bg-green-600 text-white' 
                      : 'bg-gray-200 text-gray-600'
                  }`}>
                    {stepNumber}
                  </div>
                  {stepNumber < 3 && (
                    <div className={`w-8 h-0.5 mx-2 ${
                      step > stepNumber ? 'bg-green-600' : 'bg-gray-200'
                    }`} />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Etapa 1: Participantes */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium mb-2">Participantes do Grupo</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Selecione os participantes que serão incluídos no grupo. 
                  O aluno sempre estará incluído.
                </p>
              </div>

              {/* Ações rápidas */}
              <div className="flex gap-2 mb-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSelectAll}
                  disabled={selectedParticipants.length === participants.filter(p => p.hasValidPhone).length}
                >
                  Selecionar todos
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyNumbers}
                  disabled={selectedParticipants.length === 0}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copiar números
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleGenerateVCards}
                  disabled={selectedParticipants.length === 0}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Gerar vCards
                </Button>
              </div>

              {/* Lista de participantes */}
              <div className="space-y-2">
                {participants.map((participant) => (
                  <Card key={participant.id} className="p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Checkbox
                          id={`participant-${participant.id}`}
                          checked={participant.selected}
                          onCheckedChange={() => handleParticipantToggle(participant.id)}
                          disabled={participant.type === 'student' || !participant.hasValidPhone}
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{participant.name}</span>
                            {participant.type === 'student' && (
                              <Badge variant="secondary" className="text-xs">Aluno</Badge>
                            )}
                            {participant.roles && participant.roles.length > 0 && (
                              <Badge variant="outline" className="text-xs">
                                {participant.roles.join(', ')}
                              </Badge>
                            )}
                            {!participant.hasValidPhone && (
                              <Badge variant="destructive" className="text-xs">
                                <UserX className="h-3 w-3 mr-1" />
                                sem telefone
                              </Badge>
                            )}
                          </div>
                          {participant.phoneE164 && (
                            <p className="text-sm text-gray-600">{participant.phoneE164}</p>
                          )}
                        </div>
                      </div>
                      {!participant.hasValidPhone && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(`/app/team?edit=${participant.id}`, '_blank')}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </Card>
                ))}
              </div>

              {participantsWithoutPhone.length > 0 && (
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium text-yellow-800">
                        {participantsWithoutPhone.length} participante(s) sem telefone
                      </p>
                      <p className="text-yellow-700">
                        Edite os profissionais para adicionar telefone ou gere vCards para importar no WhatsApp.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Etapa 2: Nome e Mensagem */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-2">Nome do Grupo e Mensagem</h3>
                <p className="text-sm text-gray-600">
                  Configure o nome do grupo e a mensagem de boas-vindas.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="group-name">Nome do Grupo</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      id="group-name"
                      value={groupName}
                      onChange={(e) => setGroupName(e.target.value.substring(0, 30))}
                      placeholder="Nome do grupo"
                      maxLength={30}
                    />
                    <Button variant="outline" size="sm" onClick={handleCopyGroupName}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {groupName.length}/30 caracteres
                  </p>
                </div>

                <div>
                  <Label htmlFor="welcome-message">Mensagem de Boas-vindas</Label>
                  <div className="mt-1">
                    <Textarea
                      id="welcome-message"
                      value={welcomeMessage}
                      onChange={(e) => setWelcomeMessage(e.target.value)}
                      placeholder="Mensagem de boas-vindas"
                      rows={4}
                      className="resize-none"
                    />
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mt-2"
                      onClick={handleCopyWelcomeMessage}
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copiar mensagem
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Etapa 3: Executar */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-2">Finalizar Criação do Grupo</h3>
                <p className="text-sm text-gray-600">
                  Abra o WhatsApp Web e siga as instruções para criar o grupo.
                </p>
              </div>

              <div className="space-y-4">
                {/* Resumo */}
                <Card className="p-4">
                  <h4 className="font-medium mb-2">Resumo do Grupo</h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-medium">Nome:</span> {groupName}
                    </div>
                    <div>
                      <span className="font-medium">Participantes:</span> {selectedParticipants.length}
                    </div>
                    <div>
                      <span className="font-medium">Mensagem:</span> {welcomeMessage.substring(0, 50)}...
                    </div>
                  </div>
                </Card>

                {/* Instruções */}
                <Card className="p-4 bg-blue-50 border-blue-200">
                  <h4 className="font-medium text-blue-900 mb-2">Instruções</h4>
                  <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                    <li>Clique em "Abrir WhatsApp Web"</li>
                    <li>No WhatsApp Web, clique em "Novo grupo"</li>
                    <li>Adicione os participantes (os contatos devem existir)</li>
                    <li>Cole o nome do grupo: <code className="bg-blue-100 px-1 rounded">{groupName}</code></li>
                    <li>Envie a mensagem de boas-vindas</li>
                    <li>Clique em "Concluí" quando terminar</li>
                  </ol>
                </Card>

                {/* Consentimento */}
                <div className="flex items-start space-x-2">
                  <Checkbox
                    id="consent"
                    checked={consentGiven}
                    onCheckedChange={(checked) => setConsentGiven(checked as boolean)}
                  />
                  <Label htmlFor="consent" className="text-sm">
                    Estou ciente de que a criação do grupo será concluída no WhatsApp Web.
                  </Label>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="sticky bottom-0 border-t bg-background/95 px-6 py-4 -mx-6">
          <div className="flex justify-between w-full">
            <Button
              variant="outline"
              onClick={step > 1 ? () => setStep(step - 1) : handleClose}
            >
              {step > 1 ? 'Voltar' : 'Cancelar'}
            </Button>
            
            <div className="flex gap-2">
              {step === 1 && (
                <Button
                  onClick={() => setStep(2)}
                  disabled={selectedParticipants.length === 0}
                >
                  Próximo
                </Button>
              )}
              
              {step === 2 && (
                <Button onClick={() => setStep(3)}>
                  Próximo
                </Button>
              )}
              
              {step === 3 && (
                <>
                  <Button
                    variant="outline"
                    onClick={handleOpenWhatsApp}
                    disabled={!consentGiven || loading}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    {loading ? 'Abrindo...' : 'Abrir WhatsApp Web'}
                  </Button>
                  <Button
                    onClick={handleComplete}
                    disabled={loading}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    {loading ? 'Finalizando...' : 'Concluí'}
                  </Button>
                </>
              )}
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/**
 * Log de ação de relacionamento
 */
async function logRelationshipAction(data: {
  action: string
  student_id: string
  meta: Record<string, any>
}) {
  try {
    const response = await fetch('/api/relationship/logs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...data,
        channel: WHATSAPP_CHANNEL,
        template_code: null,
        task_id: null
      })
    })

    if (!response.ok) {
      console.error('Erro ao registrar log:', await response.text())
    }
  } catch (error) {
    console.error('Erro ao registrar log de relacionamento:', error)
  }
}
