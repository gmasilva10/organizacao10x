"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { X, Construction } from "lucide-react"

interface PlaceholderModalProps {
  open: boolean
  onClose: () => void
  title: string
  description: string
  icon?: React.ReactNode
}

export default function PlaceholderModal({ 
  open, 
  onClose, 
  title,
  description,
  icon
}: PlaceholderModalProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold flex items-center gap-2">
            {icon}
            {title}
          </DialogTitle>
        </DialogHeader>
        
        <div className="py-8">
          <div className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center">
              {icon || <Construction className="h-8 w-8 text-muted-foreground" />}
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-medium">Funcionalidade em Desenvolvimento</h3>
              <p className="text-muted-foreground">{description}</p>
            </div>
            <div className="pt-4">
              <Button onClick={onClose} className="w-full">
                Fechar
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
