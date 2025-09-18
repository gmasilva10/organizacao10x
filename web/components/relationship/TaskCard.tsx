/**
 * GATE 10.6.7.HF6 - Card de Tarefa Simplificado
 * 
 * Layout limpo e eficiente para milhares de mensagens
 * - Informações essenciais apenas
 * - Ações em dropdown
 * - Design responsivo
 */

'use client'

import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { 
  MoreHorizontal, 
  Copy, 
  ExternalLink, 
  Send, 
  Clock, 
  X,
  MessageSquare
} from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface Task {
  id: string
  student_id: string
  template_code: string
  anchor: string
  scheduled_for: string
  channel: string
  status: 'pending' | 'due_today' | 'sent' | 'snoozed' | 'skipped' | 'failed'
  payload: {
    message: string
    student_name: string
    student_email: string
    student_phone: string
  }
  variables_used: string[]
  created_by: string
  sent_at?: string
  notes?: string
  occurrence_id?: number
  created_at: string
  updated_at: string
  student: {
    name: string
    phone?: string
  }
}

interface TaskCardProps {
  task: Task
  onCopyMessage: (message: string) => void
  onOpenWhatsApp: (phone: string, message: string) => void
  onUpdateStatus: (taskId: string, status: string) => void
  onSnoozeTask: (taskId: string, days: number) => void
  onDeleteTask: (taskId: string) => void
}

const CHANNEL_ICONS = {
  whatsapp: '📱',
  email: '📧',
  manual: '✋'
}

const STATUS_COLORS = {
  pending: 'bg-yellow-500',
  sent: 'bg-green-500',
  snoozed: 'bg-blue-500',
  skipped: 'bg-gray-500',
  failed: 'bg-red-500'
}

export default function TaskCard({ 
  task, 
  onCopyMessage, 
  onOpenWhatsApp, 
  onUpdateStatus, 
  onSnoozeTask,
  onDeleteTask
}: TaskCardProps) {
  const channelIcon = CHANNEL_ICONS[task.channel] || '📱'
  const statusColor = STATUS_COLORS[task.status] || 'bg-gray-500'
  
  return (
    <Card className="w-full hover:shadow-md transition-all duration-200 border-l-4 border-l-blue-500">
      <CardContent className="p-3">
        {/* Header ultra compacto */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <div className={`h-2 w-2 rounded-full ${statusColor} flex-shrink-0`} />
            <span className="text-sm font-medium text-gray-900 truncate">
              {task.student?.name || 'Aluno'}
            </span>
            <span className="text-xs text-gray-400 flex-shrink-0">
              {channelIcon}
            </span>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0 flex-shrink-0">
                <MoreHorizontal className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => onCopyMessage(task.payload.message)}>
                <Copy className="h-3 w-3 mr-2" />
                Copiar mensagem
              </DropdownMenuItem>
              
              {task.channel === 'whatsapp' && task.student?.phone && (
                <DropdownMenuItem onClick={() => onOpenWhatsApp(task.student.phone!, task.payload.message)}>
                  <ExternalLink className="h-3 w-3 mr-2" />
                  Abrir WhatsApp
                </DropdownMenuItem>
              )}
              
              {task.status === 'pending' && (
                <DropdownMenuItem onClick={() => onUpdateStatus(task.id, 'sent')}>
                  <Send className="h-3 w-3 mr-2" />
                  Marcar como enviada
                </DropdownMenuItem>
              )}
              
              <DropdownMenuSeparator />
              
              <DropdownMenuItem onClick={() => onSnoozeTask(task.id, 1)}>
                <Clock className="h-3 w-3 mr-2" />
                Adiar 1 dia
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onSnoozeTask(task.id, 3)}>
                <Clock className="h-3 w-3 mr-2" />
                Adiar 3 dias
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onSnoozeTask(task.id, 7)}>
                <Clock className="h-3 w-3 mr-2" />
                Adiar 7 dias
              </DropdownMenuItem>
              
              <DropdownMenuSeparator />
              
              <DropdownMenuItem 
                onClick={() => onUpdateStatus(task.id, 'skipped')}
                className="text-red-600"
              >
                <X className="h-3 w-3 mr-2" />
                Pular tarefa
              </DropdownMenuItem>
              
              <DropdownMenuItem 
                onClick={() => onDeleteTask(task.id)}
                className="text-red-600 font-medium"
              >
                <X className="h-3 w-3 mr-2" />
                Excluir tarefa
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Mensagem compacta */}
        <div className="mb-2">
          <p className="text-xs text-gray-700 line-clamp-2 leading-relaxed">
            {task.payload.message}
          </p>
        </div>
        
        {/* Footer com data e status */}
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span className="font-medium">
            {format(new Date(task.scheduled_for), 'dd/MM HH:mm', { locale: ptBR })}
          </span>
          <Badge 
            variant="outline" 
            className={`text-xs px-2 py-0.5 capitalize ${
              task.status === 'pending' ? 'border-yellow-500 text-yellow-700' :
              task.status === 'sent' ? 'border-green-500 text-green-700' :
              task.status === 'snoozed' ? 'border-blue-500 text-blue-700' :
              task.status === 'skipped' ? 'border-gray-500 text-gray-700' :
              task.status === 'failed' ? 'border-red-500 text-red-700' :
              'border-gray-500 text-gray-700'
            }`}
          >
            {task.status === 'pending' ? 'Pendente' :
             task.status === 'sent' ? 'Enviada' :
             task.status === 'snoozed' ? 'Adiada' :
             task.status === 'skipped' ? 'Pulada' :
             task.status === 'failed' ? 'Falhou' :
             'Desconhecido'}
          </Badge>
        </div>
      </CardContent>
    </Card>
  )
}
