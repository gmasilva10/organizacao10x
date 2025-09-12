"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { 
  UserCheck, 
  CheckCircle,
  Loader2
} from "lucide-react"
import { showSuccessToast, showErrorToast } from "@/lib/toast-utils"

interface OnboardingModalProps {
  open: boolean
  onClose: () => void
  studentId: string
  studentName: string
}

export default function OnboardingModal({ 
  open, 
  onClose, 
  studentId, 
  studentName 
}: OnboardingModalProps) {
  const [loading, setLoading] = useState(false)

  const handleEnviarOnboarding = async () => {
    setLoading(true)
    
    try {
      // Usar a API existente do sistema - mais simples e confiável
      const response = await fetch('/api/kanban/resync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          student_id: studentId,
          force_create: true // Forçar criação independente do onboard_opt
        })
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || 'Erro ao enviar para onboarding')
      }
      
      showSuccessToast(`${studentName} enviado para onboarding com sucesso!`)
      onClose()
      
    } catch (error) {
      console.error('Erro ao enviar para onboarding:', error)
      showErrorToast(`Erro ao enviar para onboarding: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-blue-600" />
            Enviar para Onboarding
          </DialogTitle>
          <DialogDescription>
            Forçar criação de card na coluna 1 do Kanban
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Informações do Aluno */}
          <div className="bg-muted/50 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <UserCheck className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <div className="font-medium text-foreground">{studentName}</div>
                <div className="text-sm text-muted-foreground">ID: {studentId}</div>
              </div>
            </div>
          </div>

          {/* Ação */}
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground mb-4">
              <strong>FORÇAR</strong> criação de card na <strong>coluna #1</strong> do Kanban.
            </p>
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span>Ação independente do campo "Onboarding"</span>
            </div>
          </div>

          {/* Botões */}
          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleEnviarOnboarding}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <UserCheck className="h-4 w-4 mr-2" />
                  Enviar para Onboarding
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
