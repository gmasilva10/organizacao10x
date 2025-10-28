"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileText, Plus, ExternalLink, Download } from "lucide-react"
import { useToast } from "@/components/ui/toast"
import { Badge } from "@/components/ui/badge"

interface AnamneseTabProps {
  studentId: string
  studentName: string
  onError?: (error: Error) => React.ReactNode
}

interface AnamneseVersion {
  id: string
  code: string
  status: string
  token: string
  token_expires_at: string
  created_at: string
}

export default function AnamneseTab({ studentId, studentName, onError }: AnamneseTabProps) {
  const [loading, setLoading] = useState(false)
  const [loadingList, setLoadingList] = useState(true)
  const [versions, setVersions] = useState<AnamneseVersion[]>([])
  const { success, error: showError } = useToast()

  // Carregar lista de anamneses ao montar
  useEffect(() => {
    loadVersions()
  }, [studentId])

  const loadVersions = async () => {
    try {
      setLoadingList(true)
      const response = await fetch(`/api/anamnese/versions/${studentId}`)
      if (response.ok) {
        const data = await response.json()
        setVersions(data.versions || [])
      }
    } catch (error) {
      console.error('Erro ao carregar versões:', error)
    } finally {
      setLoadingList(false)
    }
  }

  const handleCreateAnamnese = async () => {
    try {
      setLoading(true)
      
      console.log('🔍 [ANAMNESE TAB] Criando anamnese para:', studentId, studentName)
      
      const response = await fetch('/api/anamnese/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          alunoId: studentId,
          destino: 'ALUNO'
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao criar anamnese')
      }

      console.log('✅ [ANAMNESE TAB] Anamnese criada com sucesso:', data)

      success(`Anamnese criada com sucesso! Código: ${data.code}. Link público gerado.`)

      // Recarregar lista de anamneses
      await loadVersions()
      
    } catch (error) {
      console.error('❌ [ANAMNESE TAB] Erro ao criar anamnese:', error)
      
      showError(error instanceof Error ? error.message : "Erro desconhecido")
      
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

      <div className="space-y-3">
        {loadingList ? (
          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground text-center">
                Carregando anamneses...
              </p>
            </CardContent>
          </Card>
        ) : versions.length === 0 ? (
          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground text-center">
                Nenhuma anamnese encontrada para este aluno.
                Clique em "Nova Anamnese" para criar.
              </p>
            </CardContent>
          </Card>
        ) : (
          versions.map((version) => {
            const baseUrl = typeof window !== 'undefined' 
              ? `${window.location.protocol}//${window.location.host}`
              : 'http://localhost:3000'
            const publicLink = `${baseUrl}/p/anamnese/${version.token}`
            
            const getStatusVariant = (status: string) => {
              switch (status) {
                case 'RASCUHO': return 'secondary'
                case 'ENVIADO': return 'default'
                case 'EM_PREENCHIMENTO': return 'outline'
                case 'CONCLUIDO': return 'success'
                case 'CANCELADO': return 'destructive'
                case 'EXPIRADO': return 'destructive'
                default: return 'secondary'
              }
            }

            const getStatusLabel = (status: string) => {
              switch (status) {
                case 'RASCUHO': return 'Rascunho'
                case 'ENVIADO': return 'Enviado'
                case 'EM_PREENCHIMENTO': return 'Em Preenchimento'
                case 'CONCLUIDO': return 'Concluído'
                case 'CANCELADO': return 'Cancelado'
                case 'EXPIRADO': return 'Expirado'
                default: return status
              }
            }

            return (
              <Card key={version.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-blue-600" />
                      <div>
                        <CardTitle className="text-base">{version.code}</CardTitle>
                        <CardDescription className="text-xs">
                          Criado em {new Date(version.created_at).toLocaleDateString('pt-BR')}
                        </CardDescription>
                      </div>
                    </div>
                    <Badge variant={getStatusVariant(version.status) as any}>
                      {getStatusLabel(version.status)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        window.open(publicLink, '_blank')
                      }}
                    >
                      <ExternalLink className="h-3 w-3 mr-2" />
                      Abrir Link Público
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={async () => {
                        try {
                          const pdfResponse = await fetch(`/api/anamnese/version/${version.id}/pdf`)
                          if (pdfResponse.ok) {
                            const pdfData = await pdfResponse.json()
                            success("PDF gerado - Funcionalidade em desenvolvimento")
                          }
                        } catch (err) {
                          showError("Erro ao gerar PDF - Tente novamente")
                        }
                      }}
                    >
                      <Download className="h-3 w-3 mr-2" />
                      Baixar PDF
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}
