/**
 * Exemplo de Uso do Sistema de Exportação
 * 
 * Demonstra como usar os componentes de exportação
 * com diferentes tipos de dados e configurações
 */

'use client'

import React, { useState, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Download, 
  FileText, 
  Users, 
  CheckSquare,
  DollarSign,
  Search,
  Filter,
  Settings
} from 'lucide-react'

import ExportButton from '@/components/ui/ExportButton'
import ExportModal from '@/components/ui/ExportModal'
import { useDataExport } from '@/hooks/useDataExport'
import { formatCurrency, formatDate, formatNumber } from '@/lib/export/export-utils'

// Dados de exemplo para estudantes
const sampleStudents = [
  {
    id: '1',
    name: 'João Silva',
    email: 'joao.silva@email.com',
    phone: '11999999999',
    status: 'active',
    created_at: '2024-01-15',
    trainer: 'Maria Santos',
    age: 25,
    city: 'São Paulo'
  },
  {
    id: '2',
    name: 'Ana Costa',
    email: 'ana.costa@email.com',
    phone: '11988888888',
    status: 'onboarding',
    created_at: '2024-01-20',
    trainer: 'Pedro Oliveira',
    age: 30,
    city: 'Rio de Janeiro'
  },
  {
    id: '3',
    name: 'Carlos Santos',
    email: 'carlos.santos@email.com',
    phone: '11977777777',
    status: 'completed',
    created_at: '2024-01-10',
    trainer: 'Maria Santos',
    age: 28,
    city: 'Belo Horizonte'
  }
]

// Dados de exemplo para tarefas
const sampleTasks = [
  {
    id: '1',
    title: 'Revisar documentação',
    status: 'completed',
    priority: 'high',
    assigned_to: 'João Silva',
    due_date: '2024-01-25',
    created_at: '2024-01-20',
    description: 'Revisar documentação técnica do projeto'
  },
  {
    id: '2',
    title: 'Implementar nova funcionalidade',
    status: 'in_progress',
    priority: 'medium',
    assigned_to: 'Ana Costa',
    due_date: '2024-01-30',
    created_at: '2024-01-22',
    description: 'Implementar sistema de notificações'
  },
  {
    id: '3',
    title: 'Testes de integração',
    status: 'pending',
    priority: 'low',
    assigned_to: 'Carlos Santos',
    due_date: '2024-02-05',
    created_at: '2024-01-25',
    description: 'Executar testes de integração completos'
  }
]

// Dados de exemplo para transações financeiras
const sampleTransactions = [
  {
    id: '1',
    description: 'Pagamento de mensalidade',
    amount: 150.00,
    type: 'income',
    category: 'Mensalidades',
    date: '2024-01-15',
    status: 'completed'
  },
  {
    id: '2',
    description: 'Compra de material didático',
    amount: -50.00,
    type: 'expense',
    category: 'Material',
    date: '2024-01-18',
    status: 'completed'
  },
  {
    id: '3',
    description: 'Pagamento de fornecedor',
    amount: -200.00,
    type: 'expense',
    category: 'Fornecedores',
    date: '2024-01-20',
    status: 'pending'
  }
]

export function ExportExample() {
  const [selectedDataType, setSelectedDataType] = useState<'students' | 'tasks' | 'financial'>('students')
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  // Dados filtrados baseados na seleção
  const currentData = useMemo(() => {
    switch (selectedDataType) {
      case 'students':
        return sampleStudents
      case 'tasks':
        return sampleTasks
      case 'financial':
        return sampleTransactions
      default:
        return []
    }
  }, [selectedDataType])

  // Dados filtrados por busca e status
  const filteredData = useMemo(() => {
    let filtered = currentData

    if (searchQuery) {
      filtered = filtered.filter(item => 
        Object.values(item as any).some((value: any) => 
          String(value).toLowerCase().includes(searchQuery.toLowerCase())
        )
      ) as any
    }

    if (statusFilter) {
      filtered = filtered.filter(item => (item as any).status === statusFilter) as any
    }

    return filtered
  }, [currentData, searchQuery, statusFilter])

  // Configuração de colunas para estudantes
  const studentColumns = [
    { key: 'name', label: 'Nome', width: 25 },
    { key: 'email', label: 'E-mail', width: 30 },
    { key: 'phone', label: 'Telefone', width: 15 },
    { key: 'status', label: 'Status', width: 15 },
    { key: 'created_at', label: 'Data de Cadastro', width: 15, format: formatDate },
    { key: 'trainer', label: 'Treinador', width: 20 },
    { key: 'age', label: 'Idade', width: 10, format: formatNumber },
    { key: 'city', label: 'Cidade', width: 20 }
  ]

  // Configuração de colunas para tarefas
  const taskColumns = [
    { key: 'title', label: 'Título', width: 30 },
    { key: 'status', label: 'Status', width: 15 },
    { key: 'priority', label: 'Prioridade', width: 15 },
    { key: 'assigned_to', label: 'Responsável', width: 20 },
    { key: 'due_date', label: 'Data de Vencimento', width: 15, format: formatDate },
    { key: 'created_at', label: 'Criado em', width: 15, format: formatDate },
    { key: 'description', label: 'Descrição', width: 40 }
  ]

  // Configuração de colunas para transações financeiras
  const financialColumns = [
    { key: 'description', label: 'Descrição', width: 30 },
    { key: 'amount', label: 'Valor', width: 15, format: formatCurrency },
    { key: 'type', label: 'Tipo', width: 15 },
    { key: 'category', label: 'Categoria', width: 20 },
    { key: 'date', label: 'Data', width: 15, format: formatDate },
    { key: 'status', label: 'Status', width: 15 }
  ]

  // Colunas atuais baseadas no tipo de dados selecionado
  const currentColumns = useMemo(() => {
    switch (selectedDataType) {
      case 'students':
        return studentColumns
      case 'tasks':
        return taskColumns
      case 'financial':
        return financialColumns
      default:
        return []
    }
  }, [selectedDataType])

  // Configuração do hook de exportação
  const exportOptions = {
    defaultColumns: currentColumns,
    defaultTitle: `Relatório de ${selectedDataType === 'students' ? 'Estudantes' : selectedDataType === 'tasks' ? 'Tarefas' : 'Transações Financeiras'}`,
    defaultFilename: selectedDataType,
    organization: 'Organização 10x',
    onExportStart: () => console.log('Iniciando exportação...'),
    onExportComplete: (result: any) => console.log('Exportação concluída:', result),
    onExportError: (error: any) => console.error('Erro na exportação:', error)
  }

  return (
    <div className="space-y-6 p-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Exemplo de Sistema de Exportação</h1>
        <p className="text-muted-foreground">
          Demonstração do sistema de exportação com diferentes tipos de dados e configurações.
        </p>
      </div>

      {/* Card principal */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Exportação de Dados
          </CardTitle>
          <CardDescription>
            Selecione o tipo de dados e configure a exportação
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Seleção do tipo de dados */}
          <div className="space-y-4">
            <Label>Tipo de Dados</Label>
            <div className="grid grid-cols-3 gap-3">
              <Button
                variant={selectedDataType === 'students' ? 'default' : 'outline'}
                className="flex items-center gap-2 h-auto p-4"
                onClick={() => setSelectedDataType('students')}
              >
                <Users className="h-5 w-5" />
                <div className="text-left">
                  <div className="font-medium">Estudantes</div>
                  <div className="text-xs opacity-70">{sampleStudents.length} registros</div>
                </div>
              </Button>
              
              <Button
                variant={selectedDataType === 'tasks' ? 'default' : 'outline'}
                className="flex items-center gap-2 h-auto p-4"
                onClick={() => setSelectedDataType('tasks')}
              >
                <CheckSquare className="h-5 w-5" />
                <div className="text-left">
                  <div className="font-medium">Tarefas</div>
                  <div className="text-xs opacity-70">{sampleTasks.length} registros</div>
                </div>
              </Button>
              
              <Button
                variant={selectedDataType === 'financial' ? 'default' : 'outline'}
                className="flex items-center gap-2 h-auto p-4"
                onClick={() => setSelectedDataType('financial')}
              >
                <DollarSign className="h-5 w-5" />
                <div className="text-left">
                  <div className="font-medium">Financeiro</div>
                  <div className="text-xs opacity-70">{sampleTransactions.length} registros</div>
                </div>
              </Button>
            </div>
          </div>

          {/* Filtros */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search">Buscar</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Buscar registros..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todos os status</option>
                {selectedDataType === 'students' && (
                  <>
                    <option value="active">Ativo</option>
                    <option value="onboarding">Em Onboarding</option>
                    <option value="completed">Concluído</option>
                  </>
                )}
                {selectedDataType === 'tasks' && (
                  <>
                    <option value="pending">Pendente</option>
                    <option value="in_progress">Em Andamento</option>
                    <option value="completed">Concluída</option>
                  </>
                )}
                {selectedDataType === 'financial' && (
                  <>
                    <option value="completed">Concluída</option>
                    <option value="pending">Pendente</option>
                  </>
                )}
              </select>
            </div>
          </div>

          {/* Informações dos dados */}
          <div className="flex items-center gap-4">
            <Badge variant="outline">
              {filteredData.length} de {currentData.length} registros
            </Badge>
            {searchQuery && (
              <Badge variant="secondary">
                Busca: "{searchQuery}"
              </Badge>
            )}
            {statusFilter && (
              <Badge variant="secondary">
                Status: {statusFilter}
              </Badge>
            )}
          </div>

          {/* Botões de exportação */}
          <div className="flex items-center gap-4">
            <ExportButton
              data={filteredData}
              columns={currentColumns}
              title={`Relatório de ${selectedDataType === 'students' ? 'Estudantes' : selectedDataType === 'tasks' ? 'Tarefas' : 'Transações Financeiras'}`}
              filename={selectedDataType}
              template={selectedDataType}
              options={exportOptions}
              showProgress
              showLastExport
            />
            
            <ExportModal
              data={filteredData}
              columns={currentColumns}
              title={`Relatório de ${selectedDataType === 'students' ? 'Estudantes' : selectedDataType === 'tasks' ? 'Tarefas' : 'Transações Financeiras'}`}
              filename={selectedDataType}
              template={selectedDataType}
              options={exportOptions}
              showPreview
              showFilters
              filters={{
                search: searchQuery,
                status: statusFilter
              }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Exemplo de uso em diferentes contextos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Exemplo 1: Exportação simples */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Exportação Simples</CardTitle>
            <CardDescription>
              Botão de exportação com configuração mínima
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ExportButton
              data={filteredData}
              columns={currentColumns}
              title="Relatório Simples"
              filename="relatorio_simples"
              variant="outline"
              size="sm"
            />
          </CardContent>
        </Card>

        {/* Exemplo 2: Exportação com template */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Exportação com Template</CardTitle>
            <CardDescription>
              Exportação usando templates pré-definidos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ExportButton
              data={filteredData}
              columns={currentColumns}
              template={selectedDataType}
              title="Relatório com Template"
              filename="relatorio_template"
              variant="default"
              size="sm"
            />
          </CardContent>
        </Card>
      </div>

      {/* Tabela de preview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Preview dos Dados</CardTitle>
          <CardDescription>
            Visualização dos dados que serão exportados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  {currentColumns.map((column) => (
                    <th key={column.key} className="px-3 py-2 text-left font-medium">
                      {column.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredData.map((row, index) => (
                  <tr key={index} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                    {currentColumns.map((column) => (
                      <td key={column.key} className="px-3 py-2">
                        {column.format ? column.format((row as any)[column.key]) : (row as any)[column.key]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default ExportExample
