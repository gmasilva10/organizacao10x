"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle, 
  AlertDialogTrigger 
} from "@/components/ui/alert-dialog"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"
import { MoreHorizontal, UserX, Trash2, Loader2 } from "lucide-react"
import { showStudentInactivated, showStudentDeleted, showStudentError } from "@/lib/toast-utils"

interface StudentActionsProps {
  studentId: string
  studentName: string
  onInactivate?: () => void
  onDelete?: () => void
}

export default function StudentActions({ 
  studentId, 
  studentName, 
  onInactivate, 
  onDelete 
}: StudentActionsProps) {
  const [inactivating, setInactivating] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const handleInactivate = async () => {
    setInactivating(true)
    try {
      // Implementar lógica de inativação
      await new Promise(resolve => setTimeout(resolve, 1000)) // Simulação
      showStudentInactivated()
      onInactivate?.()
    } catch (error) {
      showStudentError("inativar")
    } finally {
      setInactivating(false)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      // Implementar lógica de exclusão
      await new Promise(resolve => setTimeout(resolve, 1000)) // Simulação
      showStudentDeleted()
      onDelete?.()
    } catch (error) {
      showStudentError("excluir")
    } finally {
      setDeleting(false)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
          <MoreHorizontal className="h-3 w-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleInactivate} disabled={inactivating}>
          {inactivating ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <UserX className="h-4 w-4 mr-2" />
          )}
          Inativar Aluno
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <DropdownMenuItem 
              onSelect={(e) => e.preventDefault()}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Excluir Aluno
            </DropdownMenuItem>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir o aluno <strong>{studentName}</strong>?
                <br /><br />
                <span className="text-destructive font-medium">
                  Esta ação não pode ser desfeita e removerá permanentemente todos os dados do aluno.
                </span>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleDelete}
                disabled={deleting}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deleting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Excluindo...
                  </>
                ) : (
                  "Excluir Aluno"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
