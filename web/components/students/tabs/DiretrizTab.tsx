"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Target, Plus } from "lucide-react"

interface DiretrizTabProps {
  studentId: string
  studentName: string
  onError?: (error: Error) => React.ReactNode
}

export default function DiretrizTab({ studentId, studentName, onError }: DiretrizTabProps) {
  const [loading, setLoading] = useState(false)

  const handleCreateDiretriz = async () => {
    try {
      setLoading(true)
      // TODO: Implementar criação de diretriz
      console.log('Criar diretriz para:', studentId, studentName)
    } catch (error) {
      console.error('Erro ao criar diretriz:', error)
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
          <h3 className="text-lg font-semibold">Diretriz de Treino</h3>
          <p className="text-sm text-muted-foreground">
            Orientações e diretrizes para {studentName}
          </p>
        </div>
        <Button onClick={handleCreateDiretriz} disabled={loading}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Diretriz
        </Button>
      </div>

      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Diretriz Atual
            </CardTitle>
            <CardDescription>
              Orientações ativas para o treino
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Nenhuma diretriz encontrada para este aluno.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Histórico de Diretrizes
            </CardTitle>
            <CardDescription>
              Diretrizes anteriores e evolução
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Nenhuma diretriz anterior encontrada.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
