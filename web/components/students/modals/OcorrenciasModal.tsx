"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"
import StudentOccurrencesList from "../StudentOccurrencesList"

interface OcorrenciasModalProps {
  open: boolean
  onClose: () => void
  studentId: string
  studentName: string
}

export default function OcorrenciasModal({ 
  open, 
  onClose, 
  studentId, 
  studentName 
}: OcorrenciasModalProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-[900px] max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="text-xl font-semibold">
            Ocorrências do Aluno
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto">
          <StudentOccurrencesList 
            studentId={studentId} 
            studentName={studentName} 
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}
