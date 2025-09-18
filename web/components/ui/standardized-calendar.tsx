/**
 * Calendário Padronizado - A-10.2.4
 * 
 * Componente de calendário com:
 * - Visual consistente
 * - Acessos de teclado padronizados
 * - Localização pt-BR
 * - Botão OK visível
 * - Enter confirma, Esc fecha
 */

"use client"

import * as React from "react"
import { Calendar } from "@/components/ui/calendar"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar as CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { cn } from "@/lib/utils"

interface StandardizedCalendarProps {
  value?: Date
  onChange?: (date: Date | undefined) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  showTime?: boolean
  timeValue?: string
  onTimeChange?: (time: string) => void
}

export function StandardizedCalendar({
  value,
  onChange,
  placeholder = "Selecionar data",
  disabled = false,
  className,
  showTime = false,
  timeValue = "",
  onTimeChange
}: StandardizedCalendarProps) {
  const [open, setOpen] = React.useState(false)
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(value)

  // Atualizar data selecionada quando value muda
  React.useEffect(() => {
    setSelectedDate(value)
  }, [value])

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date)
  }

  const handleConfirm = () => {
    onChange?.(selectedDate)
    setOpen(false)
  }

  const handleClear = () => {
    setSelectedDate(undefined)
    onChange?.(undefined)
    setOpen(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleConfirm()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      setOpen(false)
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal",
            !selectedDate && "text-muted-foreground",
            className
          )}
          disabled={disabled}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {selectedDate ? (
            showTime && timeValue ? (
              `${format(selectedDate, 'dd/MM/yyyy', { locale: ptBR })} ${timeValue}`
            ) : (
              format(selectedDate, 'dd/MM/yyyy', { locale: ptBR })
            )
          ) : (
            placeholder
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-auto p-0" 
        align="start"
        onKeyDown={handleKeyDown}
      >
        <div className="p-3">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={handleDateSelect}
            initialFocus
            locale={ptBR}
            weekStartsOn={1}
            className="rounded-md border"
            classNames={{
              months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
              month: "space-y-4",
              caption: "flex justify-center pt-1 relative items-center",
              caption_label: "text-sm font-medium",
              nav: "space-x-1 flex items-center",
              nav_button: "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100",
              nav_button_previous: "absolute left-1",
              nav_button_next: "absolute right-1",
              table: "w-full border-collapse space-y-1",
              head_row: "flex",
              head_cell: "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem] flex items-center justify-center",
              row: "flex w-full mt-2",
              cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
              day: "h-9 w-9 p-0 font-normal aria-selected:opacity-100",
              day_range_end: "day-range-end",
              day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
              day_today: "bg-accent text-accent-foreground",
              day_outside: "day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30",
              day_disabled: "text-muted-foreground opacity-50",
              day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
              day_hidden: "invisible",
            }}
          />
          
          {/* Seletor de hora (opcional) */}
          {showTime && (
            <div className="mt-4 pt-4 border-t">
              <label className="text-sm font-medium mb-2 block">Hora</label>
              <input
                type="time"
                value={timeValue}
                onChange={(e) => onTimeChange?.(e.target.value)}
                className="w-full px-3 py-2 border rounded-md text-sm"
                onKeyDown={handleKeyDown}
              />
            </div>
          )}
          
          {/* Botões de ação */}
          <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={handleClear}
            >
              Limpar
            </Button>
            <Button
              size="sm"
              onClick={handleConfirm}
            >
              OK
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
