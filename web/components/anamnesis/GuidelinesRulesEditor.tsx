"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  Upload, 
  Brain, 
  Clock,
  CheckCircle,
  AlertCircle,
  Play,
  GripVertical,
  ArrowRight,
  Settings
} from "lucide-react"
import { toast } from "sonner"
import { CreateRuleModal } from "./CreateRuleModal"
import { EditRuleModal } from "./EditRuleModal"
import { ConfirmDeleteRuleModal } from "./ConfirmDeleteRuleModal"
import { GuidelinesPreviewModal } from "./GuidelinesPreviewModal"
import { GuidelinesVersioningModal } from "./GuidelinesVersioningModal"

// Tipos para as APIs
interface GuidelineVersion {
  id: string
  tenant_id: string
  version: number
  status: 'DRAFT' | 'PUBLISHED'
  is_default: boolean
  created_by: string
  created_at: string
  published_by?: string
  published_at?: string
  guideline_rules?: GuidelineRule[]
}

interface GuidelineRule {
  id: string
  tenant_id: string
  guidelines_version_id: string
  priority_clinical: 'critica' | 'alta' | 'media' | 'baixa'
  condition: {
    all: Array<{
      tag: string
      op: 'eq' | 'in' | 'gt' | 'lt' | 'gte' | 'lte'
      val: string | number | string[]
    }>
  }
  outputs: {
    aerobio: {
      duracao_min: [number, number]
      intensidade: {
        metodo: 'FCR' | 'PSE' | 'vVO2max' | 'MFEL'
        faixa: [number, number]
        texto?: string
      }
      frequencia_sem: [number, number]
      obs?: string[]
    }
    pesos: {
      exercicios: [number, number]
      series: [number, number]
      reps: [number, number]
      frequencia_sem: [number, number]
      intensidade_pct_1rm: [number, number]
      obs?: string[]
    }
    flex_mob: {
      foco?: string
      obs?: string[]
    }
    contraindicacoes: string[]
    observacoes: string[]
  }
  created_at: string
}

interface GuidelinesRulesEditorProps {
  version: GuidelineVersion
  onBack: () => void
  onVersionUpdate?: () => void
}

export function GuidelinesRulesEditor({ version, onBack, onVersionUpdate }: GuidelinesRulesEditorProps) {
  const [rules, setRules] = useState<GuidelineRule[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showCreateRule, setShowCreateRule] = useState(false)
  const [editingRule, setEditingRule] = useState<GuidelineRule | null>(null)
  const [deletingRule, setDeletingRule] = useState<GuidelineRule | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [showVersioning, setShowVersioning] = useState(false)

  useEffect(() => {
    loadRules()
  }, [version.id])

  const loadRules = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/guidelines/versions/${version.id}/rules`)
      const data = await response.json()
      
      if (response.ok) {
        setRules(data.data || [])
      } else {
        toast.error(data.error || 'Erro ao carregar regras')
      }
    } catch (error) {
      console.error('Erro ao carregar regras:', error)
      toast.error('Erro ao carregar regras')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateRule = () => {
    setShowCreateRule(true)
  }

  const handleEditRule = (rule: GuidelineRule) => {
    setEditingRule(rule)
  }

  const handleDeleteRule = (rule: GuidelineRule) => {
    setDeletingRule(rule)
  }

  const confirmDeleteRule = async () => {
    if (!deletingRule) return

    try {
      setIsDeleting(true)
      const response = await fetch(`/api/guidelines/versions/${version.id}/rules/${deletingRule.id}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        toast.success('Regra excluída com sucesso!')
        loadRules()
        setDeletingRule(null)
      } else {
        const data = await response.json()
        toast.error(data.error || 'Erro ao excluir regra')
      }
    } catch (error) {
      console.error('Erro ao excluir regra:', error)
      toast.error('Erro ao excluir regra')
    } finally {
      setIsDeleting(false)
    }
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
      <Badge className={colors[priority as keyof typeof colors]}>
        {labels[priority as keyof typeof labels]}
      </Badge>
    )
  }

  const formatCondition = (condition: GuidelineRule['condition']) => {
    // Verificar se condition.all existe e é um array
    if (!condition || !condition.all || !Array.isArray(condition.all)) {
      return 'Condição não definida'
    }
    
    return condition.all.map(cond => {
      const opLabels = {
        eq: '=',
        in: 'em',
        gt: '>',
        lt: '<',
        gte: '≥',
        lte: '≤'
      }
      
      return `${cond.tag} ${opLabels[cond.op]} ${Array.isArray(cond.val) ? cond.val.join(', ') : cond.val}`
    }).join(' E ')
  }

  const formatOutputs = (outputs: GuidelineRule['outputs']) => {
    if (!outputs) {
      return 'Outputs não definidos'
    }
    
    const sections = []
    
    if (outputs.aerobio && outputs.aerobio.duracao_min && Array.isArray(outputs.aerobio.duracao_min)) {
      sections.push(`Aeróbio: ${outputs.aerobio.duracao_min[0]}-${outputs.aerobio.duracao_min[1]}min`)
    }
    
    if (outputs.pesos && outputs.pesos.exercicios && Array.isArray(outputs.pesos.exercicios)) {
      sections.push(`Pesos: ${outputs.pesos.exercicios[0]}-${outputs.pesos.exercicios[1]} ex`)
    }
    
    if (outputs.contraindicacoes && Array.isArray(outputs.contraindicacoes) && outputs.contraindicacoes.length > 0) {
      sections.push(`${outputs.contraindicacoes.length} contraindicação(ões)`)
    }
    
    return sections.length > 0 ? sections.join(' • ') : 'Nenhum output definido'
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-6 w-48 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
          </div>
          <div className="h-10 w-32 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-gray-200 rounded animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="p-0 h-auto"
            >
              <ArrowRight className="h-4 w-4 rotate-180 mr-1" />
              Voltar
            </Button>
          </div>
          <h2 className="text-2xl font-bold">Regras da Versão {version.version}</h2>
          <p className="text-muted-foreground">
            Configure as regras de decisão para as diretrizes de treino
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => setShowPreview(true)}
            disabled={rules.length === 0}
          >
            <Play className="h-4 w-4 mr-2" />
            Preview
          </Button>
          <Button 
            variant="outline"
            onClick={() => setShowVersioning(true)}
          >
            <Settings className="h-4 w-4 mr-2" />
            Gerenciar Versão
          </Button>
          <Button onClick={handleCreateRule} disabled={version.status !== 'DRAFT'}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Regra
          </Button>
        </div>
      </div>

      {/* Status da Versão */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Badge variant={version.status === 'PUBLISHED' ? 'default' : 'secondary'}>
                {version.status === 'PUBLISHED' ? (
                  <>
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Publicado
                  </>
                ) : (
                  <>
                    <Clock className="h-3 w-3 mr-1" />
                    Rascunho
                  </>
                )}
              </Badge>
              {version.is_default && (
                <Badge className="bg-green-100 text-green-800">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Padrão
                </Badge>
              )}
            </div>
            <div className="text-sm text-muted-foreground">
              {rules.length} regra(s) cadastrada(s)
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Regras */}
      {rules.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Brain className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhuma regra encontrada</h3>
            <p className="text-muted-foreground mb-4">
              Crie sua primeira regra de decisão para as diretrizes
            </p>
            <Button onClick={handleCreateRule} disabled={version.status !== 'DRAFT'}>
              <Plus className="h-4 w-4 mr-2" />
              Criar Regra
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {rules.map((rule, index) => (
            <Card key={rule.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2">
                      {getPriorityBadge(rule.priority_clinical)}
                      <span className="text-xs font-medium text-muted-foreground"># {index + 1}</span>
                      <span className="text-sm text-muted-foreground">
                        Criada em {new Date(rule.created_at).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                    
                    <div className="space-y-1">
                      <p className="font-medium">Condição:</p>
                      <p className="text-sm text-muted-foreground bg-gray-50 p-2 rounded">
                        {formatCondition(rule.condition)}
                      </p>
                    </div>
                    
                    <div className="space-y-1">
                      <p className="font-medium">Outputs:</p>
                      <p className="text-sm text-muted-foreground">
                        {formatOutputs(rule.outputs)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditRule(rule)}
                      disabled={version.status !== 'DRAFT'}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteRule(rule)}
                      disabled={version.status !== 'DRAFT'}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modais de Criação/Edição */}
      <CreateRuleModal
        isOpen={showCreateRule}
        onClose={() => setShowCreateRule(false)}
        onSuccess={() => {
          loadRules()
          setShowCreateRule(false)
        }}
        versionId={version.id}
      />

      {editingRule && (
        <EditRuleModal
          isOpen={!!editingRule}
          onClose={() => setEditingRule(null)}
          onSuccess={() => {
            loadRules()
            setEditingRule(null)
          }}
          rule={editingRule}
          versionId={version.id}
        />
      )}

      <ConfirmDeleteRuleModal
        isOpen={!!deletingRule}
        onClose={() => setDeletingRule(null)}
        onConfirm={confirmDeleteRule}
        ruleId={deletingRule?.id || ''}
        isLoading={isDeleting}
      />

      <GuidelinesPreviewModal
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        version={version}
      />

      <GuidelinesVersioningModal
        isOpen={showVersioning}
        onClose={() => setShowVersioning(false)}
        version={version}
        onVersionUpdate={() => {
          setShowVersioning(false)
          onVersionUpdate?.()
        }}
      />
    </div>
  )
}

