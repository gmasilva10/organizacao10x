"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/components/ui/toast"
import { Plus, Edit, Trash2, ArrowLeft, DollarSign, Calendar, Clock } from "lucide-react"

type Plan = {
  id: string
  plan_code: string
  nome: string
  descricao?: string
  valor: number
  moeda: string
  ciclo?: string
  duracao_em_ciclos?: number
  ativo: boolean
  created_at: string
  updated_at: string
}

export default function PlansPage() {
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [newPlanModal, setNewPlanModal] = useState({ open: false })
  const [editPlanModal, setEditPlanModal] = useState<{ open: boolean; plan: Plan | null }>({ open: false, plan: null })
  const [deleteConfirmModal, setDeleteConfirmModal] = useState<{ open: boolean; plan: Plan | null }>({ open: false, plan: null })
  const { success, error } = useToast()

  const [formData, setFormData] = useState({
    plan_code: '',
    nome: '',
    descricao: '',
    valor: '',
    moeda: 'BRL',
    ciclo: 'sem_ciclo',
    duracao_em_ciclos: '',
    ativo: true
  })

  useEffect(() => {
    // Só carregar planos se o usuário estiver logado
    // Verificar se há um token de autenticação
    const token = localStorage.getItem('supabase.auth.token')
    if (token) {
      loadPlans()
    } else {
      setLoading(false)
    }
  }, [])

  async function loadPlans() {
    try {
      const response = await fetch('/api/plans')
      if (response.ok) {
        const data = await response.json()
        setPlans(data.plans || [])
      } else if (response.status === 401) {
        // Usuário não autenticado - não mostrar erro
        console.log('Usuário não autenticado, redirecionando...')
        setPlans([])
      } else if (response.status === 500) {
        // Erro do servidor - verificar se é problema de autenticação
        console.error('Erro 500 ao carregar planos:', response.status)
        setPlans([])
        // Não mostrar toast de erro para 500, pode ser problema de autenticação
      } else {
        console.error('Erro ao carregar planos:', response.status)
        error("Erro ao carregar planos")
      }
    } catch (error) {
      console.error('Erro ao carregar planos:', error)
      // Só mostrar erro se não for erro de rede/conexão
      if (error instanceof TypeError && error.message.includes('fetch')) {
        console.log('Erro de conexão, tentando novamente...')
        setPlans([])
      } else {
        setPlans([])
        // Não mostrar toast de erro para erros de rede
      }
    } finally {
      setLoading(false)
    }
  }

  function resetForm() {
    setFormData({
      plan_code: '',
      nome: '',
      descricao: '',
      valor: '',
      moeda: 'BRL',
      ciclo: 'sem_ciclo',
      duracao_em_ciclos: '',
      ativo: true
    })
  }

  function openNewPlanModal() {
    resetForm()
    setNewPlanModal({ open: true })
  }

  function openEditPlanModal(plan: Plan) {
    setFormData({
      plan_code: plan.plan_code,
      nome: plan.nome,
      descricao: plan.descricao || '',
      valor: plan.valor.toString(),
      moeda: plan.moeda,
      ciclo: plan.ciclo || 'sem_ciclo',
      duracao_em_ciclos: plan.duracao_em_ciclos?.toString() || '',
      ativo: plan.ativo
    })
    setEditPlanModal({ open: true, plan })
  }

  async function createPlan() {
    try {
      const response = await fetch('/api/plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          valor: parseFloat(formData.valor),
          duracao_em_ciclos: formData.duracao_em_ciclos ? parseInt(formData.duracao_em_ciclos) : undefined,
          ciclo: formData.ciclo === 'sem_ciclo' ? undefined : formData.ciclo
        })
      })

      if (response.ok) {
        success("Plano criado com sucesso!")
        setNewPlanModal({ open: false })
        resetForm()
        loadPlans()
      } else {
        const error = await response.json()
        error(error.error === 'plan_code_already_exists' 
          ? 'Código do plano já existe' 
          : 'Erro ao criar plano')
      }
    } catch (error) {
      console.error('Erro ao criar plano:', error)
      error("Erro ao criar plano")
    }
  }

  async function updatePlan() {
    if (!editPlanModal.plan) return

    try {
      const response = await fetch(`/api/plans/${editPlanModal.plan.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          valor: parseFloat(formData.valor),
          duracao_em_ciclos: formData.duracao_em_ciclos ? parseInt(formData.duracao_em_ciclos) : undefined,
          ciclo: formData.ciclo === 'sem_ciclo' ? undefined : formData.ciclo
        })
      })

      if (response.ok) {
        success("Plano atualizado com sucesso!")
        setEditPlanModal({ open: false, plan: null })
        resetForm()
        loadPlans()
      } else {
        const error = await response.json()
        error(error.error === 'plan_code_already_exists' 
          ? 'Código do plano já existe' 
          : 'Erro ao atualizar plano')
      }
    } catch (error) {
      console.error('Erro ao atualizar plano:', error)
      error("Erro ao atualizar plano")
    }
  }

  async function deletePlan() {
    if (!deleteConfirmModal.plan) return

    try {
      const response = await fetch(`/api/plans/${deleteConfirmModal.plan.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        success("Plano deletado com sucesso!")
        setDeleteConfirmModal({ open: false, plan: null })
        loadPlans()
      } else {
        const error = await response.json()
        error(error.error === 'cannot_delete_plan_with_active_contracts'
          ? 'Não é possível deletar plano com contratos ativos'
          : 'Erro ao deletar plano')
      }
    } catch (error) {
      console.error('Erro ao deletar plano:', error)
      error("Erro ao deletar plano")
    }
  }

  function formatCurrency(value: number, currency: string) {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: currency
    }).format(value)
  }

  function formatCycle(ciclo?: string) {
    if (!ciclo || ciclo === 'sem_ciclo') return 'Sem ciclo'
    const cycles = {
      'mensal': 'Mensal',
      'trimestral': 'Trimestral',
      'semestral': 'Semestral',
      'anual': 'Anual'
    }
    return cycles[ciclo as keyof typeof cycles] || ciclo
  }

  if (loading) {
    return (
      <div className="container py-6">
        <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/app/services" className="hover:underline">Serviços</Link>
          <span>/</span>
          <span className="text-foreground">Planos</span>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Carregando planos...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container py-6">
      {/* Breadcrumb */}
      <div className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/app/services" className="hover:underline">Serviços</Link>
        <span>/</span>
        <span className="text-foreground">Planos</span>
      </div>

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Planos</h1>
        <p className="text-muted-foreground mt-2">
          Gerencie os planos de serviços disponíveis
        </p>
      </div>

      {/* Toolbar */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b mb-6">
        <div className="flex items-center justify-between py-3">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => window.history.back()}
              className="h-8"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
            <Button
              onClick={openNewPlanModal}
              className="h-8"
            >
              <Plus className="h-4 w-4 mr-2" />
              Novo Plano
            </Button>
          </div>
        </div>
      </div>

      {/* Plans Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {plans.map((plan) => (
          <Card key={plan.id} className="relative">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-lg">{plan.nome}</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Código: {plan.plan_code}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={plan.ativo ? "default" : "secondary"}>
                    {plan.ativo ? "Ativo" : "Inativo"}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {plan.descricao && (
                <p className="text-sm text-muted-foreground">{plan.descricao}</p>
              )}
              
              <div className="flex items-center gap-2 text-sm">
                <DollarSign className="h-4 w-4 text-green-600" />
                <span className="font-medium">
                  {formatCurrency(plan.valor, plan.moeda)}
                </span>
              </div>

              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>{formatCycle(plan.ciclo)}</span>
              </div>

              {plan.duracao_em_ciclos && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>{plan.duracao_em_ciclos} ciclos</span>
                </div>
              )}

              <div className="flex items-center gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openEditPlanModal(plan)}
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Editar
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDeleteConfirmModal({ open: true, plan })}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Excluir
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {plans.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Nenhum plano encontrado</p>
          <Button onClick={openNewPlanModal} className="mt-4">
            <Plus className="h-4 w-4 mr-2" />
            Criar primeiro plano
          </Button>
        </div>
      )}

      {/* New Plan Modal */}
      <Dialog open={newPlanModal.open} onOpenChange={(open) => setNewPlanModal({ open })}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Novo Plano</DialogTitle>
            <DialogDescription>
              Crie um novo plano de serviço
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="plan_code">Código do Plano</Label>
                <Input
                  id="plan_code"
                  value={formData.plan_code}
                  onChange={(e) => setFormData({ ...formData, plan_code: e.target.value })}
                  placeholder="Ex: PLANO_A"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nome">Nome</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  placeholder="Ex: Plano Básico"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="descricao">Descrição</Label>
              <Textarea
                id="descricao"
                value={formData.descricao}
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                placeholder="Descrição do plano..."
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="valor">Valor</Label>
                <Input
                  id="valor"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.valor}
                  onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="moeda">Moeda</Label>
                <Select value={formData.moeda} onValueChange={(value) => setFormData({ ...formData, moeda: value })}>
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
                <Select value={formData.ciclo} onValueChange={(value) => setFormData({ ...formData, ciclo: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sem_ciclo">Sem ciclo</SelectItem>
                    <SelectItem value="mensal">Mensal</SelectItem>
                    <SelectItem value="trimestral">Trimestral</SelectItem>
                    <SelectItem value="semestral">Semestral</SelectItem>
                    <SelectItem value="anual">Anual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="duracao_em_ciclos">Duração em Ciclos (opcional)</Label>
              <Input
                id="duracao_em_ciclos"
                type="number"
                min="1"
                value={formData.duracao_em_ciclos}
                onChange={(e) => setFormData({ ...formData, duracao_em_ciclos: e.target.value })}
                placeholder="Ex: 12"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="ativo"
                checked={formData.ativo}
                onCheckedChange={(checked) => setFormData({ ...formData, ativo: checked })}
              />
              <Label htmlFor="ativo">Plano ativo</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setNewPlanModal({ open: false })}>
              Cancelar
            </Button>
            <Button onClick={createPlan}>
              Criar Plano
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Plan Modal */}
      <Dialog open={editPlanModal.open} onOpenChange={(open) => setEditPlanModal({ open, plan: null })}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Plano</DialogTitle>
            <DialogDescription>
              Edite as informações do plano
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit_plan_code">Código do Plano</Label>
                <Input
                  id="edit_plan_code"
                  value={formData.plan_code}
                  onChange={(e) => setFormData({ ...formData, plan_code: e.target.value })}
                  placeholder="Ex: PLANO_A"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_nome">Nome</Label>
                <Input
                  id="edit_nome"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  placeholder="Ex: Plano Básico"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit_descricao">Descrição</Label>
              <Textarea
                id="edit_descricao"
                value={formData.descricao}
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                placeholder="Descrição do plano..."
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit_valor">Valor</Label>
                <Input
                  id="edit_valor"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.valor}
                  onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_moeda">Moeda</Label>
                <Select value={formData.moeda} onValueChange={(value) => setFormData({ ...formData, moeda: value })}>
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
                <Label htmlFor="edit_ciclo">Ciclo</Label>
                <Select value={formData.ciclo} onValueChange={(value) => setFormData({ ...formData, ciclo: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sem_ciclo">Sem ciclo</SelectItem>
                    <SelectItem value="mensal">Mensal</SelectItem>
                    <SelectItem value="trimestral">Trimestral</SelectItem>
                    <SelectItem value="semestral">Semestral</SelectItem>
                    <SelectItem value="anual">Anual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit_duracao_em_ciclos">Duração em Ciclos (opcional)</Label>
              <Input
                id="edit_duracao_em_ciclos"
                type="number"
                min="1"
                value={formData.duracao_em_ciclos}
                onChange={(e) => setFormData({ ...formData, duracao_em_ciclos: e.target.value })}
                placeholder="Ex: 12"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="edit_ativo"
                checked={formData.ativo}
                onCheckedChange={(checked) => setFormData({ ...formData, ativo: checked })}
              />
              <Label htmlFor="edit_ativo">Plano ativo</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditPlanModal({ open: false, plan: null })}>
              Cancelar
            </Button>
            <Button onClick={updatePlan}>
              Salvar Alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm Modal */}
      <Dialog open={deleteConfirmModal.open} onOpenChange={(open) => setDeleteConfirmModal({ open, plan: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir o plano "{deleteConfirmModal.plan?.nome}"? 
              Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmModal({ open: false, plan: null })}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={deletePlan}>
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
