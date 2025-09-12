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
  Target, 
  ChevronDown,
  AlertTriangle,
  FileText,
  Plus,
  Link as LinkIcon
} from "lucide-react"

type ProcessosDropdownProps = {
  studentId: string
}

export default function ProcessosDropdown({ studentId }: ProcessosDropdownProps) {
  const [open, setOpen] = useState(false)

  const handleNovaOcorrencia = () => {
    setOpen(false)
    // Implementar modal de nova ocorrência
    console.log('Abrir modal nova ocorrência para aluno:', studentId)
  }

  const handleGerarAnamnese = () => {
    setOpen(false)
    // Implementar geração de link de anamnese
    console.log('Gerar link anamnese para aluno:', studentId)
  }

  const handleGerarDiretriz = () => {
    setOpen(false)
    // Implementar modal de geração de diretriz
    console.log('Abrir modal gerar diretriz para aluno:', studentId)
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <Target className="h-4 w-4" />
          Processos
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem onClick={handleNovaOcorrencia} className="flex items-center gap-3">
          <div className="w-2 h-2 bg-red-500 rounded-full"></div>
          <Plus className="h-4 w-4 text-red-600" />
          <span>Nova ocorrência</span>
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={handleGerarAnamnese} className="flex items-center gap-3">
          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
          <LinkIcon className="h-4 w-4 text-blue-600" />
          <span>Gerar anamnese</span>
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem onClick={handleGerarDiretriz} className="flex items-center gap-3">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <Target className="h-4 w-4 text-green-600" />
          <span>Gerar diretriz</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
