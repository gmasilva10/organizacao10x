"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { 
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu"
import { 
  Settings, 
  AlertTriangle,
  FileText,
  Target,
  MessageSquare,
  Mail,
  GraduationCap,
  Plus
} from "lucide-react"
import { StudentOccurrenceModal } from "./StudentOccurrenceModal"
import PlaceholderModal from "./modals/PlaceholderModal"
import { AnamneseInviteModal } from "./modals/AnamneseInviteModal"

type ProcessosIconButtonProps = {
  studentId: string
  studentName: string
}

export default function ProcessosIconButton({ studentId, studentName }: ProcessosIconButtonProps) {
  const [open, setOpen] = useState(false)
  const [occurrenceModalOpen, setOccurrenceModalOpen] = useState(false)
  const [gerarAnamneseModalOpen, setGerarAnamneseModalOpen] = useState(false)
  const [gerarDiretrizModalOpen, setGerarDiretrizModalOpen] = useState(false)
  const [whatsappModalOpen, setWhatsappModalOpen] = useState(false)
  const [emailModalOpen, setEmailModalOpen] = useState(false)
  const [matricularModalOpen, setMatricularModalOpen] = useState(false)

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

  const handleOccurrenceSaved = () => {
    setOccurrenceModalOpen(false)
    console.log('Ocorrência salva com sucesso')
  }

  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenu open={open} onOpenChange={setOpen}>
            <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
          <Settings className="h-3 w-3" />
        </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem onClick={handleNovaOcorrencia} className="flex items-center gap-3">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <span>Nova Ocorrência</span>
              </DropdownMenuItem>
              
              <DropdownMenuItem onClick={handleGerarAnamnese} className="flex items-center gap-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <FileText className="h-4 w-4 text-blue-600" />
                <span>Gerar Anamnese</span>
              </DropdownMenuItem>
              
              <DropdownMenuItem onClick={handleGerarDiretriz} className="flex items-center gap-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <Target className="h-4 w-4 text-green-600" />
                <span>Gerar Diretriz</span>
              </DropdownMenuItem>
              
              <DropdownMenuSeparator />
              
              <DropdownMenuItem onClick={handleWhatsApp} className="flex items-center gap-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <MessageSquare className="h-4 w-4 text-green-600" />
                <span>Enviar WhatsApp</span>
              </DropdownMenuItem>
              
              <DropdownMenuItem onClick={handleEmail} className="flex items-center gap-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <Mail className="h-4 w-4 text-blue-600" />
                <span>Enviar E-mail</span>
              </DropdownMenuItem>
              
              <DropdownMenuItem onClick={handleMatricular} className="flex items-center gap-3">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <GraduationCap className="h-4 w-4 text-purple-600" />
                <span>Matricular Aluno</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </TooltipTrigger>
        <TooltipContent>
          <p>Processos do aluno</p>
        </TooltipContent>
      </Tooltip>

      {/* Modais */}
      <StudentOccurrenceModal
        open={occurrenceModalOpen}
        onClose={() => setOccurrenceModalOpen(false)}
        studentId={studentId}
        studentName={studentName}
        mode="create"
        onSaved={handleOccurrenceSaved}
      />

      <AnamneseInviteModal
        open={gerarAnamneseModalOpen}
        onOpenChange={setGerarAnamneseModalOpen}
        studentId={studentId}
        studentName={studentName}
        studentPhone={undefined}
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

      <PlaceholderModal
        open={matricularModalOpen}
        onClose={() => setMatricularModalOpen(false)}
        title="Matricular Aluno"
        description="Funcionalidade de matrícula em desenvolvimento. Em breve: modal com lista de planos cadastrados."
        icon={<GraduationCap className="h-5 w-5 text-purple-600" />}
      />
    </>
  )
}

