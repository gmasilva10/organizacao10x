import React from 'react'
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { AlertTriangle } from "lucide-react"

interface ConfirmDeleteRuleModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  ruleId: string
  isLoading?: boolean
}

export function ConfirmDeleteRuleModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  ruleId, 
  isLoading = false 
}: ConfirmDeleteRuleModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            Excluir Regra
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Tem certeza que deseja excluir esta regra? Esta ação não pode ser desfeita.
          </p>
          
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-800">
              <strong>ID da Regra:</strong> {ruleId.substring(0, 8)}...
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button 
            type="button" 
            variant="destructive" 
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? 'Excluindo...' : 'Excluir Regra'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}