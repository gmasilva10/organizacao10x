/**
 * Modal de configuração de exportação
 * 
 * Funcionalidades:
 * - Configuração de colunas
 * - Seleção de formato
 * - Filtros aplicados
 * - Preview dos dados
 */

'use client'

import React, { useState, useMemo } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  Download, 
  Settings, 
  Eye, 
  CheckCircle,
  AlertCircle,
  FileText,
  FileSpreadsheet,
  Table
} from 'lucide-react'
import { cn } from '@/lib/utils'

import { useDataExport, UseDataExportOptions } from '@/hooks/useDataExport'
import { ExportColumn } from '@/lib/export/export-utils'

interface ExportModalProps {
  data: any[]
  columns: ExportColumn[]
  title?: string
  filename?: string
  template?: 'students' | 'tasks' | 'financial' | 'custom'
  options?: UseDataExportOptions
  trigger?: React.ReactNode
  className?: string
  showPreview?: boolean
  showFilters?: boolean
  filters?: Record<string, any>
}

export function ExportModal({
  data,
  columns,
  title: defaultTitle,
  filename: defaultFilename,
  template,
  options,
  trigger,
  className,
  showPreview = true,
  showFilters = false,
  filters = {}
}: ExportModalProps) {
  
  const [isOpen, setIsOpen] = useState(false)
  const [exportTitle, setExportTitle] = useState(defaultTitle || 'Relatório')
  const [exportFilename, setExportFilename] = useState(defaultFilename || 'relatorio')
  const [exportFormat, setExportFormat] = useState<'pdf' | 'excel' | 'csv'>('excel')
  const [includeTimestamp, setIncludeTimestamp] = useState(true)
  const [includeFilters, setIncludeFilters] = useState(showFilters)
  const [selectedColumns, setSelectedColumns] = useState<Set<string>>(
    new Set(columns.map(col => col.key))
  )
  const [customDescription, setCustomDescription] = useState('')

  const {
    isExporting,
    exportError,
    exportToPDF,
    exportToExcel,
    exportToCSV,
    exportWithTemplate,
    clearError
  } = useDataExport(options)

  // Filtrar colunas selecionadas
  const filteredColumns = useMemo(() => {
    return columns.filter(col => selectedColumns.has(col.key))
  }, [columns, selectedColumns])

  // Preview dos dados (primeiras 5 linhas)
  const previewData = useMemo(() => {
    return data.slice(0, 5).map(row => 
      filteredColumns.reduce((acc, col) => {
        acc[col.key] = col.format ? col.format(row[col.key]) : row[col.key]
        return acc
      }, {} as any)
    )
  }, [data, filteredColumns])

  const handleColumnToggle = (columnKey: string) => {
    const newSelected = new Set(selectedColumns)
    if (newSelected.has(columnKey)) {
      newSelected.delete(columnKey)
    } else {
      newSelected.add(columnKey)
    }
    setSelectedColumns(newSelected)
  }

  const handleSelectAllColumns = () => {
    setSelectedColumns(new Set(columns.map(col => col.key)))
  }

  const handleDeselectAllColumns = () => {
    setSelectedColumns(new Set())
  }

  const handleExport = async () => {
    try {
      const exportOptions = {
        title: exportTitle,
        filename: exportFilename,
        columns: filteredColumns,
        includeTimestamp,
        includeFilters,
        filters: includeFilters ? filters : undefined,
        subtitle: customDescription || undefined
      }

      if (template) {
        await exportWithTemplate(data, template, exportFormat, exportOptions)
      } else {
        switch (exportFormat) {
          case 'pdf':
            await exportToPDF(data, exportOptions)
            break
          case 'excel':
            await exportToExcel(data, exportOptions)
            break
          case 'csv':
            await exportToCSV(data, exportOptions)
            break
        }
      }

      setIsOpen(false)
    } catch (error) {
      console.error('Erro na exportação:', error)
    }
  }

  const formatIcon = {
    pdf: FileText,
    excel: FileSpreadsheet,
    csv: Table
  }

  const formatColor = {
    pdf: 'text-red-600',
    excel: 'text-green-600',
    csv: 'text-blue-600'
  }

  const defaultTrigger = (
    <Button variant="outline" size="sm" className="gap-2">
      <Settings className="h-4 w-4" />
      Configurar Exportação
    </Button>
  )

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Configurar Exportação
          </DialogTitle>
          <DialogDescription>
            Configure as opções de exportação, selecione as colunas desejadas e escolha o formato de saída.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informações básicas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Título do Relatório</Label>
              <Input
                id="title"
                value={exportTitle}
                onChange={(e) => setExportTitle(e.target.value)}
                placeholder="Digite o título do relatório..."
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="filename">Nome do Arquivo</Label>
              <Input
                id="filename"
                value={exportFilename}
                onChange={(e) => setExportFilename(e.target.value)}
                placeholder="Digite o nome do arquivo..."
              />
            </div>
          </div>

          {/* Formato de exportação */}
          <div className="space-y-2">
            <Label>Formato de Exportação</Label>
            <div className="grid grid-cols-3 gap-3">
              {(['excel', 'pdf', 'csv'] as const).map((format) => {
                const Icon = formatIcon[format]
                const isSelected = exportFormat === format
                
                return (
                  <Button
                    key={format}
                    variant={isSelected ? "default" : "outline"}
                    className="flex items-center gap-2 h-auto p-4"
                    onClick={() => setExportFormat(format)}
                  >
                    <Icon className={cn("h-5 w-5", isSelected ? "text-white" : formatColor[format])} />
                    <div className="text-left">
                      <div className="font-medium">{format.toUpperCase()}</div>
                      <div className="text-xs opacity-70">
                        {format === 'excel' && 'Planilha Excel'}
                        {format === 'pdf' && 'Documento PDF'}
                        {format === 'csv' && 'Arquivo CSV'}
                      </div>
                    </div>
                  </Button>
                )
              })}
            </div>
          </div>

          {/* Opções adicionais */}
          <div className="space-y-4">
            <Label>Opções Adicionais</Label>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="timestamp"
                  checked={includeTimestamp}
                  onCheckedChange={setIncludeTimestamp}
                />
                <Label htmlFor="timestamp">Incluir data e hora de geração</Label>
              </div>
              
              {showFilters && (
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="filters"
                    checked={includeFilters}
                    onCheckedChange={setIncludeFilters}
                  />
                  <Label htmlFor="filters">Incluir filtros aplicados</Label>
                </div>
              )}
            </div>
          </div>

          {/* Seleção de colunas */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Colunas a Incluir</Label>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSelectAllColumns}
                >
                  Selecionar Todas
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDeselectAllColumns}
                >
                  Desmarcar Todas
                </Button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-40 overflow-y-auto border rounded-lg p-3">
              {columns.map((column) => (
                <div key={column.key} className="flex items-center space-x-2">
                  <Checkbox
                    id={column.key}
                    checked={selectedColumns.has(column.key)}
                    onCheckedChange={() => handleColumnToggle(column.key)}
                  />
                  <Label htmlFor={column.key} className="text-sm">
                    {column.label}
                  </Label>
                </div>
              ))}
            </div>
            
            <div className="flex items-center gap-2">
              <Badge variant="secondary">
                {selectedColumns.size} de {columns.length} colunas selecionadas
              </Badge>
            </div>
          </div>

          {/* Descrição personalizada */}
          <div className="space-y-2">
            <Label htmlFor="description">Descrição (opcional)</Label>
            <Textarea
              id="description"
              value={customDescription}
              onChange={(e) => setCustomDescription(e.target.value)}
              placeholder="Digite uma descrição para o relatório..."
              rows={3}
            />
          </div>

          {/* Preview dos dados */}
          {showPreview && previewData.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                <Label>Preview dos Dados</Label>
                <Badge variant="outline">
                  {previewData.length} de {data.length} registros
                </Badge>
              </div>
              
              <div className="border rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        {filteredColumns.map((column) => (
                          <th key={column.key} className="px-3 py-2 text-left font-medium">
                            {column.label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {previewData.map((row, index) => (
                        <tr key={index} className={cn(
                          "border-t",
                          index % 2 === 0 ? "bg-white" : "bg-gray-50"
                        )}>
                          {filteredColumns.map((column) => (
                            <td key={column.key} className="px-3 py-2">
                              {row[column.key] || '-'}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Erro de exportação */}
          {exportError && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="h-4 w-4 text-red-500" />
              <span className="text-sm text-red-700">{exportError}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearError}
                className="h-6 w-6 p-0 text-red-500 hover:text-red-700 ml-auto"
              >
                ×
              </Button>
            </div>
          )}

          {/* Ações */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="text-sm text-muted-foreground">
              {data.length} registro{data.length !== 1 ? 's' : ''} • {filteredColumns.length} coluna{filteredColumns.length !== 1 ? 's' : ''}
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => setIsOpen(false)}
                disabled={isExporting}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleExport}
                disabled={isExporting || filteredColumns.length === 0}
                className="gap-2"
              >
                {isExporting ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Exportando...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4" />
                    Exportar {exportFormat.toUpperCase()}
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default ExportModal
