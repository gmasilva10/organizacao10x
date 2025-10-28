"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, Clock, User, TrendingUp, Loader2 } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { useStudentOnboardingHistory } from "@/hooks/useStudentOnboardingHistory"

interface OnboardingHistoryTabProps {
  studentId: string
}

export default function OnboardingHistoryTab({ studentId }: OnboardingHistoryTabProps) {
  const { data, error, loading, retry } = useStudentOnboardingHistory(studentId, { page: 1, pageSize: 20 })
  const history = data?.items || []

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin mr-2" />
        <span>Carregando histórico...</span>
      </div>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-red-600 mb-2">Erro ao carregar histórico de onboarding</p>
          <button 
            onClick={retry}
            className="text-sm text-blue-600 hover:text-blue-800 underline"
          >
            Tentar novamente
          </button>
        </CardContent>
      </Card>
    )
  }

  if (history.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-semibold mb-2">Nenhum onboarding finalizado</h3>
          <p>Este aluno ainda não possui histórico de onboarding concluído.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {history.map((record) => (
        <Card key={record.id} className="border-l-4 border-l-green-500">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                Onboarding Concluído
              </CardTitle>
              <Badge variant="outline" className="text-green-600 border-green-600">
                {format(new Date(record.completedAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Métricas */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <Clock className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Duração</p>
                  <p className="font-semibold text-blue-900 dark:text-blue-100">{record.totalDays ?? 0} dias</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <TrendingUp className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Tarefas</p>
                  <p className="font-semibold text-green-900 dark:text-green-100">{record.totalTasksCompleted ?? 0} concluídas</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <User className="h-5 w-5 text-purple-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Finalizado por</p>
                  <p className="font-semibold text-purple-900 dark:text-purple-100">N/A</p>
                </div>
              </div>
            </div>

            {/* Metadados */}
            {record.title || record.finalStageName ? (
              <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg">
                <h4 className="font-semibold mb-2 text-gray-900 dark:text-gray-100">Informações Adicionais</h4>
                {record.title && (
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    <strong>Card:</strong> {record.title}
                  </p>
                )}
                {record.finalStageName && (
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    <strong>Estágio Final:</strong> {record.finalStageName}
                  </p>
                )}
              </div>
            ) : null}

            {/* Caminho percorrido não disponível na versão atual da API */}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
