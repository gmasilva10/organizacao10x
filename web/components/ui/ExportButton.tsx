/**
 * Componente de botão de exportação
 * 
 * Funcionalidades:
 * - Botão com dropdown para diferentes formatos
 * - Indicador de progresso
 * - Feedback de sucesso/erro
 * - Configuração de templates
 */

'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { 
  Download, 
  FileText, 
  Table, 
  FileSpreadsheet,
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react'
import { cn } from '@/lib/utils'

import { useDataExport, UseDataExportOptions } from '@/hooks/useDataExport'

interface ExportButtonProps {
  data: any[]
  columns?: Array<{
    key: string
    label: string
    width?: number
    format?: (value: any) => string
    align?: 'left' | 'center' | 'right'
  }>
  title?: string
  filename?: string
  template?: 'students' | 'tasks' | 'financial' | 'custom'
  options?: UseDataExportOptions
  className?: string
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link' | 'destructive'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  showProgress?: boolean
  showLastExport?: boolean
  disabled?: boolean
}

export function ExportButton({
  data,
  columns,
  title,
  filename,
  template,
  options,
  className,
  variant = 'outline',
  size = 'sm',
  showProgress = true,
  showLastExport = true,
  disabled = false
}: ExportButtonProps) {
  
  const {
    isExporting,
    exportProgress,
    exportError,
    lastExport,
    exportToPDF,
    exportToExcel,
    exportToCSV,
    exportWithTemplate,
    clearError,
    getLastExportInfo
  } = useDataExport(options)

  const handleExport = async (format: 'pdf' | 'excel' | 'csv') => {
    try {
      if (template) {
        await exportWithTemplate(data, template, format, {
          title,
          filename,
          columns
        })
      } else {
        await exportData(data, format, {
          title,
          filename,
          columns
        })
      }
    } catch (error) {
      console.error('Erro na exportação:', error)
    }
  }

  const exportData = async (data: any[], format: 'pdf' | 'excel' | 'csv', options: any) => {
    switch (format) {
      case 'pdf':
        return exportToPDF(data, options)
      case 'excel':
        return exportToExcel(data, options)
      case 'csv':
        return exportToCSV(data, options)
    }
  }

  const lastExportInfo = getLastExportInfo()

  return (
    <div className="space-y-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant={variant}
            size={size}
            disabled={disabled || isExporting || data.length === 0}
            className={cn("gap-2", className)}
          >
            {isExporting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            {isExporting ? 'Exportando...' : 'Exportar'}
            {data.length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {data.length}
              </Badge>
            )}
          </Button>
        </DropdownMenuTrigger>
        
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Formato de Exportação</DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          <DropdownMenuItem
            onClick={() => handleExport('excel')}
            disabled={isExporting || data.length === 0}
            className="gap-2"
          >
            <FileSpreadsheet className="h-4 w-4 text-green-600" />
            Excel (.xlsx)
          </DropdownMenuItem>
          
          <DropdownMenuItem
            onClick={() => handleExport('pdf')}
            disabled={isExporting || data.length === 0}
            className="gap-2"
          >
            <FileText className="h-4 w-4 text-red-600" />
            PDF (.pdf)
          </DropdownMenuItem>
          
          <DropdownMenuItem
            onClick={() => handleExport('csv')}
            disabled={isExporting || data.length === 0}
            className="gap-2"
          >
            <Table className="h-4 w-4 text-blue-600" />
            CSV (.csv)
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Indicador de progresso */}
      {showProgress && isExporting && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Exportando... {exportProgress}%
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${exportProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Feedback de erro */}
      {exportError && (
        <div className="flex items-center gap-2 p-2 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="h-4 w-4 text-red-500" />
          <span className="text-sm text-red-700">{exportError}</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={clearError}
            className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
          >
            ×
          </Button>
        </div>
      )}

      {/* Informações da última exportação */}
      {showLastExport && lastExportInfo && (
        <div className="flex items-center gap-2 p-2 bg-green-50 border border-green-200 rounded-lg">
          <CheckCircle className="h-4 w-4 text-green-500" />
          <div className="text-sm text-green-700">
            <div className="font-medium">
              Última exportação: {lastExportInfo.format}
            </div>
            <div className="text-xs text-green-600">
              {lastExportInfo.recordCount} registros • {lastExportInfo.timeAgo}
            </div>
          </div>
        </div>
      )}

      {/* Aviso se não há dados */}
      {data.length === 0 && (
        <div className="flex items-center gap-2 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
          <AlertCircle className="h-4 w-4 text-yellow-500" />
          <span className="text-sm text-yellow-700">
            Nenhum dado disponível para exportação
          </span>
        </div>
      )}
    </div>
  )
}

export default ExportButton
