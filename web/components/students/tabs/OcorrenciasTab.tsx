"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertTriangle, Plus } from "lucide-react"

interface OcorrenciasTabProps {
  studentId: string
  studentName: string
  onError?: (error: Error) => React.ReactNode
}

export default function OcorrenciasTab({ studentId, studentName, onError }: OcorrenciasTabProps) {
  const [loading, setLoading] = useState(false)

  const handleCreateOcorrencia = async () => {
    try {
      setLoading(true)
      // TODO: Implementar criação de ocorrência
      console.log('Criar ocorrência para:', studentId, studentName)
    } catch (error) {
      console.error('Erro ao criar ocorrência:', error)
      if (onError) {
        onError(error as Error)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Ocorrências</h3>
          <p className="text-sm text-muted-foreground">
            Registro de ocorrências para {studentName}
          </p>
        </div>
        <Button onClick={handleCreateOcorrencia} disabled={loading}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Ocorrência
        </Button>
      </div>

      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Ocorrências Ativas
            </CardTitle>
            <CardDescription>
              Ocorrências em aberto que precisam de atenção
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Nenhuma ocorrência ativa encontrada.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Histórico de Ocorrências
            </CardTitle>
            <CardDescription>
              Todas as ocorrências registradas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Nenhuma ocorrência encontrada no histórico.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
