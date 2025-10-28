"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  BarChart3, 
  TrendingUp, 
  AlertTriangle, 
  Clock, 
  Activity,
  RefreshCw,
  Download,
  Eye
} from "lucide-react"

interface APIMetric {
  route: string
  totalRequests: number
  errorRate: number
  p95Latency: number
  avgLatency: number
  last24h: {
    requests: number
    errors: number
    avgLatency: number
  }
}

interface MetricsData {
  success: boolean
  data: APIMetric[]
  timestamp: string
  route: string
}

export default function MetricsDashboard() {
  const [metrics, setMetrics] = useState<APIMetric[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())

  const fetchMetrics = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/metrics')
      const data: MetricsData = await response.json()
      
      if (data.success && Array.isArray(data.data)) {
        setMetrics(data.data)
        setLastRefresh(new Date())
      } else {
        setError('Falha ao carregar métricas')
      }
    } catch (err) {
      setError('Erro de conexão com o servidor')
      console.error('Error fetching metrics:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMetrics()
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchMetrics, 30000)
    return () => clearInterval(interval)
  }, [])

  const getStatusColor = (errorRate: number, latency: number) => {
    if (errorRate > 5 || latency > 2000) return "destructive"
    if (errorRate > 2 || latency > 1000) return "secondary"
    return "default"
  }

  const getStatusIcon = (errorRate: number, latency: number) => {
    if (errorRate > 5 || latency > 2000) return <AlertTriangle className="h-4 w-4" />
    if (errorRate > 2 || latency > 1000) return <Clock className="h-4 w-4" />
    return <Activity className="h-4 w-4" />
  }

  const exportMetrics = () => {
    const csvData = metrics.map(metric => ({
      Route: metric.route,
      'Total Requests': metric.totalRequests,
      'Error Rate (%)': metric.errorRate.toFixed(2),
      'P95 Latency (ms)': metric.p95Latency,
      'Avg Latency (ms)': metric.avgLatency.toFixed(2),
      'Requests (24h)': metric.last24h.requests,
      'Errors (24h)': metric.last24h.errors,
      'Avg Latency 24h (ms)': metric.last24h.avgLatency.toFixed(2)
    }))

    const csv = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `metrics-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading && metrics.length === 0) {
    return (
      <div className="container py-6">
        <div className="flex items-center justify-center py-8">
          <RefreshCw className="h-6 w-6 animate-spin mr-2" />
          <span>Carregando métricas...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container py-6">
        <Card>
          <CardContent className="py-8 text-center">
            <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-red-500" />
            <h3 className="text-lg font-semibold mb-2">Erro ao carregar métricas</h3>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={fetchMetrics}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Tentar novamente
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <BarChart3 className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold">Dashboard de Métricas</h1>
            <p className="text-muted-foreground">
              Monitoramento de performance e saúde das APIs
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-sm">
            <Clock className="h-3 w-3 mr-1" />
            Atualizado: {lastRefresh.toLocaleTimeString()}
          </Badge>
          <Button variant="outline" onClick={fetchMetrics} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          <Button variant="outline" onClick={exportMetrics}>
            <Download className="h-4 w-4 mr-2" />
            Exportar CSV
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Rotas</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.length}</div>
            <p className="text-xs text-muted-foreground">
              APIs monitoradas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Erro Média</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics.length > 0 
                ? (metrics.reduce((sum, m) => sum + m.errorRate, 0) / metrics.length).toFixed(2)
                : '0.00'
              }%
            </div>
            <p className="text-xs text-muted-foreground">
              Últimas 24h
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Latência P95 Média</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics.length > 0 
                ? Math.round(metrics.reduce((sum, m) => sum + m.p95Latency, 0) / metrics.length)
                : '0'
              }ms
            </div>
            <p className="text-xs text-muted-foreground">
              Percentil 95
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Requests (24h)</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics.reduce((sum, m) => sum + m.last24h.requests, 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Últimas 24 horas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Metrics Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Métricas Detalhadas por Rota
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Visão Geral</TabsTrigger>
              <TabsTrigger value="performance">Performance</TabsTrigger>
              <TabsTrigger value="errors">Erros</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="space-y-4">
              <div className="rounded-md border">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="h-12 px-4 text-left align-middle font-medium">Rota</th>
                        <th className="h-12 px-4 text-left align-middle font-medium">Status</th>
                        <th className="h-12 px-4 text-left align-middle font-medium">Requests</th>
                        <th className="h-12 px-4 text-left align-middle font-medium">Taxa de Erro</th>
                        <th className="h-12 px-4 text-left align-middle font-medium">Latência P95</th>
                        <th className="h-12 px-4 text-left align-middle font-medium">Latência Média</th>
                      </tr>
                    </thead>
                    <tbody>
                      {metrics.map((metric, index) => (
                        <tr key={index} className="border-b">
                          <td className="px-4 py-3 font-mono text-sm">{metric.route}</td>
                          <td className="px-4 py-3">
                            <Badge variant={getStatusColor(metric.errorRate, metric.p95Latency)}>
                              {getStatusIcon(metric.errorRate, metric.p95Latency)}
                              {metric.errorRate > 5 || metric.p95Latency > 2000 ? 'Crítico' : 
                               metric.errorRate > 2 || metric.p95Latency > 1000 ? 'Atenção' : 'OK'}
                            </Badge>
                          </td>
                          <td className="px-4 py-3">{metric.totalRequests.toLocaleString()}</td>
                          <td className="px-4 py-3">
                            <span className={metric.errorRate > 5 ? 'text-red-600 font-semibold' : ''}>
                              {metric.errorRate.toFixed(2)}%
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={metric.p95Latency > 2000 ? 'text-red-600 font-semibold' : ''}>
                              {metric.p95Latency}ms
                            </span>
                          </td>
                          <td className="px-4 py-3">{metric.avgLatency.toFixed(2)}ms</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="performance" className="space-y-4">
              <div className="text-center py-8 text-muted-foreground">
                <TrendingUp className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-semibold mb-2">Gráficos de Performance</h3>
                <p>Visualizações detalhadas de latência e throughput serão implementadas em breve.</p>
              </div>
            </TabsContent>
            
            <TabsContent value="errors" className="space-y-4">
              <div className="text-center py-8 text-muted-foreground">
                <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-semibold mb-2">Análise de Erros</h3>
                <p>Dashboard detalhado de erros e troubleshooting será implementado em breve.</p>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
