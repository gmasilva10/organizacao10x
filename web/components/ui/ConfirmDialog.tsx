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
import { cn } from "@/lib/utils"

interface ConfirmDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: () => Promise<void>
  title: string
  description: string
  confirmLabel?: string
  confirmVariant?: 'default' | 'destructive'
  icon?: React.ReactNode
  consequences?: string[]
  entityName?: string
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirmar',
  confirmVariant = 'default',
  icon = <AlertTriangle className="h-5 w-5" />,
  consequences = [],
  entityName
}: ConfirmDialogProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleConfirm = async () => {
    setIsLoading(true)
    try {
      await onConfirm()
      onClose()
    } catch (error) {
      console.error('Erro na ação:', error)
      // Toast de erro será mostrado pela função onConfirm
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className={cn(
              "flex h-10 w-10 items-center justify-center rounded-full",
              confirmVariant === 'destructive' 
                ? "bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400" 
                : "bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400"
            )}>
              {icon}
            </div>
            <div>
              <DialogTitle>{title}</DialogTitle>
              <DialogDescription>{description}</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {entityName && (
          <div className="rounded-lg bg-muted p-4">
            <p className="text-sm font-semibold text-foreground">
              {entityName}
            </p>
          </div>
        )}

        {consequences.length > 0 && (
          <div className="space-y-2 text-sm text-muted-foreground">
            <p className="font-medium">⚠️ Consequências:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              {consequences.map((consequence, i) => (
                <li key={i}>{consequence}</li>
              ))}
            </ul>
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button 
            type="button"
            variant={confirmVariant} 
            onClick={handleConfirm} 
            disabled={isLoading}
            className={confirmVariant === 'destructive' ? 
              "bg-red-600 hover:bg-red-700 text-white border-red-600 hover:border-red-700" : 
              undefined
            }
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processando...
              </>
            ) : (
              confirmLabel
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
