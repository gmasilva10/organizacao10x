"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
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
  Paperclip,
  UserPlus,
  Users
} from "lucide-react"
import { StudentOccurrenceModal } from "../StudentOccurrenceModal"
import StudentRelationshipModal from "../StudentRelationshipModal"
import PlaceholderModal from "../modals/PlaceholderModal"
import { AnamneseInviteModal } from "../modals/AnamneseInviteModal"
import MatricularModal from "../modals/MatricularModal"
import OnboardingModal from "../modals/OnboardingModal"
import MessageComposer from "../../relationship/MessageComposer"
import WhatsAppContactModal from "../modals/WhatsAppContactModal"
import WhatsAppCreateGroupModal from "../modals/WhatsAppCreateGroupModal"

interface StudentActionsProps {
  studentId: string
  studentName: string
  studentPhone?: string // Telefone do aluno
  variant?: 'card' | 'edit' // Variante para card ou página de edição
  onActionComplete?: () => void // Callback para atualizar dados após ação
}

export default function StudentActions({ 
  studentId, 
  studentName, 
  studentPhone,
  variant = 'card',
  onActionComplete 
}: StudentActionsProps) {
  const [open, setOpen] = useState(false)
  const [occurrenceModalOpen, setOccurrenceModalOpen] = useState(false)
  const [relacionamentoModalOpen, setRelacionamentoModalOpen] = useState(false)
  const [gerarAnamneseModalOpen, setGerarAnamneseModalOpen] = useState(false)
  const [gerarDiretrizModalOpen, setGerarDiretrizModalOpen] = useState(false)
  const [whatsappModalOpen, setWhatsappModalOpen] = useState(false)
  const [emailModalOpen, setEmailModalOpen] = useState(false)
  const [matricularModalOpen, setMatricularModalOpen] = useState(false)
  const [onboardingModalOpen, setOnboardingModalOpen] = useState(false)
  const [messageComposerOpen, setMessageComposerOpen] = useState(false)
  const [arquivosModalOpen, setArquivosModalOpen] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [whatsappContactModalOpen, setWhatsappContactModalOpen] = useState(false)
  const [whatsappCreateGroupOpen, setWhatsappCreateGroupOpen] = useState(false)

  const handleAction = (action: () => void) => {
    console.log('🔍 [DEBUG] handleAction chamado')
    setOpen(false)
    console.log('🔍 [DEBUG] setOpen(false) executado')
    action()
    console.log('🔍 [DEBUG] action() executado')
  }

  const handleOccurrenceSaved = () => {
    setOccurrenceModalOpen(false)
    onActionComplete?.()
  }

  const handleMatricularComplete = () => {
    setMatricularModalOpen(false)
    onActionComplete?.()
  }

  const handleOnboardingComplete = () => {
    setOnboardingModalOpen(false)
    onActionComplete?.()
  }

  // Renderização baseada na variante
  if (variant === 'card') {
    return (
      <>
        {/* Ações do Card */}
        <div className="flex items-center gap-1">
          {/* Anexos */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                <Paperclip className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => handleAction(() => setOccurrenceModalOpen(true))}>
                <AlertTriangle className="h-4 w-4 mr-2 text-red-600" />
                Ocorrências
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleAction(() => setRelacionamentoModalOpen(true))}>
                <MessageSquare className="h-4 w-4 mr-2 text-orange-600" />
                Relacionamento
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleAction(() => setGerarAnamneseModalOpen(true))}>
                <FileText className="h-4 w-4 mr-2 text-blue-600" />
                Anamnese
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleAction(() => setGerarDiretrizModalOpen(true))}>
                <Target className="h-4 w-4 mr-2 text-green-600" />
                Diretriz
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleAction(() => setGerarDiretrizModalOpen(true))}>
                <Target className="h-4 w-4 mr-2 text-purple-600" />
                Treino
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleAction(() => setArquivosModalOpen(true))}>
                <Paperclip className="h-4 w-4 mr-2 text-gray-600" />
                Arquivos
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Processos */}
          <DropdownMenu open={open} onOpenChange={setOpen}>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                <Settings className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem onClick={() => handleAction(() => setMatricularModalOpen(true))}>
                <GraduationCap className="h-4 w-4 mr-2 text-purple-600" />
                Matricular Aluno
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleAction(() => setOnboardingModalOpen(true))}>
                <UserCheck className="h-4 w-4 mr-2 text-blue-600" />
                Enviar Onboarding
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleAction(() => setGerarAnamneseModalOpen(true))}>
                <FileText className="h-4 w-4 mr-2 text-blue-600" />
                Gerar Anamnese
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleAction(() => setGerarDiretrizModalOpen(true))}>
                <Target className="h-4 w-4 mr-2 text-green-600" />
                Gerar Diretriz
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleAction(() => setOccurrenceModalOpen(true))}>
                <AlertTriangle className="h-4 w-4 mr-2 text-red-600" />
                Nova Ocorrência
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleAction(() => setMessageComposerOpen(true))}>
                <MessageSquare className="h-4 w-4 mr-2 text-green-600" />
                Enviar Mensagem
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleAction(() => setEmailModalOpen(true))}>
                <Mail className="h-4 w-4 mr-2 text-blue-600" />
                Enviar E-mail
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => handleAction(() => setDeleteModalOpen(true))}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2 text-red-600" />
                Excluir Aluno
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Modais */}
        <StudentOccurrenceModal
          open={occurrenceModalOpen}
          onClose={() => setOccurrenceModalOpen(false)}
          studentId={studentId}
          studentName={studentName}
          mode="create"
          onSaved={handleOccurrenceSaved}
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

        {/* Modal de teste simples */}
        {gerarAnamneseModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
              <h2 className="text-xl font-bold mb-4">Modal de Teste</h2>
              <p>Modal está funcionando!</p>
              <button 
                onClick={() => setGerarAnamneseModalOpen(false)}
                className="mt-4 px-4 py-2 bg-blue-500 text-white rounded"
              >
                Fechar
              </button>
            </div>
          </div>
        )}
        
        <AnamneseInviteModal
          open={gerarAnamneseModalOpen}
          onOpenChange={setGerarAnamneseModalOpen}
          studentId={studentId}
          studentName={studentName}
          studentPhone={studentPhone}
        />

        <PlaceholderModal
          open={gerarDiretrizModalOpen}
          onClose={() => setGerarDiretrizModalOpen(false)}
          title="Gerar Diretriz"
          description="Funcionalidade de geração de diretriz em desenvolvimento."
          icon={<Target className="h-5 w-5 text-green-600" />}
        />

        <PlaceholderModal
          open={whatsappModalOpen}
          onClose={() => setWhatsappModalOpen(false)}
          title="Enviar WhatsApp"
          description="Funcionalidade de WhatsApp em desenvolvimento."
          icon={<MessageSquare className="h-5 w-5 text-green-600" />}
        />

        <PlaceholderModal
          open={emailModalOpen}
          onClose={() => setEmailModalOpen(false)}
          title="Enviar E-mail"
          description="Funcionalidade de e-mail em desenvolvimento."
          icon={<Mail className="h-5 w-5 text-blue-600" />}
        />

        <PlaceholderModal
          open={deleteModalOpen}
          onClose={() => setDeleteModalOpen(false)}
          title="Excluir Aluno"
          description="Funcionalidade de exclusão em desenvolvimento."
          icon={<Trash2 className="h-5 w-5 text-red-600" />}
        />
      </>
    )
  }

  // Variante para página de edição (botões maiores)
  return (
    <>
      <div className="flex items-center gap-2">
        {/* Anexos */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="flex items-center gap-2">
              <Paperclip className="h-4 w-4" />
              Anexos
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={() => handleAction(() => setOccurrenceModalOpen(true))}>
              <AlertTriangle className="h-4 w-4 mr-2 text-red-600" />
              Ocorrências
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleAction(() => setRelacionamentoModalOpen(true))}>
              <MessageSquare className="h-4 w-4 mr-2 text-orange-600" />
              Relacionamento
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => handleAction(() => setGerarAnamneseModalOpen(true))}>
              <FileText className="h-4 w-4 mr-2 text-blue-600" />
              Anamnese
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleAction(() => setGerarDiretrizModalOpen(true))}>
              <Target className="h-4 w-4 mr-2 text-green-600" />
              Diretriz
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleAction(() => setGerarDiretrizModalOpen(true))}>
              <Target className="h-4 w-4 mr-2 text-purple-600" />
              Treino
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => handleAction(() => setArquivosModalOpen(true))}>
              <Paperclip className="h-4 w-4 mr-2 text-gray-600" />
              Arquivos
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Processos */}
        <DropdownMenu open={open} onOpenChange={setOpen}>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Processos
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem onClick={() => handleAction(() => setMatricularModalOpen(true))}>
              <GraduationCap className="h-4 w-4 mr-2 text-purple-600" />
              Matricular Aluno
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleAction(() => setOnboardingModalOpen(true))}>
              <UserCheck className="h-4 w-4 mr-2 text-blue-600" />
              Enviar Onboarding
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => {
              console.log('🔍 [DEBUG] Clicou em Gerar Anamnese, abrindo modal...')
              console.log('🔍 [DEBUG] gerarAnamneseModalOpen antes:', gerarAnamneseModalOpen)
              handleAction(() => {
                console.log('🔍 [DEBUG] setGerarAnamneseModalOpen(true) sendo chamado')
                setGerarAnamneseModalOpen(true)
                console.log('🔍 [DEBUG] setGerarAnamneseModalOpen(true) executado')
              })
            }}>
              <FileText className="h-4 w-4 mr-2 text-blue-600" />
              Gerar Anamnese
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleAction(() => setGerarDiretrizModalOpen(true))}>
              <Target className="h-4 w-4 mr-2 text-green-600" />
              Gerar Diretriz
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => handleAction(() => setOccurrenceModalOpen(true))}>
              <AlertTriangle className="h-4 w-4 mr-2 text-red-600" />
              Nova Ocorrência
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => handleAction(() => setMessageComposerOpen(true))}>
              <MessageSquare className="h-4 w-4 mr-2 text-green-600" />
              Enviar Mensagem
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleAction(() => setEmailModalOpen(true))}>
              <Mail className="h-4 w-4 mr-2 text-blue-600" />
              Enviar E-mail
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                  <MessageSquare className="h-4 w-4 mr-2 text-green-600" />
                  WhatsApp ▸
                </DropdownMenuItem>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="right" align="start" className="w-48">
                <DropdownMenuItem onClick={() => handleAction(() => setWhatsappContactModalOpen(true))}>
                  <UserPlus className="h-4 w-4 mr-2 text-green-600" />
                  Criar contato
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => {
                  console.log('🔍 WhatsApp Create Group clicked!')
                  handleAction(() => setWhatsappCreateGroupOpen(true))
                }}>
                  <Users className="h-4 w-4 mr-2 text-green-600" />
                  Criar grupo
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={() => handleAction(() => setDeleteModalOpen(true))}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2 text-red-600" />
              Excluir Aluno
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Modais (mesmos da variante card) */}
      <StudentOccurrenceModal
        open={occurrenceModalOpen}
        onClose={() => setOccurrenceModalOpen(false)}
        studentId={studentId}
        studentName={studentName}
        mode="create"
        onSaved={handleOccurrenceSaved}
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
        open={gerarDiretrizModalOpen}
        onClose={() => setGerarDiretrizModalOpen(false)}
        title="Gerar Diretriz"
        description="Funcionalidade de geração de diretriz em desenvolvimento."
        icon={<Target className="h-5 w-5 text-green-600" />}
      />

      <PlaceholderModal
        open={whatsappModalOpen}
        onClose={() => setWhatsappModalOpen(false)}
        title="Enviar WhatsApp"
        description="Funcionalidade de WhatsApp em desenvolvimento."
        icon={<MessageSquare className="h-5 w-5 text-green-600" />}
      />

      <PlaceholderModal
        open={emailModalOpen}
        onClose={() => setEmailModalOpen(false)}
        title="Enviar E-mail"
        description="Funcionalidade de e-mail em desenvolvimento."
        icon={<Mail className="h-5 w-5 text-blue-600" />}
      />

      <PlaceholderModal
        open={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Excluir Aluno"
        description="Funcionalidade de exclusão em desenvolvimento."
        icon={<Trash2 className="h-5 w-5 text-red-600" />}
      />

      {/* Relacionamento Modal */}
      <StudentRelationshipModal
        open={relacionamentoModalOpen}
        onOpenChange={setRelacionamentoModalOpen}
        studentId={studentId}
        studentName={studentName}
        studentPhone={studentPhone}
        onSuccess={() => {
          onActionComplete?.()
        }}
      />

      {/* MessageComposer Modal */}
      <MessageComposer
        open={messageComposerOpen}
        onOpenChange={setMessageComposerOpen}
        studentId={studentId}
        studentName={studentName}
        studentPhone={studentPhone}
        onSuccess={() => {
          onActionComplete?.()
        }}
      />

      {/* WhatsApp Contact Modal */}
      <WhatsAppContactModal
        open={whatsappContactModalOpen}
        onClose={() => setWhatsappContactModalOpen(false)}
        studentId={studentId}
        studentName={studentName}
        studentPhone={studentPhone}
      />

      {/* WhatsApp Create Group Modal */}
      { (process.env.NEXT_PUBLIC_WA_CREATE_GROUP_ENABLED === 'true') && (
        <WhatsAppCreateGroupModal
          open={whatsappCreateGroupOpen}
          onOpenChange={setWhatsappCreateGroupOpen}
          studentId={studentId}
          studentName={studentName}
          studentPhone={studentPhone}
        />
      )}

      {/* Arquivos Modal */}
      <PlaceholderModal
        open={arquivosModalOpen}
        onClose={() => setArquivosModalOpen(false)}
        title="Arquivos do Aluno"
        description="Funcionalidade de gerenciamento de arquivos em desenvolvimento."
        icon={<Paperclip className="h-5 w-5 text-gray-600" />}
      />
    </>
  )
}
