"use client"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export interface ConfirmDialogViewProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  description?: string
  confirmText?: string
  cancelText?: string
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
  isLoading?: boolean
}

export function ConfirmDialogView({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  variant = "default",
  isLoading = false,
}: ConfirmDialogViewProps) {
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose()
    }
  }

  const confirmClasses = cn(
    buttonVariants({ variant }),
    "min-w-[120px]",
    isLoading && "pointer-events-none opacity-80"
  )

  const cancelClasses = buttonVariants({ variant: "outline" })

  const handleConfirm = () => {
    onConfirm()
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={handleOpenChange}>
      <AlertDialogContent
        role="alertdialog"
        aria-busy={isLoading}
      >
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          {description && (
            <AlertDialogDescription>{description}</AlertDialogDescription>
          )}
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className={cancelClasses}>{cancelText}</AlertDialogCancel>
          <AlertDialogAction
            className={confirmClasses}
            onClick={handleConfirm}
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="inline-flex items-center gap-2" aria-live="polite">
                <span
                  className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
                  aria-hidden="true"
                />
                {confirmText}
              </span>
            ) : (
              confirmText
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export default ConfirmDialogView
