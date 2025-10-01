"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Clock, Activity, Dumbbell, Zap, Ban, AlertCircle, CheckCircle, Play, FileText } from "lucide-react"
import { toast } from "sonner"
import { GUIDELINE_TAGS } from "@/lib/guidelines-constants"

interface VersionLike {
  id: string
  version: number
  status: "DRAFT" | "PUBLISHED"
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
      intensidade: { metodo: string; faixa: [number, number] }
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
    flex_mob: { foco: string; obs: string[] }
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

export function GuidelinesPreviewPanel({ version }: { version: VersionLike }) {
  const [isLoading, setIsLoading] = useState(false)
  // Guardar valores como strings para preservar seleÃ§Ã£o ("sim"|"nao"|"")
  const [formValues, setFormValues] = useState<Record<string, string>>({})
  const [previewResult, setPreviewResult] = useState<PreviewResult | null>(null)

  const setValue = (tag: string, value: string) => {
    setFormValues(prev => ({ ...prev, [tag]: value }))
  }

  const toPayload = (values: Record<string, string>) => {
    const payload: Record<string, any> = {}
    for (const [key, raw] of Object.entries(values)) {
      if (raw === "sim") payload[key] = true
      else if (raw === "nao" || raw === "nÃ£o") payload[key] = false
      else if (raw.trim() === "") continue
      else if (!Number.isNaN(Number(raw))) payload[key] = Number(raw)
      else payload[key] = raw
    }
    return payload
  }

  const handleGeneratePreview = async () => {
    try {
      setIsLoading(true)
      setPreviewResult(null)
      const response = await fetch("/api/guidelines/simple-preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ test_data: toPayload(formValues), version: version.id }),
      })
      if (!response.ok) {
        const err = await response.json().catch(() => ({}))
        throw new Error(err.error || "Erro ao gerar preview")
      }
      const data = await response.json()
      setPreviewResult(data.data)
      toast.success("Preview gerado com sucesso!")
    } catch (e) {
      console.error("Erro ao gerar preview:", e)
      toast.error(e instanceof Error ? e.message : "Erro ao gerar preview")
    } finally {
      setIsLoading(false)
    }
  }

  const formatRange = (range: [number, number]) => {
    if (range[0] === range[1]) return range[0] === 0 ? "NÃ£o definido" : range[0].toString()
    return range[0] === 0 && range[1] === 0 ? "NÃ£o definido" : `${range[0]} - ${range[1]}`
  }

  const priorityBadge = (priority: string) => {
    const map: Record<string, string> = {
      critica: "bg-red-100 text-red-800",
      alta: "bg-orange-100 text-orange-800",
      media: "bg-yellow-100 text-yellow-800",
      baixa: "bg-green-100 text-green-800",
    }
    const label: Record<string, string> = { critica: "CrÃ­tica", alta: "Alta", media: "MÃ©dia", baixa: "Baixa" }
    return <Badge className={map[priority] || map.media}>{label[priority] || priority}</Badge>
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Dados de Teste</CardTitle>
          <CardDescription>Configure os valores para testar as regras das diretrizes</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {GUIDELINE_TAGS.slice(0, 8).map(tag => (
              <div key={tag.value}>
                <Label htmlFor={tag.value}>{tag.label}</Label>
                {tag.category === "cardiovascular" || tag.category === "musculoesqueletica" || tag.category === "metabolica" ? (
                  <select
                    id={tag.value}
                    value={formValues[tag.value] ?? ""}
                    onChange={e => setValue(tag.value, e.target.value)}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="">Selecione</option>
                    <option value="sim">Sim</option>
                    <option value="nao">NÃ£o</option>
                  </select>
                ) : (
                  <Input
                    id={tag.value}
                    value={formValues[tag.value] ?? ""}
                    onChange={e => setValue(tag.value, e.target.value)}
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
                  <Play className="h-4 w-4 mr-2 animate-spin" />
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

      {previewResult && (
        <div className="space-y-4">
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
                    {new Date(previewResult.preview_generated_at).toLocaleTimeString("pt-BR")}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Regras Aplicadas */}
          {previewResult.applicable_rules && previewResult.applicable_rules.length > 0 && (
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
                      {priorityBadge(rule.priority_clinical)}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* SeÃ§Ã£o Debug Detalhada */}
          {previewResult?.debug_info && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-blue-600" />
                  Debug - InformaÃ§Ãµes do Motor
                </CardTitle>
                <CardDescription>Detalhes sobre como as regras foram processadas e combinadas</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Total de Regras</Label>
                    <p className="text-sm text-muted-foreground">{(previewResult as any).debug_info?.total_rules}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Regras AplicÃ¡veis</Label>
                    <p className="text-sm text-muted-foreground">{(previewResult as any).debug_info?.applicable_rules}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">LÃ³gica de CombinaÃ§Ã£o</Label>
                    <p className="text-sm text-muted-foreground">{(previewResult as any).debug_info?.combination_logic}</p>
                  </div>
                </div>
                
                {previewResult.debug_info.decisions && previewResult.debug_info.decisions.length > 0 && (
                  <div>
                    <Label className="text-sm font-medium">DecisÃµes por Regra</Label>
                    <div className="space-y-2 mt-2">
                      {previewResult.debug_info.decisions.map((decision: any, index: number) => (
                        <div key={index} className="p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Regra #{index + 1}</span>
                            <Badge variant={decision?.applied ? "default" : "secondary"}>
                              {decision.applied ? "Aplicada" : "NÃ£o aplicada"}
                            </Badge>
                          </div>
                          {decision.reason && (
                            <p className="text-xs text-muted-foreground mt-1">{decision.reason}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* SeÃ§Ã£o AerÃ³bio */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Activity className="h-5 w-5 text-blue-600" />
                ResistÃªncia AerÃ³bia
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label className="text-sm font-medium">DuraÃ§Ã£o</Label>
                  <p className="text-sm text-muted-foreground">{formatRange(previewResult.combined_outputs.aerobio.duracao_min)} min</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Intensidade</Label>
                  <p className="text-sm text-muted-foreground">
                    {formatRange(previewResult.combined_outputs.aerobio.intensidade.faixa)}% {previewResult.combined_outputs.aerobio.intensidade.metodo}
                    {(previewResult.combined_outputs.aerobio.intensidade as any)?.texto && (
                      <span className="block text-xs text-muted-foreground mt-1">
                        ({(previewResult.combined_outputs.aerobio.intensidade as any)?.texto})
                      </span>
                    )}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">FrequÃªncia</Label>
                  <p className="text-sm text-muted-foreground">{formatRange(previewResult.combined_outputs.aerobio.frequencia_sem)}x/sem</p>
                </div>
              </div>
              {previewResult.combined_outputs.aerobio.obs && previewResult.combined_outputs.aerobio.obs.length > 0 && (
                <div>
                  <Label className="text-sm font-medium">ObservaÃ§Ãµes</Label>
                  <ul className="text-sm text-muted-foreground list-disc list-inside mt-1">
                    {previewResult.combined_outputs.aerobio.obs.map((obs, i) => (
                      <li key={i}>{obs}</li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>

          {/* SeÃ§Ã£o Pesos */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Dumbbell className="h-5 w-5 text-purple-600" />
                Treino com Pesos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <Label className="text-sm font-medium">ExercÃ­cios</Label>
                  <p className="text-sm text-muted-foreground">{formatRange(previewResult.combined_outputs.pesos.exercicios)}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">SÃ©ries</Label>
                  <p className="text-sm text-muted-foreground">{formatRange(previewResult.combined_outputs.pesos.series)}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">RepetiÃ§Ãµes</Label>
                  <p className="text-sm text-muted-foreground">{formatRange(previewResult.combined_outputs.pesos.reps)}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">FrequÃªncia</Label>
                  <p className="text-sm text-muted-foreground">{formatRange(previewResult.combined_outputs.pesos.frequencia_sem)}x/sem</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Intensidade (% 1RM)</Label>
                  <p className="text-sm text-muted-foreground">{formatRange(previewResult.combined_outputs.pesos.intensidade_pct_1rm)}%</p>
                </div>
              </div>
              {previewResult.combined_outputs.pesos.obs && previewResult.combined_outputs.pesos.obs.length > 0 && (
                <div>
                  <Label className="text-sm font-medium">ObservaÃ§Ãµes</Label>
                  <ul className="text-sm text-muted-foreground list-disc list-inside mt-1">
                    {previewResult.combined_outputs.pesos.obs.map((obs, i) => (
                      <li key={i}>{obs}</li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>

          {/* SeÃ§Ã£o Flexibilidade e Mobilidade */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Zap className="h-5 w-5 text-green-600" />
                Flexibilidade e Mobilidade
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Foco</Label>
                <p className="text-sm text-muted-foreground">{previewResult.combined_outputs.flex_mob.foco || "NÃ£o especificado"}</p>
              </div>
              {previewResult.combined_outputs.flex_mob.obs && previewResult.combined_outputs.flex_mob.obs.length > 0 && (
                <div>
                  <Label className="text-sm font-medium">ObservaÃ§Ãµes</Label>
                  <ul className="text-sm text-muted-foreground list-disc list-inside mt-1">
                    {previewResult.combined_outputs.flex_mob.obs.map((obs, i) => (
                      <li key={i}>{obs}</li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>

          {/* SeÃ§Ã£o ContraindicaÃ§Ãµes */}
          {previewResult.combined_outputs.contraindicacoes.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Ban className="h-5 w-5 text-red-600" />
                  ContraindicaÃ§Ãµes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                  {previewResult.combined_outputs.contraindicacoes.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* SeÃ§Ã£o ObservaÃ§Ãµes Gerais */}
          {previewResult.combined_outputs.observacoes.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-5 w-5 text-orange-600" />
                  ObservaÃ§Ãµes Gerais
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                  {previewResult.combined_outputs.observacoes.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}

export default GuidelinesPreviewPanel








