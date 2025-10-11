"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { AlertTriangle, Loader2 } from "lucide-react"
import { showStudentError, showSuccessToast } from "@/lib/toast-utils"

interface DeleteStudentModalProps {
  open: boolean
  onClose: () => void
  studentId: string
  studentName: string
  onSuccess?: () => void
}

export function DeleteStudentModal({
  open,
  onClose,
  studentId,
  studentName,
  onSuccess
}: DeleteStudentModalProps) {
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async () => {
    setDeleting(true)
    
    try {
      const response = await fetch(`/api/students/${studentId}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Erro ao excluir aluno')
      }

      showSuccessToast(`Aluno "${studentName}" excluído com sucesso!`)
      onSuccess?.()
      onClose()
    } catch (error: any) {
      console.error('Erro ao excluir aluno:', error)
      showStudentError(error.message || 'Erro ao excluir aluno')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
              <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <DialogTitle>Excluir Aluno</DialogTitle>
              <DialogDescription>
                Esta ação não pode ser desfeita
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="rounded-lg bg-muted p-4 space-y-2">
            <p className="text-sm font-medium">
              Tem certeza que deseja excluir o aluno:
            </p>
            <p className="text-sm font-semibold text-foreground">
              {studentName}
            </p>
          </div>

          <div className="space-y-2 text-sm text-muted-foreground">
            <p className="font-medium">⚠️ Consequências da exclusão:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Todos os dados do aluno serão removidos</li>
              <li>Ocorrências relacionadas serão mantidas</li>
              <li>Histórico de relacionamento será mantido</li>
              <li>Esta ação é permanente</li>
            </ul>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={deleting}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={deleting}
            className="bg-red-600 hover:bg-red-700 text-white border-red-600 hover:border-red-700"
            aria-label={`Excluir aluno ${studentName}`}
          >
            {deleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Excluindo...
              </>
            ) : (
              <>
                <AlertTriangle className="mr-2 h-4 w-4" />
                Excluir
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

