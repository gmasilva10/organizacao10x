"use client"

import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { StandardizedCalendar } from "@/components/ui/standardized-calendar"

type Props = {
  open: boolean
  onClose: () => void
  occurrenceId?: number
  currentReminderAt?: string | null
  onSuccess?: () => void
}

export function OccurrenceRescheduleModal({ open, onClose, occurrenceId, currentReminderAt, onSuccess }: Props) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(currentReminderAt ? new Date(currentReminderAt) : undefined)
  const [time, setTime] = useState<string>(currentReminderAt ? new Date(currentReminderAt).toISOString().slice(11,16) : "")
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    setSelectedDate(currentReminderAt ? new Date(currentReminderAt) : undefined)
    setTime(currentReminderAt ? new Date(currentReminderAt).toISOString().slice(11,16) : "")
  }, [currentReminderAt, open])

  async function handleSave() {
    if (!occurrenceId) return
    setSubmitting(true)
    try {
      let iso: string | null = null
      if (selectedDate) {
        const [hh, mm] = (time || "00:00").split(":")
        const d = new Date(selectedDate)
        d.setHours(Number(hh || 0), Number(mm || 0), 0, 0)
        iso = d.toISOString()
      }
      await fetch(`/api/occurrences/${occurrenceId}/reminder`, {
        method:'PATCH',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ reminder_at: iso, reminder_status: 'PENDING' })
      })
      onSuccess?.()
      onClose()
    } finally { setSubmitting(false) }
  }

  return (
    <Dialog open={open} onOpenChange={(v: boolean)=> { if(!v) onClose() }}>
      <DialogContent 
        aria-labelledby="reschedule-title" 
        aria-describedby="reschedule-desc"
        className="sm:max-w-md w-[95vw] max-h-[85vh] overflow-y-auto p-0"
      >
        <DialogHeader>
          <DialogTitle id="reschedule-title">Reagendar lembrete</DialogTitle>
          <DialogDescription id="reschedule-desc">Selecione nova data e hora para o lembrete desta ocorrência.</DialogDescription>
        </DialogHeader>

        <div className="space-y-3 px-6">
          <StandardizedCalendar
            value={selectedDate}
            onChange={setSelectedDate}
            showTime
            timeValue={time}
            onTimeChange={setTime}
            placeholder="Selecione a data"
            className="w-full"
          />
        </div>

        <div className="sticky bottom-0 mt-4 flex justify-end gap-2 border-t bg-background/95 px-6 py-4">
          <Button variant="outline" onClick={onClose} disabled={submitting}>Cancelar</Button>
          <Button onClick={handleSave} disabled={submitting || !selectedDate}>Salvar</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}


