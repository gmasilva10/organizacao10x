'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Activity, Utensils, Brain, AlertTriangle } from 'lucide-react'

interface ReadinessType {
  id: string
  code: string
  label: string
  description: string
  stages: ReadinessStage[]
}

interface ReadinessStage {
  id: string
  stage: number
  label: string
  description: string
  readiness_type_id: string
}

interface ReadinessData {
  types: ReadinessType[]
  stages: ReadinessStage[]
  organized: ReadinessType[]
}

export function ReadinessCatalog() {
  const [readinessData, setReadinessData] = useState<ReadinessData | null>(null)
  const [loading, setLoading] = useState(true)
  const [queryTime, setQueryTime] = useState<number>(0)

  useEffect(() => {
    fetchReadinessData()
  }, [])

  const fetchReadinessData = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/guidelines/catalog/readiness')
      const data = await response.json()
      
      if (response.ok) {
        setReadinessData(data.data)
        setQueryTime(data.meta?.query_time_ms || 0)
      } else {
        console.error('Erro ao buscar dados de prontidão:', data.error)
      }
    } catch (error) {
      console.error('Erro ao buscar dados de prontidão:', error)
    } finally {
      setLoading(false)
    }
  }

  const getTypeIcon = (code: string) => {
    switch (code) {
      case 'exercicio': return <Activity className="h-5 w-5" />
      case 'alimentacao': return <Utensils className="h-5 w-5" />
      case 'ansiedade': return <Brain className="h-5 w-5" />
      case 'estresse': return <AlertTriangle className="h-5 w-5" />
      default: return <Activity className="h-5 w-5" />
    }
  }

  const getStageColor = (stage: number) => {
    switch (stage) {
      case 1: return 'bg-red-100 text-red-800 border-red-200'
      case 2: return 'bg-orange-100 text-orange-800 border-orange-200'
      case 3: return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 4: return 'bg-green-100 text-green-800 border-green-200'
      case 5: return 'bg-blue-100 text-blue-800 border-blue-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStageLabel = (stage: number) => {
    switch (stage) {
      case 1: return 'Muito Baixo'
      case 2: return 'Baixo'
      case 3: return 'Moderado'
      case 4: return 'Alto'
      case 5: return 'Muito Alto'
      default: return 'N/A'
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Catálogo de Prontidão</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!readinessData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Catálogo de Prontidão</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            Erro ao carregar dados de prontidão.
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Catálogo de Prontidão
          <Badge variant="secondary">
            {readinessData.types.length} tipos × {readinessData.stages.length} estágios
          </Badge>
          {queryTime > 0 && (
            <Badge variant="outline" className="text-xs">
              {queryTime}ms
            </Badge>
          )}
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Tipos de prontidão e seus estágios para avaliação do estado do aluno
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {readinessData.organized.map((type) => (
            <div key={type.id} className="border rounded-lg p-4 space-y-4">
              <div className="flex items-center gap-3">
                {getTypeIcon(type.code)}
                <div>
                  <h3 className="font-semibold text-lg">{type.label}</h3>
                  <p className="text-sm text-muted-foreground">{type.description}</p>
                </div>
                <Badge variant="outline" className="ml-auto">
                  {type.code}
                </Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                {type.stages
                  .sort((a, b) => a.stage - b.stage)
                  .map((stage) => (
                    <div
                      key={stage.id}
                      className={`border rounded-lg p-3 ${getStageColor(stage.stage)}`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="outline" className="text-xs">
                          Estágio {stage.stage}
                        </Badge>
                        <span className="text-xs font-medium">
                          {getStageLabel(stage.stage)}
                        </span>
                      </div>
                      <h4 className="font-medium text-sm mb-1">{stage.label}</h4>
                      <p className="text-xs opacity-80">{stage.description}</p>
                    </div>
                  ))}
              </div>
            </div>
          ))}

          {readinessData.organized.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum tipo de prontidão encontrado.
            </div>
          )}
        </div>

        <div className="mt-6 space-y-4">
          {/* Informações Gerais */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-medium text-sm mb-3 text-blue-900">📊 Sistema de Prontidão</h4>
            <p className="text-sm text-blue-800 mb-3">
              O sistema de prontidão avalia 4 dimensões essenciais para determinar a capacidade de treino do aluno. 
              Cada dimensão é avaliada em uma escala de 1 a 5, onde valores mais altos indicam maior prontidão.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-2">
                <h5 className="font-medium text-xs text-blue-900">Escala de Avaliação:</h5>
                <div className="space-y-1 text-xs text-blue-700">
                  <div className="flex justify-between">
                    <span>1 - Muito Baixo</span>
                    <span className="w-3 h-3 bg-red-200 rounded-full"></span>
                  </div>
                  <div className="flex justify-between">
                    <span>2 - Baixo</span>
                    <span className="w-3 h-3 bg-orange-200 rounded-full"></span>
                  </div>
                  <div className="flex justify-between">
                    <span>3 - Moderado</span>
                    <span className="w-3 h-3 bg-yellow-200 rounded-full"></span>
                  </div>
                  <div className="flex justify-between">
                    <span>4 - Alto</span>
                    <span className="w-3 h-3 bg-green-200 rounded-full"></span>
                  </div>
                  <div className="flex justify-between">
                    <span>5 - Muito Alto</span>
                    <span className="w-3 h-3 bg-blue-200 rounded-full"></span>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <h5 className="font-medium text-xs text-blue-900">Dimensões Avaliadas:</h5>
                <div className="space-y-1 text-xs text-blue-700">
                  <div className="flex items-center gap-2">
                    <Activity className="h-3 w-3" />
                    <span><strong>Exercício:</strong> Disposição física</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Utensils className="h-3 w-3" />
                    <span><strong>Alimentação:</strong> Qualidade da dieta</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Brain className="h-3 w-3" />
                    <span><strong>Ansiedade:</strong> Estado emocional</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-3 w-3" />
                    <span><strong>Estresse:</strong> Nível de estresse</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Como Usar */}
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <h4 className="font-medium text-sm mb-3 text-green-900">💡 Como Usar</h4>
            <div className="space-y-2 text-sm text-green-800">
              <p><strong>1. Avaliação:</strong> O aluno avalia cada dimensão em uma escala de 1 a 5</p>
              <p><strong>2. Interpretação:</strong> Valores baixos (1-2) indicam necessidade de ajustes no treino</p>
              <p><strong>3. Ajustes:</strong> O sistema pode sugerir modificações baseadas nos valores</p>
              <p><strong>4. Monitoramento:</strong> Acompanhe a evolução ao longo do tempo</p>
            </div>
          </div>

          {/* Dicas Práticas */}
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <h4 className="font-medium text-sm mb-3 text-amber-900">⚠️ Dicas Importantes</h4>
            <div className="space-y-2 text-sm text-amber-800">
              <p>• <strong>Consistência:</strong> Avalie sempre no mesmo horário (preferencialmente pela manhã)</p>
              <p>• <strong>Honestidade:</strong> O aluno deve ser honesto na autoavaliação</p>
              <p>• <strong>Contexto:</strong> Considere fatores externos (sono, trabalho, relacionamentos)</p>
              <p>• <strong>Flexibilidade:</strong> Ajuste o treino conforme a prontidão do dia</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
