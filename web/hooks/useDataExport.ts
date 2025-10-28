/**
 * Hook para gerenciar exportações de dados
 * 
 * Funcionalidades:
 * - Exportação para PDF, Excel e CSV
 * - Gerenciamento de estado de exportação
 * - Validação de dados
 * - Configuração de templates
 */

'use client'

import { useState, useCallback } from 'react'
import { 
  exportToPDF, 
  exportToExcel, 
  exportToCSV,
  validateExportData,
  ExportOptions,
  PDFOptions,
  ExcelOptions,
  ExportColumn
} from '@/lib/export/export-utils'

export interface ExportState {
  isExporting: boolean
  exportProgress: number
  exportError: string | null
  lastExport: {
    format: string
    filename: string
    timestamp: Date
    recordCount: number
  } | null
}

export interface UseDataExportOptions {
  defaultColumns?: ExportColumn[]
  defaultTitle?: string
  defaultFilename?: string
  organization?: string
  logo?: string
  onExportStart?: () => void
  onExportComplete?: (result: { format: string; filename: string; recordCount: number }) => void
  onExportError?: (error: string) => void
}

export function useDataExport(options: UseDataExportOptions = {}) {
  const {
    defaultColumns = [],
    defaultTitle = 'Relatório',
    defaultFilename = 'relatorio',
    organization,
    logo,
    onExportStart,
    onExportComplete,
    onExportError
  } = options

  const [state, setState] = useState<ExportState>({
    isExporting: false,
    exportProgress: 0,
    exportError: null,
    lastExport: null
  })

  // Função para atualizar estado de exportação
  const updateExportState = useCallback((updates: Partial<ExportState>) => {
    setState(prev => ({ ...prev, ...updates }))
  }, [])

  // Função para limpar erros
  const clearError = useCallback(() => {
    updateExportState({ exportError: null })
  }, [updateExportState])

  // Função para exportar dados
  const exportData = useCallback(async (
    data: any[],
    format: 'pdf' | 'excel' | 'csv',
    options: Partial<ExportOptions> = {}
  ) => {
    try {
      // Limpar erro anterior
      clearError()
      
      // Atualizar estado de exportação
      updateExportState({ 
        isExporting: true, 
        exportProgress: 0 
      })

      // Chamar callback de início
      onExportStart?.()

      // Validar dados
      const validation = validateExportData(data, options.columns || defaultColumns)
      if (!validation.isValid) {
        throw new Error(validation.errors.join('; '))
      }

      // Preparar opções de exportação
      const exportOptions: ExportOptions = {
        title: options.title || defaultTitle,
        filename: options.filename || defaultFilename,
        columns: options.columns || defaultColumns,
        data,
        includeTimestamp: options.includeTimestamp ?? true,
        includeFilters: options.includeFilters ?? false,
        filters: options.filters || {},
        organization,
        logo,
        ...options
      }

      // Simular progresso
      updateExportState({ exportProgress: 25 })

      // Executar exportação baseada no formato
      switch (format) {
        case 'pdf':
          await exportToPDF(exportOptions as any)
          break
        case 'excel':
          await exportToExcel(exportOptions as any)
          break
        case 'csv':
          await exportToCSV(exportOptions as any)
          break
        default:
          throw new Error(`Formato de exportação não suportado: ${format}`)
      }

      updateExportState({ exportProgress: 100 })

      // Atualizar estado com sucesso
      const result = {
        format,
        filename: exportOptions.filename,
        timestamp: new Date(),
        recordCount: data.length
      }

      updateExportState({
        isExporting: false,
        exportProgress: 0,
        lastExport: result
      })

      // Chamar callback de sucesso
      onExportComplete?.(result)

      return result

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido na exportação'
      
      updateExportState({
        isExporting: false,
        exportProgress: 0,
        exportError: errorMessage
      })

      // Chamar callback de erro
      onExportError?.(errorMessage)

      throw error
    }
  }, [
    defaultColumns,
    defaultTitle,
    defaultFilename,
    organization,
    logo,
    onExportStart,
    onExportComplete,
    onExportError,
    clearError,
    updateExportState
  ])

  // Função para exportar para PDF
  const exportToPDF = useCallback((data: any[], options: Partial<PDFOptions> = {}) => {
    return exportData(data, 'pdf', options)
  }, [exportData])

  // Função para exportar para Excel
  const exportToExcel = useCallback((data: any[], options: Partial<ExcelOptions> = {}) => {
    return exportData(data, 'excel', options)
  }, [exportData])

  // Função para exportar para CSV
  const exportToCSV = useCallback((data: any[], options: Partial<ExportOptions> = {}) => {
    return exportData(data, 'csv', options)
  }, [exportData])

  // Função para exportar com template pré-definido
  const exportWithTemplate = useCallback(async (
    data: any[],
    template: 'students' | 'tasks' | 'financial' | 'custom',
    format: 'pdf' | 'excel' | 'csv' = 'excel',
    customOptions: Partial<ExportOptions> = {}
  ) => {
    const templates = {
      students: {
        title: 'Relatório de Estudantes',
        filename: 'estudantes',
        columns: [
          { key: 'name', label: 'Nome', width: 25 },
          { key: 'email', label: 'E-mail', width: 30 },
          { key: 'phone', label: 'Telefone', width: 15 },
          { key: 'status', label: 'Status', width: 15 },
          { key: 'created_at', label: 'Data de Cadastro', width: 15 }
        ]
      },
      tasks: {
        title: 'Relatório de Tarefas',
        filename: 'tarefas',
        columns: [
          { key: 'title', label: 'Título', width: 30 },
          { key: 'status', label: 'Status', width: 15 },
          { key: 'priority', label: 'Prioridade', width: 15 },
          { key: 'assigned_to', label: 'Responsável', width: 20 },
          { key: 'due_date', label: 'Data de Vencimento', width: 15 },
          { key: 'created_at', label: 'Criado em', width: 15 }
        ]
      },
      financial: {
        title: 'Relatório Financeiro',
        filename: 'financeiro',
        columns: [
          { key: 'description', label: 'Descrição', width: 30 },
          { key: 'amount', label: 'Valor', width: 15, format: (value: number) => 
            new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
          },
          { key: 'type', label: 'Tipo', width: 15 },
          { key: 'category', label: 'Categoria', width: 20 },
          { key: 'date', label: 'Data', width: 15 },
          { key: 'status', label: 'Status', width: 15 }
        ]
      },
      custom: {
        title: 'Relatório Personalizado',
        filename: 'personalizado',
        columns: defaultColumns
      }
    }

    const templateConfig = templates[template]
    const options = {
      ...templateConfig,
      ...customOptions
    }

    return exportData(data, format, options)
  }, [exportData, defaultColumns])

  // Função para obter estatísticas da última exportação
  const getLastExportInfo = useCallback(() => {
    if (!state.lastExport) return null

    const { format, filename, timestamp, recordCount } = state.lastExport
    
    return {
      format: format.toUpperCase(),
      filename: `${filename}_${timestamp.toISOString().split('T')[0]}`,
      timestamp: timestamp.toLocaleString('pt-BR'),
      recordCount,
      timeAgo: getTimeAgo(timestamp)
    }
  }, [state.lastExport])

  // Função para obter tempo decorrido
  const getTimeAgo = (date: Date): string => {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    
    if (minutes < 1) return 'Agora mesmo'
    if (minutes < 60) return `${minutes} minuto${minutes !== 1 ? 's' : ''} atrás`
    
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours} hora${hours !== 1 ? 's' : ''} atrás`
    
    const days = Math.floor(hours / 24)
    return `${days} dia${days !== 1 ? 's' : ''} atrás`
  }

  return {
    // Estado
    isExporting: state.isExporting,
    exportProgress: state.exportProgress,
    exportError: state.exportError,
    lastExport: state.lastExport,
    
    // Ações
    exportData,
    exportToPDF,
    exportToExcel,
    exportToCSV,
    exportWithTemplate,
    clearError,
    
    // Utilitários
    getLastExportInfo,
    validateExportData: (data: any[], columns: ExportColumn[]) => 
      validateExportData(data, columns)
  }
}

export default useDataExport
