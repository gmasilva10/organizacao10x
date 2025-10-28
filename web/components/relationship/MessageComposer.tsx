'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { ptBR } from 'date-fns/locale'
import { MessageSquare, Send, Calendar as CalendarIcon, User, Tag, AlertCircle, ChevronDown, Eye, User2, Mail, Phone, Cake } from 'lucide-react'
import dayjs from 'dayjs'
import timezone from 'dayjs/plugin/timezone'
import utc from 'dayjs/plugin/utc'
import { toast } from 'sonner'
import { RELATIONSHIP_VARIABLES, VARIABLE_CATEGORIES, getVariablesByCategory } from '@/lib/relationship-variables'
import { CLASSIFICATION_TAGS } from '@/lib/relationship-anchors'
import { whatsappService } from '@/lib/integrations/whatsapp/service'
import { WhatsAppContact, WhatsAppMessage } from '@/lib/integrations/whatsapp/types'
import { MessagePreviewBubble } from './MessagePreviewBubble'

// Configurar dayjs com timezone
dayjs.extend(utc)
dayjs.extend(timezone)

interface MessageComposerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  studentId?: string
  studentName?: string
  studentPhone?: string
  initialMessage?: string
  onSuccess?: () => void
}

interface Student {
  id: string
  name: string
  status: string
}

interface Template {
  id: string
  code: string
  title: string
  message_v1: string
  message_v2?: string
  active: boolean
}

export default function MessageComposer({
  open,
  onOpenChange,
  studentId: initialStudentId,
  studentName: initialStudentName,
  studentPhone: initialStudentPhone,
  initialMessage = '',
  onSuccess
}: MessageComposerProps) {
  // Debug removido para limpeza do console
  // Estados
  const [loading, setLoading] = useState(false)
  const [students, setStudents] = useState<Student[]>([])
  const [templates, setTemplates] = useState<Template[]>([])
  const [showVariables, setShowVariables] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string>('pessoal')
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)
  const [selectedTime, setSelectedTime] = useState('09:00')
  const [dateError, setDateError] = useState<string | null>(null)
  const [variableSearch, setVariableSearch] = useState('')

  // Limpar erro quando modal é fechado
  useEffect(() => {
    if (!open) {
      setDateError(null)
      setVariableSearch('')
    }
  }, [open])

  // Atalhos de teclado para variáveis
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!showVariables) return
      
      // Ctrl/Cmd + 1-4 para trocar categorias
      if ((event.ctrlKey || event.metaKey) && event.key >= '1' && event.key <= '4') {
        event.preventDefault()
        const categories = ['pessoal', 'contato', 'temporal', 'treinador']
        const index = parseInt(event.key) - 1
        if (categories[index]) {
          setSelectedCategory(categories[index])
        }
      }
      
      // Escape para fechar painel de variáveis
      if (event.key === 'Escape') {
        setShowVariables(false)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [showVariables])
  
  // Catálogo de variáveis com ícones e legendas
  const VARIABLES_CATALOG = [
    { key: 'Nome', label: 'Nome', description: 'Nome completo do aluno', icon: User2, category: 'pessoal' },
    { key: 'PrimeiroNome', label: 'Primeiro Nome', description: 'Primeiro nome do aluno', icon: User, category: 'pessoal' },
    { key: 'Sobrenome', label: 'Sobrenome', description: 'Sobrenome do aluno', icon: User2, category: 'pessoal' },
    { key: 'Email', label: 'Email', description: 'Email do aluno', icon: Mail, category: 'contato' },
    { key: 'Telefone', label: 'Telefone', description: 'Telefone do aluno', icon: Phone, category: 'contato' },
    { key: 'SaudacaoTemporal', label: 'Saudação Temporal', description: 'Bom dia, boa tarde, boa noite', icon: MessageSquare, category: 'temporal' },
    { key: 'DataHoje', label: 'Data de Hoje', description: 'Data atual', icon: CalendarIcon, category: 'temporal' },
    { key: 'NomeTreinador', label: 'Nome do Treinador', description: 'Nome do treinador', icon: User2, category: 'treinador' },
    { key: 'TreinadorPrincipal', label: 'Treinador Principal', description: 'Treinador principal', icon: User2, category: 'treinador' }
  ]

  // Formulário
  const [formData, setFormData] = useState({
    studentId: initialStudentId || '',
    channel: 'whatsapp',
    mode: 'free' as 'template' | 'free',
    templateCode: '',
    message: initialMessage,
    classificationTag: '',
    scheduledFor: '',
    sendNow: true
  })

  // Carregar dados iniciais
  useEffect(() => {
    if (open) {
      loadStudents()
      loadTemplates()
      
      // Forçar atualização do formData quando modal abrir
      if (initialStudentId) {
        const suggestedMessage = initialMessage || 'Olá [Primeiro Nome], [Saudação Temporal]! Como está o treino hoje?'
        setFormData(prev => ({ 
          ...prev, 
          studentId: initialStudentId, 
          message: suggestedMessage
        }))
      }
    }
  }, [open, initialStudentId, initialMessage])

  // Atualizar aluno quando initialStudentId mudar
  useEffect(() => {
    if (initialStudentId) {
      const suggestedMessage = initialMessage || 'Olá [Primeiro Nome], [Saudação Temporal]! Como está o treino hoje?'
      
      setFormData(prev => ({ 
        ...prev, 
        studentId: initialStudentId, 
        message: suggestedMessage
      }))
    }
  }, [initialStudentId, initialMessage])

  const loadStudents = async () => {
    try {
      const response = await fetch('/api/students?limit=100')
      const data = await response.json()
      setStudents(data.items || [])
    } catch (error) {
      console.error('Erro ao carregar alunos:', error)
    }
  }

  const loadTemplates = async () => {
    try {
      const response = await fetch('/api/relationship/templates')
      const data = await response.json()
      // Templates carregados com sucesso
      setTemplates(data.items || [])
    } catch (error) {
      console.error('Erro ao carregar templates:', error)
    }
  }

  const handleTemplateChange = (templateCode: string) => {
    const template = templates.find(t => t.code === templateCode)
    if (template) {
      setFormData(prev => ({
        ...prev,
        templateCode,
        message: template.message_v1 // Usar sempre v1 (versão ativa)
      }))
    }
  }

  // Garantir sincronização quando alternar o modo (evita ter que fechar/abrir)
  useEffect(() => {
    if (formData.mode === 'template' && formData.templateCode) {
      // Reaplicar o conteúdo do template selecionado
      const t = templates.find(x => x.code === formData.templateCode)
      if (t && t.message_v1 && formData.message !== t.message_v1) {
        setFormData(prev => ({ ...prev, message: t.message_v1 }))
      }
    } else if (formData.mode === 'free' && (!formData.message || formData.message.trim().length === 0)) {
      const suggestedMessage = initialMessage || 'Olá [Primeiro Nome], [Saudação Temporal]! Como está o treino hoje?'
      setFormData(prev => ({ ...prev, message: suggestedMessage }))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.mode, formData.templateCode, templates.length])

  const insertVariable = (variable: string) => {
    // Garantir que a variável esteja no padrão de colchetes
    const formattedVariable = variable.startsWith('[') ? variable : `[${variable}]`
    
    // Inserir no cursor (caret) do textarea
    const textarea = document.getElementById('message') as HTMLTextAreaElement
    if (textarea) {
      const start = textarea.selectionStart || 0
      const end = textarea.selectionEnd || 0
      const text = formData.message
      const before = text.substring(0, start)
      const after = text.substring(end, text.length)
      const newText = before + formattedVariable + after
      
      setFormData(prev => ({
        ...prev,
        message: newText
      }))
      
      // Reposicionar cursor após inserir
      setTimeout(() => {
        textarea.focus()
        textarea.setSelectionRange(start + formattedVariable.length, start + formattedVariable.length)
      }, 10)
    } else {
      // Fallback: inserir no final
      setFormData(prev => ({
        ...prev,
        message: prev.message + formattedVariable
      }))
    }
  }


  // Função para renderizar prévia da mensagem com variáveis resolvidas
  const renderMessagePreview = (templateText: string, student: any, context?: { scheduledFor?: string, sendNow?: boolean }): string => {
    let finalMessage = templateText
    
    // Substituir variáveis básicas (padrão colchetes) - COM e SEM espaços e aliases
    finalMessage = finalMessage.replace(/\[Nome\]/g, student?.name || '[Nome]')
    finalMessage = finalMessage.replace(/\[(Nome do Aluno|Nome do aluno)\]/g, student?.name || '[Nome do Aluno]')
    finalMessage = finalMessage.replace(/\[Primeiro Nome\]/g, student?.name?.split(' ')[0] || '[Primeiro Nome]')
    finalMessage = finalMessage.replace(/\[PrimeiroNome\]/g, student?.name?.split(' ')[0] || '[PrimeiroNome]')
    finalMessage = finalMessage.replace(/\[Sobrenome\]/g, student?.name?.split(' ').slice(1).join(' ') || '[Sobrenome]')
    
    // Substituir variáveis de saudação temporal (usar scheduledFor se disponível e válido)
    let referenceTime: dayjs.Dayjs
    
    try {
      // Se é "Enviar Agora" ou não há scheduledFor, usar agora
      if (context?.sendNow || !context?.scheduledFor) {
        referenceTime = dayjs().tz('America/Sao_Paulo')
      } else {
        // Tentar parsear o scheduledFor
        const parsedTime = dayjs.tz(context.scheduledFor, 'America/Sao_Paulo')
        
        // Validar se a data é válida
        if (!parsedTime.isValid()) {
          console.warn('[REL-COMPOSER-PREVIEW] Invalid scheduledFor:', context.scheduledFor)
          referenceTime = dayjs().tz('America/Sao_Paulo')
        } else {
          referenceTime = parsedTime
        }
      }
      
      const hour = referenceTime.hour()
      let saudacao = 'Olá'
      if (hour < 12) saudacao = 'Bom dia'
      else if (hour < 18) saudacao = 'Boa tarde'
      else saudacao = 'Boa noite'
      
      finalMessage = finalMessage.replace(/\[Saudação Temporal\]/g, saudacao)
      finalMessage = finalMessage.replace(/\[SaudacaoTemporal\]/g, saudacao)
      
      // Substituir variáveis de data
      const hoje = referenceTime.format('DD/MM/YYYY')
      finalMessage = finalMessage.replace(/\[Data Hoje\]/g, hoje)
      finalMessage = finalMessage.replace(/\[DataHoje\]/g, hoje)
      
    } catch (error) {
      console.error('[REL-COMPOSER-PREVIEW] Erro ao processar data:', error)
      // Fallback para agora em caso de erro
      const now = dayjs().tz('America/Sao_Paulo')
      const hour = now.hour()
      let saudacao = 'Olá'
      if (hour < 12) saudacao = 'Bom dia'
      else if (hour < 18) saudacao = 'Boa tarde'
      else saudacao = 'Boa noite'
      
      finalMessage = finalMessage.replace(/\[Saudação Temporal\]/g, saudacao)
      finalMessage = finalMessage.replace(/\[SaudacaoTemporal\]/g, saudacao)
      finalMessage = finalMessage.replace(/\[Data Hoje\]/g, now.format('DD/MM/YYYY'))
      finalMessage = finalMessage.replace(/\[DataHoje\]/g, now.format('DD/MM/YYYY'))
    }
    
    // Substituir variáveis de treinador
    finalMessage = finalMessage.replace(/\[NomeTreinador\]/g, student?.trainer?.name || '[NomeTreinador]')
    finalMessage = finalMessage.replace(/\[TreinadorPrincipal\]/g, student?.trainer?.name || '[TreinadorPrincipal]')
    
    // Substituir variáveis de contato
    finalMessage = finalMessage.replace(/\[Telefone\]/g, student?.phone || '[Telefone]')
    finalMessage = finalMessage.replace(/\[Email\]/g, student?.email || '[Email]')
    
    return finalMessage
  }

  // Função para substituir variáveis pelos valores reais (mantida para compatibilidade)
  const replaceVariables = (message: string, student: any): string => {
    return renderMessagePreview(message, student)
  }

  // Funções para Date/Time Picker com parse padronizado
  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date)
    setDateError(null) // Limpar erro anterior
    
    if (date) {
      const [hours, minutes] = selectedTime.split(':')
      const newDateTime = new Date(date)
      newDateTime.setHours(parseInt(hours), parseInt(minutes))
      
      // Usar data/hora local sem conversão de timezone
      try {
        const scheduledFor = dayjs(newDateTime).toISOString()
        
        // Validar se a data é válida
        if (dayjs(scheduledFor).isValid()) {
          // Validar se a data não é anterior à data atual
          const now = dayjs()
          if (dayjs(scheduledFor).isBefore(now, 'minute')) {
            setDateError('A data e hora selecionadas são anteriores ao momento atual. Selecione uma data futura.')
            return
          }
          
          setFormData(prev => ({
            ...prev,
            scheduledFor
          }))
        } else {
          console.warn('[REL-COMPOSER-DATETIME] Invalid date selected:', date)
          setDateError('Data inválida. Selecione novamente.')
        }
      } catch (error) {
        console.error('[REL-COMPOSER-DATETIME] Erro ao processar data:', error)
        setDateError('Erro ao processar data. Tente novamente.')
      }
    }
  }

  const handleTimeChange = (time: string) => {
    setSelectedTime(time)
    setDateError(null) // Limpar erro anterior
    
    if (selectedDate) {
      const [hours, minutes] = time.split(':')
      const newDateTime = new Date(selectedDate)
      newDateTime.setHours(parseInt(hours), parseInt(minutes))
      
      // Usar data/hora local sem conversão de timezone para manter consistência
      try {
        const scheduledFor = dayjs(newDateTime).toISOString()
        
        // Validar se a data é válida
        if (dayjs(scheduledFor).isValid()) {
          // Validar se a data não é anterior à data atual
          const now = dayjs()
          if (dayjs(scheduledFor).isBefore(now, 'minute')) {
            setDateError('A data e hora selecionadas são anteriores ao momento atual. Selecione uma data futura.')
            return
          }
          
          setFormData(prev => ({
            ...prev,
            scheduledFor
          }))
        } else {
          console.warn('[REL-COMPOSER-DATETIME] Invalid time selected:', time)
          setDateError('Hora inválida. Selecione novamente.')
        }
      } catch (error) {
        console.error('[REL-COMPOSER-DATETIME] Erro ao processar hora:', error)
        setDateError('Erro ao processar hora. Tente novamente.')
      }
    }
  }

  const setToday = () => {
    const today = new Date()
    setSelectedDate(today)
    const [hours, minutes] = selectedTime.split(':')
    today.setHours(parseInt(hours), parseInt(minutes))
    
    // Usar data/hora local sem conversão de timezone
    try {
      const scheduledFor = dayjs(today).toISOString()
      
      if (dayjs(scheduledFor).isValid()) {
        setFormData(prev => ({
          ...prev,
          scheduledFor
        }))
        setShowDatePicker(false)
      }
    } catch (error) {
      console.error('[REL-COMPOSER-DATETIME] Erro ao definir hoje:', error)
    }
  }

  const clearDateTime = () => {
    setSelectedDate(undefined)
    setSelectedTime('09:00')
    setFormData(prev => ({
      ...prev,
      scheduledFor: ''
    }))
    setShowDatePicker(false)
  }

  const confirmDateTime = () => {
    setShowDatePicker(false)
  }

  // Função para lidar com teclas no calendário
  const handleCalendarKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      event.preventDefault()
      confirmDateTime()
    } else if (event.key === 'Escape') {
      event.preventDefault()
      setShowDatePicker(false)
    }
  }

  const validateVariables = (message: string, template: any): { isValid: boolean, missingVariables: string[] } => {
    if (formData.mode !== 'template' || !template) {
      return { isValid: true, missingVariables: [] }
    }
    
    const requiredVariables = template.variables || []
    const missingVariables = requiredVariables.filter((variable: string) => {
      const placeholder = `[${variable}]`
      return !message.includes(placeholder)
    })
    
    return {
      isValid: missingVariables.length === 0,
      missingVariables
    }
  }

  const handleSubmit = async () => {
    if (!formData.studentId || !formData.message) {
      toast.error('Selecione um aluno e digite uma mensagem')
      return
    }

    // Validação de data/hora para modo agendar
    if (!formData.sendNow) {
      if (!formData.scheduledFor || !selectedDate) {
        toast.error('Informe data e hora para agendar a tarefa')
        return
      }
      
      // Validar se a data/hora é válida
      try {
        const parsedTime = dayjs(formData.scheduledFor)
        if (!parsedTime.isValid()) {
          toast.error('Data e hora inválidas. Selecione novamente.')
          return
        }
        
        // Validar se a data não é anterior à data atual
        const now = dayjs()
        if (parsedTime.isBefore(now, 'minute')) {
          toast.error('A data e hora selecionadas são anteriores ao momento atual. Selecione uma data futura para agendar a tarefa.')
          return
        }
      } catch (error) {
        console.error('[REL-COMPOSER-SUBMIT] Erro ao validar data:', error)
        toast.error('Data e hora inválidas. Selecione novamente.')
        return
      }
    }

    // Validação de variáveis obrigatórias
    if (formData.mode === 'template') {
      const template = templates.find(t => t.code === formData.templateCode)
      const validation = validateVariables(formData.message, template)
      
      if (!validation.isValid) {
        toast.error(`Variáveis obrigatórias não preenchidas: ${validation.missingVariables.join(', ')}`)
        return
      }
    }

    setLoading(true)
    try {
      // Se for WhatsApp e "Enviar Agora", abrir WhatsApp Web
      if (formData.channel === 'whatsapp' && formData.sendNow) {
        await handleWhatsAppSend()
        return
      }

      // Substituir variáveis na mensagem
      const student = students.find(s => s.id === formData.studentId) || {
        name: initialStudentName,
        phone: initialStudentPhone,
        email: '',
        trainer: { name: '' }
      }
      
      const finalMessage = replaceVariables(formData.message, student)
      
      // Caso contrário, criar tarefa normal
      const payload = {
        studentId: formData.studentId,
        channel: formData.channel,
        mode: formData.mode,
        templateCode: formData.mode === 'template' ? formData.templateCode : null,
        message: finalMessage,
        classificationTag: formData.classificationTag || null,
        scheduledFor: formData.sendNow ? null : (formData.scheduledFor ? 
          formData.scheduledFor : null),
        sendNow: formData.sendNow
      }

      const response = await fetch('/api/relationship/tasks/manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const data = await response.json()

      if (response.ok && data.success) {
        const student = students.find(s => s.id === formData.studentId)
        const studentName = student?.name || initialStudentName || 'Aluno'
        
        if (formData.sendNow) {
          toast.success(`Mensagem preparada para ${studentName} no WhatsApp.`)
        } else {
          // Deep-link para a tela de relacionamento com focusTaskId
          const relationshipUrl = `/app/relationship?focusTaskId=${data.task.id}&period=${formData.scheduledFor ? dayjs(formData.scheduledFor).format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD')}`
          
          toast.success(
            <div className="flex items-center gap-2">
              <span>Tarefa criada para {studentName}</span>
              <Button
                variant="link"
                size="sm"
                className="p-0 h-auto text-blue-600 hover:text-blue-800"
                onClick={() => {
                  window.open(relationshipUrl, '_blank')
                }}
              >
                Ver Relacionamento
              </Button>
            </div>
          )
        }
        
        onSuccess?.()
        onOpenChange(false)
        
        // Reset form
        setFormData({
          studentId: initialStudentId || '',
          channel: 'whatsapp',
          mode: 'free',
          templateCode: '',
          message: initialMessage || (initialStudentId ? 'Olá [Primeiro Nome], [Saudação Temporal]! Como está o treino hoje?' : ''),
          classificationTag: '',
          scheduledFor: '',
          sendNow: true
        })
      } else {
        toast.error(data.error || 'Erro ao enviar mensagem')
      }
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error)
      toast.error('Erro ao enviar mensagem')
    } finally {
      setLoading(false)
    }
  }

  const handleWhatsAppSend = async () => {
    try {
      // Usar telefone passado como prop ou buscar na lista de alunos
      let phoneNumber = ''
      
      if (initialStudentPhone) {
        // Usar telefone passado como prop (mais confiável)
        phoneNumber = initialStudentPhone.replace(/\D/g, '')
        console.log('🔍 Usando telefone da prop:', initialStudentPhone, '->', phoneNumber)
      } else {
        // Fallback: buscar na lista de alunos
        const student = students.find(s => s.id === formData.studentId)
        if (!student) {
          toast.error('Aluno não encontrado')
          return
        }
        phoneNumber = (student as any).phone?.replace(/\D/g, '') || ''
        console.log('🔍 Usando telefone da lista:', (student as any).phone, '->', phoneNumber)
      }
      
      if (!phoneNumber) {
        toast.error('Telefone do aluno não encontrado')
        return
      }

      // Lógica para formatação do número brasileiro
      // Se começar com 55, já tem código do país
      // Se começar com 11, 12, 13, etc. (DDD), adicionar 55
      // Se começar com 9, assumir que é celular de SP (11)
      let formattedPhone = ''
      
      if (phoneNumber.startsWith('55')) {
        // Já tem código do país
        formattedPhone = phoneNumber
      } else if (phoneNumber.length === 11 && phoneNumber.startsWith('9')) {
        // Celular sem DDD, assumir SP (11)
        formattedPhone = `5511${phoneNumber}`
      } else if (phoneNumber.length === 10 && phoneNumber.startsWith('9')) {
        // Celular sem DDD, assumir SP (11)
        formattedPhone = `5511${phoneNumber}`
      } else if (phoneNumber.length === 11) {
        // Celular com DDD
        formattedPhone = `55${phoneNumber}`
      } else if (phoneNumber.length === 10) {
        // Telefone fixo com DDD
        formattedPhone = `55${phoneNumber}`
      } else {
        // Formato não reconhecido, tentar adicionar 55
        formattedPhone = `55${phoneNumber}`
      }
      
      console.log('🔍 DEBUG WhatsApp:', {
        originalPhone: initialStudentPhone || 'não fornecido',
        cleanedPhone: phoneNumber,
        formattedPhone: formattedPhone
      })
      
      // Substituir variáveis na mensagem
      const student = students.find(s => s.id === formData.studentId) || {
        name: initialStudentName,
        phone: initialStudentPhone,
        email: '',
        trainer: { name: '' }
      }
      
      const finalMessage = replaceVariables(formData.message, student)
      console.log('🔍 DEBUG Mensagem final:', {
        original: formData.message,
        final: finalMessage
      })
      
      // Usar novo serviço WhatsApp (Desktop primeiro, fallback para Web)
      const contact: WhatsAppContact = {
        phone: formattedPhone,
        name: student.name || initialStudentName || 'Aluno'
      }
      
      const whatsappMessage: WhatsAppMessage = {
        text: finalMessage,
        contact
      }
      
      console.log('🔍 DEBUG WhatsApp Service:', {
        contact,
        message: finalMessage.substring(0, 50) + '...'
      })
      
      // Tentar enviar via WhatsApp Desktop primeiro, fallback para Web
      const result = await whatsappService.sendMessage(whatsappMessage)
      
      if (!result.success) {
        throw new Error(result.error || 'Erro ao abrir WhatsApp')
      }
      
      const methodName = result.method === 'desktop' ? 'WhatsApp Desktop' : 'WhatsApp Web'
      console.log(`✅ WhatsApp aberto via ${methodName}`)
      
      // Copiar mensagem para área de transferência
      await navigator.clipboard.writeText(finalMessage)
      
      // Registrar log da ação
      const response = await fetch('/api/relationship/tasks/manual', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          studentId: formData.studentId,
          channel: 'whatsapp',
          mode: 'free',
          message: finalMessage,
          classificationTag: formData.classificationTag,
          sendNow: true
        })
      })

      const data = await response.json()
      
      if (response.ok && data.success) {
        const studentName = initialStudentName || 'Aluno'
        const methodName = result.method === 'desktop' ? 'WhatsApp Desktop' : 'WhatsApp Web'
        toast.success(`Mensagem preparada para ${studentName}`, {
          description: `Abrindo ${methodName}...`
        })
        onSuccess?.()
        onOpenChange(false)
      } else {
        toast.error(data.error || 'Erro ao registrar ação')
      }
      
    } catch (error) {
      console.error('Erro ao abrir WhatsApp:', error)
      toast.error('Erro ao abrir WhatsApp Web')
    }
  }

  const selectedStudent = students.find(s => s.id === formData.studentId)
  
  // Debug removido para limpeza do console

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-visible">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            {formData.sendNow ? 'Enviar Mensagem' : 'Criar Tarefa'}
          </DialogTitle>
          <DialogDescription>
            {formData.sendNow 
              ? 'Envie uma mensagem personalizada para seus alunos usando variáveis dinâmicas.'
              : 'Crie uma tarefa de relacionamento para ser executada automaticamente no futuro.'
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 overflow-y-auto max-h-[calc(90vh-120px)] pr-2">
          {/* Seção: Destino */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <User className="h-4 w-4" />
                Destino
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="student" className="text-sm font-medium">Aluno *</Label>
                <Select 
                  value={formData.studentId} 
                  onValueChange={(value: string) => setFormData(prev => ({ ...prev, studentId: value }))}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Selecione um aluno" />
                  </SelectTrigger>
                  <SelectContent>
                    {students.map((student) => (
                      <SelectItem key={student.id} value={student.id}>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          {student.name}
                          <Badge variant="outline" className="text-xs">
                            {student.status}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Seção: Conteúdo */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Conteúdo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="mode" className="text-sm font-medium">Modo</Label>
                  <Select value={formData.mode} onValueChange={(value: string) => setFormData(prev => ({ ...prev, mode: value as 'template' | 'free' }))}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="free">Texto Livre</SelectItem>
                      <SelectItem value="template">Template</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formData.mode === 'template' && (
                  <div>
                    <Label htmlFor="template" className="text-sm font-medium">Template</Label>
                    <Select value={formData.templateCode} onValueChange={handleTemplateChange}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Selecione um template" />
                      </SelectTrigger>
                      <SelectContent>
                        {templates.map((template) => (
                          <SelectItem key={template.code} value={template.code}>
                            {template.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="channel" className="text-sm font-medium">Canal *</Label>
                  <Select value={formData.channel} onValueChange={(value: string) => setFormData(prev => ({ ...prev, channel: value }))}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="whatsapp">WhatsApp</SelectItem>
                      <SelectItem value="email">E-mail</SelectItem>
                      <SelectItem value="manual">Manual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="classification" className="text-sm font-medium">Classificação</Label>
                  <Select value={formData.classificationTag} onValueChange={(value: string) => setFormData(prev => ({ ...prev, classificationTag: value }))}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Selecione uma classificação" />
                    </SelectTrigger>
                    <SelectContent>
                      {CLASSIFICATION_TAGS.map((tag) => (
                        <SelectItem key={tag.value} value={tag.value}>
                          <div className="flex items-center gap-2">
                            <Tag className="h-4 w-4" />
                            {tag.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Seção: Mensagem */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Mensagem
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label htmlFor="message" className="text-sm font-medium">Texto *</Label>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setShowVariables(!showVariables)
                        if (showPreview) setShowPreview(false) // Fechar prévia se abrir variáveis
                      }}
                      className={`transition-all duration-200 ${
                        showVariables 
                          ? 'bg-blue-50 border-blue-300 text-blue-700 shadow-sm' 
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Inserir Variáveis
                      <div className="ml-2 flex items-center gap-1">
                        <span className="text-xs bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full">
                          {VARIABLES_CATALOG.length}
                        </span>
                        <ChevronDown className={`h-4 w-4 transition-transform ${showVariables ? 'rotate-180' : ''}`} />
                      </div>
                    </Button>
                    
                    {formData.studentId && formData.message && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setShowPreview(!showPreview)
                          if (showVariables) setShowVariables(false) // Fechar variáveis se abrir prévia
                        }}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Ver Prévia
                      </Button>
                    )}
                  </div>
                </div>
                <Textarea
                  id="message"
                  value={formData.message}
                  onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                  placeholder="Digite sua mensagem..."
                  rows={4}
                  className="resize-none"
                />
                
                {/* Painel de Variáveis (colapsável) - Design Premium */}
                {showVariables && (
                  <div className="mt-4 border border-gray-200 rounded-xl p-6 bg-gradient-to-br from-gray-50 to-white shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <MessageSquare className="h-5 w-5 text-blue-600" />
                        <h3 className="text-lg font-semibold text-gray-900">Variáveis Disponíveis</h3>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                          {VARIABLES_CATALOG.filter(v => 
                            v.category === selectedCategory && 
                            (!variableSearch || v.key.toLowerCase().includes(variableSearch.toLowerCase()) || 
                             v.description.toLowerCase().includes(variableSearch.toLowerCase()))
                          ).length} variáveis
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowVariables(false)}
                          className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
                        >
                          ×
                        </Button>
                      </div>
                    </div>

                    {/* Campo de busca */}
                    <div className="mb-4">
                      <div className="relative">
                        <MessageSquare className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          type="text"
                          placeholder="Buscar variáveis..."
                          value={variableSearch}
                          onChange={(e) => setVariableSearch(e.target.value)}
                          className="pl-10 pr-4 py-2 text-sm border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                        />
                        {variableSearch && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setVariableSearch('')}
                            className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
                          >
                            ×
                          </Button>
                        )}
                      </div>
                    </div>
                    
                    {/* Categorias com design premium */}
                    <div className="flex flex-wrap gap-2 mb-6">
                      {[
                        { key: 'pessoal', label: 'Pessoal', icon: User, color: 'blue', shortcut: '1' },
                        { key: 'contato', label: 'Contato', icon: Phone, color: 'green', shortcut: '2' },
                        { key: 'temporal', label: 'Temporal', icon: CalendarIcon, color: 'purple', shortcut: '3' },
                        { key: 'treinador', label: 'Treinador', icon: User2, color: 'orange', shortcut: '4' }
                      ].map((category) => {
                        const IconComponent = category.icon
                        const isSelected = selectedCategory === category.key
                        return (
                          <Button
                            key={category.key}
                            type="button"
                            variant={isSelected ? "default" : "outline"}
                            size="sm"
                            onClick={() => setSelectedCategory(category.key)}
                            className={`transition-all duration-200 group ${
                              isSelected 
                                ? `bg-${category.color}-600 hover:bg-${category.color}-700 text-white shadow-md` 
                                : `hover:bg-${category.color}-50 hover:border-${category.color}-300 hover:text-${category.color}-700`
                            }`}
                          >
                            <IconComponent className="h-4 w-4 mr-2" />
                            {category.label}
                            <span className={`ml-2 text-xs px-1.5 py-0.5 rounded ${
                              isSelected 
                                ? 'bg-white/20 text-white' 
                                : 'bg-gray-100 text-gray-500 group-hover:bg-white/50'
                            }`}>
                              Ctrl+{category.shortcut}
                            </span>
                          </Button>
                        )
                      })}
                    </div>

                    {/* Variáveis da categoria selecionada com design premium */}
                    {(() => {
                      const filteredVariables = VARIABLES_CATALOG.filter(variable => 
                        variable.category === selectedCategory && 
                        (!variableSearch || 
                         variable.key.toLowerCase().includes(variableSearch.toLowerCase()) || 
                         variable.description.toLowerCase().includes(variableSearch.toLowerCase()))
                      )

                      if (filteredVariables.length === 0) {
                        return (
                          <div className="text-center py-8">
                            <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                            <div className="text-gray-500 text-sm">
                              {variableSearch ? 'Nenhuma variável encontrada para sua busca.' : 'Nenhuma variável disponível nesta categoria.'}
                            </div>
                            {variableSearch && (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setVariableSearch('')}
                                className="mt-2"
                              >
                                Limpar busca
                              </Button>
                            )}
                          </div>
                        )
                      }

                      return (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {filteredVariables.map((variable) => {
                          const IconComponent = variable.icon
                          const isRecommended = variable.key === 'PrimeiroNome'
                          return (
                            <div 
                              key={variable.key} 
                              className={`group relative flex items-center justify-between p-4 border rounded-xl bg-white transition-all duration-200 hover:shadow-md hover:scale-[1.02] ${
                                isRecommended 
                                  ? 'border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 ring-1 ring-green-200' 
                                  : 'border-gray-200 hover:border-gray-300'
                              }`}
                            >
                              <div className="flex items-center gap-3 flex-1">
                                <div className={`p-2 rounded-lg ${
                                  isRecommended ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'
                                }`}>
                                  <IconComponent className="h-4 w-4" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <code className="font-mono text-sm font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded">
                                      [{variable.key}]
                                    </code>
                                    {isRecommended && (
                                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full font-medium">
                                        ⭐ Recomendado
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-sm text-gray-600 leading-relaxed">
                                    {variable.description}
                                  </div>
                                </div>
                              </div>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => insertVariable(variable.key)}
                                className={`transition-all duration-200 ${
                                  isRecommended 
                                    ? 'bg-green-600 hover:bg-green-700 text-white border-green-600 hover:border-green-700' 
                                    : 'hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700'
                                }`}
                              >
                                <MessageSquare className="h-3 w-3 mr-1" />
                                Inserir
                              </Button>
                            </div>
                          )
                        })}
                        </div>
                      )
                    })()}

                    {/* Dica de uso */}
                    <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-start gap-2">
                        <MessageSquare className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                        <div className="text-sm text-blue-800">
                          <div className="font-medium mb-1">💡 Como usar:</div>
                          <div>Clique em "Inserir" para adicionar a variável na sua mensagem. Exemplo: "Olá [Primeiro Nome], [Saudação Temporal]!"</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Prévia das variáveis substituídas (collapse) */}
                {showPreview && formData.message && (() => {
                  const student = {
                    name: initialStudentName || 'Nome do Aluno',
                    phone: initialStudentPhone || 'Telefone',
                    email: '',
                    trainer: { name: 'Nome do Treinador' }
                  }
                  
                  const context = {
                    scheduledFor: formData.scheduledFor,
                    sendNow: formData.sendNow
                  }
                  
                  const previewText = renderMessagePreview(formData.message, student, context)
                  
                  return (
                    <div className="mt-4 space-y-3">
                      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                        <Eye className="h-4 w-4" />
                        Preview da Mensagem
                      </div>
                      <div className="bg-muted/30 rounded-lg p-4 border">
                        <MessagePreviewBubble
                          message={previewText}
                          senderName="Personal Trainer"
                          showAvatar={true}
                        />
                        {previewText === formData.message && (
                          <div className="mt-3 text-xs text-muted-foreground">
                            ℹ️ Nenhuma variável encontrada na mensagem
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })()}
              </div>
            </CardContent>
          </Card>

          {/* Seção: Agendamento */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <CalendarIcon className="h-4 w-4" />
                Agendamento
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="sendNow"
                    name="action"
                    checked={formData.sendNow}
                    onChange={() => setFormData(prev => ({ ...prev, sendNow: true }))}
                  />
                  <Label htmlFor="sendNow" className="flex items-center gap-2 text-sm">
                    <Send className="h-4 w-4" />
                    Enviar Agora
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="createTask"
                    name="action"
                    checked={!formData.sendNow}
                    onChange={() => setFormData(prev => ({ ...prev, sendNow: false }))}
                  />
                  <Label htmlFor="createTask" className="flex items-center gap-2 text-sm">
                    <CalendarIcon className="h-4 w-4" />
                    Criar Tarefa
                  </Label>
                </div>

                {!formData.sendNow && (
                  <div className="ml-6 space-y-3">
                    <Label className="text-sm font-medium">Data e Hora</Label>
                    
                    <div className="space-y-2">
                      <Popover open={showDatePicker} onOpenChange={setShowDatePicker}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 px-3 text-sm justify-start"
                          >
                            <CalendarIcon className="mr-2 h-3 w-3" />
                            {selectedDate ? (
                              selectedDate.toLocaleDateString('pt-BR')
                            ) : (
                              <span>Selecionar data</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <div onKeyDown={handleCalendarKeyDown}>
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
                          </div>
                          <div className="p-3 border-t">
                            <div className="flex items-center gap-2 mb-2">
                              <Input
                                type="time"
                                value={selectedTime}
                                onChange={(e) => handleTimeChange(e.target.value)}
                                className="w-24"
                              />
                            </div>
                            <div className="flex justify-between gap-2">
                              <div className="flex gap-2">
                                <Button size="sm" variant="outline" onClick={setToday}>
                                  Hoje
                                </Button>
                                <Button size="sm" variant="outline" onClick={clearDateTime}>
                                  Limpar
                                </Button>
                              </div>
                              <div className="flex gap-2">
                                <Button size="sm" variant="outline" onClick={() => setShowDatePicker(false)}>
                                  Cancelar
                                </Button>
                                <Button size="sm" onClick={confirmDateTime}>
                                  OK
                                </Button>
                              </div>
                            </div>
                          </div>
                        </PopoverContent>
                      </Popover>
                      
                      {formData.scheduledFor && (
                        <div className="text-xs text-gray-500">
                          Agendado para: {dayjs(formData.scheduledFor).format('DD/MM/YYYY HH:mm')}
                        </div>
                      )}
                      
                      {dateError && (
                        <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 p-2 rounded-md border border-red-200">
                          <AlertCircle className="h-3 w-3" />
                          {dateError}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Aviso discreto sobre WhatsApp */}
              {formData.channel === 'whatsapp' && formData.sendNow && (
                <div className="text-xs text-gray-500 mt-2">
                  Ao enviar, o WhatsApp Desktop será aberto automaticamente (ou Web como fallback).
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={loading || (!formData.sendNow && (!formData.scheduledFor || !selectedDate)) || !!dateError}
          >
            {loading ? 'Enviando...' : (formData.sendNow ? 'Enviar Agora' : 'Criar Tarefa')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
