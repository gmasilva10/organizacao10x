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
import { Paperclip, ChevronDown, AlertTriangle, FileText, Target, Dumbbell, Eye } from "lucide-react"
import OcorrenciasModal from "./modals/OcorrenciasModal"
import AnamneseModal from "./modals/AnamneseModal"
import PlaceholderModal from "./modals/PlaceholderModal"

type AnexosIconButtonProps = {
  studentId: string
  studentName: string
}

export default function AnexosIconButton({ studentId, studentName }: AnexosIconButtonProps) {
  const [open, setOpen] = useState(false)
  const [ocorrenciasModalOpen, setOcorrenciasModalOpen] = useState(false)
  const [anamneseModalOpen, setAnamneseModalOpen] = useState(false)
  const [diretrizModalOpen, setDiretrizModalOpen] = useState(false)
  const [treinoModalOpen, setTreinoModalOpen] = useState(false)

  const handleOcorrencias = () => {
    setOpen(false)
    setOcorrenciasModalOpen(true)
  }

  const handleAnamnese = () => {
    setOpen(false)
    setAnamneseModalOpen(true)
  }

  const handleDiretriz = () => {
    setOpen(false)
    setDiretrizModalOpen(true)
  }

  const handleTreino = () => {
    setOpen(false)
    setTreinoModalOpen(true)
  }

  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenu open={open} onOpenChange={setOpen}>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                <Paperclip className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem onClick={handleOcorrencias} className="flex items-center gap-3">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <span>Ocorrências</span>
              </DropdownMenuItem>
              
              <DropdownMenuItem onClick={handleAnamnese} className="flex items-center gap-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <FileText className="h-4 w-4 text-blue-600" />
                <span>Anamnese</span>
              </DropdownMenuItem>
              
              <DropdownMenuSeparator />
              
              <DropdownMenuItem onClick={handleDiretriz} className="flex items-center gap-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <Target className="h-4 w-4 text-green-600" />
                <span>Diretriz de Treino</span>
              </DropdownMenuItem>
              
              <DropdownMenuItem onClick={handleTreino} className="flex items-center gap-3">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <Dumbbell className="h-4 w-4 text-purple-600" />
                <span>Treino</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </TooltipTrigger>
        <TooltipContent>
          <p>Anexos do aluno</p>
        </TooltipContent>
      </Tooltip>

      {/* Modais */}
      <OcorrenciasModal
        open={ocorrenciasModalOpen}
        onClose={() => setOcorrenciasModalOpen(false)}
        studentId={studentId}
        studentName={studentName}
      />

      <AnamneseModal
        open={anamneseModalOpen}
        onClose={() => setAnamneseModalOpen(false)}
        studentId={studentId}
        studentName={studentName}
      />

      <PlaceholderModal
        open={diretrizModalOpen}
        onClose={() => setDiretrizModalOpen(false)}
        title="Diretriz de Treino"
        description="Funcionalidade de diretriz de treino em desenvolvimento. Em breve: exibição de diretrizes vinculadas ao aluno."
        icon={<Target className="h-5 w-5 text-green-600" />}
      />

      <PlaceholderModal
        open={treinoModalOpen}
        onClose={() => setTreinoModalOpen(false)}
        title="Treino"
        description="Funcionalidade de treino em desenvolvimento. Em breve: exibição de treinos vinculados ao aluno."
        icon={<Dumbbell className="h-5 w-5 text-purple-600" />}
      />
    </>
  )
}

