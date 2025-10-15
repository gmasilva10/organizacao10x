"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { 
  DollarSign, 
  Calendar, 
  CreditCard, 
  TrendingUp, 
  AlertCircle,
  Receipt,
  Clock,
  CheckCircle
} from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

interface FinancialTabProps {
  studentId: string
  studentName: string
}

interface StudentService {
  id: string
  name: string
  type: string
  status: string
  price_cents: number
  currency: string
  purchase_status: string
  payment_method: string
  billing_cycle: string
  start_date: string
  end_date: string | null
  next_renewal_date: string | null
  renewal_status: string | null
  renewal_alert_days: number | null
  is_active: boolean
}

interface Transaction {
  id: string
  type: string
  category: string
  amount: number
  description: string
  payment_method: string
  status: string
  paid_at: string | null
  due_date: string | null
  created_at: string
}

export default function FinancialTab({ studentId, studentName }: FinancialTabProps) {
  const [services, setServices] = useState<StudentService[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchFinancialData() {
      try {
        setLoading(true)

        // Buscar contratos do aluno
        const servicesRes = await fetch(`/api/students/${studentId}/services`)
        const servicesData = servicesRes.ok ? await servicesRes.json() : { services: [] }
        
        // Buscar transações do aluno
        const transactionsRes = await fetch(`/api/financial/transactions?student_id=${studentId}`)
        const transactionsData = transactionsRes.ok ? await transactionsRes.json() : { transactions: [] }

        setServices(servicesData.services || [])
        setTransactions(transactionsData.transactions || [])
      } catch (error) {
        console.error('Erro ao buscar dados financeiros:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchFinancialData()
    // Atualização em tempo real quando houver lançamentos/matrículas
    function handleFinancialUpdated() {
      fetchFinancialData()
    }
    if (typeof window !== 'undefined') {
      window.addEventListener('financial:updated', handleFinancialUpdated)
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('financial:updated', handleFinancialUpdated)
      }
    }
  }, [studentId])

  // Calcular próxima renovação
  const activeService = services.find(s => s.status === 'active' && s.is_active)
  const nextRenewal = activeService?.next_renewal_date
  const daysUntilRenewal = nextRenewal 
    ? Math.ceil((new Date(nextRenewal).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : null

  // Calcular total pago
  const totalPaid = transactions
    .filter(t => t.type === 'receita' && t.status === 'pago')
    .reduce((sum, t) => sum + t.amount, 0)

  return (
    <div className="space-y-6">
      {/* Resumo Financeiro do Aluno */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Plano Atual */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Plano Atual</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-32" />
            ) : activeService ? (
              <>
                <div className="text-lg font-bold">{activeService.name}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  R$ {(activeService.price_cents / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  {activeService.billing_cycle && ` / ${activeService.billing_cycle}`}
                </p>
                <Badge variant={activeService.status === 'active' ? 'default' : 'secondary'} className="mt-2">
                  {activeService.status === 'active' ? 'Ativo' : 'Inativo'}
                </Badge>
              </>
            ) : (
              <div className="text-sm text-muted-foreground">Nenhum plano ativo</div>
            )}
          </CardContent>
        </Card>

        {/* Próxima Renovação */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Próxima Renovação</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-32" />
            ) : nextRenewal ? (
              <>
                <div className="text-lg font-bold">
                  {format(new Date(nextRenewal), "dd/MM/yyyy", { locale: ptBR })}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {daysUntilRenewal !== null && (
                    <Badge variant={daysUntilRenewal <= 7 ? "destructive" : daysUntilRenewal <= 15 ? "default" : "secondary"}>
                      {daysUntilRenewal} dias restantes
                    </Badge>
                  )}
                </p>
              </>
            ) : (
              <div className="text-sm text-muted-foreground">Sem renovação agendada</div>
            )}
          </CardContent>
        </Card>

        {/* Total Pago */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pago</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <>
                <div className="text-lg font-bold text-green-600">
                  R$ {totalPaid.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Histórico completo</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Histórico de Contratos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Contratos e Planos
          </CardTitle>
          <CardDescription>
            Histórico completo de planos contratados
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : services.length > 0 ? (
            <div className="space-y-3">
              {services.map((service) => (
                <div key={service.id} className="flex items-start justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold">{service.name}</h4>
                      <Badge variant={service.status === 'active' ? 'default' : 'secondary'}>
                        {service.status === 'active' ? 'Ativo' : service.status === 'paused' ? 'Pausado' : 'Encerrado'}
                      </Badge>
                      {service.purchase_status === 'paid' && (
                        <Badge variant="outline" className="bg-green-50 text-green-700">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Pago
                        </Badge>
                      )}
                    </div>
                    <div className="mt-2 text-sm text-muted-foreground space-y-1">
                      <div className="flex items-center gap-2">
                        <Clock className="h-3 w-3" />
                        <span>
                          Início: {format(new Date(service.start_date), "dd/MM/yyyy", { locale: ptBR })}
                          {service.end_date && ` • Fim: ${format(new Date(service.end_date), "dd/MM/yyyy", { locale: ptBR })}`}
                        </span>
                      </div>
                      {service.next_renewal_date && (
                        <div className="flex items-center gap-2">
                          <Calendar className="h-3 w-3" />
                          <span>
                            Renovação: {format(new Date(service.next_renewal_date), "dd/MM/yyyy", { locale: ptBR })}
                          </span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-3 w-3" />
                        <span>Pagamento: {service.payment_method || 'Não informado'}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold">
                      R$ {(service.price_cents / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>
                    {service.billing_cycle && (
                      <p className="text-xs text-muted-foreground capitalize">
                        {service.billing_cycle === 'monthly' ? 'Mensal' : 
                         service.billing_cycle === 'quarterly' ? 'Trimestral' :
                         service.billing_cycle === 'semiannual' ? 'Semestral' :
                         service.billing_cycle === 'annual' ? 'Anual' : 'Único'}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
              <Receipt className="h-8 w-8 mb-2 opacity-50" />
              <p className="text-sm">Nenhum contrato registrado</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Histórico de Transações */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Histórico de Transações
          </CardTitle>
          <CardDescription>
            Todas as movimentações financeiras do aluno
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : transactions.length > 0 ? (
            <div className="space-y-2">
              {transactions.map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`font-medium ${transaction.type === 'receita' ? 'text-green-600' : 'text-red-600'}`}>
                        {transaction.type === 'receita' ? 'Receita' : 'Despesa'}
                      </span>
                      <Badge variant="outline">{transaction.category}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {transaction.description || 'Sem descrição'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {transaction.paid_at 
                        ? format(new Date(transaction.paid_at), "dd/MM/yyyy", { locale: ptBR })
                        : 'Data não informada'}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className={`text-lg font-bold ${transaction.type === 'receita' ? 'text-green-600' : 'text-red-600'}`}>
                      {transaction.type === 'receita' ? '+' : '-'} R$ {transaction.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>
                    <Badge variant={
                      transaction.status === 'pago' ? 'default' : 
                      transaction.status === 'pendente' ? 'secondary' : 
                      'destructive'
                    } className="mt-1">
                      {transaction.status === 'pago' ? 'Pago' : 
                       transaction.status === 'pendente' ? 'Pendente' : 
                       transaction.status === 'cancelado' ? 'Cancelado' : 'Reembolsado'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
              <AlertCircle className="h-8 w-8 mb-2 opacity-50" />
              <p className="text-sm">Nenhuma transação registrada</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* (removido) Anexos do Aluno – não pertence ao financeiro */}
    </div>
  )
}
