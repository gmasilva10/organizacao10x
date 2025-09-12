import { toast } from "sonner"

export const showSuccessToast = (message: string) => {
  toast.success(message, {
    duration: 4000,
    position: "top-right",
    className: "bg-green-50 border-green-200 text-green-800"
  })
}

export const showErrorToast = (message: string) => {
  toast.error(message, {
    duration: 5000,
    position: "top-right",
    className: "bg-red-50 border-red-200 text-red-800"
  })
}

export const showWarningToast = (message: string) => {
  toast.warning(message, {
    duration: 4000,
    position: "top-right",
    className: "bg-yellow-50 border-yellow-200 text-yellow-800"
  })
}

export const showInfoToast = (message: string) => {
  toast.info(message, {
    duration: 3000,
    position: "top-right",
    className: "bg-blue-50 border-blue-200 text-blue-800"
  })
}

// Toasts específicos para operações de alunos
export const showStudentSaved = () => showSuccessToast("Aluno salvo com sucesso!")
export const showStudentUpdated = () => showSuccessToast("Aluno atualizado com sucesso!")
export const showStudentInactivated = () => showSuccessToast("Aluno inativado com sucesso!")
export const showStudentDeleted = () => showSuccessToast("Aluno excluído com sucesso!")
export const showStudentError = (operation: string) => showErrorToast(`Erro ao ${operation} aluno`)
export const showStudentNotFound = () => showWarningToast("Aluno não encontrado")
export const showNoStudentsFound = () => showInfoToast("Nenhum aluno encontrado")
export const showNoOccurrencesFound = () => showInfoToast("Nenhuma ocorrência registrada")
export const showNoAnamnesisFound = () => showInfoToast("Nenhuma anamnese encontrada")
