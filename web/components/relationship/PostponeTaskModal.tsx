/**
 * PostponeTaskModal - Modal para adiar tarefas com seletor de data
 * Substitui as opções fixas "Adiar 1 dia", "Adiar 3 dias", "Adiar 7 dias"
 * por uma interface mais transparente e flexível
 */

'use client'

import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { CalendarIcon, Clock, Save, X } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { cn } from '@/lib/utils'

interface PostponeTaskModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  taskId: string
  taskTitle: string
  currentDate?: Date
  onPostpone: (taskId: string, newDate: Date) => Promise<void>
}

export function PostponeTaskModal({
  open,
  onOpenChange,
  taskId,
  taskTitle,
  currentDate,
  onPostpone
}: PostponeTaskModalProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    currentDate || new Date()
  )
  const [isLoading, setIsLoading] = useState(false)
  const [calendarOpen, setCalendarOpen] = useState(false)

  const handlePostpone = async () => {
    if (!selectedDate) return

    setIsLoading(true)
    try {
      await onPostpone(taskId, selectedDate)
      onOpenChange(false)
    } catch (error) {
      console.error('Erro ao adiar tarefa:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getSuggestedDates = () => {
    const today = new Date()
    return [
      { label: 'Amanhã', date: new Date(today.getTime() + 24 * 60 * 60 * 1000) },
      { label: 'Em 3 dias', date: new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000) },
      { label: 'Em 1 semana', date: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000) },
      { label: 'Em 2 semanas', date: new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000) },
    ]
  }

  const suggestedDates = getSuggestedDates()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-orange-500" />
            Adiar Tarefa
          </DialogTitle>
          <DialogDescription>
            Selecione uma nova data para enviar a mensagem para{' '}
            <span className="font-medium">{taskTitle}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Data Atual */}
          {currentDate && (
            <div className="p-3 bg-muted rounded-lg">
              <div className="text-sm text-muted-foreground">Data atual:</div>
              <div className="font-medium">
                {format(currentDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </div>
            </div>
          )}

          {/* Sugestões Rápidas */}
          <div>
            <Label className="text-sm font-medium mb-3 block">
              Sugestões rápidas
            </Label>
            <div className="grid grid-cols-2 gap-2">
              {suggestedDates.map((suggestion, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedDate(suggestion.date)}
                  className={cn(
                    "justify-start text-left",
                    selectedDate?.getTime() === suggestion.date.getTime() && 
                    "bg-primary text-primary-foreground"
                  )}
                >
                  <CalendarIcon className="h-4 w-4 mr-2" />
                  {suggestion.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Seletor de Data Personalizada */}
          <div>
            <Label className="text-sm font-medium mb-3 block">
              Ou escolha uma data específica
            </Label>
            <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !selectedDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? (
                    format(selectedDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
                  ) : (
                    "Selecione uma data"
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => {
                    setSelectedDate(date)
                    setCalendarOpen(false)
                  }}
                  disabled={(date) => date < new Date()}
                  initialFocus
                  locale={ptBR}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Preview da Nova Data */}
          {selectedDate && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="text-sm text-green-700 font-medium">
                Nova data de envio:
              </div>
              <div className="text-green-800">
                {format(selectedDate, "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            <X className="h-4 w-4 mr-2" />
            Cancelar
          </Button>
          <Button
            onClick={handlePostpone}
            disabled={!selectedDate || isLoading}
            className="bg-orange-500 hover:bg-orange-600"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Adiando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Adiar Tarefa
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
