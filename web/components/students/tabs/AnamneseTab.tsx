"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileText, Plus } from "lucide-react"

interface AnamneseTabProps {
  studentId: string
  studentName: string
  onError?: (error: Error) => React.ReactNode
}

export default function AnamneseTab({ studentId, studentName, onError }: AnamneseTabProps) {
  const [loading, setLoading] = useState(false)

  const handleCreateAnamnese = async () => {
    try {
      setLoading(true)
      // TODO: Implementar criação de anamnese
      console.log('Criar anamnese para:', studentId, studentName)
    } catch (error) {
      console.error('Erro ao criar anamnese:', error)
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
          <h3 className="text-lg font-semibold">Anamnese</h3>
          <p className="text-sm text-muted-foreground">
            Questionários de avaliação para {studentName}
          </p>
        </div>
        <Button onClick={handleCreateAnamnese} disabled={loading}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Anamnese
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Anamnese Inicial
            </CardTitle>
            <CardDescription>
              Questionário básico de avaliação inicial
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Nenhuma anamnese encontrada para este aluno.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Anamnese de Acompanhamento
            </CardTitle>
            <CardDescription>
              Questionários de acompanhamento e evolução
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Nenhuma anamnese de acompanhamento encontrada.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
