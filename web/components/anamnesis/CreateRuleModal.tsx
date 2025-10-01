import React, { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { TagSelect } from "@/components/ui/tag-select"
import { Plus, X, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { GUIDELINE_TAGS, OPERATORS, VALIDATION_RULES, validateRule, getSuggestionsForTag } from "@/lib/guidelines-constants"

interface CreateRuleModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  versionId: string
}

interface Condition {
  tag: string
  op: 'eq' | 'in' | 'gt' | 'lt' | 'gte' | 'lte'
  val: string | number | string[]
}

interface Outputs {
  aerobio: {
    duracao_min: [number, number]
    intensidade: {
      metodo: 'FCR' | 'PSE' | 'vVO2max' | 'MFEL'
      faixa: [number, number]
      texto?: string
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
    foco?: string
    obs: string[]
  }
  contraindicacoes: string[]
  observacoes: string[]
}

export function CreateRuleModal({ isOpen, onClose, onSuccess, versionId }: CreateRuleModalProps) {
  const [priority, setPriority] = useState<'critica' | 'alta' | 'media' | 'baixa'>('media')
  const [conditions, setConditions] = useState<Condition[]>([{ tag: '', op: 'eq', val: '' }])
  const [outputs, setOutputs] = useState<Outputs>({
    aerobio: { 
      duracao_min: [0, 0], 
      intensidade: { metodo: 'FCR', faixa: [0, 0] }, 
      frequencia_sem: [0, 0], 
      obs: [] 
    },
    pesos: { 
      exercicios: [0, 0], 
      series: [0, 0], 
      reps: [0, 0], 
      frequencia_sem: [0, 0], 
      intensidade_pct_1rm: [0, 0], 
      obs: [] 
    },
    flex_mob: { obs: [] },
    contraindicacoes: [],
    observacoes: []
  })
  const [isLoading, setIsLoading] = useState(false)

  const handleConditionChange = (index: number, field: keyof Condition, value: any) => {
    const newConditions = [...conditions]
    newConditions[index] = { ...newConditions[index], [field]: value }
    setConditions(newConditions)
  }

  const handleAddCondition = () => {
    setConditions([...conditions, { tag: '', op: 'eq', val: '' }])
  }

  const handleRemoveCondition = (index: number) => {
    if (conditions.length > 1) {
      setConditions(conditions.filter((_, i) => i !== index))
    }
  }

  const handleOutputChange = (section: keyof Outputs, field: string, value: any) => {
    setOutputs(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }))
  }

  const handleArrayOutputChange = (field: keyof Outputs, value: string[]) => {
    setOutputs(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      setIsLoading(true)
      
      // Validate rule
      const validation = validateRule({ priority, conditions, outputs })
      if (!validation.isValid) {
        toast.error(validation.errors.join(', '))
        return
      }

      // Create rule
      const response = await fetch(`/api/guidelines/versions/${versionId}/rules`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          priority,
          conditions,
          outputs
        })
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Erro ao criar regra')
      }
      
      toast.success('Regra criada com sucesso!')
      onSuccess()
      onClose()
    } catch (error) {
      console.error('Erro ao criar regra:', error)
      toast.error(error instanceof Error ? error.message : 'Erro ao criar regra')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen) {
      // Reset form when opening
      setConditions([{ tag: '', op: 'eq', val: '' }])
      setOutputs({
        aerobio: { 
          duracao_min: [0, 0], 
          intensidade: { metodo: 'FCR', faixa: [0, 0] }, 
          frequencia_sem: [0, 0], 
          obs: [] 
        },
        pesos: { 
          exercicios: [0, 0], 
          series: [0, 0], 
          reps: [0, 0], 
          frequencia_sem: [0, 0], 
          intensidade_pct_1rm: [0, 0], 
          obs: [] 
        },
        flex_mob: { obs: [] },
        contraindicacoes: [],
        observacoes: []
      })
      setPriority('media')
    }
  }, [isOpen])

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[95vh] overflow-visible p-0">
        <DialogHeader className="px-6 pt-6 pb-4">
          <DialogTitle className="text-2xl font-bold text-gray-900">Nova Regra de Diretriz de Treino</DialogTitle>
          <p className="text-sm text-gray-600 mt-2">Configure as condições e parâmetros de treino para esta regra</p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-8 overflow-y-auto max-h-[calc(95vh-180px)] px-6">
          {/* Prioridade */}
          <div className="bg-gray-50 p-6 rounded-lg border">
            <div className="space-y-3">
              <Label htmlFor="priority" className="text-base font-semibold text-gray-900">Prioridade Clínica</Label>
              <p className="text-sm text-gray-600">Defina o nível de prioridade clínica desta regra</p>
              <Select value={priority} onValueChange={(value: 'critica' | 'alta' | 'media' | 'baixa') => setPriority(value)}>
                <SelectTrigger id="priority" className="h-12">
                  <SelectValue placeholder="Selecione a prioridade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="critica">🔴 Crítica</SelectItem>
                  <SelectItem value="alta">🟠 Alta</SelectItem>
                  <SelectItem value="media">🟡 Média</SelectItem>
                  <SelectItem value="baixa">🟢 Baixa</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Condições */}
          <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Condições</h3>
                <p className="text-sm text-gray-600">Defina as condições que devem ser atendidas para aplicar esta regra</p>
              </div>
              
              <div className="space-y-4">
                {conditions.map((cond, index) => (
                  <div key={index} className="relative bg-white p-4 rounded-lg border border-gray-200 shadow-sm group">
                    <div className="flex items-start gap-4 pr-12">
                      <div className="flex-1 space-y-3">
                        <div>
                          <Label htmlFor={`tag-${index}`} className="text-sm font-semibold text-gray-700">Tag</Label>
                          <p className="text-xs text-gray-500 mb-2">Selecione a característica a ser avaliada</p>
                          <TagSelect
                            value={cond.tag}
                            onValueChange={(value: string) => handleConditionChange(index, 'tag', value)}
                            placeholder="Selecione a tag"
                          />
                        </div>

                        <div>
                          <Label htmlFor={`op-${index}`} className="text-sm font-semibold text-gray-700">Operador</Label>
                          <p className="text-xs text-gray-500 mb-2">Como comparar o valor</p>
                          <Select
                            value={cond.op}
                            onValueChange={(value: 'eq' | 'in' | 'gt' | 'lt' | 'gte' | 'lte') => handleConditionChange(index, 'op', value)}
                          >
                            <SelectTrigger className="h-10">
                              <SelectValue placeholder="Selecione o operador" />
                            </SelectTrigger>
                            <SelectContent>
                              {OPERATORS.map(op => (
                                <SelectItem key={op.value} value={op.value}>
                                  {op.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label htmlFor={`val-${index}`} className="text-sm font-semibold text-gray-700">Valor</Label>
                          <p className="text-xs text-gray-500 mb-2">Valor ou valores para comparação</p>
                          <Input
                            id={`val-${index}`}
                            value={Array.isArray(cond.val) ? cond.val.join(', ') : cond.val}
                            onChange={(e) => handleConditionChange(index, 'val', e.target.value)}
                            placeholder={"Digite o valor (para múltiplos, separe por vírgula)"}
                            className="h-10"
                          />
                        </div>
                      </div>
                      
                      <Button 
                        variant="outline"
                        size="icon" 
                        onClick={() => handleRemoveCondition(index)}
                        className="absolute top-4 right-4 h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 hover:border-red-300"
                        disabled={conditions.length === 1}
                        title={conditions.length === 1 ? "Mínimo de 1 condição" : "Remover condição"}
                        data-testid={`condition-remove-${index}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              
              <Button type="button" variant="outline" onClick={handleAddCondition} className="w-full h-12 border-dashed border-2 border-blue-300 text-blue-600 hover:bg-blue-50" data-testid="condition-add">
                <Plus className="h-5 w-5 mr-2" /> Adicionar Nova Condição
              </Button>
            </div>
          </div>

          {/* Outputs */}
          <div className="bg-green-50 p-6 rounded-lg border border-green-200">
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Parâmetros de Treino</h3>
                <p className="text-sm text-gray-600">Configure os parâmetros de treino que serão aplicados quando as condições forem atendidas</p>
              </div>

              {/* Aeróbio */}
              <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <h4 className="text-lg font-bold text-gray-900">Resistência Aeróbia</h4>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <div>
                        <Label className="text-sm font-semibold text-gray-700">Duração (minutos)</Label>
                        <p className="text-xs text-gray-500 mb-2">Tempo mínimo e máximo de duração</p>
                        <div className="flex gap-3">
                          <div className="flex-1">
                            <Input 
                              type="number" 
                              value={outputs.aerobio.duracao_min[0]} 
                              onChange={(e) => handleOutputChange('aerobio', 'duracao_min', [parseInt(e.target.value) || 0, outputs.aerobio.duracao_min[1]])} 
                              placeholder="Mínimo" 
                              className="h-10"
                            />
                          </div>
                          <div className="flex-1">
                            <Input 
                              type="number" 
                              value={outputs.aerobio.duracao_min[1]} 
                              onChange={(e) => handleOutputChange('aerobio', 'duracao_min', [outputs.aerobio.duracao_min[0], parseInt(e.target.value) || 0])} 
                              placeholder="Máximo" 
                              className="h-10"
                            />
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <Label className="text-sm font-semibold text-gray-700">Frequência (semanas)</Label>
                        <p className="text-xs text-gray-500 mb-2">Quantas vezes por semana</p>
                        <div className="flex gap-3">
                          <div className="flex-1">
                            <Input 
                              type="number" 
                              value={outputs.aerobio.frequencia_sem[0]} 
                              onChange={(e) => handleOutputChange('aerobio', 'frequencia_sem', [parseInt(e.target.value) || 0, outputs.aerobio.frequencia_sem[1]])} 
                              placeholder="Mínimo" 
                              className="h-10"
                            />
                          </div>
                          <div className="flex-1">
                            <Input 
                              type="number" 
                              value={outputs.aerobio.frequencia_sem[1]} 
                              onChange={(e) => handleOutputChange('aerobio', 'frequencia_sem', [outputs.aerobio.frequencia_sem[0], parseInt(e.target.value) || 0])} 
                              placeholder="Máximo" 
                              className="h-10"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div>
                        <Label className="text-sm font-semibold text-gray-700">Método de Intensidade</Label>
                        <p className="text-xs text-gray-500 mb-2">Como medir a intensidade do exercício</p>
                        <Select value={outputs.aerobio.intensidade.metodo} onValueChange={(value: 'FCR' | 'PSE' | 'vVO2max' | 'MFEL') => handleOutputChange('aerobio', 'intensidade', { ...outputs.aerobio.intensidade, metodo: value })}>
                          <SelectTrigger className="h-10">
                            <SelectValue placeholder="Selecione o método" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="FCR">FCR - Frequência Cardíaca de Reserva</SelectItem>
                            <SelectItem value="PSE">PSE - Percepção Subjetiva de Esforço</SelectItem>
                            <SelectItem value="vVO2max">vVO2max - Velocidade no VO2 Máximo</SelectItem>
                            <SelectItem value="MFEL">MFEL - Método de Frequência Cardíaca de Esforço Limiar</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label className="text-sm font-semibold text-gray-700">Faixa de Intensidade (%)</Label>
                        <p className="text-xs text-gray-500 mb-2">Percentual mínimo e máximo de intensidade</p>
                        <div className="flex gap-3">
                          <div className="flex-1">
                            <Input 
                              type="number" 
                              value={outputs.aerobio.intensidade.faixa[0]} 
                              onChange={(e) => handleOutputChange('aerobio', 'intensidade', { ...outputs.aerobio.intensidade, faixa: [parseInt(e.target.value) || 0, outputs.aerobio.intensidade.faixa[1]] })} 
                              placeholder="Mínimo %" 
                              className="h-10"
                            />
                          </div>
                          <div className="flex-1">
                            <Input 
                              type="number" 
                              value={outputs.aerobio.intensidade.faixa[1]} 
                              onChange={(e) => handleOutputChange('aerobio', 'intensidade', { ...outputs.aerobio.intensidade, faixa: [outputs.aerobio.intensidade.faixa[0], parseInt(e.target.value) || 0] })} 
                              placeholder="Máximo %" 
                              className="h-10"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-semibold text-gray-700">Observações Aeróbio</Label>
                    <p className="text-xs text-gray-500 mb-2">Observações específicas para o treino aeróbio</p>
                    <Textarea 
                      value={outputs.aerobio.obs.join('\n')} 
                      onChange={(e) => handleOutputChange('aerobio', 'obs', e.target.value.split('\n'))} 
                      placeholder="Digite as observações, uma por linha..." 
                      className="min-h-[80px]"
                    />
                  </div>
                </div>
              </div>

              {/* Pesos */}
              <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <h4 className="text-lg font-bold text-gray-900">Treino com Pesos</h4>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <Label className="text-sm font-semibold text-gray-700">Número de Exercícios</Label>
                        <p className="text-xs text-gray-500 mb-2">Quantidade de exercícios por sessão</p>
                        <div className="flex gap-3">
                          <div className="flex-1">
                            <Input 
                              type="number" 
                              value={outputs.pesos.exercicios[0]} 
                              onChange={(e) => handleOutputChange('pesos', 'exercicios', [parseInt(e.target.value) || 0, outputs.pesos.exercicios[1]])} 
                              placeholder="Mínimo" 
                              className="h-10"
                            />
                          </div>
                          <div className="flex-1">
                            <Input 
                              type="number" 
                              value={outputs.pesos.exercicios[1]} 
                              onChange={(e) => handleOutputChange('pesos', 'exercicios', [outputs.pesos.exercicios[0], parseInt(e.target.value) || 0])} 
                              placeholder="Máximo" 
                              className="h-10"
                            />
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <Label className="text-sm font-semibold text-gray-700">Séries por Exercício</Label>
                        <p className="text-xs text-gray-500 mb-2">Número de séries para cada exercício</p>
                        <div className="flex gap-3">
                          <div className="flex-1">
                            <Input 
                              type="number" 
                              value={outputs.pesos.series[0]} 
                              onChange={(e) => handleOutputChange('pesos', 'series', [parseInt(e.target.value) || 0, outputs.pesos.series[1]])} 
                              placeholder="Mínimo" 
                              className="h-10"
                            />
                          </div>
                          <div className="flex-1">
                            <Input 
                              type="number" 
                              value={outputs.pesos.series[1]} 
                              onChange={(e) => handleOutputChange('pesos', 'series', [outputs.pesos.series[0], parseInt(e.target.value) || 0])} 
                              placeholder="Máximo" 
                              className="h-10"
                            />
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <Label className="text-sm font-semibold text-gray-700">Repetições por Série</Label>
                        <p className="text-xs text-gray-500 mb-2">Número de repetições em cada série</p>
                        <div className="flex gap-3">
                          <div className="flex-1">
                            <Input 
                              type="number" 
                              value={outputs.pesos.reps[0]} 
                              onChange={(e) => handleOutputChange('pesos', 'reps', [parseInt(e.target.value) || 0, outputs.pesos.reps[1]])} 
                              placeholder="Mínimo" 
                              className="h-10"
                            />
                          </div>
                          <div className="flex-1">
                            <Input 
                              type="number" 
                              value={outputs.pesos.reps[1]} 
                              onChange={(e) => handleOutputChange('pesos', 'reps', [outputs.pesos.reps[0], parseInt(e.target.value) || 0])} 
                              placeholder="Máximo" 
                              className="h-10"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <Label className="text-sm font-semibold text-gray-700">Frequência (semanas)</Label>
                        <p className="text-xs text-gray-500 mb-2">Quantas vezes por semana</p>
                        <div className="flex gap-3">
                          <div className="flex-1">
                            <Input 
                              type="number" 
                              value={outputs.pesos.frequencia_sem[0]} 
                              onChange={(e) => handleOutputChange('pesos', 'frequencia_sem', [parseInt(e.target.value) || 0, outputs.pesos.frequencia_sem[1]])} 
                              placeholder="Mínimo" 
                              className="h-10"
                            />
                          </div>
                          <div className="flex-1">
                            <Input 
                              type="number" 
                              value={outputs.pesos.frequencia_sem[1]} 
                              onChange={(e) => handleOutputChange('pesos', 'frequencia_sem', [outputs.pesos.frequencia_sem[0], parseInt(e.target.value) || 0])} 
                              placeholder="Máximo" 
                              className="h-10"
                            />
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <Label className="text-sm font-semibold text-gray-700">Intensidade (% 1RM)</Label>
                        <p className="text-xs text-gray-500 mb-2">Percentual da carga máxima</p>
                        <div className="flex gap-3">
                          <div className="flex-1">
                            <Input 
                              type="number" 
                              value={outputs.pesos.intensidade_pct_1rm[0]} 
                              onChange={(e) => handleOutputChange('pesos', 'intensidade_pct_1rm', [parseInt(e.target.value) || 0, outputs.pesos.intensidade_pct_1rm[1]])} 
                              placeholder="Mínimo %" 
                              className="h-10"
                            />
                          </div>
                          <div className="flex-1">
                            <Input 
                              type="number" 
                              value={outputs.pesos.intensidade_pct_1rm[1]} 
                              onChange={(e) => handleOutputChange('pesos', 'intensidade_pct_1rm', [outputs.pesos.intensidade_pct_1rm[0], parseInt(e.target.value) || 0])} 
                              placeholder="Máximo %" 
                              className="h-10"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-semibold text-gray-700">Observações Pesos</Label>
                    <p className="text-xs text-gray-500 mb-2">Observações específicas para o treino com pesos</p>
                    <Textarea 
                      value={outputs.pesos.obs.join('\n')} 
                      onChange={(e) => handleOutputChange('pesos', 'obs', e.target.value.split('\n'))} 
                      placeholder="Digite as observações, uma por linha..." 
                      className="min-h-[80px]"
                    />
                  </div>
                </div>
              </div>

              {/* Flexibilidade e Mobilidade */}
              <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <h4 className="text-lg font-bold text-gray-900">Flexibilidade e Mobilidade</h4>
                  </div>
                  
                  <div>
                    <Label htmlFor="flex_foco" className="text-sm font-semibold text-gray-700">Foco</Label>
                    <p className="text-xs text-gray-500 mb-2">Área específica de foco para flexibilidade</p>
                    <Input 
                      id="flex_foco" 
                      value={outputs.flex_mob.foco || ''} 
                      onChange={(e) => handleOutputChange('flex_mob', 'foco', e.target.value)} 
                      placeholder="Ex: Membros inferiores, coluna vertebral..." 
                      className="h-10"
                    />
                  </div>
                  
                  <div>
                    <Label className="text-sm font-semibold text-gray-700">Observações Flexibilidade</Label>
                    <p className="text-xs text-gray-500 mb-2">Observações específicas para flexibilidade e mobilidade</p>
                    <Textarea 
                      value={outputs.flex_mob.obs.join('\n')} 
                      onChange={(e) => handleOutputChange('flex_mob', 'obs', e.target.value.split('\n'))} 
                      placeholder="Digite as observações, uma por linha..." 
                      className="min-h-[80px]"
                    />
                  </div>
                </div>
              </div>

              {/* Contraindicações */}
              <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <h4 className="text-lg font-bold text-gray-900">Contraindicações</h4>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-semibold text-gray-700">Lista de Contraindicações</Label>
                    <p className="text-xs text-gray-500 mb-2">Exercícios ou atividades que devem ser evitados</p>
                    <Textarea
                      value={outputs.contraindicacoes.join('\n')}
                      onChange={(e) => handleArrayOutputChange('contraindicacoes', e.target.value.split('\n'))}
                      placeholder="Digite as contraindicações, uma por linha..."
                      className="min-h-[100px]"
                    />
                  </div>
                </div>
              </div>

              {/* Observações Gerais */}
              <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                    <h4 className="text-lg font-bold text-gray-900">Observações Gerais</h4>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-semibold text-gray-700">Observações Adicionais</Label>
                    <p className="text-xs text-gray-500 mb-2">Informações gerais sobre a aplicação desta regra</p>
                    <Textarea
                      value={outputs.observacoes.join('\n')}
                      onChange={(e) => handleArrayOutputChange('observacoes', e.target.value.split('\n'))}
                      placeholder="Digite as observações gerais, uma por linha..."
                      className="min-h-[100px]"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="bg-gray-50 px-6 py-4 border-t sticky bottom-0">
            <div className="flex justify-end gap-3 w-full">
              <Button type="button" variant="outline" onClick={onClose} disabled={isLoading} className="h-11 px-6">
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading} className="h-11 px-8 bg-blue-600 hover:bg-blue-700">
                {isLoading ? 'Criando Regra...' : 'Criar Regra'}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}