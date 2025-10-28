"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  Play, 
  Loader2, 
  CheckCircle, 
  AlertCircle, 
  Target,
  Clock,
  Activity,
  Dumbbell,
  Zap,
  Ban,
  FileText
} from "lucide-react"
import { toast } from "sonner"
import { GUIDELINE_TAGS } from "@/lib/guidelines-constants"

interface GuidelinesPreviewModalProps {
  isOpen: boolean
  onClose: () => void
  version: {
    id: string
    version: number
    status: 'DRAFT' | 'PUBLISHED'
  }
}

interface PreviewResult {
  applicable_rules: Array<{
    id: string
    priority_clinical: string
    condition: any
    outputs: any
  }>
  combined_outputs: {
    aerobio: {
      duracao_min: [number, number]
      intensidade: {
        metodo: string
        faixa: [number, number]
      }
      frequencia_sem: [number, number]
      obs: string[]
    }
    pesos: {
      exercicios: [number, number]
      series: [number, number]
      reps: [number, number]
      frequencia_sem: [number, number]
      intensidade_pct_1rm: [number, number]
      obs: string[]
    }
    flex_mob: {
      foco: string
      obs: string[]
    }
    contraindicacoes: string[]
    observacoes: string[]
  }
  rules_total: number
  rules_applied: number
  preview_generated_at: string
  debug_info?: {
    rules_evaluated: number
    rules_applied: number
    decisions: Array<{
      rule_id: string
      priority: string
      condition: any
      decision: string
      before: any
      after: any
    }>
  }
}

export function GuidelinesPreviewModal({ isOpen, onClose, version }: GuidelinesPreviewModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  // Sempre armazenar como string para compatibilidade com <select>
  const [mockResponses, setMockResponses] = useState<Record<string, string>>({})
  const [previewResult, setPreviewResult] = useState<PreviewResult | null>(null)

  const handleMockResponseChange = (tag: string, value: string) => {
    setMockResponses(prev => ({ ...prev, [tag]: value }))
  }

  const handleGeneratePreview = async () => {
    setIsLoading(true)
    setPreviewResult(null)

    try {
      const response = await fetch('/api/guidelines/simple-preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          test_data: Object.fromEntries(
            Object.entries(mockResponses).map(([k, v]) => {
              if (v === 'sim') return [k, true]
              if (v === 'nao' || v === 'não') return [k, false]
              const asNum = Number(v)
              if (!Number.isNaN(asNum) && v.trim() !== '') return [k, asNum]
              if (v.trim() === '') return [k, undefined]
              return [k, v]
            })
          )
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erro ao gerar preview')
      }

      const data = await response.json()
      setPreviewResult(data.data)
      toast.success('Preview gerado com sucesso!')
    } catch (error) {
      console.error('Erro ao gerar preview:', error)
      toast.error(error instanceof Error ? error.message : 'Erro ao gerar preview')
    } finally {
      setIsLoading(false)
    }
  }

  const formatRange = (range: [number, number]) => {
    if (range[0] === range[1]) {
      return range[0] === 0 ? 'Não definido' : range[0].toString()
    }
    return range[0] === 0 && range[1] === 0 ? 'Não definido' : `${range[0]} - ${range[1]}`
  }

  const getPriorityBadge = (priority: string) => {
    const colors = {
      critica: 'bg-red-100 text-red-800',
      alta: 'bg-orange-100 text-orange-800',
      media: 'bg-yellow-100 text-yellow-800',
      baixa: 'bg-green-100 text-green-800'
    }
    
    const labels = {
      critica: 'Crítica',
      alta: 'Alta',
      media: 'Média',
      baixa: 'Baixa'
    }

    return (
      <Badge className={colors[priority as keyof typeof colors] || colors.media}>
        {labels[priority as keyof typeof labels] || priority}
      </Badge>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-visible">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Preview de Diretrizes - Versão {version.version}
          </DialogTitle>
          <DialogDescription>
            Teste e visualize como as diretrizes serão aplicadas com dados de exemplo.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Seção de Inputs de Teste */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Dados de Teste</CardTitle>
              <CardDescription>
                Configure os valores para testar as regras das diretrizes
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {GUIDELINE_TAGS.slice(0, 8).map(tag => (
                  <div key={tag.value}>
                    <Label htmlFor={tag.value}>{tag.label}</Label>
                    {tag.category === 'cardiovascular' || tag.category === 'musculoesqueletica' || tag.category === 'metabolica' ? (
                      <select
                        value={mockResponses[tag.value] ?? ''}
                        onChange={(e) => handleMockResponseChange(tag.value, e.target.value)}
                        className="w-full p-2 border rounded-md"
                      >
                        <option value="">Selecione</option>
                        <option value="sim">Sim</option>
                        <option value="nao">Não</option>
                      </select>
                    ) : (
                      <Input
                        id={tag.value}
                        value={mockResponses[tag.value] ?? ''}
                        onChange={(e) => handleMockResponseChange(tag.value, e.target.value)}
                        placeholder="Digite o valor"
                      />
                    )}
                  </div>
                ))}
              </div>
              
              <div className="flex justify-end">
                <Button onClick={handleGeneratePreview} disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Gerando Preview...
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      Gerar Preview
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

              {/* Resultados do Preview */}
          {previewResult && (
            <div className="space-y-4">
              {/* Estatísticas */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="text-sm">
                          {previewResult.rules_applied} de {previewResult.rules_total} regras aplicadas
                        </span>
                      </div>
                      <Badge variant="secondary">
                        <Clock className="h-3 w-3 mr-1" />
                        {new Date(previewResult.preview_generated_at).toLocaleTimeString('pt-BR')}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Debug Info */}
              {previewResult?.debug_info?.decisions && previewResult.debug_info.decisions.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <AlertCircle className="h-5 w-5 text-blue-600" />
                      Debug - Decisões do Motor
                    </CardTitle>
                    <CardDescription>
                      Mostra como as regras foram combinadas usando a lógica "mais restritivo vence"
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {previewResult.debug_info.decisions.map((decision, index) => (
                      <div key={index} className="p-3 bg-gray-50 rounded-lg text-sm">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="text-xs">
                            {decision.priority}
                          </Badge>
                          <span className="font-medium">Regra #{index + 1}</span>
                        </div>
                        <p className="text-muted-foreground">{decision.decision}</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Regras Aplicadas */}
              {previewResult.applicable_rules.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <AlertCircle className="h-5 w-5" />
                      Regras Aplicadas
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {previewResult.applicable_rules.map((rule, index) => (
                      <div key={rule.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">Regra #{index + 1}</span>
                          {getPriorityBadge(rule.priority_clinical)}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Outputs Combinados */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Aeróbio */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Activity className="h-5 w-5 text-blue-600" />
                      Resistência Aeróbia
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <Label className="text-sm font-medium">Duração</Label>
                      <p className="text-sm text-muted-foreground">
                        {formatRange(previewResult.combined_outputs.aerobio.duracao_min)} min
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Intensidade</Label>
                      <p className="text-sm text-muted-foreground">
                        {formatRange(previewResult.combined_outputs.aerobio.intensidade.faixa)}% {previewResult.combined_outputs.aerobio.intensidade.metodo}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Frequência</Label>
                      <p className="text-sm text-muted-foreground">
                        {formatRange(previewResult.combined_outputs.aerobio.frequencia_sem)}x/sem
                      </p>
                    </div>
                    {previewResult.combined_outputs.aerobio.obs.length > 0 && (
                      <div>
                        <Label className="text-sm font-medium">Observações</Label>
                        <ul className="text-sm text-muted-foreground list-disc list-inside">
                          {previewResult.combined_outputs.aerobio.obs.map((obs, i) => (
                            <li key={i}>{obs}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Pesos */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Dumbbell className="h-5 w-5 text-purple-600" />
                      Treino com Pesos
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <Label className="text-sm font-medium">Exercícios</Label>
                      <p className="text-sm text-muted-foreground">
                        {formatRange(previewResult.combined_outputs.pesos.exercicios)}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Séries</Label>
                      <p className="text-sm text-muted-foreground">
                        {formatRange(previewResult.combined_outputs.pesos.series)}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Repetições</Label>
                      <p className="text-sm text-muted-foreground">
                        {formatRange(previewResult.combined_outputs.pesos.reps)}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Frequência</Label>
                      <p className="text-sm text-muted-foreground">
                        {formatRange(previewResult.combined_outputs.pesos.frequencia_sem)}x/sem
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Intensidade</Label>
                      <p className="text-sm text-muted-foreground">
                        {formatRange(previewResult.combined_outputs.pesos.intensidade_pct_1rm)}% 1RM
                      </p>
                    </div>
                    {previewResult.combined_outputs.pesos.obs.length > 0 && (
                      <div>
                        <Label className="text-sm font-medium">Observações</Label>
                        <ul className="text-sm text-muted-foreground list-disc list-inside">
                          {previewResult.combined_outputs.pesos.obs.map((obs, i) => (
                            <li key={i}>{obs}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Flexibilidade */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Zap className="h-5 w-5 text-green-600" />
                      Flexibilidade e Mobilidade
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <Label className="text-sm font-medium">Foco</Label>
                      <p className="text-sm text-muted-foreground">
                        {previewResult.combined_outputs.flex_mob.foco || 'Não especificado'}
                      </p>
                    </div>
                    {previewResult.combined_outputs.flex_mob.obs.length > 0 && (
                      <div>
                        <Label className="text-sm font-medium">Observações</Label>
                        <ul className="text-sm text-muted-foreground list-disc list-inside">
                          {previewResult.combined_outputs.flex_mob.obs.map((obs, i) => (
                            <li key={i}>{obs}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Contraindicações e Observações */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Ban className="h-5 w-5 text-red-600" />
                      Contraindicações & Observações
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {previewResult.combined_outputs.contraindicacoes.length > 0 && (
                      <div>
                        <Label className="text-sm font-medium">Contraindicações</Label>
                        <ul className="text-sm text-muted-foreground list-disc list-inside">
                          {previewResult.combined_outputs.contraindicacoes.map((contra, i) => (
                            <li key={i}>{contra}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {previewResult.combined_outputs.observacoes.length > 0 && (
                      <div>
                        <Label className="text-sm font-medium">Observações Gerais</Label>
                        <ul className="text-sm text-muted-foreground list-disc list-inside">
                          {previewResult.combined_outputs.observacoes.map((obs, i) => (
                            <li key={i}>{obs}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
