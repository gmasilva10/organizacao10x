"use client"

import { UserCheck } from "lucide-react"
import { ConfirmDialog } from "@/components/ui/ConfirmDialog"
import { showStudentInactivated, showStudentError } from "@/lib/toast-utils"

interface InactivateStudentModalProps {
  open: boolean
  onClose: () => void
  studentId: string
  studentName: string
  onSuccess?: () => void
}

export function InactivateStudentModal({
  open,
  onClose,
  studentId,
  studentName,
  onSuccess
}: InactivateStudentModalProps) {
  const handleInactivate = async () => {
    try {
      const response = await fetch(`/api/students/${studentId}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: 'inactive' })
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Erro ao inativar aluno')
      }

      showStudentInactivated()
      onSuccess?.()
    } catch (error: any) {
      console.error('Erro ao inativar aluno:', error)
      showStudentError(`inativar aluno: ${error.message || 'Erro desconhecido'}`)
      throw error // Re-throw para que o ConfirmDialog mostre o estado de erro
    }
  }

  return (
    <ConfirmDialog
      open={open}
      onClose={onClose}
      onConfirm={handleInactivate}
      title="Inativar Aluno"
      description="O aluno não será excluído, apenas marcado como inativo"
      confirmLabel="Inativar"
      confirmVariant="destructive"
      icon={<UserCheck className="h-5 w-5" />}
      entityName={studentName}
      consequences={[
        'Aluno será marcado como inativo',
        'Dados serão preservados',
        'Pode ser reativado a qualquer momento',
        'Continuará aparecendo nos relatórios'
      ]}
    />
  )
}
