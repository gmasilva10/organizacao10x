"use client"

import { AlertTriangle } from "lucide-react"
import { ConfirmDialog } from "@/components/ui/ConfirmDialog"
import { showStudentError, showStudentDeleted } from "@/lib/toast-utils"

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
  const handleDelete = async () => {
    try {
      const response = await fetch(`/api/students/${studentId}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Erro ao excluir aluno')
      }

      showStudentDeleted()
      onSuccess?.()
    } catch (error: any) {
      console.error('Erro ao excluir aluno:', error)
      showStudentError(`excluir aluno: ${error.message || 'Erro desconhecido'}`)
      throw error // Re-throw para que o ConfirmDialog mostre o estado de erro
    }
  }

  return (
    <ConfirmDialog
      open={open}
      onClose={onClose}
      onConfirm={handleDelete}
      title="Excluir Aluno"
      description="Esta ação não pode ser desfeita"
      confirmLabel="Excluir"
      confirmVariant="destructive"
      icon={<AlertTriangle className="h-5 w-5" />}
      entityName={studentName}
      consequences={[
        'Todos os dados do aluno serão removidos',
        'Ocorrências relacionadas serão mantidas',
        'Histórico de relacionamento será mantido',
        'Esta ação é permanente'
      ]}
    />
  )
}

