/**
 * Hook específico para filtros de tarefas de relacionamento
 * 
 * Funcionalidades:
 * - Filtros pré-configurados para tarefas de relacionamento
 * - Integração com API de tarefas
 * - Validações específicas
 * - Persistência de estado
 */

'use client'

import { useMemo } from 'react'
import { useAdvancedFilters, FilterDefinition } from './useAdvancedFilters'

// Configuração de filtros para tarefas de relacionamento
const RELATIONSHIP_TASK_FILTERS: FilterDefinition[] = [
  {
    key: 'search',
    label: 'Buscar',
    type: 'text',
    placeholder: 'Buscar por título, descrição ou aluno...',
    validation: {
      required: false,
      min: 2
    }
  },
  {
    key: 'status',
    label: 'Status',
    type: 'select',
    options: [
      { value: 'pending', label: 'Pendente' },
      { value: 'in_progress', label: 'Em Andamento' },
      { value: 'completed', label: 'Concluída' },
      { value: 'cancelled', label: 'Cancelada' }
    ]
  },
  {
    key: 'priority',
    label: 'Prioridade',
    type: 'select',
    options: [
      { value: 'low', label: 'Baixa' },
      { value: 'medium', label: 'Média' },
      { value: 'high', label: 'Alta' },
      { value: 'urgent', label: 'Urgente' }
    ]
  },
  {
    key: 'anchor',
    label: 'Âncora',
    type: 'select',
    options: [] // Será preenchido dinamicamente
  },
  {
    key: 'templateCode',
    label: 'Template',
    type: 'select',
    options: [] // Será preenchido dinamicamente
  },
  {
    key: 'channel',
    label: 'Canal',
    type: 'multiselect',
    options: [
      { value: 'whatsapp', label: 'WhatsApp' },
      { value: 'email', label: 'E-mail' },
      { value: 'phone', label: 'Telefone' },
      { value: 'sms', label: 'SMS' },
      { value: 'in_person', label: 'Presencial' }
    ]
  },
  {
    key: 'assignedTo',
    label: 'Responsável',
    type: 'multiselect',
    options: [] // Será preenchido dinamicamente
  },
  {
    key: 'dueDate',
    label: 'Data de Vencimento',
    type: 'daterange',
    placeholder: 'Selecione o período...'
  },
  {
    key: 'createdAt',
    label: 'Data de Criação',
    type: 'daterange',
    placeholder: 'Selecione o período...'
  },
  {
    key: 'completedAt',
    label: 'Data de Conclusão',
    type: 'daterange',
    placeholder: 'Selecione o período...'
  },
  {
    key: 'overdue',
    label: 'Atrasadas',
    type: 'boolean'
  },
  {
    key: 'hasAttachment',
    label: 'Tem Anexo',
    type: 'boolean'
  }
]

interface UseRelationshipTaskFiltersOptions {
  storageKey?: string
  debounceMs?: number
  anchors?: Array<{ id: string; name: string }>
  templates?: Array<{ code: string; name: string }>
  assignees?: Array<{ id: string; name: string }>
  onFiltersChange?: (filters: Record<string, any>) => void
}

export function useRelationshipTaskFilters(options: UseRelationshipTaskFiltersOptions = {}) {
  const {
    storageKey = 'relationship-task-filters',
    debounceMs = 300,
    anchors = [],
    templates = [],
    assignees = [],
    onFiltersChange
  } = options
  
  // Atualizar opções dinamicamente
  const filters = useMemo(() => {
    return RELATIONSHIP_TASK_FILTERS.map(filter => {
      if (filter.key === 'anchor') {
        return {
          ...filter,
          options: anchors.map(anchor => ({
            value: anchor.id,
            label: anchor.name
          }))
        }
      }
      if (filter.key === 'templateCode') {
        return {
          ...filter,
          options: templates.map(template => ({
            value: template.code,
            label: template.name
          }))
        }
      }
      if (filter.key === 'assignedTo') {
        return {
          ...filter,
          options: assignees.map(assignee => ({
            value: assignee.id,
            label: assignee.name
          }))
        }
      }
      return filter
    })
  }, [anchors, templates, assignees])
  
  const {
    values,
    errors,
    isValid,
    hasActiveFilters,
    activeFiltersCount,
    debouncedValues,
    updateFilter,
    resetFilters,
    clearFilter
  } = useAdvancedFilters({ filters, storageKey, debounceMs })
  
  // Helpers específicos para tarefas de relacionamento
  const getTaskQueryParams = () => {
    const params = new URLSearchParams()
    
    // Busca
    if (values.search) {
      params.append('q', values.search)
    }
    
    // Status
    if (values.status) {
      params.append('status', values.status)
    }
    
    // Prioridade
    if (values.priority) {
      params.append('priority', values.priority)
    }
    
    // Âncora
    if (values.anchor) {
      params.append('anchor', values.anchor)
    }
    
    // Template
    if (values.templateCode) {
      params.append('template_code', values.templateCode)
    }
    
    // Canais (múltiplos)
    if (values.channel && Array.isArray(values.channel) && values.channel.length > 0) {
      values.channel.forEach(channel => {
        params.append('channel', channel)
      })
    }
    
    // Responsáveis (múltiplos)
    if (values.assignedTo && Array.isArray(values.assignedTo) && values.assignedTo.length > 0) {
      values.assignedTo.forEach(assigneeId => {
        params.append('assigned_to', assigneeId)
      })
    }
    
    // Datas
    if (values.dueDate?.from) {
      params.append('due_from', values.dueDate.from)
    }
    if (values.dueDate?.to) {
      params.append('due_to', values.dueDate.to)
    }
    
    if (values.createdAt?.from) {
      params.append('created_from', values.createdAt.from)
    }
    if (values.createdAt?.to) {
      params.append('created_to', values.createdAt.to)
    }
    
    if (values.completedAt?.from) {
      params.append('completed_from', values.completedAt.from)
    }
    if (values.completedAt?.to) {
      params.append('completed_to', values.completedAt.to)
    }
    
    // Booleanos
    if (values.overdue === true) {
      params.append('overdue', 'true')
    }
    if (values.hasAttachment === true) {
      params.append('has_attachment', 'true')
    }
    
    return params.toString()
  }
  
  const getTaskFilters = () => {
    const filters: Record<string, any> = {}
    
    // Busca
    if (values.search) {
      filters.search = values.search
    }
    
    // Status
    if (values.status) {
      filters.status = values.status
    }
    
    // Prioridade
    if (values.priority) {
      filters.priority = values.priority
    }
    
    // Âncora
    if (values.anchor) {
      filters.anchor_id = values.anchor
    }
    
    // Template
    if (values.templateCode) {
      filters.template_code = values.templateCode
    }
    
    // Canais
    if (values.channel && Array.isArray(values.channel) && values.channel.length > 0) {
      filters.channels = values.channel
    }
    
    // Responsáveis
    if (values.assignedTo && Array.isArray(values.assignedTo) && values.assignedTo.length > 0) {
      filters.assigned_to = values.assignedTo
    }
    
    // Datas
    if (values.dueDate?.from) {
      filters.due_from = values.dueDate.from
    }
    if (values.dueDate?.to) {
      filters.due_to = values.dueDate.to
    }
    
    if (values.createdAt?.from) {
      filters.created_from = values.createdAt.from
    }
    if (values.createdAt?.to) {
      filters.created_to = values.createdAt.to
    }
    
    if (values.completedAt?.from) {
      filters.completed_from = values.completedAt.from
    }
    if (values.completedAt?.to) {
      filters.completed_to = values.completedAt.to
    }
    
    // Booleanos
    if (values.overdue === true) {
      filters.overdue = true
    }
    if (values.hasAttachment === true) {
      filters.has_attachment = true
    }
    
    return filters
  }
  
  const clearAllFilters = () => {
    resetFilters()
  }
  
  const setQuickFilter = (key: string, value: any) => {
    updateFilter(key, value)
  }
  
  const setStatusFilter = (status: string) => {
    updateFilter('status', status)
  }
  
  const setPriorityFilter = (priority: string) => {
    updateFilter('priority', priority)
  }
  
  const setChannelFilter = (channels: string[]) => {
    updateFilter('channel', channels)
  }
  
  const setAssigneeFilter = (assigneeIds: string[]) => {
    updateFilter('assignedTo', assigneeIds)
  }
  
  const setDateRangeFilter = (from: string, to: string) => {
    updateFilter('dueDate', { from, to })
  }
  
  const setOverdueFilter = (overdue: boolean) => {
    updateFilter('overdue', overdue)
  }
  
  return {
    // Estado dos filtros
    filters,
    values,
    errors,
    isValid,
    hasActiveFilters,
    activeFiltersCount,
    debouncedValues,
    
    // Ações
    updateFilter,
    resetFilters,
    clearFilter,
    clearAllFilters,
    
    // Helpers específicos
    getTaskQueryParams,
    getTaskFilters,
    setQuickFilter,
    setStatusFilter,
    setPriorityFilter,
    setChannelFilter,
    setAssigneeFilter,
    setDateRangeFilter,
    setOverdueFilter,
    
    // Estado específico
    selectedStatus: values.status,
    selectedPriority: values.priority,
    selectedChannels: values.channel || [],
    selectedAssignees: values.assignedTo || [],
    selectedDateRange: values.dueDate,
    searchQuery: values.search || '',
    isOverdue: values.overdue || false,
    hasAttachment: values.hasAttachment || false
  }
}

export default useRelationshipTaskFilters
