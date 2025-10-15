"use client"

import { useState, useEffect, useCallback } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { DollarSign, TrendingUp, Receipt, BarChart3, AlertCircle, Calendar, ArrowUpRight, ArrowDownRight } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { TransactionsList } from "@/components/financial/TransactionsList"
import { RenewalAlerts } from "@/components/financial/RenewalAlerts"
import { ReportsPage } from "@/components/financial/ReportsPage"

interface FinancialSummary {
  totalReceitas: number
  totalDespesas: number
  saldoAtual: number
  receitasMes: number
  despesasMes: number
  saldoMes: number
  contratosAtivos: number
  proximosVencimentos: Array<{
    student_id: string
    student_name: string
    plan_name: string
    dias_restantes: number
    valor: number
    next_renewal_date: string
  }>
}

export default function FinancialPage() {
  const [activeTab, setActiveTab] = useState("dashboard")
  const [summary, setSummary] = useState<FinancialSummary | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchSummary = useCallback(async () => {
    try {
      setLoading(true)
      console.log('🔄 [FinancialPage] Buscando resumo financeiro...')
      const response = await fetch('/api/financial/summary')
      if (response.ok) {
        const data = await response.json()
        console.log('✅ [FinancialPage] Dados recebidos:', data)
        setSummary(data)
      } else {
        console.error('❌ [FinancialPage] Erro na resposta:', response.status)
      }
    } catch (error) {
      console.error('❌ [FinancialPage] Erro ao buscar resumo financeiro:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSummary()

    // Atualização em tempo real após lançamentos/matrículas
    const handleFinancialUpdated = () => {
      console.log('🔄 Evento financial:updated recebido no FinancialPage. Refetching summary...')
      fetchSummary()
    }
    
    if (typeof window !== 'undefined') {
      window.addEventListener('financial:updated', handleFinancialUpdated)
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('financial:updated', handleFinancialUpdated)
      }
    }
  }, [fetchSummary])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <DollarSign className="h-8 w-8 text-primary" />
          Financeiro
        </h1>
        <p className="text-muted-foreground">
          Gestão completa de receitas, despesas e renovações
        </p>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="dashboard" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="transactions" className="flex items-center gap-2">
            <Receipt className="h-4 w-4" />
            Lançamentos
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Relatórios
          </TabsTrigger>
        </TabsList>

        {/* Dashboard Tab */}
        <TabsContent value="dashboard" className="space-y-4">
          {/* KPIs Financeiros */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {/* Receitas do Mês */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Receitas (Mês)</CardTitle>
                <ArrowUpRight className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-8 w-24" />
                ) : (
                  <>
                    <div className="text-2xl font-bold text-green-600">
                      R$ {summary?.receitasMes?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}
                    </div>
                    <p className="text-xs text-muted-foreground">Últimos 30 dias</p>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Despesas do Mês */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Despesas (Mês)</CardTitle>
                <ArrowDownRight className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-8 w-24" />
                ) : (
                  <>
                    <div className="text-2xl font-bold text-red-600">
                      R$ {summary?.despesasMes?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}
                    </div>
                    <p className="text-xs text-muted-foreground">Últimos 30 dias</p>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Saldo do Mês */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Saldo (Mês)</CardTitle>
                <DollarSign className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-8 w-24" />
                ) : (
                  <>
                    <div className={`text-2xl font-bold ${(summary?.saldoMes || 0) >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                      R$ {summary?.saldoMes?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}
                    </div>
                    <p className="text-xs text-muted-foreground">Receitas - Despesas</p>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Contratos Ativos */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Contratos Ativos</CardTitle>
                <TrendingUp className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-8 w-24" />
                ) : (
                  <>
                    <div className="text-2xl font-bold text-purple-600">
                      {summary?.contratosAtivos || 0}
                    </div>
                    <p className="text-xs text-muted-foreground">Planos em andamento</p>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Saldo Total (Ano) */}
          <Card>
            <CardHeader>
              <CardTitle>Saldo Geral (Ano)</CardTitle>
              <CardDescription>Resumo anual de receitas e despesas</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-2">
                  <Skeleton className="h-6 w-full" />
                  <Skeleton className="h-6 w-full" />
                  <Skeleton className="h-6 w-full" />
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ArrowUpRight className="h-5 w-5 text-green-600" />
                      <span className="text-sm font-medium">Total de Receitas</span>
                    </div>
                    <span className="text-lg font-bold text-green-600">
                      R$ {summary?.totalReceitas?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ArrowDownRight className="h-5 w-5 text-red-600" />
                      <span className="text-sm font-medium">Total de Despesas</span>
                    </div>
                    <span className="text-lg font-bold text-red-600">
                      R$ {summary?.totalDespesas?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}
                    </span>
                  </div>
                  <div className="border-t pt-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-5 w-5 text-blue-600" />
                        <span className="text-base font-semibold">Saldo Atual</span>
                      </div>
                      <span className={`text-2xl font-bold ${(summary?.saldoAtual || 0) >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                        R$ {summary?.saldoAtual?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Alertas de Renovação */}
          <RenewalAlerts />
        </TabsContent>

        {/* Lançamentos Tab */}
        <TabsContent value="transactions" className="space-y-4">
          <TransactionsList />
        </TabsContent>

        {/* Relatórios Tab */}
        <TabsContent value="reports" className="space-y-4">
          <ReportsPage />
        </TabsContent>
      </Tabs>
    </div>
  )
}
