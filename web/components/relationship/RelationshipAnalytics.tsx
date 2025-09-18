/**
 * GATE 10.6.7.5 - Analytics de Relacionamento
 * 
 * Funcionalidades:
 * - Métricas por âncora (incluindo 'manual')
 * - Filtros por classification_tag
 * - Volume por período
 * - Performance otimizada
 */

'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { 
  BarChart3, 
  TrendingUp, 
  MessageSquare, 
  Clock, 
  CheckCircle, 
  Pause, 
  X,
  RefreshCw
} from 'lucide-react'
import { toast } from 'sonner'

interface AnalyticsData {
  period: string
  start_date: string
  end_date: string
  metrics: {
    total_tasks: number
    by_anchor: Record<string, number>
    by_classification: Record<string, number>
    by_status: Record<string, number>
    by_period: Record<string, number>
    manual_tasks: number
    total_logs: number
    by_action: Record<string, number>
    by_channel: Record<string, number>
  }
  performance: {
    duration_ms: number
    tasks_processed: number
    logs_processed: number
  }
}

const PERIOD_OPTIONS = [
  { value: '7d', label: 'Últimos 7 dias' },
  { value: '30d', label: 'Últimos 30 dias' },
  { value: '90d', label: 'Últimos 90 dias' },
  { value: '1y', label: 'Último ano' }
]

const ANCHOR_LABELS = {
  'sale_close': 'Pós Venda',
  'first_workout': '1º Treino',
  'weekly_followup': 'Follow-up Semanal',
  'monthly_review': 'Revisão Mensal',
  'birthday': 'Aniversário',
  'renewal_window': 'Renovação',
  'occurrence_followup': 'Follow-up Ocorrência',
  'manual': 'Manual'
}

const STATUS_LABELS = {
  'pending': 'Pendente',
  'due_today': 'Para Hoje',
  'sent': 'Enviadas',
  'snoozed': 'Snoozed',
  'skipped': 'Puladas',
  'failed': 'Falharam'
}

const ACTION_LABELS = {
  'created': 'Criadas',
  'sent': 'Enviadas',
  'snoozed': 'Snoozed',
  'skipped': 'Puladas',
  'failed': 'Falharam',
  'recalculated': 'Recalculadas'
}

export default function RelationshipAnalytics() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('30d')
  const [anchorFilter, setAnchorFilter] = useState('all')
  const [classificationFilter, setClassificationFilter] = useState('all')

  const fetchAnalytics = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        period,
        ...(anchorFilter !== 'all' && { anchor: anchorFilter }),
        ...(classificationFilter !== 'all' && { classification_tag: classificationFilter })
      })

      const response = await fetch(`/api/relationship/analytics?${params}`)
      const result = await response.json()

      if (result.success) {
        setData(result.data)
      } else {
        toast.error('Erro ao carregar analytics')
      }
    } catch (error) {
      console.error('Erro ao buscar analytics:', error)
      toast.error('Erro ao carregar analytics')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAnalytics()
  }, [period, anchorFilter, classificationFilter])

  const getAnchorOptions = () => {
    if (!data) return []
    
    const anchors = Object.keys(data.metrics.by_anchor)
    return [
      { value: 'all', label: 'Todas as âncoras' },
      ...anchors.map(anchor => ({
        value: anchor,
        label: ANCHOR_LABELS[anchor as keyof typeof ANCHOR_LABELS] || anchor
      }))
    ]
  }

  const getClassificationOptions = () => {
    if (!data) return []
    
    const classifications = Object.keys(data.metrics.by_classification)
    return [
      { value: 'all', label: 'Todas as classificações' },
      ...classifications.map(classification => ({
        value: classification,
        label: classification
      }))
    ]
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Analytics de Relacionamento
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin mr-2" />
            Carregando analytics...
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Analytics de Relacionamento
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            Nenhum dado disponível
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header com Filtros */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Analytics de Relacionamento
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchAnalytics}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Período</label>
              <Select value={period} onValueChange={setPeriod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PERIOD_OPTIONS.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Âncora</label>
              <Select value={anchorFilter} onValueChange={setAnchorFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {getAnchorOptions().map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Classificação</label>
              <Select value={classificationFilter} onValueChange={setClassificationFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {getClassificationOptions().map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Métricas Principais */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total de Tarefas</p>
                <p className="text-2xl font-bold">{data.metrics.total_tasks}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Tarefas Manuais</p>
                <p className="text-2xl font-bold">{data.metrics.manual_tasks}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Enviadas</p>
                <p className="text-2xl font-bold">{data.metrics.by_status.sent || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-yellow-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pendentes</p>
                <p className="text-2xl font-bold">{data.metrics.by_status.pending || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Distribuição por Âncora */}
      <Card>
        <CardHeader>
          <CardTitle>Distribuição por Âncora</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Object.entries(data.metrics.by_anchor).map(([anchor, count]) => (
              <div key={anchor} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">
                    {ANCHOR_LABELS[anchor as keyof typeof ANCHOR_LABELS] || anchor}
                  </Badge>
                  {anchor === 'manual' && (
                    <Badge variant="secondary" className="text-xs">
                      Manual
                    </Badge>
                  )}
                </div>
                <span className="font-medium">{count}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Distribuição por Classificação */}
      {Object.keys(data.metrics.by_classification).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Distribuição por Classificação</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(data.metrics.by_classification).map(([classification, count]) => (
                <div key={classification} className="flex items-center justify-between">
                  <Badge variant="outline">{classification}</Badge>
                  <span className="font-medium">{count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Tempo de Resposta</p>
              <p className="text-lg font-bold">{data.performance.duration_ms}ms</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Tarefas Processadas</p>
              <p className="text-lg font-bold">{data.performance.tasks_processed}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Logs Processados</p>
              <p className="text-lg font-bold">{data.performance.logs_processed}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
