"use client"

/**
 * GATE 10.9 - Hotmart Product Mappings Management
 * UI para gerenciar mapeamento de produtos Hotmart → Planos internos
 */

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { 
  ArrowLeft,
  Plus,
  Edit,
  Trash2,
  ArrowRight,
  Package
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface Mapping {
  id: string
  hotmart_product_id: number
  hotmart_product_name: string
  hotmart_product_ucode: string
  internal_plan_id: string
  auto_create_student: boolean
  auto_activate: boolean
  trigger_onboarding: boolean
  plan: {
    id: string
    plan_code: string
    nome: string
    valor: number
    ciclo: string
  }
}

interface Plan {
  id: string
  plan_code: string
  nome: string
  valor: number
  ciclo: string
  ativo: boolean
}

export default function HotmartMappingsPage() {
  const [mappings, setMappings] = useState<Mapping[]>([])
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [showNewModal, setShowNewModal] = useState(false)
  
  // Form state
  const [productId, setProductId] = useState('')
  const [productName, setProductName] = useState('')
  const [selectedPlanId, setSelectedPlanId] = useState('')
  const [autoCreate, setAutoCreate] = useState(true)
  const [autoActivate, setAutoActivate] = useState(true)
  const [triggerOnboarding, setTriggerOnboarding] = useState(true)

  useEffect(() => {
    loadMappings()
    loadPlans()
  }, [])

  const loadMappings = async () => {
    try {
      const response = await fetch('/api/integrations/hotmart/mappings')
      const data = await response.json()
      setMappings(data.mappings || [])
    } catch (error) {
      console.error('Erro ao carregar mapeamentos:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadPlans = async () => {
    try {
      const response = await fetch('/api/services/plans')
      const data = await response.json()
      setPlans(data.plans || [])
    } catch (error) {
      console.error('Erro ao carregar planos:', error)
    }
  }

  const handleCreateMapping = async () => {
    if (!productId || !productName || !selectedPlanId) {
      toast.error('Preencha todos os campos')
      return
    }

    try {
      const response = await fetch('/api/integrations/hotmart/mappings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hotmart_product_id: parseInt(productId),
          hotmart_product_name: productName,
          internal_plan_id: selectedPlanId,
          auto_create_student: autoCreate,
          auto_activate: autoActivate,
          trigger_onboarding: triggerOnboarding
        })
      })

      const data = await response.json()

      if (!response.ok) {
        toast.error(data.error || 'Erro ao criar mapeamento')
        return
      }

      toast.success('Mapeamento criado!')
      setShowNewModal(false)
      loadMappings()
      
      // Limpar form
      setProductId('')
      setProductName('')
      setSelectedPlanId('')
      
    } catch (error: any) {
      toast.error('Erro ao criar mapeamento', {
        description: error.message
      })
    }
  }

  const handleDeleteMapping = async (id: string) => {
    if (!confirm('Remover este mapeamento?')) return

    try {
      const response = await fetch(`/api/integrations/hotmart/mappings/${id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        toast.error('Erro ao remover')
        return
      }

      toast.success('Mapeamento removido')
      loadMappings()
      
    } catch (error: any) {
      toast.error('Erro ao remover', {
        description: error.message
      })
    }
  }

  return (
    <div className="space-y-6 container py-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/app/settings/integrations/hotmart">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">Mapeamento de Produtos</h1>
          <p className="text-muted-foreground">
            Configure quais produtos Hotmart correspondem aos seus planos internos
          </p>
        </div>
        <Button onClick={() => setShowNewModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Mapeamento
        </Button>
      </div>

      {/* Lista de Mapeamentos */}
      {loading ? (
        <div className="text-center py-12 text-muted-foreground">
          Carregando mapeamentos...
        </div>
      ) : mappings.length === 0 ? (
        <Card className="p-12">
          <div className="text-center space-y-3">
            <Package className="h-12 w-12 mx-auto text-muted-foreground opacity-50" />
            <div>
              <h3 className="font-semibold">Nenhum produto mapeado</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Crie seu primeiro mapeamento para automatizar a criação de alunos.
              </p>
            </div>
            <Button onClick={() => setShowNewModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Criar Primeiro Mapeamento
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {mappings.map((mapping) => (
            <Card key={mapping.id} className="relative">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center justify-between">
                  <span className="truncate">{mapping.hotmart_product_name}</span>
                  <Badge variant="outline" className="ml-2 flex-shrink-0">
                    #{mapping.hotmart_product_id}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Mapeamento */}
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">Produto</span>
                  <ArrowRight className="h-3 w-3 text-muted-foreground" />
                  <span className="font-medium">{mapping.plan.nome}</span>
                </div>
                
                {/* Configurações */}
                <div className="flex flex-wrap gap-1">
                  {mapping.auto_create_student && (
                    <Badge variant="secondary" className="text-xs">Auto Criar</Badge>
                  )}
                  {mapping.auto_activate && (
                    <Badge variant="secondary" className="text-xs">Auto Ativar</Badge>
                  )}
                  {mapping.trigger_onboarding && (
                    <Badge variant="secondary" className="text-xs">Onboarding</Badge>
                  )}
                </div>
                
                {/* Ações */}
                <div className="flex gap-2 pt-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="flex-1"
                    onClick={() => toast.info('Edição em breve')}
                  >
                    <Edit className="h-3 w-3 mr-1" />
                    Editar
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleDeleteMapping(mapping.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modal Novo Mapeamento */}
      <Dialog open={showNewModal} onOpenChange={setShowNewModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-visible">
          <DialogHeader>
            <DialogTitle>Novo Mapeamento de Produto</DialogTitle>
            <DialogDescription>
              Configure qual produto Hotmart corresponde a qual plano interno
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 overflow-y-auto max-h-[calc(90vh-200px)] pr-2">
            {/* Produto Hotmart */}
            <div className="space-y-2">
              <Label htmlFor="product-id">ID do Produto Hotmart *</Label>
              <Input 
                id="product-id"
                type="number"
                placeholder="123456"
                value={productId}
                onChange={(e) => setProductId(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Você encontra o ID do produto no painel da Hotmart
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="product-name">Nome do Produto *</Label>
              <Input 
                id="product-name"
                placeholder="Plano Mensal - Academia"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
              />
            </div>

            {/* Plano Interno */}
            <div className="space-y-2">
              <Label htmlFor="plan">Plano Interno *</Label>
              <Select value={selectedPlanId} onValueChange={setSelectedPlanId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um plano" />
                </SelectTrigger>
                <SelectContent>
                  {plans.filter(p => p.ativo).map((plan) => (
                    <SelectItem key={plan.id} value={plan.id}>
                      {plan.nome} - R$ {plan.valor?.toFixed(2)} ({plan.ciclo})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Configurações */}
            <div className="space-y-3 pt-2">
              <h4 className="font-medium text-sm">Automações</h4>
              
              <label className="flex items-center justify-between py-2 cursor-pointer">
                <div>
                  <p className="text-sm font-medium">Criar aluno automaticamente</p>
                  <p className="text-xs text-muted-foreground">
                    Ao receber compra aprovada, criar aluno no sistema
                  </p>
                </div>
                <input 
                  type="checkbox"
                  checked={autoCreate}
                  onChange={(e) => setAutoCreate(e.target.checked)}
                  className="h-4 w-4"
                />
              </label>

              <label className="flex items-center justify-between py-2 cursor-pointer">
                <div>
                  <p className="text-sm font-medium">Ativar aluno imediatamente</p>
                  <p className="text-xs text-muted-foreground">
                    Marcar status como "ativo" ao criar
                  </p>
                </div>
                <input 
                  type="checkbox"
                  checked={autoActivate}
                  onChange={(e) => setAutoActivate(e.target.checked)}
                  className="h-4 w-4"
                />
              </label>

              <label className="flex items-center justify-between py-2 cursor-pointer">
                <div>
                  <p className="text-sm font-medium">Disparar onboarding</p>
                  <p className="text-xs text-muted-foreground">
                    Criar cards no Kanban de onboarding
                  </p>
                </div>
                <input 
                  type="checkbox"
                  checked={triggerOnboarding}
                  onChange={(e) => setTriggerOnboarding(e.target.checked)}
                  className="h-4 w-4"
                />
              </label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewModal(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateMapping}>
              Criar Mapeamento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
