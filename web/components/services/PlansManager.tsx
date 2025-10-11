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
import { Plus, Edit, Trash2, Eye, Save, X, Grid3X3, List } from 'lucide-react'
import { toast } from 'sonner'
import { DeletePlanModal } from './modals/DeletePlanModal'

interface Plan {
  id: string
  plan_code: string
  nome: string
  descricao?: string
  valor: number | null  // MODIFICAR: permitir null
  moeda: string
  ciclo: string | null  // MODIFICAR: permitir null
  ativo: boolean
  category_id?: string
  tipo: 'receita' | 'despesa'
  custom_value: boolean  // ADICIONAR: novo campo
  created_at: string
  updated_at: string
}

interface Category {
  id: string
  name: string
  color: string
  active: boolean
  is_system: boolean
}

type ViewMode = 'cards' | 'table'

export default function PlansManager() {
  const [plans, setPlans] = useState<Plan[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<ViewMode>('cards')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null)
  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    valor: '',
    moeda: 'BRL',
    ciclo: '',
    ativo: true,
    category_id: '',
    tipo: 'receita' as 'receita' | 'despesa',
    custom_value: false  // ADICIONAR: novo campo
  })
  const [saving, setSaving] = useState(false)

  const loadPlans = async () => {
    try {
      setLoading(true)
      const [plansResponse, categoriesResponse] = await Promise.all([
        fetch('/api/services/plans'),
        fetch('/api/financial/categories')
      ])
      
      if (!plansResponse.ok) {
        throw new Error('Erro ao carregar planos')
      }
      const plansData = await plansResponse.json()
      setPlans(plansData.plans || [])
      
      if (categoriesResponse.ok) {
        const categoriesData = await categoriesResponse.json()
        setCategories(categoriesData.categories || [])
      }
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

  const formatPlanValue = (plan: Plan) => {
    if (plan.custom_value) {
      return (
        <span className="text-amber-600 dark:text-amber-400 text-sm font-medium">
          Valor Customizado
        </span>
      )
    }
    return formatCurrency(plan.valor || 0, plan.moeda)
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
      nome: '',
      descricao: '',
      valor: '',
      moeda: 'BRL',
      ciclo: '',
      ativo: true,
      category_id: '',
      tipo: 'receita',
      custom_value: false
    })
  }

  const handleCreatePlan = () => {
    resetForm()
    setShowCreateModal(true)
  }

  const handleEditPlan = (plan: Plan) => {
    setSelectedPlan(plan)
    setFormData({
      nome: plan.nome,
      descricao: plan.descricao || '',
      valor: plan.valor?.toString() || '',
      moeda: plan.moeda,
      ciclo: plan.ciclo || '',
      ativo: plan.ativo,
      category_id: plan.category_id || '',
      tipo: plan.tipo || 'receita',
      custom_value: plan.custom_value || false
    })
    setShowEditModal(true)
  }

  const handleDeletePlan = (plan: Plan) => {
    setSelectedPlan(plan)
    setShowDeleteModal(true)
  }

  const handleDeleteSuccess = () => {
    loadPlans() // Recarregar a lista de planos
  }

  const handleViewPlan = (plan: Plan) => {
    setSelectedPlan(plan)
    setShowViewModal(true)
  }

  const handleSavePlan = async () => {
    try {
      setSaving(true)
      
      // MODIFICAR: Validação condicional baseada em custom_value
      const payload = formData.custom_value 
        ? {
            ...formData,
            valor: null,  // Garantir NULL
            ciclo: null,  // Garantir NULL
            moeda: 'BRL'  // Valor padrão
          }
        : {
            ...formData,
            valor: parseFloat(formData.valor)
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
        <div className="flex items-center gap-3">
          {/* Toggle de Visualização */}
          <div className="flex border rounded-lg" role="group" aria-label="Modo de visualização">
            <Button
              variant={viewMode === 'cards' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('cards')}
              className="rounded-r-none"
              aria-label="Visualizar em cards"
              aria-pressed={viewMode === 'cards'}
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'table' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('table')}
              className="rounded-l-none"
              aria-label="Visualizar em tabela"
              aria-pressed={viewMode === 'table'}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
          <Button onClick={handleCreatePlan} aria-label="Criar novo plano">
            <Plus className="h-4 w-4 mr-2" />
            Novo Plano
          </Button>
        </div>
      </div>

      {plans.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">Nenhum plano encontrado</h3>
              <p className="text-muted-foreground mb-4">
                Crie seu primeiro plano para começar a vender
              </p>
              <Button onClick={handleCreatePlan} aria-label="Criar primeiro plano">
                <Plus className="h-4 w-4 mr-2" />
                Criar Primeiro Plano
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : viewMode === 'cards' ? (
        <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {plans.map((plan) => (
            <Card key={plan.id} className="relative hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <CardTitle className="text-sm font-medium truncate" title={plan.nome}>
                      {plan.nome}
                    </CardTitle>
                  </div>
                  <Badge variant={plan.ativo ? "default" : "secondary"} className="text-xs">
                    {plan.ativo ? "Ativo" : "Inativo"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="text-lg font-bold">
                      {formatPlanValue(plan)}
                    </div>
                    <div className="flex items-center gap-1">
                      <span className={`text-sm ${plan.tipo === 'receita' ? 'text-green-600' : 'text-red-600'}`}>
                        {plan.tipo === 'receita' ? '↑' : '↓'}
                      </span>
                      <span className="text-xs text-muted-foreground capitalize">
                        {plan.tipo}
                      </span>
                    </div>
                  </div>
                  
                  {/* ADICIONAR: Badge para planos com valor customizado */}
                  {plan.custom_value && (
                    <Badge variant="secondary" className="text-xs">
                      <span className="mr-1">⚙️</span>
                      Valor Manual
                    </Badge>
                  )}
                  
                  {/* MODIFICAR: Mostrar ciclo apenas se não for custom_value */}
                  {!plan.custom_value && plan.ciclo && (
                    <div className="text-xs text-muted-foreground">
                      {getCycleLabel(plan.ciclo)}
                    </div>
                  )}
                  {plan.category_id && (
                    <div className="flex items-center gap-1">
                      {(() => {
                        const category = categories.find(c => c.id === plan.category_id)
                        return category ? (
                          <>
                            <div 
                              className="w-1.5 h-1.5 rounded-full" 
                              style={{ backgroundColor: category.color }}
                            />
                            <span className="text-xs text-muted-foreground truncate">{category.name}</span>
                          </>
                        ) : null
                      })()}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-4">
                  <Button variant="ghost" size="sm" onClick={() => handleViewPlan(plan)} aria-label="Ver detalhes do plano">
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleEditPlan(plan)} aria-label="Editar plano">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => handleDeletePlan(plan)} aria-label="Excluir plano">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        /* Visualização em Tabela */
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full" role="table" aria-label="Tabela de planos financeiros">
                <thead className="border-b">
                  <tr>
                    <th className="text-left p-3 font-medium text-sm" scope="col">Nome</th>
                    <th className="text-left p-3 font-medium text-sm" scope="col">Código</th>
                    <th className="text-left p-3 font-medium text-sm" scope="col">Valor</th>
                    <th className="text-left p-3 font-medium text-sm" scope="col">Tipo</th>
                    <th className="text-left p-3 font-medium text-sm" scope="col">Status</th>
                    <th className="text-left p-3 font-medium text-sm" scope="col">Categoria</th>
                    <th className="text-right p-3 font-medium text-sm" scope="col">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {plans.map((plan) => (
                    <tr key={plan.id} className="border-b hover:bg-muted/50">
                      <td className="p-3">
                        <div className="font-medium text-sm">{plan.nome}</div>
                      </td>
                      <td className="p-3 text-muted-foreground text-xs">{plan.plan_code}</td>
                      <td className="p-3">
                        <div className="font-medium text-sm">
                          {formatPlanValue(plan)}
                        </div>
                        {plan.custom_value && (
                          <Badge variant="secondary" className="text-xs mt-1">
                            <span className="mr-1">⚙️</span>
                            Valor Manual
                          </Badge>
                        )}
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-1">
                          <span className={`text-sm ${plan.tipo === 'receita' ? 'text-green-600' : 'text-red-600'}`}>
                            {plan.tipo === 'receita' ? '↑' : '↓'}
                          </span>
                          <span className="text-xs text-muted-foreground capitalize">
                            {plan.tipo}
                          </span>
                        </div>
                      </td>
                      <td className="p-3">
                        <Badge variant={plan.ativo ? "default" : "secondary"} className="text-xs">
                          {plan.ativo ? "Ativo" : "Inativo"}
                        </Badge>
                      </td>
                      <td className="p-3">
                        {plan.category_id && (
                          <div className="flex items-center gap-1">
                            {(() => {
                              const category = categories.find(c => c.id === plan.category_id)
                              return category ? (
                                <>
                                  <div 
                                    className="w-1.5 h-1.5 rounded-full" 
                                    style={{ backgroundColor: category.color }}
                                  />
                                  <span className="text-xs text-muted-foreground">{category.name}</span>
                                </>
                              ) : null
                            })()}
                          </div>
                        )}
                      </td>
                      <td className="p-3">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="sm" onClick={() => handleViewPlan(plan)} aria-label="Ver detalhes do plano">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleEditPlan(plan)} aria-label="Editar plano">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="destructive" size="sm" onClick={() => handleDeletePlan(plan)} aria-label="Excluir plano">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modal de Criação/Edição */}
      <Dialog open={showCreateModal || showEditModal} onOpenChange={(open: boolean) => {
        if (!open) {
          setShowCreateModal(false)
          setShowEditModal(false)
          setSelectedPlan(null)
          resetForm()
        }
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <div className="space-y-4">
              <div>
                <DialogTitle>
                  {selectedPlan ? '✏️ Editar Plano' : '➕ Novo Plano'}
                </DialogTitle>
                <DialogDescription>
                  {selectedPlan ? 'Atualize as informações do plano' : 'Preencha os dados para criar um novo plano'}
                </DialogDescription>
              </div>
              <div className="flex justify-end">
                <div className="flex items-center gap-2">
                  <Switch
                    id="ativo"
                    checked={formData.ativo}
                    onCheckedChange={(checked: boolean) => setFormData(prev => ({ ...prev, ativo: checked }))}
                  />
                  <Label htmlFor="ativo" className="text-sm font-medium">Ativo</Label>
                </div>
              </div>
            </div>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Seção 1: Informações Básicas */}
            <div>
              <h3 className="flex items-center gap-2 text-sm font-medium mb-3">
                📝 Informações Básicas
              </h3>
              <div className="border rounded-lg p-4 space-y-4">
                <div>
                  <Label htmlFor="nome" className="mb-2 block">Nome do Plano *</Label>
                  <Input
                    id="nome"
                    value={formData.nome}
                    onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                    placeholder="Ex: Plano Básico"
                  />
                </div>
              </div>
            </div>

            {/* Seção 2: Valores e Periodicidade */}
            <div>
              <h3 className="flex items-center gap-2 text-sm font-medium mb-3">
                💰 Valores e Periodicidade
              </h3>
              <div className="border rounded-lg p-4 space-y-4 min-h-[200px]">
             {/* ADICIONAR: Toggle Switch para Valor Customizado */}
             <div className="flex items-center justify-between p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
               <div className="flex-1">
                 <Label htmlFor="custom_value" className="font-semibold cursor-pointer">
                   Valor Customizado
                 </Label>
               </div>
               <Switch
                 id="custom_value"
                 checked={formData.custom_value}
                 onCheckedChange={(checked) => {
                   setFormData(prev => ({ 
                     ...prev, 
                     custom_value: checked,
                     // Limpar campos quando ativar
                     ...(checked ? { valor: '', ciclo: '', moeda: 'BRL' } : {})
                   }))
                 }}
               />
             </div>

                {/* MODIFICAR: Campos existentes com disabled quando custom_value = true */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="valor" className="mb-2 block">
                      Valor {!formData.custom_value && '*'}
                    </Label>
                    <Input
                      id="valor"
                      type="number"
                      step="0.01"
                      value={formData.valor}
                      onChange={(e) => setFormData(prev => ({ ...prev, valor: e.target.value }))}
                      placeholder="0.00"
                      disabled={formData.custom_value}  // ADICIONAR
                      className={formData.custom_value ? 'bg-gray-100 dark:bg-gray-800 cursor-not-allowed' : ''}  // ADICIONAR
                    />
                  </div>
                  <div>
                    <Label htmlFor="moeda" className="mb-2 block">Moeda</Label>
                    <Select 
                      value={formData.moeda} 
                      onValueChange={(value: string) => setFormData(prev => ({ ...prev, moeda: value }))}
                      disabled={formData.custom_value}  // ADICIONAR
                    >
                      <SelectTrigger className={formData.custom_value ? 'bg-gray-100 dark:bg-gray-800 cursor-not-allowed' : ''}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="BRL">BRL - Real Brasileiro</SelectItem>
                        <SelectItem value="USD">USD - Dólar Americano</SelectItem>
                        <SelectItem value="EUR">EUR - Euro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label htmlFor="ciclo" className="mb-2 block">Ciclo de Cobrança</Label>
                  <Select 
                    value={formData.ciclo} 
                    onValueChange={(value: string) => setFormData(prev => ({ ...prev, ciclo: value }))}
                    disabled={formData.custom_value}  // ADICIONAR
                  >
                    <SelectTrigger className={formData.custom_value ? 'bg-gray-100 dark:bg-gray-800 cursor-not-allowed' : ''}>
                      <SelectValue placeholder="Selecione o ciclo" />
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
            </div>

            {/* Seção 3: Categoria e Tipo */}
            <div>
              <h3 className="flex items-center gap-2 text-sm font-medium mb-3">
                📂 Categoria e Tipo
              </h3>
              <div className="border rounded-lg p-4 space-y-4">
                <div>
                  <Label htmlFor="category_id" className="mb-2 block">Categoria *</Label>
                  <Select value={formData.category_id} onValueChange={(value: string) => setFormData(prev => ({ ...prev, category_id: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.filter(c => c.active).map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-3 h-3 rounded-full" 
                              style={{ backgroundColor: category.color }}
                            />
                            {category.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="mb-2 block">Tipo Financeiro *</Label>
                  <div className="flex gap-4">
                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        id="tipo_receita"
                        name="tipo"
                        value="receita"
                        checked={formData.tipo === 'receita'}
                        onChange={(e) => setFormData(prev => ({ ...prev, tipo: e.target.value as 'receita' | 'despesa' }))}
                        className="h-4 w-4"
                      />
                      <Label htmlFor="tipo_receita" className="flex items-center gap-1">
                        <span className="text-green-600">↑</span> Receita
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        id="tipo_despesa"
                        name="tipo"
                        value="despesa"
                        checked={formData.tipo === 'despesa'}
                        onChange={(e) => setFormData(prev => ({ ...prev, tipo: e.target.value as 'receita' | 'despesa' }))}
                        className="h-4 w-4"
                      />
                      <Label htmlFor="tipo_despesa" className="flex items-center gap-1">
                        <span className="text-red-600">↓</span> Despesa
                      </Label>
                    </div>
                  </div>
                </div>
              </div>
            </div>


          </div>
          
          <DialogFooter className="flex justify-between">
            <div>
              {selectedPlan && (
                <Button 
                  variant="destructive" 
                  onClick={() => {
                    setShowEditModal(false)
                    setShowDeleteModal(true)
                  }}
                  className="bg-red-600 hover:bg-red-700 text-white border-red-600 hover:border-red-700"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Excluir Plano
                </Button>
              )}
            </div>
            <div className="flex gap-2">
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
                Cancelar
              </Button>
              <Button onClick={handleSavePlan} disabled={saving || !formData.nome || !formData.category_id || (!formData.custom_value && !formData.valor)}>
                {saving ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
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
              
              
              {/* MODIFICAR: Seção de Valores */}
              <div className="border rounded-lg p-4">
                <h4 className="font-semibold mb-3">💰 Valores e Periodicidade</h4>
                <div className="space-y-3">
                  {/* ADICIONAR: Indicador de valor customizado */}
                  {selectedPlan.custom_value && (
                    <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">Valor Customizado</Badge>
                        <span className="text-xs text-muted-foreground">
                          O valor será definido manualmente no lançamento financeiro
                        </span>
                      </div>
                    </div>
                  )}
                  
                  {/* MODIFICAR: Exibir valor apenas se não for customizado */}
                  {!selectedPlan.custom_value && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Valor:</span>
                        <span className="font-semibold">
                          {formatCurrency(selectedPlan.valor || 0, selectedPlan.moeda)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Ciclo:</span>
                        <span className="font-medium">{getCycleLabel(selectedPlan.ciclo)}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Status</Label>
                  <Badge variant={selectedPlan.ativo ? "default" : "secondary"}>
                    {selectedPlan.ativo ? "Ativo" : "Inativo"}
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium">Tipo</Label>
                  <Badge variant={selectedPlan.tipo === 'receita' ? "default" : "destructive"}>
                    {selectedPlan.tipo === 'receita' ? 'Receita' : 'Despesa'}
                  </Badge>
                </div>
              </div>
              
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowViewModal(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Confirmação de Exclusão */}
      <DeletePlanModal
        open={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        planId={selectedPlan?.id || ''}
        planName={selectedPlan?.nome || ''}
        onSuccess={handleDeleteSuccess}
      />
    </div>
  )
}
