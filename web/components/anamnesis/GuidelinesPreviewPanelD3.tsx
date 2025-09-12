"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Clock, Activity, Dumbbell, Zap, Ban, AlertCircle, CheckCircle, Play, FileText, User, Ruler, Heart } from "lucide-react"
import { toast } from "sonner"
import { GUIDELINE_TAGS } from "@/lib/guidelines-constants"

interface VersionLike {
  id: string
  version: number
  status: "DRAFT" | "PUBLISHED"
}

interface PreviewResult {
  guidelines: {
    aerobio: {
      duracao_min?: [number, number]
      intensidade?: { metodo: string; faixa: [number, number]; texto: string }
      frequencia_sem?: [number, number]
      obs?: string[]
    } | null
    pesos: {
      exercicios?: [number, number]
      series?: [number, number]
      reps?: [number, number]
      frequencia_sem?: [number, number]
      intensidade_pct_1rm?: [number, number]
      obs?: string[]
    } | null
    flex_mob: { foco?: string; obs?: string[] } | null
    contraindicacoes: string[]
    observacoes: string[]
  }
  debug: {
    rules_fired: Array<{
      id: string
      priority: string
      tags: string[]
    }>
    merges: {
      intensidade?: {
        antes: number[][]
        depois: number[]
        criterio: string
      } | null
    }
    anthro_snapshot?: {
      protocolo: string
      version_tag: string
      inputs: {
        massa_kg: number
        estatura_m: number
        skinfolds_mm: Record<string, number>
      }
      outputs: {
        densidade: number
        pct_gordura: number
        mg_kg: number
        mm_kg: number
      }
    } | null
    rir_refs?: Array<{
      rir: number
      reps: number
      pct_1rm: number
    }> | null
    warnings: string[]
  }
  preview_generated_at: string
}

function GuidelinesPreviewPanelD3({ version }: { version: VersionLike }) {
  const [isLoading, setIsLoading] = useState(false)
  const [formValues, setFormValues] = useState<Record<string, any>>({})
  const [previewResult, setPreviewResult] = useState<PreviewResult | null>(null)

  const setValue = (key: string, value: any) => {
    setFormValues(prev => ({ ...prev, [key]: value }))
  }

  const handleGeneratePreview = async () => {
    try {
      setIsLoading(true)
      setPreviewResult(null)
      
      const response = await fetch(`/api/guidelines/versions/${version.id}/preview`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formValues),
      })
      
      if (!response.ok) {
        const err = await response.json().catch(() => ({}))
        throw new Error(err.error || "Erro ao gerar preview")
      }
      
      const data = await response.json()
      setPreviewResult(data)
      toast.success('Preview gerado com sucesso!')
    } catch (error) {
      console.error('Erro ao gerar preview:', error)
      toast.error(error instanceof Error ? error.message : 'Erro ao gerar preview')
    } finally {
      setIsLoading(false)
    }
  }

  const formatRange = (range: [number, number]) => `${range[0]}-${range[1]}`

  const getPriorityBadge = (priority: string) => {
    const variants = {
      'critica': 'destructive',
      'alta': 'destructive', 
      'media': 'secondary',
      'baixa': 'outline'
    } as const
    return <Badge variant={variants[priority as keyof typeof variants] || 'outline'}>{priority}</Badge>
  }

  return (
    <div className="space-y-6">
      {/* Checklist de dados mínimos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Checklist de Dados Mínimos
          </CardTitle>
          <CardDescription>
            Complete os dados necessários para gerar o preview das diretrizes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Dados do Aluno */}
          <div className="space-y-4">
            <h4 className="font-medium flex items-center gap-2">
              <User className="h-4 w-4" />
              Dados do Aluno
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="idade">Idade</Label>
                <Input
                  id="idade"
                  type="number"
                  value={formValues.aluno?.idade || ''}
                  onChange={(e) => setValue('aluno', { ...formValues.aluno, idade: Number(e.target.value) })}
                  placeholder="Ex: 40"
                />
              </div>
              <div>
                <Label htmlFor="sexo">Sexo</Label>
                <select
                  id="sexo"
                  value={formValues.aluno?.sexo || ''}
                  onChange={(e) => setValue('aluno', { ...formValues.aluno, sexo: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="">Selecione</option>
                  <option value="M">Masculino</option>
                  <option value="F">Feminino</option>
                </select>
              </div>
            </div>
          </div>

          {/* Antropometria */}
          <div className="space-y-4">
            <h4 className="font-medium flex items-center gap-2">
              <Ruler className="h-4 w-4" />
              Antropometria
            </h4>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="massa_kg">Massa (kg)</Label>
                <Input
                  id="massa_kg"
                  type="number"
                  step="0.1"
                  value={formValues.anthro?.massa_kg || ''}
                  onChange={(e) => setValue('anthro', { ...formValues.anthro, massa_kg: Number(e.target.value) })}
                  placeholder="Ex: 78.4"
                />
              </div>
              <div>
                <Label htmlFor="estatura_m">Estatura (m)</Label>
                <Input
                  id="estatura_m"
                  type="number"
                  step="0.01"
                  value={formValues.anthro?.estatura_m || ''}
                  onChange={(e) => setValue('anthro', { ...formValues.anthro, estatura_m: Number(e.target.value) })}
                  placeholder="Ex: 1.76"
                />
              </div>
              <div>
                <Label htmlFor="protocolo_code">Protocolo</Label>
                <select
                  id="protocolo_code"
                  value={formValues.anthro?.protocolo_code || ''}
                  onChange={(e) => setValue('anthro', { ...formValues.anthro, protocolo_code: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="">Selecione</option>
                  <option value="JP7_H_M">Jackson & Pollock 7 dobras - Homem</option>
                  <option value="JP7_M_F">Jackson & Pollock 7 dobras - Mulher</option>
                  <option value="JP3_H_M">Jackson & Pollock 3 dobras - Homem</option>
                  <option value="JP3_M_F">Jackson & Pollock 3 dobras - Mulher</option>
                </select>
              </div>
            </div>
            
            {/* Dobras cutâneas */}
            <div className="space-y-2">
              <Label>Dobras Cutâneas (mm)</Label>
              <div className="grid grid-cols-4 gap-2">
                {['tricipital', 'peitoral', 'subescapular', 'suprailíaca', 'axilar_media', 'abdominal', 'coxa'].map(fold => (
                  <div key={fold}>
                    <Input
                      type="number"
                      step="0.1"
                      value={formValues.anthro?.skinfolds_mm?.[fold] || ''}
                      onChange={(e) => setValue('anthro', { 
                        ...formValues.anthro, 
                        skinfolds_mm: { 
                          ...formValues.anthro?.skinfolds_mm, 
                          [fold]: Number(e.target.value) 
                        } 
                      })}
                      placeholder={fold}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Método Aeróbio */}
          <div className="space-y-4">
            <h4 className="font-medium flex items-center gap-2">
              <Heart className="h-4 w-4" />
              Método Aeróbio
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="aerobio_metodo">Método</Label>
                <select
                  id="aerobio_metodo"
                  value={formValues.aerobio_metodo || ''}
                  onChange={(e) => setValue('aerobio_metodo', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="">Selecione</option>
                  <option value="FCR">FCR - Frequência Cardíaca de Reserva</option>
                  <option value="PSE">PSE - Escala de Borg</option>
                  <option value="vVO2">vVO2 - Velocidade no VO2 máximo</option>
                  <option value="MFEL">MFEL (Limiar)</option>
                </select>
              </div>
              <div>
                <Label htmlFor="readiness">Prontidão (1-5)</Label>
                <Input
                  id="readiness"
                  type="number"
                  min="1"
                  max="5"
                  value={formValues.readiness?.exercicio || ''}
                  onChange={(e) => setValue('readiness', { exercicio: Number(e.target.value) })}
                  placeholder="Ex: 3"
                />
              </div>
            </div>
          </div>

          {/* RIR */}
          <div className="space-y-4">
            <h4 className="font-medium">RIR (Reps in Reserve)</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="reps">Repetições</Label>
                <Input
                  id="reps"
                  type="number"
                  min="1"
                  max="20"
                  value={formValues.rir?.reps || ''}
                  onChange={(e) => setValue('rir', { ...formValues.rir, reps: Number(e.target.value) })}
                  placeholder="Ex: 8"
                />
              </div>
              <div>
                <Label htmlFor="rir">RIR (5-10)</Label>
                <Input
                  id="rir"
                  type="number"
                  min="5"
                  max="10"
                  value={formValues.rir?.rir || ''}
                  onChange={(e) => setValue('rir', { ...formValues.rir, rir: Number(e.target.value) })}
                  placeholder="Ex: 3"
                />
              </div>
            </div>
          </div>

          {/* Tags de Resposta */}
          <div className="space-y-4">
            <h4 className="font-medium">Respostas da Anamnese</h4>
            <div className="grid grid-cols-2 gap-4">
              {GUIDELINE_TAGS.slice(0, 6).map(tag => (
                <div key={tag.value}>
                  <Label htmlFor={tag.value}>{tag.label}</Label>
                  <select
                    id={tag.value}
                    value={formValues.answers?.[tag.value] || ''}
                    onChange={(e) => setValue('answers', { ...formValues.answers, [tag.value]: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="">Selecione</option>
                    <option value="sim">Sim</option>
                    <option value="nao">Não</option>
                  </select>
                </div>
              ))}
            </div>
          </div>

          <Button onClick={handleGeneratePreview} disabled={isLoading} className="w-full">
            {isLoading ? (
              <>
                <Clock className="h-4 w-4 mr-2 animate-spin" />
                Gerando Preview...
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Gerar Preview
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Resultado do Preview */}
      {previewResult && (
        <div className="space-y-6">
          {/* Guidelines */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Diretrizes Geradas
              </CardTitle>
              <CardDescription>
                Gerado em: {new Date(previewResult.preview_generated_at).toLocaleString('pt-BR')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Aeróbio */}
              {previewResult.guidelines.aerobio && (
                <div className="space-y-2">
                  <h4 className="font-medium flex items-center gap-2">
                    <Activity className="h-4 w-4" />
                    Aeróbio
                  </h4>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                    {previewResult.guidelines.aerobio.duracao_min && (
                      <p><strong>Duração:</strong> {formatRange(previewResult.guidelines.aerobio.duracao_min)} minutos</p>
                    )}
                    {previewResult.guidelines.aerobio.intensidade && (
                      <p><strong>Intensidade:</strong> {previewResult.guidelines.aerobio.intensidade.texto} ({formatRange(previewResult.guidelines.aerobio.intensidade.faixa)})</p>
                    )}
                    {previewResult.guidelines.aerobio.frequencia_sem && (
                      <p><strong>Frequência:</strong> {formatRange(previewResult.guidelines.aerobio.frequencia_sem)}x/semana</p>
                    )}
                    {previewResult.guidelines.aerobio.obs && previewResult.guidelines.aerobio.obs.length > 0 && (
                      <div>
                        <strong>Observações:</strong>
                        <ul className="list-disc list-inside ml-4">
                          {previewResult.guidelines.aerobio.obs.map((obs, i) => (
                            <li key={i}>{obs}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Pesos */}
              {previewResult.guidelines.pesos && (
                <div className="space-y-2">
                  <h4 className="font-medium flex items-center gap-2">
                    <Dumbbell className="h-4 w-4" />
                    Pesos
                  </h4>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                    {previewResult.guidelines.pesos.exercicios && (
                      <p><strong>Exercícios:</strong> {formatRange(previewResult.guidelines.pesos.exercicios)}</p>
                    )}
                    {previewResult.guidelines.pesos.series && (
                      <p><strong>Séries:</strong> {formatRange(previewResult.guidelines.pesos.series)}</p>
                    )}
                    {previewResult.guidelines.pesos.reps && (
                      <p><strong>Repetições:</strong> {formatRange(previewResult.guidelines.pesos.reps)}</p>
                    )}
                    {previewResult.guidelines.pesos.intensidade_pct_1rm && (
                      <p><strong>Intensidade:</strong> {formatRange(previewResult.guidelines.pesos.intensidade_pct_1rm)}% 1RM</p>
                    )}
                    {previewResult.guidelines.pesos.frequencia_sem && (
                      <p><strong>Frequência:</strong> {formatRange(previewResult.guidelines.pesos.frequencia_sem)}x/semana</p>
                    )}
                    {previewResult.guidelines.pesos.obs && previewResult.guidelines.pesos.obs.length > 0 && (
                      <div>
                        <strong>Observações:</strong>
                        <ul className="list-disc list-inside ml-4">
                          {previewResult.guidelines.pesos.obs.map((obs, i) => (
                            <li key={i}>{obs}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Flex/Mob */}
              {previewResult.guidelines.flex_mob && (
                <div className="space-y-2">
                  <h4 className="font-medium flex items-center gap-2">
                    <Zap className="h-4 w-4" />
                    Flexibilidade/Mobilidade
                  </h4>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    {previewResult.guidelines.flex_mob.foco && (
                      <p><strong>Foco:</strong> {previewResult.guidelines.flex_mob.foco}</p>
                    )}
                    {previewResult.guidelines.flex_mob.obs && previewResult.guidelines.flex_mob.obs.length > 0 && (
                      <div>
                        <strong>Observações:</strong>
                        <ul className="list-disc list-inside ml-4">
                          {previewResult.guidelines.flex_mob.obs.map((obs, i) => (
                            <li key={i}>{obs}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Contraindicações */}
              {previewResult.guidelines.contraindicacoes.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium flex items-center gap-2">
                    <Ban className="h-4 w-4" />
                    Contraindicações
                  </h4>
                  <div className="bg-red-50 p-4 rounded-lg">
                    <ul className="list-disc list-inside">
                      {previewResult.guidelines.contraindicacoes.map((contra, i) => (
                        <li key={i} className="text-red-800">{contra}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* Observações */}
              {previewResult.guidelines.observacoes.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    Observações
                  </h4>
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <ul className="list-disc list-inside">
                      {previewResult.guidelines.observacoes.map((obs, i) => (
                        <li key={i} className="text-yellow-800">{obs}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Debug Info */}
          <Card>
            <CardHeader>
              <CardTitle>Debug Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Regras Aplicadas */}
              <div>
                <h4 className="font-medium mb-2">Regras Aplicadas ({previewResult.debug.rules_fired.length})</h4>
                <div className="space-y-2">
                  {previewResult.debug.rules_fired.map((rule, i) => (
                    <div key={rule.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                      <Badge variant="outline">#{i + 1}</Badge>
                      {getPriorityBadge(rule.priority)}
                      <span className="text-sm text-gray-600">
                        Tags: {rule.tags.join(', ')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Snapshot Antropométrico */}
              {previewResult.debug.anthro_snapshot && (
                <div>
                  <h4 className="font-medium mb-2">Snapshot Antropométrico</h4>
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p><strong>Protocolo:</strong> {previewResult.debug.anthro_snapshot.protocolo} ({previewResult.debug.anthro_snapshot.version_tag})</p>
                    <p><strong>Densidade:</strong> {previewResult.debug.anthro_snapshot.outputs.densidade} g/cm³</p>
                    <p><strong>% Gordura:</strong> {previewResult.debug.anthro_snapshot.outputs.pct_gordura}%</p>
                    <p><strong>Massa Gorda:</strong> {previewResult.debug.anthro_snapshot.outputs.mg_kg} kg</p>
                    <p><strong>Massa Magra:</strong> {previewResult.debug.anthro_snapshot.outputs.mm_kg} kg</p>
                  </div>
                </div>
              )}

              {/* RIR References */}
              {previewResult.debug.rir_refs && (
                <div>
                  <h4 className="font-medium mb-2">RIR → %1RM</h4>
                  <div className="bg-green-50 p-4 rounded-lg">
                    {previewResult.debug.rir_refs.map((ref, i) => (
                      <p key={i}>
                        <strong>RIR {ref.rir} com {ref.reps} reps:</strong> {ref.pct_1rm}% 1RM
                      </p>
                    ))}
                  </div>
                </div>
              )}

              {/* Warnings */}
              {previewResult.debug.warnings.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Avisos</h4>
                  <div className="bg-orange-50 p-4 rounded-lg">
                    <ul className="list-disc list-inside">
                      {previewResult.debug.warnings.map((warning, i) => (
                        <li key={i} className="text-orange-800">{warning}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

export default GuidelinesPreviewPanelD3
