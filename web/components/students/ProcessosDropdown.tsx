"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger
} from "@/components/ui/dropdown-menu"
import { 
  Settings, 
  ChevronDown,
  AlertTriangle,
  FileText,
  Target,
  MessageSquare,
  Mail,
  GraduationCap,
  Trash2,
  UserCheck,
  MessageCircle,
  IdCard,
  Users
} from "lucide-react"
import { StudentOccurrenceModal } from "./StudentOccurrenceModal"
import PlaceholderModal from "./modals/PlaceholderModal"
import MatricularModal from "./modals/MatricularModal"
import OnboardingModal from "./modals/OnboardingModal"
import MessageComposer from "../relationship/MessageComposer"
import { WhatsAppGroupWizard } from "../whatsapp/WhatsAppGroupWizard"

type ProcessosDropdownProps = {
  studentId: string
  studentName: string
  studentPhone?: string | null
  studentEmail?: string | null
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

export default function ProcessosDropdown({ 
  studentId, 
  studentName, 
  studentPhone, 
  studentEmail, 
  responsibles = [], 
  organizationName = 'Personal Global' 
}: ProcessosDropdownProps) {
  const [open, setOpen] = useState(false)
  const [occurrenceModalOpen, setOccurrenceModalOpen] = useState(false)
  const [gerarAnamneseModalOpen, setGerarAnamneseModalOpen] = useState(false)
  const [gerarDiretrizModalOpen, setGerarDiretrizModalOpen] = useState(false)
  const [whatsappModalOpen, setWhatsappModalOpen] = useState(false)
  const [whatsappGroupModalOpen, setWhatsappGroupModalOpen] = useState(false)
  const [emailModalOpen, setEmailModalOpen] = useState(false)
  const [messageComposerOpen, setMessageComposerOpen] = useState(false)
  const [matricularModalOpen, setMatricularModalOpen] = useState(false)
  const [onboardingModalOpen, setOnboardingModalOpen] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)

  const handleNovaOcorrencia = () => {
    setOpen(false)
    setOccurrenceModalOpen(true)
  }

  const handleGerarAnamnese = () => {
    setOpen(false)
    setGerarAnamneseModalOpen(true)
  }

  const handleGerarDiretriz = () => {
    setOpen(false)
    setGerarDiretrizModalOpen(true)
  }

  const handleWhatsApp = () => {
    setOpen(false)
    setMessageComposerOpen(true)
  }

  const handleWhatsAppContact = async () => {
    setOpen(false)
    
    // Executar ação direta de criar contato
    try {
      const { normalizeToE164, isValidForWhatsApp } = await import('@/utils/phone')
      const { buildStudentVCard, downloadVCard } = await import('@/utils/vcard')
      const { openWhatsAppChat, canOpenPopups } = await import('@/utils/wa')
      const { DEFAULT_CONTACT_GREETING, WHATSAPP_ACTIONS, WHATSAPP_CHANNEL, WHATSAPP_ORIGIN } = await import('@/constants/whatsapp')
      const { toast } = await import('sonner')

      // 1. Normalizar telefone
      if (!studentPhone) {
        toast.error('Aluno sem telefone válido. Edite o cadastro para continuar.', {
          action: {
            label: 'Editar aluno',
            onClick: () => {
              // TODO: Focar no campo telefone do formulário
              console.log('Focar no campo telefone')
            }
          }
        })
        return
      }

      const phoneResult = normalizeToE164(studentPhone)
      
      if (!phoneResult.e164) {
        toast.error('Telefone inválido. Verifique o formato e tente novamente.', {
          action: {
            label: 'Editar aluno',
            onClick: () => {
              // TODO: Focar no campo telefone do formulário
              console.log('Focar no campo telefone')
            }
          }
        })
        return
      }

      // 2. Validar se é compatível com WhatsApp
      if (!isValidForWhatsApp(phoneResult.e164)) {
        toast.warning('Número pode não funcionar no WhatsApp. Recomendamos celular com 11 dígitos.')
      }

      // 3. Mostrar toast informativo se usou DDD padrão
      if (phoneResult.source === 'org_default_ddd') {
        toast.info('Assumido DDD 11 (org padrão). Edite o aluno para ajustar.')
      }

      // 4. Gerar vCard
      const vcard = buildStudentVCard({
        id: studentId,
        name: studentName,
        email: studentEmail
      }, phoneResult.e164)
      
      // 5. Baixar vCard
      downloadVCard(vcard)

      // 6. Log: contact_vcard_generated
      await logRelationshipAction({
        action: WHATSAPP_ACTIONS.CONTACT_VCARD_GENERATED,
        student_id: studentId,
        meta: {
          phone_e164: phoneResult.masked || '***',
          normalized_phone_source: phoneResult.source,
          origin: WHATSAPP_ORIGIN
        }
      })

      // 7. Verificar se pode abrir popups
      if (!canOpenPopups()) {
        toast.warning('Permita popups para abrir o WhatsApp automaticamente.')
      }

      // 8. Resolver mensagem de saudação
      const firstName = studentName.split(' ')[0] || 'Aluno'
      const greeting = DEFAULT_CONTACT_GREETING.replace('{PrimeiroNome}', firstName)

      // 9. Abrir WhatsApp Web
      await openWhatsAppChat(phoneResult.e164, greeting)

      // 10. Log: whatsapp_chat_opened
      await logRelationshipAction({
        action: WHATSAPP_ACTIONS.WHATSAPP_CHAT_OPENED,
        student_id: studentId,
        meta: {
          phone_e164: phoneResult.masked || '***',
          normalized_phone_source: phoneResult.source,
          origin: WHATSAPP_ORIGIN
        }
      })

      // 11. Toast de sucesso
      toast.success('vCard gerado e chat aberto no WhatsApp')

    } catch (error) {
      console.error('Erro ao criar contato WhatsApp:', error)
      toast.error('Erro ao criar contato. Tente novamente.')
    }
  }

  const handleWhatsAppGroup = () => {
    setOpen(false)
    setWhatsappGroupModalOpen(true)
  }

  const handleEmail = () => {
    setOpen(false)
    setEmailModalOpen(true)
  }

  const handleMatricular = () => {
    setOpen(false)
    setMatricularModalOpen(true)
  }

  const handleOnboarding = () => {
    setOpen(false)
    setOnboardingModalOpen(true)
  }

  const handleDelete = () => {
    setOpen(false)
    setDeleteModalOpen(true)
  }

  const handleOccurrenceSaved = () => {
    setOccurrenceModalOpen(false)
    // Aqui poderia atualizar a lista de ocorrências se necessário
    console.log('Ocorrência salva com sucesso')
  }

  /**
   * Log de ação de relacionamento
   */
  const logRelationshipAction = async (data: {
    action: string
    student_id: string
    meta: Record<string, any>
  }) => {
    try {
      const response = await fetch('/api/relationship/logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          channel: 'whatsapp',
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

  // View padrão - dropdown
  return (
    <>
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Processos
            <ChevronDown className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          {/* 1. Matricular Aluno */}
          <DropdownMenuItem onClick={handleMatricular} className="flex items-center gap-3">
            <GraduationCap className="h-4 w-4 text-purple-600" />
            <span>Matricular Aluno</span>
          </DropdownMenuItem>
          
          {/* 2. Enviar Onboarding */}
          <DropdownMenuItem onClick={handleOnboarding} className="flex items-center gap-3">
            <UserCheck className="h-4 w-4 text-blue-600" />
            <span>Enviar Onboarding</span>
          </DropdownMenuItem>
          
          {/* Separador 1 */}
          <DropdownMenuSeparator />
          
          {/* 3. Gerar Anamnese */}
          <DropdownMenuItem onClick={handleGerarAnamnese} className="flex items-center gap-3">
            <FileText className="h-4 w-4 text-blue-600" />
            <span>Gerar Anamnese</span>
          </DropdownMenuItem>
          
          {/* 4. Gerar Diretriz */}
          <DropdownMenuItem onClick={handleGerarDiretriz} className="flex items-center gap-3">
            <Target className="h-4 w-4 text-green-600" />
            <span>Gerar Diretriz</span>
          </DropdownMenuItem>
          
          {/* Separador 2 */}
          <DropdownMenuSeparator />
          
          {/* 5. Nova Ocorrência */}
          <DropdownMenuItem onClick={handleNovaOcorrencia} className="flex items-center gap-3">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <span>Nova Ocorrência</span>
          </DropdownMenuItem>
          
          {/* Separador 3 */}
          <DropdownMenuSeparator />
          
          {/* 6. WhatsApp */}
          <DropdownMenuSub>
            <DropdownMenuSubTrigger className="flex items-center gap-3">
              <MessageCircle className="h-4 w-4 text-green-600" />
              <span>WhatsApp</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuItem onClick={handleWhatsAppContact} className="flex items-center gap-3">
                <IdCard className="h-4 w-4 text-green-600" />
                <span>Criar contato</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleWhatsAppGroup} className="flex items-center gap-3">
                <Users className="h-4 w-4 text-green-600" />
                <span>Criar grupo (assistido)</span>
              </DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
          
          {/* 7. Enviar Mensagem */}
          <DropdownMenuItem onClick={handleWhatsApp} className="flex items-center gap-3">
            <MessageSquare className="h-4 w-4 text-blue-600" />
            <span>Enviar Mensagem</span>
          </DropdownMenuItem>
          
          {/* 8. Enviar E-mail */}
          <DropdownMenuItem onClick={handleEmail} className="flex items-center gap-3">
            <Mail className="h-4 w-4 text-blue-600" />
            <span>Enviar E-mail</span>
          </DropdownMenuItem>
          
          {/* Separador 4 */}
          <DropdownMenuSeparator />
          
          {/* 9. Excluir Aluno (último item - vermelho) */}
          <DropdownMenuItem 
            onClick={handleDelete} 
            className="flex items-center gap-3 text-destructive focus:text-destructive"
          >
            <Trash2 className="h-4 w-4 text-red-600" />
            <span>Excluir Aluno</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Modal de Nova Ocorrência */}
      <StudentOccurrenceModal
        open={occurrenceModalOpen}
        onClose={() => setOccurrenceModalOpen(false)}
        studentId={studentId}
        studentName={studentName}
        mode="create"
        onSaved={handleOccurrenceSaved}
      />

      {/* Modais de Placeholder */}
      <PlaceholderModal
        open={gerarAnamneseModalOpen}
        onClose={() => setGerarAnamneseModalOpen(false)}
        title="Gerar Anamnese"
        description="Funcionalidade de geração de anamnese em desenvolvimento. Em breve: link tokenizado para preenchimento pelo aluno."
        icon={<FileText className="h-5 w-5 text-blue-600" />}
      />

      <PlaceholderModal
        open={gerarDiretrizModalOpen}
        onClose={() => setGerarDiretrizModalOpen(false)}
        title="Gerar Diretriz"
        description="Funcionalidade de geração de diretriz em desenvolvimento. Em breve: motor de diretrizes baseado na anamnese."
        icon={<Target className="h-5 w-5 text-green-600" />}
      />

      {/* MessageComposer Modal */}
      <MessageComposer
        open={messageComposerOpen}
        onOpenChange={setMessageComposerOpen}
        studentId={studentId}
        studentName={studentName}
        onSuccess={() => {
          console.log('Mensagem enviada com sucesso')
        }}
      />

      <PlaceholderModal
        open={emailModalOpen}
        onClose={() => setEmailModalOpen(false)}
        title="Enviar E-mail"
        description="Funcionalidade de e-mail em desenvolvimento. Em breve: modal com corpo de e-mail e mailto."
        icon={<Mail className="h-5 w-5 text-blue-600" />}
      />

      <MatricularModal
        open={matricularModalOpen}
        onClose={() => setMatricularModalOpen(false)}
        studentId={studentId}
        studentName={studentName}
      />

      <OnboardingModal
        open={onboardingModalOpen}
        onClose={() => setOnboardingModalOpen(false)}
        studentId={studentId}
        studentName={studentName}
      />

      <PlaceholderModal
        open={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Excluir Aluno"
        description="Funcionalidade de exclusão em desenvolvimento. Em breve: modal de confirmação com aviso de impacto e exclusão permanente."
        icon={<Trash2 className="h-5 w-5 text-red-600" />}
      />


      {/* WhatsApp Group Wizard */}
      <WhatsAppGroupWizard
        open={whatsappGroupModalOpen}
        onClose={() => setWhatsappGroupModalOpen(false)}
        student={{
          id: studentId,
          name: studentName,
          phone: studentPhone
        }}
        responsibles={responsibles}
        organizationName={organizationName}
      />
    </>
  )
}
