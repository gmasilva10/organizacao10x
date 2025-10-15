"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { 
  Bell, 
  Calendar, 
  DollarSign, 
  AlertCircle,
  CheckCircle,
  RefreshCw
} from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import Link from "next/link"

interface RenewalAlert {
  service_id: string
  student_id: string
  student_name: string
  student_email: string
  plan_name: string
  renewal_date: string
  days_until_renewal: number
  amount: number
  priority: 'low' | 'medium' | 'high'
  org_id: string
}

interface RenewalAlertsProps {
  compact?: boolean
}

export function RenewalAlerts({ compact = false }: RenewalAlertsProps) {
  const [alerts, setAlerts] = useState<RenewalAlert[]>([])
  const [loading, setLoading] = useState(true)
  const [checking, setChecking] = useState(false)

  async function fetchAlerts() {
    try {
      setLoading(true)

      // Buscar resumo financeiro que já inclui próximos vencimentos
      const response = await fetch('/api/financial/summary')
      if (response.ok) {
        const data = await response.json()
        
        // Transformar próximos vencimentos em alertas
        const renewalAlerts = data.proximosVencimentos?.map((v: any) => ({
          service_id: v.service_id || '',
          student_id: v.student_id,
          student_name: v.student_name,
          student_email: '',
          plan_name: v.plan_name,
          renewal_date: v.next_renewal_date,
          days_until_renewal: v.dias_restantes,
          amount: v.valor,
          priority: v.dias_restantes <= 7 ? 'high' : v.dias_restantes <= 15 ? 'medium' : 'low',
          org_id: ''
        })) || []

        setAlerts(renewalAlerts)
      }
    } catch (error) {
      console.error('Erro ao buscar alertas:', error)
    } finally {
      setLoading(false)
    }
  }

  async function runCheck() {
    try {
      setChecking(true)
      
      const response = await fetch('/api/cron/check-renewals', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_CRON_SECRET || 'dev-secret'}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        console.log('✅ Verificação concluída:', data)
        fetchAlerts() // Recarregar alertas
      }
    } catch (error) {
      console.error('Erro ao executar verificação:', error)
    } finally {
      setChecking(false)
    }
  }

  useEffect(() => {
    fetchAlerts()
  }, [])

  const highPriority = alerts.filter(a => a.priority === 'high')
  const mediumPriority = alerts.filter(a => a.priority === 'medium')
  const lowPriority = alerts.filter(a => a.priority === 'low')

  if (compact) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Alertas de Renovação</CardTitle>
          <Bell className="h-4 w-4 text-orange-600" />
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-8 w-16" />
          ) : (
            <>
              <div className="text-2xl font-bold text-orange-600">
                {alerts.length}
              </div>
              <p className="text-xs text-muted-foreground">
                {highPriority.length > 0 && `${highPriority.length} críticos`}
              </p>
            </>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Alertas de Renovação
            </CardTitle>
            <CardDescription>
              Contratos que precisam de atenção
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={runCheck}
            disabled={checking}
          >
            {checking ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Verificando...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Verificar Agora
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        ) : alerts.length > 0 ? (
          <div className="space-y-4">
            {/* Alertas Críticos (7 dias ou menos) */}
            {highPriority.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <h4 className="font-semibold text-sm text-red-600">
                    Críticos ({highPriority.length})
                  </h4>
                </div>
                {highPriority.map((alert, index) => (
                  <div key={index} className="flex items-start justify-between p-3 border-2 border-red-200 bg-red-50 rounded-lg">
                    <div className="flex-1">
                      <Link 
                        href={`/app/students/${alert.student_id}/edit`}
                        className="font-medium hover:underline"
                      >
                        {alert.student_name}
                      </Link>
                      <p className="text-sm text-muted-foreground">{alert.plan_name}</p>
                      <div className="flex items-center gap-2 mt-1 text-xs text-red-700">
                        <Calendar className="h-3 w-3" />
                        <span>Vence em {alert.days_until_renewal} dias - {format(new Date(alert.renewal_date), "dd/MM/yyyy", { locale: ptBR })}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-red-700">
                        R$ {alert.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </div>
                      <Badge variant="destructive" className="mt-1">
                        Urgente
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Alertas Médios (8-15 dias) */}
            {mediumPriority.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-orange-600" />
                  <h4 className="font-semibold text-sm text-orange-600">
                    Atenção ({mediumPriority.length})
                  </h4>
                </div>
                {mediumPriority.map((alert, index) => (
                  <div key={index} className="flex items-start justify-between p-3 border border-orange-200 bg-orange-50 rounded-lg">
                    <div className="flex-1">
                      <Link 
                        href={`/app/students/${alert.student_id}/edit`}
                        className="font-medium hover:underline"
                      >
                        {alert.student_name}
                      </Link>
                      <p className="text-sm text-muted-foreground">{alert.plan_name}</p>
                      <div className="flex items-center gap-2 mt-1 text-xs text-orange-700">
                        <Calendar className="h-3 w-3" />
                        <span>Vence em {alert.days_until_renewal} dias - {format(new Date(alert.renewal_date), "dd/MM/yyyy", { locale: ptBR })}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-orange-700">
                        R$ {alert.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </div>
                      <Badge variant="default" className="mt-1">
                        Atenção
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Alertas Baixos (16-30 dias) */}
            {lowPriority.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-blue-600" />
                  <h4 className="font-semibold text-sm text-blue-600">
                    Informativo ({lowPriority.length})
                  </h4>
                </div>
                {lowPriority.map((alert, index) => (
                  <div key={index} className="flex items-start justify-between p-3 border border-blue-200 bg-blue-50 rounded-lg">
                    <div className="flex-1">
                      <Link 
                        href={`/app/students/${alert.student_id}/edit`}
                        className="font-medium hover:underline"
                      >
                        {alert.student_name}
                      </Link>
                      <p className="text-sm text-muted-foreground">{alert.plan_name}</p>
                      <div className="flex items-center gap-2 mt-1 text-xs text-blue-700">
                        <Calendar className="h-3 w-3" />
                        <span>Vence em {alert.days_until_renewal} dias - {format(new Date(alert.renewal_date), "dd/MM/yyyy", { locale: ptBR })}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-blue-700">
                        R$ {alert.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </div>
                      <Badge variant="secondary" className="mt-1">
                        OK
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
            <CheckCircle className="h-8 w-8 mb-2 opacity-50 text-green-600" />
            <p className="text-sm font-medium">Nenhum alerta de renovação</p>
            <p className="text-xs">Todos os contratos estão em dia</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
