/**
 * GATE 10.8 - Plans Manager Component
 * Wrapper do módulo de planos para uso no Financeiro
 */

'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { ConfirmDeleteDialog } from '@/components/ui/confirm-delete-dialog'
import { Plus, Edit, Trash2, Eye, Save, X } from 'lucide-react'
import { toast } from 'sonner'

interface Plan {
  id: string
  plan_code: string
  nome: string
  descricao?: string
  valor: number
  moeda: string
  ciclo: string
  duracao_em_ciclos?: number
  ativo: boolean
  created_at: string
  updated_at: string
}

export default function PlansManager() {
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null)
  const [formData, setFormData] = useState({
    plan_code: '',
    nome: '',
    descricao: '',
    valor: '',
    moeda: 'BRL',
    ciclo: '',
    duracao_em_ciclos: '',
    ativo: true
  })
  const [saving, setSaving] = useState(false)

  const loadPlans = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/services/plans')
      if (!response.ok) {
        throw new Error('Erro ao carregar planos')
      }
      const data = await response.json()
      setPlans(data.plans || [])
    } catch (error) {
      console.error('Erro ao carregar planos:', error)
      toast.error('Erro ao carregar planos')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPlans()
  }, [])

  const formatCurrency = (value: number, currency: string) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: currency || 'BRL'
    }).format(value)
  }

  const getCycleLabel = (ciclo: string) => {
    const cycles = {
      'diario': 'Diário',
      'semanal': 'Semanal',
      'quinzenal': 'Quinzenal',
      'mensal': 'Mensal',
      'bimestral': 'Bimestral',
      'trimestral': 'Trimestral',
      'semestral': 'Semestral',
      'anual': 'Anual',
      'sem_ciclo': 'Sem ciclo'
    }
    return cycles[ciclo as keyof typeof cycles] || ciclo
  }

  const resetForm = () => {
    setFormData({
      plan_code: '',
      nome: '',
      descricao: '',
      valor: '',
      moeda: 'BRL',
      ciclo: '',
      duracao_em_ciclos: '',
      ativo: true
    })
  }

  const handleCreatePlan = () => {
    resetForm()
    setShowCreateModal(true)
  }

  const handleEditPlan = (plan: Plan) => {
    setSelectedPlan(plan)
    setFormData({
      plan_code: plan.plan_code,
      nome: plan.nome,
      descricao: plan.descricao || '',
      valor: plan.valor.toString(),
      moeda: plan.moeda,
      ciclo: plan.ciclo || '',
      duracao_em_ciclos: plan.duracao_em_ciclos?.toString() || '',
      ativo: plan.ativo
    })
    setShowEditModal(true)
  }

  const handleDeletePlan = (plan: Plan) => {
    setSelectedPlan(plan)
    setShowDeleteModal(true)
  }

  const handleViewPlan = (plan: Plan) => {
    setSelectedPlan(plan)
    setShowViewModal(true)
  }

  const handleSavePlan = async () => {
    try {
      setSaving(true)
      
      const payload = {
        ...formData,
        valor: parseFloat(formData.valor),
        duracao_em_ciclos: formData.duracao_em_ciclos ? parseInt(formData.duracao_em_ciclos) : undefined
      }

      const url = selectedPlan ? `/api/services/plans/${selectedPlan.id}` : '/api/services/plans'
      const method = selectedPlan ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.details || errorData.error || 'Erro ao salvar plano')
      }

      const data = await response.json()
      toast.success(data.message || 'Plano salvo com sucesso')
      
      await loadPlans()
      
      setShowCreateModal(false)
      setShowEditModal(false)
      setSelectedPlan(null)
      resetForm()
      
    } catch (error: any) {
      console.error('Erro ao salvar plano:', error)
      toast.error(error.message || 'Erro ao salvar plano')
    } finally {
      setSaving(false)
    }
  }

  const handleConfirmDelete = async () => {
    if (!selectedPlan) return

    try {
      setSaving(true)
      
      const response = await fetch(`/api/services/plans/${selectedPlan.id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.details || errorData.error || 'Erro ao excluir plano')
      }

      const data = await response.json()
      toast.success(data.message || 'Plano excluído com sucesso')
      
      await loadPlans()
      
      setShowDeleteModal(false)
      setSelectedPlan(null)
      
    } catch (error: any) {
      console.error('Erro ao excluir plano:', error)
      toast.error(error.message || 'Erro ao excluir plano')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold tracking-tight">Planos</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-6 bg-gray-200 rounded w-1/3 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-full"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Planos</h2>
          <p className="text-muted-foreground">
            Gerencie seus planos de venda e assinatura
          </p>
        </div>
        <Button onClick={handleCreatePlan}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Plano
        </Button>
      </div>

      {plans.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">Nenhum plano encontrado</h3>
              <p className="text-muted-foreground mb-4">
                Crie seu primeiro plano para começar a vender
              </p>
              <Button onClick={handleCreatePlan}>
                <Plus className="h-4 w-4 mr-2" />
                Criar Primeiro Plano
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan) => (
            <Card key={plan.id} className="relative">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{plan.nome}</CardTitle>
                    <CardDescription className="text-sm">
                      {plan.plan_code}
                    </CardDescription>
                  </div>
                  <Badge variant={plan.ativo ? "default" : "secondary"}>
                    {plan.ativo ? "Ativo" : "Inativo"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="text-2xl font-bold">
                    {formatCurrency(plan.valor, plan.moeda)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {getCycleLabel(plan.ciclo)}
                    {plan.duracao_em_ciclos && ` • ${plan.duracao_em_ciclos} ciclos`}
                  </div>
                  {plan.descricao && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {plan.descricao}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-4">
                  <Button variant="outline" size="sm" onClick={() => handleViewPlan(plan)}>
                    <Eye className="h-4 w-4 mr-1" />
                    Ver
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleEditPlan(plan)}>
                    <Edit className="h-4 w-4 mr-1" />
                    Editar
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleDeletePlan(plan)}>
                    <Trash2 className="h-4 w-4 mr-1" />
                    Excluir
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modal de Criação/Edição */}
      <Dialog open={showCreateModal || showEditModal} onOpenChange={(open) => {
        if (!open) {
          setShowCreateModal(false)
          setShowEditModal(false)
          setSelectedPlan(null)
          resetForm()
        }
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedPlan ? 'Editar Plano' : 'Novo Plano'}
            </DialogTitle>
            <DialogDescription>
              {selectedPlan ? 'Atualize as informações do plano' : 'Preencha os dados para criar um novo plano'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="plan_code">Código do Plano *</Label>
                <Input
                  id="plan_code"
                  value={formData.plan_code}
                  onChange={(e) => setFormData(prev => ({ ...prev, plan_code: e.target.value }))}
                  placeholder="Ex: PLANO_BASICO"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nome">Nome *</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                  placeholder="Ex: Plano Básico"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="descricao">Descrição</Label>
              <Textarea
                id="descricao"
                value={formData.descricao}
                onChange={(e) => setFormData(prev => ({ ...prev, descricao: e.target.value }))}
                placeholder="Descreva o plano..."
                rows={3}
              />
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="valor">Valor *</Label>
                <Input
                  id="valor"
                  type="number"
                  step="0.01"
                  value={formData.valor}
                  onChange={(e) => setFormData(prev => ({ ...prev, valor: e.target.value }))}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="moeda">Moeda</Label>
                <Select value={formData.moeda} onValueChange={(value) => setFormData(prev => ({ ...prev, moeda: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BRL">BRL</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="ciclo">Ciclo</Label>
                <Select value={formData.ciclo} onValueChange={(value) => setFormData(prev => ({ ...prev, ciclo: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mensal">Mensal</SelectItem>
                    <SelectItem value="trimestral">Trimestral</SelectItem>
                    <SelectItem value="semestral">Semestral</SelectItem>
                    <SelectItem value="anual">Anual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="duracao_em_ciclos">Duração em Ciclos</Label>
              <Input
                id="duracao_em_ciclos"
                type="number"
                value={formData.duracao_em_ciclos}
                onChange={(e) => setFormData(prev => ({ ...prev, duracao_em_ciclos: e.target.value }))}
                placeholder="Ex: 12"
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="ativo"
                checked={formData.ativo}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, ativo: checked }))}
              />
              <Label htmlFor="ativo">Plano ativo</Label>
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowCreateModal(false)
                setShowEditModal(false)
                setSelectedPlan(null)
                resetForm()
              }}
              disabled={saving}
            >
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
            <Button onClick={handleSavePlan} disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Visualização */}
      <Dialog open={showViewModal} onOpenChange={setShowViewModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Detalhes do Plano</DialogTitle>
            <DialogDescription>
              Informações completas do plano selecionado
            </DialogDescription>
          </DialogHeader>
          
          {selectedPlan && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Código</Label>
                  <p className="text-sm text-muted-foreground">{selectedPlan.plan_code}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Nome</Label>
                  <p className="text-sm text-muted-foreground">{selectedPlan.nome}</p>
                </div>
              </div>
              
              {selectedPlan.descricao && (
                <div>
                  <Label className="text-sm font-medium">Descrição</Label>
                  <p className="text-sm text-muted-foreground">{selectedPlan.descricao}</p>
                </div>
              )}
              
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label className="text-sm font-medium">Valor</Label>
                  <p className="text-sm text-muted-foreground">
                    {formatCurrency(selectedPlan.valor, selectedPlan.moeda)}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Ciclo</Label>
                  <p className="text-sm text-muted-foreground">
                    {getCycleLabel(selectedPlan.ciclo)}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Status</Label>
                  <Badge variant={selectedPlan.ativo ? "default" : "secondary"}>
                    {selectedPlan.ativo ? "Ativo" : "Inativo"}
                  </Badge>
                </div>
              </div>
              
              {selectedPlan.duracao_em_ciclos && (
                <div>
                  <Label className="text-sm font-medium">Duração</Label>
                  <p className="text-sm text-muted-foreground">
                    {selectedPlan.duracao_em_ciclos} ciclos
                  </p>
                </div>
              )}
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowViewModal(false)}>
              <X className="h-4 w-4 mr-2" />
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Confirmação de Exclusão */}
      <ConfirmDeleteDialog
        open={showDeleteModal}
        onOpenChange={setShowDeleteModal}
        onConfirm={handleConfirmDelete}
        title="Excluir Plano"
        description="Tem certeza que deseja excluir este plano?"
        itemName={selectedPlan?.nome}
        itemType="plano"
        loading={saving}
      />
    </div>
  )
}
