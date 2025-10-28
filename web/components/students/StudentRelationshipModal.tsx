/**
 * GATE A-10.2.1 - Modal de Relacionamento por Aluno
 * 
 * Funcionalidades:
 * - Modal XL responsivo com Timeline do aluno
 * - Botão "Nova Mensagem" que abre MessageComposer
 * - Reutiliza componentes do módulo Relacionamento
 * - Atualização imediata da Timeline e Kanban
 */

'use client'

import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { MessageSquare, Plus } from 'lucide-react'
import RelationshipTimeline from '../relationship/RelationshipTimeline'
import MessageComposer from '../relationship/MessageComposer'

interface StudentRelationshipModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  studentId: string
  studentName: string
  studentPhone?: string
  onSuccess?: () => void
}

export default function StudentRelationshipModal({
  open,
  onOpenChange,
  studentId,
  studentName,
  studentPhone,
  onSuccess
}: StudentRelationshipModalProps) {
  const [messageComposerOpen, setMessageComposerOpen] = useState(false)

  const handleNewMessage = () => {
    setMessageComposerOpen(true)
  }

  const handleMessageSuccess = () => {
    setMessageComposerOpen(false)
    onSuccess?.()
  }

  const handleClose = () => {
    onOpenChange(false)
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-visible">
          <DialogHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <MessageSquare className="h-6 w-6 text-orange-600" />
                <div>
                  <DialogTitle className="text-xl font-semibold">
                    Relacionamento do Aluno
                  </DialogTitle>
                  <DialogDescription className="text-sm text-muted-foreground mt-1">
                    {studentName} - Visualize o histórico de comunicação e crie novas mensagens.
                  </DialogDescription>
                </div>
              </div>
              <Button 
                onClick={handleNewMessage}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Nova Mensagem
              </Button>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-hidden">
            <div className="h-full overflow-y-auto">
              <RelationshipTimeline 
                studentId={studentId}
                studentName={studentName}
              />
            </div>
          </div>

          <DialogFooter className="pt-4 border-t">
            <Button variant="outline" onClick={handleClose}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MessageComposer Modal */}
      <MessageComposer
        open={messageComposerOpen}
        onOpenChange={setMessageComposerOpen}
        studentId={studentId}
        studentName={studentName}
        studentPhone={studentPhone}
        onSuccess={handleMessageSuccess}
      />
    </>
  )
}
