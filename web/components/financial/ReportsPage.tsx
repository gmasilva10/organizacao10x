"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  BarChart3, 
  Download, 
  TrendingUp,
  PieChart,
  Calendar,
  FileText
} from "lucide-react"

interface ReportsPageProps {
  orgId?: string
}

export function ReportsPage({ orgId }: ReportsPageProps) {
  const [loading, setLoading] = useState(false)
  const [period, setPeriod] = useState('month')
  const [reportData, setReportData] = useState<any>(null)

  useEffect(() => {
    async function fetchReportData() {
      try {
        setLoading(true)
        
        // Buscar dados para relatórios
        const response = await fetch('/api/financial/summary')
        if (response.ok) {
          const data = await response.json()
          setReportData(data)
        }
      } catch (error) {
        console.error('Erro ao buscar dados do relatório:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchReportData()
  }, [period])

  const handleExportCSV = () => {
    console.log('📊 Exportando relatório em CSV...')
    // TODO: Implementar exportação CSV
    alert('Exportação CSV será implementada em breve')
  }

  const handleExportPDF = () => {
    console.log('📊 Exportando relatório em PDF...')
    // TODO: Implementar exportação PDF
    alert('Exportação PDF será implementada em breve')
  }

  return (
    <div className="space-y-4">
      {/* Header com Filtros */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Relatórios Financeiros
              </CardTitle>
              <CardDescription>
                Análises e exportação de dados financeiros
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Select value={period} onValueChange={setPeriod}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Período" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="week">Última Semana</SelectItem>
                  <SelectItem value="month">Último Mês</SelectItem>
                  <SelectItem value="quarter">Último Trimestre</SelectItem>
                  <SelectItem value="year">Último Ano</SelectItem>
                  <SelectItem value="all">Todo o Período</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={handleExportCSV}>
                <Download className="h-4 w-4 mr-2" />
                CSV
              </Button>
              <Button variant="outline" onClick={handleExportPDF}>
                <Download className="h-4 w-4 mr-2" />
                PDF
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Resumo do Período */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receitas</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className="text-2xl font-bold text-green-600">
                  R$ {reportData?.receitasMes?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}
                </div>
                <p className="text-xs text-muted-foreground">No período</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Despesas</CardTitle>
            <TrendingUp className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className="text-2xl font-bold text-red-600">
                  R$ {reportData?.despesasMes?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}
                </div>
                <p className="text-xs text-muted-foreground">No período</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className={`text-2xl font-bold ${(reportData?.saldoMes || 0) >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                  R$ {reportData?.saldoMes?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}
                </div>
                <p className="text-xs text-muted-foreground">No período</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Transações</CardTitle>
            <FileText className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className="text-2xl font-bold text-purple-600">
                  {reportData?.transactionsCount || 0}
                </div>
                <p className="text-xs text-muted-foreground">No período</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Gráfico de Evolução */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Evolução Financeira</CardTitle>
            <CardDescription>Receitas x Despesas ao longo do tempo</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center h-64 text-muted-foreground">
              <div className="text-center space-y-2">
                <BarChart3 className="h-12 w-12 mx-auto opacity-50" />
                <p className="text-sm">Gráfico de evolução será implementado aqui</p>
                <p className="text-xs">Biblioteca: Recharts ou Chart.js</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Gráfico de Categorias */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Receitas por Categoria</CardTitle>
            <CardDescription>Distribuição de receitas por tipo</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center h-64 text-muted-foreground">
              <div className="text-center space-y-2">
                <PieChart className="h-12 w-12 mx-auto opacity-50" />
                <p className="text-sm">Gráfico de categorias será implementado aqui</p>
                <p className="text-xs">Biblioteca: Recharts ou Chart.js</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabela Resumida */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Resumo por Categoria</CardTitle>
          <CardDescription>Breakdown detalhado de receitas e despesas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-48 text-muted-foreground">
            <div className="text-center space-y-2">
              <FileText className="h-12 w-12 mx-auto opacity-50" />
              <p className="text-sm">Tabela resumida será implementada aqui</p>
              <p className="text-xs">Agrupamento por categoria com totais</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
