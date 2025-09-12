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
  UserCheck
} from "lucide-react"
import { StudentOccurrenceModal } from "./StudentOccurrenceModal"
import PlaceholderModal from "./modals/PlaceholderModal"
import MatricularModal from "./modals/MatricularModal"
import OnboardingModal from "./modals/OnboardingModal"

type ProcessosDropdownProps = {
  studentId: string
  studentName: string
}

export default function ProcessosDropdown({ studentId, studentName }: ProcessosDropdownProps) {
  const [open, setOpen] = useState(false)
  const [occurrenceModalOpen, setOccurrenceModalOpen] = useState(false)
  const [gerarAnamneseModalOpen, setGerarAnamneseModalOpen] = useState(false)
  const [gerarDiretrizModalOpen, setGerarDiretrizModalOpen] = useState(false)
  const [whatsappModalOpen, setWhatsappModalOpen] = useState(false)
  const [emailModalOpen, setEmailModalOpen] = useState(false)
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
    setWhatsappModalOpen(true)
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
          
          {/* 6. Enviar Mensagem */}
          <DropdownMenuItem onClick={handleWhatsApp} className="flex items-center gap-3">
            <MessageSquare className="h-4 w-4 text-green-600" />
            <span>Enviar Mensagem</span>
          </DropdownMenuItem>
          
          {/* 7. Enviar E-mail */}
          <DropdownMenuItem onClick={handleEmail} className="flex items-center gap-3">
            <Mail className="h-4 w-4 text-blue-600" />
            <span>Enviar E-mail</span>
          </DropdownMenuItem>
          
          {/* Separador 4 */}
          <DropdownMenuSeparator />
          
          {/* 8. Excluir Aluno (último item - vermelho) */}
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

      <PlaceholderModal
        open={whatsappModalOpen}
        onClose={() => setWhatsappModalOpen(false)}
        title="Enviar WhatsApp"
        description="Funcionalidade de WhatsApp em desenvolvimento. Em breve: abertura do WhatsApp Web com número do aluno."
        icon={<MessageSquare className="h-5 w-5 text-green-600" />}
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
    </>
  )
}
