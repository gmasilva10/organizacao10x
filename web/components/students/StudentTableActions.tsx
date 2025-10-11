"use client"

import { Button } from "@/components/ui/button"
import { 
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Edit } from "lucide-react"
import Link from "next/link"
import StudentActions from "./shared/StudentActions"

type StudentTableActionsProps = {
  studentId: string
  studentName: string
  onHover?: () => void
  onActionComplete?: () => void
}

export default function StudentTableActions({ studentId, studentName, onHover, onActionComplete }: StudentTableActionsProps) {
  return (
    <div className="flex items-center justify-end gap-0.5">
        {/* Editar */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="sm" asChild className="h-6 w-6 p-0">
              <Link 
                href={`/app/students/${studentId}/edit`}
                onMouseEnter={onHover}
                onFocus={onHover}
              >
                <Edit className="h-3 w-3" />
              </Link>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Editar aluno</p>
          </TooltipContent>
        </Tooltip>

        {/* Anexos e Processos - Componente Compartilhado */}
        <StudentActions 
          studentId={studentId} 
          studentName={studentName} 
          variant="card"
          onActionComplete={onActionComplete}
        />
      </div>
  )
}