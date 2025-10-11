"use client"

import { memo } from "react"
import { Button } from "@/components/ui/button"
import { 
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Edit } from "lucide-react"
import Link from "next/link"
import StudentActions from "./shared/StudentActions"

type StudentCardActionsProps = {
  studentId: string
  studentName: string
  onHover?: () => void
  onActionComplete?: () => void
}

const StudentCardActions = memo(function StudentCardActions({ studentId, studentName, onHover, onActionComplete }: StudentCardActionsProps) {
  return (
    <div className="flex items-center gap-1 pt-1.5 border-t">
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
}, (prevProps, nextProps) => {
  // Re-render apenas se studentId ou studentName mudarem
  return prevProps.studentId === nextProps.studentId &&
         prevProps.studentName === nextProps.studentName
})

export default StudentCardActions