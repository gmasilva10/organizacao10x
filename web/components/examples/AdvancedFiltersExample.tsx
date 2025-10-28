/**
 * Exemplo de Uso dos Filtros Avançados
 * 
 * Demonstra como usar o sistema de filtros avançados
 * com diferentes tipos de filtros e configurações
 */

'use client'

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Search, Filter, Download, RefreshCw } from 'lucide-react'

import AdvancedFilters from '@/components/ui/AdvancedFilters'
import AdvancedFiltersDrawer from '@/components/ui/AdvancedFiltersDrawer'
import ActiveFilterTags from '@/components/ui/ActiveFilterTags'

import { useAdvancedFilters } from '@/hooks/useAdvancedFilters'

// Tipos para os filtros
interface FilterDefinition {
  key: string
  label: string
  type: 'text' | 'select' | 'multiselect' | 'date' | 'daterange' | 'number' | 'boolean'
  placeholder?: string
  options?: { value: string; label: string }[]
  validation?: {
    required?: boolean
    min?: number
    max?: number
    minLength?: number
    maxLength?: number
  }
}

// Configuração de exemplo para filtros de estudantes
const studentFilters: FilterDefinition[] = [
  {
    key: 'name',
    label: 'Nome do Aluno',
    type: 'text',
    placeholder: 'Digite o nome do aluno...',
    validation: {
      required: false,
      minLength: 2
    }
  },
  {
    key: 'status',
    label: 'Status',
    type: 'select',
    options: [
      { value: 'onboarding', label: 'Em Onboarding' },
      { value: 'active', label: 'Ativo' },
      { value: 'inactive', label: 'Inativo' },
      { value: 'completed', label: 'Concluído' }
    ]
  },
  {
    key: 'trainer',
    label: 'Treinador',
    type: 'multiselect',
    options: [
      { value: 'trainer-1', label: 'João Silva' },
      { value: 'trainer-2', label: 'Maria Santos' },
      { value: 'trainer-3', label: 'Pedro Costa' },
      { value: 'trainer-4', label: 'Ana Oliveira' }
    ]
  },
  {
    key: 'createdAt',
    label: 'Data de Cadastro',
    type: 'daterange',
    placeholder: 'Selecione o período...'
  },
  {
    key: 'age',
    label: 'Idade',
    type: 'number',
    validation: {
      min: 0,
      max: 100
    }
  },
  {
    key: 'hasPhone',
    label: 'Tem Telefone',
    type: 'boolean'
  }
]

export function AdvancedFiltersExample() {
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
  } = useAdvancedFilters({
    filters: studentFilters,
    storageKey: 'student-filters-example'
  })
  
  // Simular busca com os filtros
  const handleSearch = () => {
    console.log('🔍 Buscando com filtros:', debouncedValues)
    // Aqui você faria a chamada para a API
  }
  
  const handleExport = () => {
    console.log('📊 Exportando dados com filtros:', debouncedValues)
    // Aqui você faria a exportação dos dados
  }
  
  return (
    <div className="space-y-6 p-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Exemplo de Filtros Avançados</h1>
        <p className="text-muted-foreground">
          Demonstração do sistema de filtros avançados com diferentes tipos e configurações.
        </p>
      </div>
      
      {/* Card principal */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Busca de Estudantes
          </CardTitle>
          <CardDescription>
            Use os filtros abaixo para encontrar estudantes específicos
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Barra de ações */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <AdvancedFiltersDrawer
                filters={studentFilters}
                values={values}
                errors={errors}
                isValid={isValid}
                hasActiveFilters={hasActiveFilters}
                activeFiltersCount={activeFiltersCount}
                onUpdateFilter={updateFilter}
                onResetFilters={resetFilters}
                onClearFilter={clearFilter}
                onApplyFilters={handleSearch}
                title="Filtros de Estudantes"
                description="Configure os filtros para buscar estudantes específicos"
              />
              
              {hasActiveFilters && (
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                  {activeFiltersCount} filtro{activeFiltersCount !== 1 ? 's' : ''} ativo{activeFiltersCount !== 1 ? 's' : ''}
                </Badge>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleExport}>
                <Download className="h-4 w-4 mr-2" />
                Exportar
              </Button>
              <Button size="sm" onClick={handleSearch}>
                <Search className="h-4 w-4 mr-2" />
                Buscar
              </Button>
            </div>
          </div>
          
          {/* Tags de filtros ativos */}
          {hasActiveFilters && (
            <>
              <Separator />
              <ActiveFilterTags
                filters={studentFilters}
                values={values}
                onRemoveFilter={clearFilter}
                onClearAll={resetFilters}
              />
            </>
          )}
          
          {/* Filtros inline (versão compacta) */}
          <div className="border rounded-lg p-4 bg-muted/30">
            <div className="flex items-center gap-2 mb-4">
              <Filter className="h-4 w-4" />
              <h3 className="font-medium">Filtros Rápidos</h3>
            </div>
            
            <AdvancedFilters
              filters={studentFilters.slice(0, 3)} // Apenas os primeiros 3 filtros
              values={values}
              errors={errors}
              isValid={isValid}
              hasActiveFilters={hasActiveFilters}
              activeFiltersCount={activeFiltersCount}
              onUpdateFilter={updateFilter}
              onResetFilters={resetFilters}
              onClearFilter={clearFilter}
              compact
            />
          </div>
          
          {/* Informações de debug */}
          <div className="border rounded-lg p-4 bg-gray-50">
            <h3 className="font-medium mb-2">Debug - Valores dos Filtros:</h3>
            <pre className="text-xs text-gray-600 overflow-auto">
              {JSON.stringify(debouncedValues, null, 2)}
            </pre>
            
            <div className="mt-4 flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <span className="font-medium">Válido:</span>
                <Badge variant={isValid ? "default" : "destructive"}>
                  {isValid ? "Sim" : "Não"}
                </Badge>
              </div>
              
              <div className="flex items-center gap-2">
                <span className="font-medium">Filtros Ativos:</span>
                <Badge variant="secondary">
                  {activeFiltersCount}
                </Badge>
              </div>
              
              <div className="flex items-center gap-2">
                <span className="font-medium">Erros:</span>
                <Badge variant={Object.keys(errors).length > 0 ? "destructive" : "secondary"}>
                  {Object.keys(errors).length}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Exemplo de uso em diferentes contextos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Exemplo 1: Filtros simples */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Filtros Simples</CardTitle>
            <CardDescription>
              Apenas filtros de texto e seleção
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AdvancedFilters
              filters={studentFilters.slice(0, 2)}
              values={values}
              errors={errors}
              isValid={isValid}
              hasActiveFilters={hasActiveFilters}
              activeFiltersCount={activeFiltersCount}
              onUpdateFilter={updateFilter}
              onResetFilters={resetFilters}
              onClearFilter={clearFilter}
              compact
            />
          </CardContent>
        </Card>
        
        {/* Exemplo 2: Filtros complexos */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Filtros Complexos</CardTitle>
            <CardDescription>
              Filtros com validação e tipos avançados
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AdvancedFilters
              filters={studentFilters.slice(2)}
              values={values}
              errors={errors}
              isValid={isValid}
              hasActiveFilters={hasActiveFilters}
              activeFiltersCount={activeFiltersCount}
              onUpdateFilter={updateFilter}
              onResetFilters={resetFilters}
              onClearFilter={clearFilter}
              compact
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default AdvancedFiltersExample
