/**
 * GATE 10.6.5 - Timeline de Relacionamento do Aluno
 * 
 * Funcionalidades:
 * - Lista cronológica de eventos de relacionamento
 * - Filtros por ação, canal, template, período
 * - Visualização rica com detalhes
 * - Integração com sistema de alunos
 */

'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { 
  Clock, 
  MessageSquare, 
  CheckCircle, 
  Pause, 
  X, 
  AlertCircle,
  RefreshCw,
  Filter,
  Calendar as CalendarIcon,
  User,
  Copy,
  ExternalLink,
  Plus,
  Check,
  ChevronDown,
  ChevronUp
} from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import MessageComposer from './MessageComposer'

interface Task {
  id: string
  template_code: string
  anchor: string
  scheduled_for: string
  status: string
  payload: {
    message: string
    student_name: string
    student_email: string
    student_phone: string
  }
}

interface Log {
  id: string
  action: string
  channel: string
  template_code?: string
  at: string
  task?: Task
  meta?: Record<string, any>
}

interface RelationshipTimelineProps {
  studentId: string
  studentName: string
}

// Opções de filtro
const ACTION_OPTIONS = [
  { value: 'all', label: 'Todas as Ações' },
  { value: 'created', label: 'Criado' },
  { value: 'sent', label: 'Enviado' },
  { value: 'delivered', label: 'Entregue' },
  { value: 'read', label: 'Lido' },
  { value: 'snoozed', label: 'Adiado' },
  { value: 'skipped', label: 'Pulado' },
  { value: 'failed', label: 'Falhou' },
  { value: 'recalculated', label: 'Recalculado' }
]

const CHANNEL_OPTIONS = [
  { value: 'all', label: 'Todos os Canais' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'email', label: 'E-mail' },
  { value: 'sms', label: 'SMS' },
  { value: 'manual', label: 'Manual' },
  { value: 'system', label: 'Sistema' }
]

const TEMPLATE_OPTIONS = [
  { value: 'all', label: 'Todos os Templates' },
  { value: 'MSG1', label: 'MSG1 - Boas-vindas' },
  { value: 'MSG2', label: 'MSG2 - Lembrete de Treino' },
  { value: 'MSG3', label: 'MSG3 - Parabéns por Conclusão' },
  { value: 'MSG4', label: 'MSG4 - Convite para Avaliação' },
  { value: 'MSG5', label: 'MSG5 - Oferta de Serviços' },
  { value: 'MSG6', label: 'MSG6 - Follow-up Pós-Treino' },
  { value: 'MSG7', label: 'MSG7 - Lembrete de Pagamento' },
  { value: 'MSG8', label: 'MSG8 - Agendamento de Consulta' },
  { value: 'MSG9', label: 'MSG9 - Acompanhamento Trimestral' },
  { value: 'MSG10', label: 'MSG10 - Oferecimento de Novos Serviços' }
]

export default function RelationshipTimeline({ studentId, studentName }: RelationshipTimelineProps) {
  const [logs, setLogs] = useState<Log[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedLogs, setExpandedLogs] = useState<Set<string>>(new Set())
  const [expandedMessages, setExpandedMessages] = useState<Set<string>>(new Set())
  const [filters, setFilters] = useState({
    action: 'all',
    channel: 'all',
    template_code: 'all',
    date_from: '',
    date_to: '',
    q: ''
  })
  const [pagination, setPagination] = useState({
    page: 1,
    page_size: 20,
    total: 0,
    total_pages: 0
  })
  const [messageComposerOpen, setMessageComposerOpen] = useState(false)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [showDateFromPicker, setShowDateFromPicker] = useState(false)
  const [showDateToPicker, setShowDateToPicker] = useState(false)

  // Buscar logs
  const fetchLogs = async () => {
    setLoading(true)
    try {
      console.log('🔍 [DEBUG] RelationshipTimeline - Iniciando busca de logs para studentId:', studentId)
      
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        page_size: pagination.page_size.toString(),
        ...(filters.action !== 'all' && { action: filters.action }),
        ...(filters.channel !== 'all' && { channel: filters.channel }),
        ...(filters.template_code !== 'all' && { template_code: filters.template_code }),
        ...(filters.q && { q: filters.q }),
        ...(filters.date_from && { date_from: filters.date_from }),
        ...(filters.date_to && { date_to: filters.date_to })
      })

      const url = `/api/students/${studentId}/relationship-logs?${params}`
      console.log('🔍 [DEBUG] RelationshipTimeline - URL da requisição:', url)

      const response = await fetch(url)
      
      console.log('🔍 [DEBUG] RelationshipTimeline - Status da resposta:', response.status)
      console.log('🔍 [DEBUG] RelationshipTimeline - Headers da resposta:', Object.fromEntries(response.headers.entries()))
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ [DEBUG] RelationshipTimeline - Erro na resposta:', errorText)
        throw new Error(`Erro ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      console.log('🔍 [DEBUG] RelationshipTimeline - Dados recebidos:', data)
      console.log('🔍 [DEBUG] RelationshipTimeline - Logs encontrados:', data.data?.length || 0)
      console.log('🔍 [DEBUG] RelationshipTimeline - Paginação:', data.pagination)
      
      if (data.data && data.data.length > 0) {
        console.log('🔍 [DEBUG] RelationshipTimeline - Primeiro log:', data.data[0])
      }
      
      setLogs(data.data || [])
      setPagination(data.pagination || pagination)
    } catch (error) {
      console.error('❌ [DEBUG] RelationshipTimeline - Erro ao buscar logs:', error)
      toast.error('Erro ao buscar logs')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLogs()
  }, [studentId, filters, pagination.page])

  // Obter ícone da ação
  const getActionIcon = (action: string) => {
    switch (action) {
      case 'created':
        return <MessageSquare className="h-4 w-4 text-blue-600" />
      case 'sent':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'snoozed':
        return <Pause className="h-4 w-4 text-yellow-600" />
      case 'skipped':
        return <X className="h-4 w-4 text-gray-600" />
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-600" />
      case 'recalculated':
        return <RefreshCw className="h-4 w-4 text-purple-600" />
      default:
        return <Clock className="h-4 w-4 text-gray-600" />
    }
  }

  // Obter cor da ação
  const getActionColor = (action: string) => {
    switch (action) {
      case 'created':
        return 'bg-blue-50 text-blue-700 border-blue-200'
      case 'sent':
        return 'bg-green-50 text-green-700 border-green-200'
      case 'snoozed':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200'
      case 'skipped':
        return 'bg-gray-50 text-gray-700 border-gray-200'
      case 'failed':
        return 'bg-red-50 text-red-700 border-red-200'
      case 'recalculated':
        return 'bg-purple-50 text-purple-700 border-purple-200'
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200'
    }
  }

  // Obter cor do canal
  const getChannelColor = (channel: string) => {
    switch (channel) {
      case 'whatsapp':
        return 'bg-green-50 text-green-700 border-green-200'
      case 'email':
        return 'bg-blue-50 text-blue-700 border-blue-200'
      case 'manual':
        return 'bg-orange-50 text-orange-700 border-orange-200'
      case 'system':
        return 'bg-gray-50 text-gray-700 border-gray-200'
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200'
    }
  }

  // Renderizar log com design moderno e minimalista
  const renderLog = (log: Log) => (
    <div key={log.id} className="group relative flex gap-3 p-4 hover:bg-gray-50/50 transition-colors border-b border-gray-100 last:border-b-0">
      {/* Timeline line */}
      <div className="absolute left-6 top-14 bottom-0 w-px bg-gray-200 group-last:hidden" />
      
      {/* Ícone da ação - minimalista */}
      <div className="relative z-10 flex-shrink-0">
        <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
          log.action === 'sent' ? 'bg-green-100 text-green-600' :
          log.action === 'created' ? 'bg-blue-100 text-blue-600' :
          log.action === 'failed' ? 'bg-red-100 text-red-600' :
          'bg-gray-100 text-gray-600'
        }`}>
          {log.action === 'sent' ? <Check className="w-3 h-3" /> :
           log.action === 'created' ? <Plus className="w-3 h-3" /> :
           log.action === 'failed' ? <X className="w-3 h-3" /> :
           <Clock className="w-3 h-3" />}
        </div>
      </div>

      {/* Conteúdo principal */}
      <div className="flex-1 min-w-0">
        {/* Header com ação e timestamp */}
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-900">
              {log.action === 'created' && 'Tarefa criada'}
              {log.action === 'sent' && 'Mensagem enviada'}
              {log.action === 'snoozed' && 'Tarefa adiada'}
              {log.action === 'skipped' && 'Tarefa pulada'}
              {log.action === 'failed' && 'Falha no envio'}
              {log.action === 'recalculated' && 'Tarefas recalculadas'}
            </span>
            <span className="text-xs text-gray-400">•</span>
            <span className="text-xs text-gray-500 uppercase tracking-wide font-medium">
              {log.channel}
            </span>
            {log.template_code && (
              <>
                <span className="text-xs text-gray-400">•</span>
                <span className="text-xs font-mono text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded">
                  {log.template_code}
                </span>
              </>
            )}
          </div>
          <time className="text-xs text-gray-500 font-mono">
            {format(new Date(log.at), 'dd/MM HH:mm', { locale: ptBR })}
          </time>
        </div>

        {/* Detalhes da tarefa - colapsável */}
        {log.task && (
          <div className="mb-2">
            {/* Botão para expandir/colapsar mensagem */}
            <button
              onClick={() => toggleMessage(log.id)}
              className="w-full text-left p-2 bg-gray-50 rounded-lg border border-gray-100 hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">
                    {expandedMessages.has(log.id) ? 'Ocultar mensagem' : 'Ver mensagem'}
                  </span>
                  <span className="text-xs text-gray-500">
                    ({log.task.payload.message.length} caracteres)
                  </span>
                </div>
                {expandedMessages.has(log.id) ? (
                  <ChevronUp className="h-4 w-4 text-gray-500" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-gray-500" />
                )}
              </div>
            </button>

            {/* Conteúdo da mensagem expandido */}
            {expandedMessages.has(log.id) && (
              <div className="mt-2 bg-white rounded-lg p-3 border border-gray-200 shadow-sm">
                <div className="text-sm text-gray-700 mb-3 leading-relaxed">
                  {log.task.payload.message}
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <span>Agendado: {format(new Date(log.task.scheduled_for), 'dd/MM HH:mm', { locale: ptBR })}</span>
                    <span className={`px-1.5 py-0.5 rounded-full text-xs font-medium ${
                      log.task.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                      log.task.status === 'sent' ? 'bg-green-100 text-green-700' :
                      log.task.status === 'due_today' ? 'bg-blue-100 text-blue-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {log.task.status === 'pending' ? 'Pendente' :
                       log.task.status === 'sent' ? 'Enviado' :
                       log.task.status === 'due_today' ? 'Para Hoje' :
                       log.task.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs hover:bg-gray-100"
                      onClick={() => copyMessage(log.task.payload.message)}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                    {log.channel === 'whatsapp' && log.task?.payload?.student_phone && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-xs hover:bg-gray-100"
                        onClick={() => openWhatsApp(log.task.payload.student_phone, log.task.payload.message)}
                      >
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Status e informações claras */}
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-4 text-xs text-gray-500">
            {log.meta?.mode && (
              <span className="flex items-center gap-1">
                <div className={`w-1.5 h-1.5 rounded-full ${
                  log.meta.mode === 'free' ? 'bg-green-400' : 'bg-blue-400'
                }`} />
                {log.meta.mode === 'free' ? 'Livre' : 'Template'}
              </span>
            )}
            {log.meta?.scheduled_for && (
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span className="font-medium">Agendado:</span>
                {format(new Date(log.meta.scheduled_for), 'dd/MM HH:mm', { locale: ptBR })}
              </span>
            )}
            {log.meta?.sent_at && (
              <span className="flex items-center gap-1">
                <Check className="w-3 h-3" />
                <span className="font-medium">Enviado:</span>
                {format(new Date(log.meta.sent_at), 'dd/MM HH:mm', { locale: ptBR })}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span className="font-medium">Registrado:</span>
              {format(new Date(log.at), 'dd/MM HH:mm', { locale: ptBR })}
            </span>
          </div>
          
          {/* Botão para expandir detalhes técnicos */}
          {log.meta && Object.keys(log.meta).length > 0 && (
            <button
              onClick={() => toggleDetails(log.id)}
              className="flex items-center gap-1 text-gray-400 hover:text-gray-600 transition-colors text-xs"
            >
              {expandedLogs.has(log.id) ? (
                <ChevronUp className="w-3 h-3" />
              ) : (
                <ChevronDown className="w-3 h-3" />
              )}
              Detalhes
            </button>
          )}
        </div>

        {/* Detalhes técnicos expandidos - Design Premium */}
        {expandedLogs.has(log.id) && log.meta && (
          <div className="mt-3 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200 shadow-sm">
            <div className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-sm font-semibold text-gray-800">Informações Técnicas</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {Object.entries(log.meta).map(([key, value]) => {
                  // Mapear nomes técnicos para nomes amigáveis
                  const friendlyKey = {
                    'mode': 'Modo',
                    'send_now': 'Envio Imediato',
                    'scheduled_for': 'Agendado para',
                    'template_version': 'Versão do Template',
                    'classification_tag': 'Tag de Classificação',
                    'sent_at': 'Enviado em',
                    'created_at': 'Criado em',
                    'updated_at': 'Atualizado em'
                  }[key] || key

                  // Formatar valores
                  let displayValue = value
                  if (key === 'scheduled_for' || key === 'sent_at' || key === 'created_at' || key === 'updated_at') {
                    displayValue = format(new Date(value), 'dd/MM/yyyy HH:mm', { locale: ptBR })
                  } else if (key === 'send_now') {
                    displayValue = value ? 'Sim' : 'Não'
                  } else if (key === 'mode') {
                    displayValue = value === 'free' ? 'Livre' : 'Template'
                  } else if (value === null || value === 'null') {
                    displayValue = 'Não informado'
                  }

                  return (
                    <div key={key} className="bg-white rounded-lg p-3 border border-gray-100">
                      <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                        {friendlyKey}
                      </div>
                      <div className="text-sm text-gray-800 font-medium">
                        {displayValue}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )

  // Copiar mensagem
  const copyMessage = async (message: string) => {
    try {
      await navigator.clipboard.writeText(message)
      toast.success('Mensagem copiada!')
    } catch (error) {
      toast.error('Erro ao copiar mensagem')
    }
  }

  // Abrir WhatsApp
  const openWhatsApp = (phone: string | undefined, message: string) => {
    if (!phone) {
      toast.error('Telefone não disponível')
      return
    }
    const cleanPhone = phone.replace(/\D/g, '')
    const encodedMessage = encodeURIComponent(message)
    const url = `https://wa.me/55${cleanPhone}?text=${encodedMessage}`
    window.open(url, '_blank')
  }

  // Funções para calendário
  const handleDateFromSelect = (date: Date | undefined) => {
    if (date) {
      setFilters(prev => ({ ...prev, date_from: date.toISOString().split('T')[0] }))
    }
    setShowDateFromPicker(false)
  }

  const handleDateToSelect = (date: Date | undefined) => {
    if (date) {
      setFilters(prev => ({ ...prev, date_to: date.toISOString().split('T')[0] }))
    }
    setShowDateToPicker(false)
  }

  const getDateFromValue = () => {
    return filters.date_from ? new Date(filters.date_from + 'T00:00:00') : undefined
  }

  const getDateToValue = () => {
    return filters.date_to ? new Date(filters.date_to + 'T00:00:00') : undefined
  }

  // Toggle detalhes expandidos
  const toggleDetails = (logId: string) => {
    setExpandedLogs(prev => {
      const newSet = new Set(prev)
      if (newSet.has(logId)) {
        newSet.delete(logId)
      } else {
        newSet.add(logId)
      }
      return newSet
    })
  }

  // Toggle mensagem expandida
  const toggleMessage = (logId: string) => {
    setExpandedMessages(prev => {
      const newSet = new Set(prev)
      if (newSet.has(logId)) {
        newSet.delete(logId)
      } else {
        newSet.add(logId)
      }
      return newSet
    })
  }

  return (
    <div className="flex gap-6 h-full">
      {/* Filtro Lateral */}
      <div className={`transition-all duration-300 ${filtersOpen ? 'w-80' : 'w-0'} overflow-hidden flex-shrink-0`}>
        <Card className="h-fit">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Filter className="h-4 w-4" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Ação</label>
              <Select
                value={filters.action}
                onValueChange={(value) => setFilters(prev => ({ ...prev, action: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as Ações</SelectItem>
                  <SelectItem value="sent">Enviado</SelectItem>
                  <SelectItem value="created">Criado</SelectItem>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="snoozed">Adiado</SelectItem>
                  <SelectItem value="skipped">Ignorado</SelectItem>
                  <SelectItem value="failed">Falhou</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Canal</label>
              <Select
                value={filters.channel}
                onValueChange={(value) => setFilters(prev => ({ ...prev, channel: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Canais</SelectItem>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                  <SelectItem value="email">E-mail</SelectItem>
                  <SelectItem value="sms">SMS</SelectItem>
                  <SelectItem value="manual">Manual</SelectItem>
                  <SelectItem value="system">Sistema</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Template</label>
              <Select
                value={filters.template_code}
                onValueChange={(value) => setFilters(prev => ({ ...prev, template_code: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos os Templates" />
                </SelectTrigger>
                <SelectContent>
                  {TEMPLATE_OPTIONS.map((template) => (
                    <SelectItem key={template.value} value={template.value}>
                      {template.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Buscar</label>
              <Input
                placeholder="Buscar nos logs..."
                value={filters.q}
                onChange={(e) => setFilters(prev => ({ ...prev, q: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Data Inicial</label>
              <Popover open={showDateFromPicker} onOpenChange={setShowDateFromPicker}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 px-3 text-sm justify-start w-full"
                  >
                    <CalendarIcon className="mr-2 h-3 w-3" />
                    {filters.date_from ? (
                      new Date(filters.date_from).toLocaleDateString('pt-BR')
                    ) : (
                      <span>Selecionar data inicial</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <div className="p-3">
                    <Calendar
                      mode="single"
                      selected={getDateFromValue()}
                      onSelect={handleDateFromSelect}
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
                        head_cell: "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
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
                    <div className="flex justify-end gap-2 pt-3 border-t">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setFilters(prev => ({ ...prev, date_from: '' }))
                          setShowDateFromPicker(false)
                        }}
                      >
                        Limpar
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => setShowDateFromPicker(false)}
                      >
                        OK
                      </Button>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Data Final</label>
              <Popover open={showDateToPicker} onOpenChange={setShowDateToPicker}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 px-3 text-sm justify-start w-full"
                  >
                    <CalendarIcon className="mr-2 h-3 w-3" />
                    {filters.date_to ? (
                      new Date(filters.date_to).toLocaleDateString('pt-BR')
                    ) : (
                      <span>Selecionar data final</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <div className="p-3">
                    <Calendar
                      mode="single"
                      selected={getDateToValue()}
                      onSelect={handleDateToSelect}
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
                        head_cell: "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
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
                    <div className="flex justify-end gap-2 pt-3 border-t">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setFilters(prev => ({ ...prev, date_to: '' }))
                          setShowDateToPicker(false)
                        }}
                      >
                        Limpar
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => setShowDateToPicker(false)}
                      >
                        OK
                      </Button>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            <Button 
              onClick={fetchLogs} 
              disabled={loading}
              className="w-full"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Aplicar Filtros
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Conteúdo Principal */}
      <div className="flex-1 flex flex-col space-y-4 min-h-0">
        {/* Header Compacto */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Timeline de Relacionamento - {studentName}
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setFiltersOpen(!filtersOpen)}
                >
                  <Filter className="h-4 w-4 mr-2" />
                  {filtersOpen ? 'Ocultar Filtros' : 'Mostrar Filtros'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchLogs}
                  disabled={loading}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Atualizar
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Timeline com Scroll */}
        <Card className="flex-1">
          <CardContent className="p-0 h-full flex flex-col">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-500">Carregando logs...</p>
                </div>
              </div>
            ) : logs.length === 0 ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum log encontrado</h3>
                  <p className="text-gray-500">Este aluno ainda não possui eventos de relacionamento</p>
                </div>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto max-h-[600px]">
                <div className="divide-y divide-gray-100">
                  {logs.map(renderLog)}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Paginação */}
        {pagination.total_pages > 1 && (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  Mostrando {((pagination.page - 1) * pagination.page_size) + 1} a {Math.min(pagination.page * pagination.page_size, pagination.total)} de {pagination.total} logs
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                    disabled={pagination.page === 1}
                  >
                    Anterior
                  </Button>
                  <span className="text-sm text-gray-500">
                    Página {pagination.page} de {pagination.total_pages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                    disabled={pagination.page === pagination.total_pages}
                  >
                    Próxima
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Modal MessageComposer */}
      <MessageComposer
        open={messageComposerOpen}
        onOpenChange={setMessageComposerOpen}
        initialStudentId={studentId}
        initialStudentName={studentName}
        onSuccess={() => {
          fetchLogs() // Atualizar a timeline após enviar mensagem
        }}
      />
    </div>
  )
}