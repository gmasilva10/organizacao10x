"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"
import StudentAnamnesisList from "../StudentAnamnesisList"

interface AnamneseModalProps {
  open: boolean
  onClose: () => void
  studentId: string
  studentName: string
}

export default function AnamneseModal({ 
  open, 
  onClose, 
  studentId, 
  studentName 
}: AnamneseModalProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-[900px] max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="text-xl font-semibold">
            Anamnese do Aluno
          </DialogTitle>
          <DialogDescription>
            Visualize e gerencie as anamneses do aluno {studentName}.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto">
          <StudentAnamnesisList 
            studentId={studentId} 
            studentName={studentName} 
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}
