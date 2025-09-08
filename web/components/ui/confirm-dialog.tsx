"use client"

import * as React from "react"
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
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export interface ConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  onCancel?: () => void
  title: string
  description?: string
  confirmText?: string
  cancelText?: string
  variant?: "destructive" | "default" | "warning"
  size?: "sm" | "md" | "lg"
}

export function ConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  onCancel,
  title,
  description,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  variant = "default",
  size = "md",
}: ConfirmDialogProps) {
  const handleConfirm = () => {
    onConfirm()
    onOpenChange(false)
  }

  const handleCancel = () => {
    onCancel?.()
    onOpenChange(false)
  }

  const sizeClasses = {
    sm: "max-w-sm",
    md: "max-w-lg", 
    lg: "max-w-2xl"
  }

  const variantClasses = {
    destructive: "border-red-200 bg-red-50",
    default: "border-gray-200 bg-white",
    warning: "border-amber-200 bg-amber-50"
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent 
        className={cn(
          sizeClasses[size],
          variantClasses[variant]
        )}
        data-testid="alert-dialog"
      >
        <AlertDialogHeader>
          <AlertDialogTitle className="text-left">
            {title}
          </AlertDialogTitle>
          {description && (
            <AlertDialogDescription className="text-left">
              {description}
            </AlertDialogDescription>
          )}
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2">
          <AlertDialogCancel onClick={handleCancel} data-testid="alert-dialog-cancel">
            {cancelText}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            className={cn(
              variant === "destructive" && "bg-red-600 hover:bg-red-700",
              variant === "warning" && "bg-amber-600 hover:bg-amber-700"
            )}
            data-testid="alert-dialog-confirm"
          >
            {confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

// Hook para facilitar o uso
export function useConfirmDialog() {
  const [open, setOpen] = React.useState(false)
  const [config, setConfig] = React.useState<Omit<ConfirmDialogProps, 'open' | 'onOpenChange'>>({})

  const confirm = (props: Omit<ConfirmDialogProps, 'open' | 'onOpenChange'>) => {
    setConfig(props)
    setOpen(true)
  }

  const ConfirmDialogComponent = () => (
    <ConfirmDialog
      open={open}
      onOpenChange={setOpen}
      {...config}
    />
  )

  return { confirm, ConfirmDialog: ConfirmDialogComponent }
}