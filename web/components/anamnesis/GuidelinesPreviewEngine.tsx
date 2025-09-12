"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import { 
  Play, 
  Activity, 
  Dumbbell, 
  StretchHorizontal, 
  AlertTriangle, 
  FileText,
  CheckCircle,
  XCircle
} from "lucide-react"

interface PreviewEngineProps {
  versionId: string
  onClose: () => void
}

interface TestData {
  dac?: 'sim' | 'não'
  condromalacia_patelar?: 'sim' | 'não'
  obesidade?: 'sim' | 'não'
  hipertensao?: 'sim' | 'não'
  diabetes?: 'sim' | 'não'
  betabloqueador?: 'sim' | 'não'
  emagrecimento?: number
  hipertrofia_muscular?: number
  condicionamento_fisico?: number
  idade?: number
  peso?: number
  altura?: number
  sexo?: 'M' | 'F'
}

interface PreviewResult {
  outputs: {
    aerobio?: {
      duracao_min: [number, number]
      intensidade: {
        metodo: string
        faixa: [number, number]
        texto?: string
      }
      frequencia_sem: [number, number]
      obs: string[]
    }
    pesos?: {
      exercicios: [number, number]
      series: [number, number]
      reps: [number, number]
      frequencia_sem: [number, number]
      intensidade_pct_1rm: [number, number]
      obs: string[]
    }
    flex_mob?: {
      foco: string
      obs: string[]
    }
    contraindicacoes: string[]
    observacoes: string[]
  }
  debug_info: {
    total_rules: number
    applicable_rules: number
    applied_rules: Array<{
      id: string
      priority: string
      condition: any
      outputs: any
    }>
    test_data: TestData
    combination_logic: string
  }
}

export function GuidelinesPreviewEngine({ versionId, onClose }: PreviewEngineProps) {
  const [testData, setTestData] = useState<TestData>({})
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<PreviewResult | null>(null)

  const handleGeneratePreview = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/guidelines/simple-preview', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          test_data: testData
        })
      })

      if (!response.ok) {
        throw new Error('Erro ao gerar preview')
      }

      const data = await response.json()
      setResult(data.data)
      toast.success("Preview gerado com sucesso!")
    } catch (error) {
      console.error('Erro ao gerar preview:', error)
      toast.error("Erro ao gerar preview")
    } finally {
      setIsLoading(false)
    }
  }

  const formatRange = (range: [number, number]) => {
    return `${range[0]}-${range[1]}`
  }

  const formatMethod = (intensidade: any) => {
    if (!intensidade) return 'Não definido'
    return `${intensidade.metodo} ${intensidade.faixa[0]}-${intensidade.faixa[1]}%${intensidade.texto ? ` (${intensidade.texto})` : ''}`
  }

  return (
    <div className="space-y-6">
      {/* Dados de Teste */}
      <Card>
        <CardHeader>
          <CardTitle>Dados de Teste</CardTitle>
          <p className="text-sm text-muted-foreground">
            Configure os valores para testar as regras das diretrizes
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Condições Médicas */}
            <div className="space-y-4">
              <h4 className="font-medium">Condições Médicas</h4>
              
              <div className="space-y-2">
                <Label htmlFor="dac">DAC (Doença Arterial Coronariana)</Label>
                <select 
                  id="dac"
                  value={testData.dac || ''} 
                  onChange={(e) => setTestData(prev => ({ ...prev, dac: e.target.value as 'sim' | 'não' }))}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="">Selecione</option>
                  <option value="sim">Sim</option>
                  <option value="não">Não</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="hipertensao">Hipertensão Arterial</Label>
                <select 
                  id="hipertensao"
                  value={testData.hipertensao || ''} 
                  onChange={(e) => setTestData(prev => ({ ...prev, hipertensao: e.target.value as 'sim' | 'não' }))}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="">Selecione</option>
                  <option value="sim">Sim</option>
                  <option value="não">Não</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="diabetes">Diabetes Mellitus</Label>
                <select 
                  id="diabetes"
                  value={testData.diabetes || ''} 
                  onChange={(e) => setTestData(prev => ({ ...prev, diabetes: e.target.value as 'sim' | 'não' }))}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="">Selecione</option>
                  <option value="sim">Sim</option>
                  <option value="não">Não</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="betabloqueador">Betabloqueador</Label>
                <select 
                  id="betabloqueador"
                  value={testData.betabloqueador || ''} 
                  onChange={(e) => setTestData(prev => ({ ...prev, betabloqueador: e.target.value as 'sim' | 'não' }))}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="">Selecione</option>
                  <option value="sim">Sim</option>
                  <option value="não">Não</option>
                </select>
              </div>
            </div>

            {/* Dados Físicos */}
            <div className="space-y-4">
              <h4 className="font-medium">Dados Físicos</h4>
              
              <div className="space-y-2">
                <Label htmlFor="idade">Idade</Label>
                <Input
                  id="idade"
                  type="number"
                  placeholder="Digite a idade"
                  value={testData.idade || ''}
                  onChange={(e) => setTestData(prev => ({ ...prev, idade: parseInt(e.target.value) || undefined }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="peso">Peso (kg)</Label>
                <Input
                  id="peso"
                  type="number"
                  placeholder="Digite o peso"
                  value={testData.peso || ''}
                  onChange={(e) => setTestData(prev => ({ ...prev, peso: parseFloat(e.target.value) || undefined }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="altura">Altura (cm)</Label>
                <Input
                  id="altura"
                  type="number"
                  placeholder="Digite a altura"
                  value={testData.altura || ''}
                  onChange={(e) => setTestData(prev => ({ ...prev, altura: parseFloat(e.target.value) || undefined }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sexo">Sexo</Label>
                <select 
                  id="sexo"
                  value={testData.sexo || ''} 
                  onChange={(e) => setTestData(prev => ({ ...prev, sexo: e.target.value as 'M' | 'F' }))}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="">Selecione</option>
                  <option value="M">Masculino</option>
                  <option value="F">Feminino</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Fechar
            </Button>
            <Button onClick={handleGeneratePreview} disabled={isLoading}>
              <Play className="h-4 w-4 mr-2" />
              {isLoading ? 'Gerando...' : 'Gerar Preview'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Resultado do Preview */}
      {result && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Resultado do Preview
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Aeróbio */}
            {result.outputs.aerobio && (
              <div className="space-y-2">
                <h4 className="font-medium flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  Aeróbio
                </h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Duração:</span> {formatRange(result.outputs.aerobio.duracao_min)} min
                  </div>
                  <div>
                    <span className="text-muted-foreground">Intensidade:</span> {formatMethod(result.outputs.aerobio.intensidade)}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Frequência:</span> {formatRange(result.outputs.aerobio.frequencia_sem)}x/sem
                  </div>
                  {result.outputs.aerobio.obs.length > 0 && (
                    <div className="col-span-2">
                      <span className="text-muted-foreground">Observações:</span>
                      <ul className="list-disc list-inside ml-2">
                        {result.outputs.aerobio.obs.map((obs, index) => (
                          <li key={index}>{obs}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Pesos */}
            {result.outputs.pesos && (
              <div className="space-y-2">
                <h4 className="font-medium flex items-center gap-2">
                  <Dumbbell className="h-4 w-4" />
                  Pesos
                </h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Exercícios:</span> {formatRange(result.outputs.pesos.exercicios)}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Séries:</span> {formatRange(result.outputs.pesos.series)}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Reps:</span> {formatRange(result.outputs.pesos.reps)}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Intensidade:</span> {formatRange(result.outputs.pesos.intensidade_pct_1rm)}% 1RM
                  </div>
                  <div>
                    <span className="text-muted-foreground">Frequência:</span> {formatRange(result.outputs.pesos.frequencia_sem)}x/sem
                  </div>
                  {result.outputs.pesos.obs.length > 0 && (
                    <div className="col-span-2">
                      <span className="text-muted-foreground">Observações:</span>
                      <ul className="list-disc list-inside ml-2">
                        {result.outputs.pesos.obs.map((obs, index) => (
                          <li key={index}>{obs}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Flex/Mob */}
            {result.outputs.flex_mob && (
              <div className="space-y-2">
                <h4 className="font-medium flex items-center gap-2">
                  <StretchHorizontal className="h-4 w-4" />
                  Flexibilidade/Mobilidade
                </h4>
                <div className="text-sm">
                  <div>
                    <span className="text-muted-foreground">Foco:</span> {result.outputs.flex_mob.foco}
                  </div>
                  {result.outputs.flex_mob.obs.length > 0 && (
                    <div>
                      <span className="text-muted-foreground">Observações:</span>
                      <ul className="list-disc list-inside ml-2">
                        {result.outputs.flex_mob.obs.map((obs, index) => (
                          <li key={index}>{obs}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Contraindicações */}
            {result.outputs.contraindicacoes.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                  Contraindicações
                </h4>
                <div className="flex flex-wrap gap-2">
                  {result.outputs.contraindicacoes.map((contra, index) => (
                    <Badge key={index} variant="destructive">{contra}</Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Observações */}
            {result.outputs.observacoes.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Observações
                </h4>
                <ul className="list-disc list-inside text-sm">
                  {result.outputs.observacoes.map((obs, index) => (
                    <li key={index}>{obs}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Debug Info */}
            <div className="space-y-2">
              <h4 className="font-medium">Debug Info</h4>
              <div className="text-sm text-muted-foreground space-y-1">
                <div>Total de regras: {result.debug_info.total_rules}</div>
                <div>Regras aplicáveis: {result.debug_info.applicable_rules}</div>
                <div>Lógica de combinação: {result.debug_info.combination_logic}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
