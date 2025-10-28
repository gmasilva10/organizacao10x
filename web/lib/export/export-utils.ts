/**
 * Utilitários para exportação de dados
 * 
 * Funcionalidades:
 * - Exportação para PDF com jsPDF
 * - Exportação para Excel com xlsx
 * - Formatação de dados
 * - Templates personalizáveis
 */

import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'

// Tipos para exportação
export interface ExportColumn {
  key: string
  label: string
  width?: number
  format?: (value: any) => string
  align?: 'left' | 'center' | 'right'
}

export interface ExportOptions {
  title: string
  subtitle?: string
  filename: string
  columns: ExportColumn[]
  data: any[]
  includeTimestamp?: boolean
  includeFilters?: boolean
  filters?: Record<string, any>
  logo?: string
  organization?: string
}

export interface PDFOptions extends ExportOptions {
  orientation?: 'portrait' | 'landscape'
  fontSize?: number
  headerColor?: string
  rowColors?: {
    even: string
    odd: string
  }
}

export interface ExcelOptions extends ExportOptions {
  sheetName?: string
  includeFormulas?: boolean
  autoFilter?: boolean
  freezePanes?: string
}

// Utilitários de formatação
export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value)
}

export const formatDate = (date: string | Date): string => {
  const d = new Date(date)
  return d.toLocaleDateString('pt-BR')
}

export const formatDateTime = (date: string | Date): string => {
  const d = new Date(date)
  return d.toLocaleString('pt-BR')
}

export const formatNumber = (value: number): string => {
  return new Intl.NumberFormat('pt-BR').format(value)
}

export const formatPercentage = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'percent',
    minimumFractionDigits: 2
  }).format(value / 100)
}

// Exportação para PDF
export async function exportToPDF(options: PDFOptions): Promise<void> {
  const {
    title,
    subtitle,
    filename,
    columns,
    data,
    includeTimestamp = true,
    includeFilters = false,
    filters = {},
    logo,
    organization,
    orientation = 'portrait',
    fontSize = 10,
    headerColor = '#3b82f6',
    rowColors = {
      even: '#f8fafc',
      odd: '#ffffff'
    }
  } = options

  // Criar documento PDF
  const doc = new jsPDF({
    orientation,
    unit: 'mm',
    format: 'a4'
  })

  // Configurar fonte
  doc.setFontSize(fontSize)

  // Adicionar logo (se fornecido)
  if (logo) {
    try {
      const img = new Image()
      img.src = logo
      await new Promise((resolve) => {
        img.onload = () => {
          const imgWidth = 30
          const imgHeight = (img.height * imgWidth) / img.width
          doc.addImage(img, 'PNG', 15, 15, imgWidth, imgHeight)
          resolve(void 0)
        }
      })
    } catch (error) {
      console.warn('Erro ao carregar logo:', error)
    }
  }

  // Adicionar título
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text(title, 15, logo ? 60 : 30)

  // Adicionar subtítulo
  if (subtitle) {
    doc.setFontSize(12)
    doc.setFont('helvetica', 'normal')
    doc.text(subtitle, 15, logo ? 70 : 40)
  }

  // Adicionar organização
  if (organization) {
    doc.setFontSize(10)
    doc.text(organization, 15, logo ? 80 : 50)
  }

  // Adicionar timestamp
  if (includeTimestamp) {
    const timestamp = new Date().toLocaleString('pt-BR')
    doc.setFontSize(8)
    doc.text(`Gerado em: ${timestamp}`, 15, logo ? 90 : 60)
  }

  // Adicionar filtros
  if (includeFilters && Object.keys(filters).length > 0) {
    let yPos = logo ? 100 : 70
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.text('Filtros aplicados:', 15, yPos)
    
    yPos += 5
    doc.setFont('helvetica', 'normal')
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        const filterText = `${key}: ${value}`
        doc.text(filterText, 20, yPos)
        yPos += 5
      }
    })
  }

  // Preparar dados para tabela
  const tableData = data.map(row => 
    columns.map(col => {
      const value = row[col.key]
      return col.format ? col.format(value) : String(value || '')
    })
  )

  const tableHeaders = columns.map(col => col.label)

  // Adicionar tabela
  autoTable(doc, {
    head: [tableHeaders],
    body: tableData,
    startY: logo ? 120 : 90,
    styles: {
      fontSize: fontSize,
      cellPadding: 4,
      overflow: 'linebreak',
      halign: 'left'
    },
    headStyles: {
      fillColor: headerColor,
      textColor: '#ffffff',
      fontStyle: 'bold',
      halign: 'center'
    },
    alternateRowStyles: {
      fillColor: rowColors.even
    },
    columnStyles: columns.reduce((acc, col, index) => {
      acc[index] = {
        halign: col.align || 'left',
        cellWidth: col.width ? `${col.width}%` : 'auto'
      }
      return acc
    }, {} as any),
    didDrawPage: (data) => {
      // Adicionar número da página
      doc.setFontSize(8)
      doc.text(
        `Página ${data.pageNumber}`,
        doc.internal.pageSize.width - 30,
        doc.internal.pageSize.height - 10
      )
    }
  })

  // Salvar arquivo
  const finalFilename = `${filename}_${new Date().toISOString().split('T')[0]}.pdf`
  doc.save(finalFilename)
}

// Exportação para Excel
export async function exportToExcel(options: ExcelOptions): Promise<void> {
  const {
    title,
    subtitle,
    filename,
    columns,
    data,
    includeTimestamp = true,
    includeFilters = false,
    filters = {},
    sheetName = 'Dados',
    includeFormulas = false,
    autoFilter = true,
    freezePanes = 'A2'
  } = options

  // Criar workbook
  const workbook = XLSX.utils.book_new()

  // Preparar dados
  const worksheetData = [
    // Cabeçalho com título
    [title],
    subtitle ? [subtitle] : [],
    options.organization ? [options.organization] : [],
    includeTimestamp ? [`Gerado em: ${new Date().toLocaleString('pt-BR')}`] : [],
    [], // Linha em branco
    // Cabeçalhos das colunas
    columns.map(col => col.label),
    // Dados
    ...data.map(row => 
      columns.map(col => {
        const value = row[col.key]
        return col.format ? col.format(value) : value
      })
    )
  ]

  // Adicionar filtros se solicitado
  if (includeFilters && Object.keys(filters).length > 0) {
    const filterRow = ['Filtros aplicados:']
    const filterEntries = Object.entries(filters).filter(([_, value]) => 
      value !== null && value !== undefined && value !== ''
    )
    filterEntries.forEach(([key, value]) => {
      filterRow.push(`${key}: ${value}`)
    })
    worksheetData.splice(4, 0, filterRow, []) // Inserir após timestamp
  }

  // Criar worksheet
  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData)

  // Configurar largura das colunas
  const colWidths = columns.map(col => ({
    wch: col.width ? col.width / 10 : Math.max(col.label.length, 15)
  }))
  worksheet['!cols'] = colWidths

  // Configurar freeze panes
  if (freezePanes) {
    worksheet['!freeze'] = { xSplit: 0, ySplit: 5 }
  }

  // Adicionar auto filter
  if (autoFilter) {
    const headerRow = includeFilters ? 6 : 5
    const dataRange = XLSX.utils.encode_range({
      s: { c: 0, r: headerRow },
      e: { c: columns.length - 1, r: headerRow + data.length }
    })
    worksheet['!autofilter'] = { ref: dataRange }
  }

  // Adicionar worksheet ao workbook
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)

  // Gerar arquivo
  const excelBuffer = XLSX.write(workbook, { 
    bookType: 'xlsx', 
    type: 'array',
    cellStyles: true
  })

  // Salvar arquivo
  const finalFilename = `${filename}_${new Date().toISOString().split('T')[0]}.xlsx`
  const blob = new Blob([excelBuffer], { 
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
  })
  saveAs(blob, finalFilename)
}

// Exportação para CSV
export async function exportToCSV(options: ExportOptions): Promise<void> {
  const {
    title,
    filename,
    columns,
    data,
    includeTimestamp = true,
    includeFilters = false,
    filters = {}
  } = options

  // Preparar dados CSV
  const csvRows = []
  
  // Adicionar título
  csvRows.push(title)
  
  // Adicionar timestamp
  if (includeTimestamp) {
    csvRows.push(`Gerado em: ${new Date().toLocaleString('pt-BR')}`)
  }
  
  // Adicionar filtros
  if (includeFilters && Object.keys(filters).length > 0) {
    csvRows.push('Filtros aplicados:')
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        csvRows.push(`${key}: ${value}`)
      }
    })
  }
  
  // Linha em branco
  csvRows.push('')
  
  // Cabeçalhos
  csvRows.push(columns.map(col => `"${col.label}"`).join(','))
  
  // Dados
  data.forEach(row => {
    const rowData = columns.map(col => {
      const value = row[col.key]
      const formattedValue = col.format ? col.format(value) : String(value || '')
      return `"${formattedValue.replace(/"/g, '""')}"`
    })
    csvRows.push(rowData.join(','))
  })
  
  // Gerar CSV
  const csvContent = csvRows.join('\n')
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  
  // Salvar arquivo
  const finalFilename = `${filename}_${new Date().toISOString().split('T')[0]}.csv`
  saveAs(blob, finalFilename)
}

// Função utilitária para obter formato de arquivo baseado na extensão
export function getFileFormat(filename: string): 'pdf' | 'excel' | 'csv' {
  const extension = filename.toLowerCase().split('.').pop()
  switch (extension) {
    case 'pdf':
      return 'pdf'
    case 'xlsx':
    case 'xls':
      return 'excel'
    case 'csv':
      return 'csv'
    default:
      return 'excel' // Default para Excel
  }
}

// Função para validar dados antes da exportação
export function validateExportData(data: any[], columns: ExportColumn[]): {
  isValid: boolean
  errors: string[]
} {
  const errors: string[] = []
  
  if (!data || data.length === 0) {
    errors.push('Nenhum dado fornecido para exportação')
  }
  
  if (!columns || columns.length === 0) {
    errors.push('Nenhuma coluna definida para exportação')
  }
  
  if (data && columns) {
    // Verificar se todas as colunas têm chaves válidas
    const validKeys = new Set(columns.map(col => col.key))
    const invalidKeys = columns.filter(col => !col.key).map(col => col.label)
    
    if (invalidKeys.length > 0) {
      errors.push(`Colunas sem chave definida: ${invalidKeys.join(', ')}`)
    }
    
    // Verificar se há dados suficientes
    if (data.length > 10000) {
      errors.push('Muitos dados para exportação (máximo 10.000 registros)')
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

export default {
  exportToPDF,
  exportToExcel,
  exportToCSV,
  getFileFormat,
  validateExportData,
  formatCurrency,
  formatDate,
  formatDateTime,
  formatNumber,
  formatPercentage
}
