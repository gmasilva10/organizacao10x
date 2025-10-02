/**
 * Componente padrão para confirmação de exclusão
 * Garante consistência e acessibilidade em todos os diálogos de exclusão
 */

'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { AlertTriangle, X, Trash2 } from 'lucide-react'

interface ConfirmDeleteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  title: string
  description: string
  itemName?: string
  itemType?: string
  loading?: boolean
  destructive?: boolean
}

export function ConfirmDeleteDialog({
  open,
  onOpenChange,
  onConfirm,
  title,
  description,
  itemName,
  itemType = 'item',
  loading = false,
  destructive = true
}: ConfirmDeleteDialogProps) {
  const handleConfirm = () => {
    onConfirm()
  }

  const handleCancel = () => {
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="sm:max-w-md"
        aria-describedby="delete-dialog-description"
      >
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-6 w-6 text-destructive" />
            </div>
            <div className="flex-1">
              <DialogTitle className="text-lg font-semibold">
                {title}
              </DialogTitle>
            </div>
          </div>
          <DialogDescription 
            id="delete-dialog-description"
            className="text-sm text-muted-foreground mt-2"
          >
            {description}
            {itemName && (
              <span className="block mt-2 font-medium text-foreground">
                "{itemName}"
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-destructive mb-1">
                  Esta ação não pode ser desfeita
                </p>
                <p className="text-muted-foreground">
                  {itemType === 'plano' && 'O plano será permanentemente removido do sistema.'}
                  {itemType === 'aluno' && 'Todos os dados do aluno serão permanentemente removidos.'}
                  {itemType === 'serviço' && 'O serviço será permanentemente removido.'}
                  {itemType === 'item' && 'Este item será permanentemente removido.'}
                </p>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={loading}
            className="flex-1 sm:flex-none"
          >
            <X className="h-4 w-4 mr-2" />
            Cancelar
          </Button>
          <Button
            variant={destructive ? "destructive" : "default"}
            onClick={handleConfirm}
            disabled={loading}
            className="flex-1 sm:flex-none"
          >
            {loading ? (
              <>
                <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Excluindo...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4 mr-2" />
                Excluir
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Hook para facilitar o uso do diálogo
export function useConfirmDelete() {
  const [open, setOpen] = useState(false)
  const [config, setConfig] = useState<{
    title: string
    description: string
    itemName?: string
    itemType?: string
    onConfirm: () => void
  } | null>(null)

  const confirmDelete = (config: {
    title: string
    description: string
    itemName?: string
    itemType?: string
    onConfirm: () => void
  }) => {
    setConfig(config)
    setOpen(true)
  }

  const handleConfirm = () => {
    if (config?.onConfirm) {
      config.onConfirm()
    }
    setOpen(false)
    setConfig(null)
  }

  const ConfirmDialog = () => {
    if (!config) return null

    return (
      <ConfirmDeleteDialog
        open={open}
        onOpenChange={setOpen}
        onConfirm={handleConfirm}
        title={config.title}
        description={config.description}
        itemName={config.itemName}
        itemType={config.itemType}
      />
    )
  }

  return {
    confirmDelete,
    ConfirmDialog
  }
}
