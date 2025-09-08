"use client"

import { useEffect, useState } from "react"
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
import { Plus, Edit, Trash2, DollarSign, Calendar, Clock, MoreHorizontal } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

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
}

type Contract = {
  id: string
  student_id: string
  plan_code: string
  unit_price: number
  currency: string
  cycle?: string
  duration_cycles?: number
  start_date: string
  end_date?: string
  status: 'ativo' | 'encerrado' | 'cancelado'
  notes?: string
  created_at: string
  updated_at: string
  plans?: {
    nome: string
    descricao?: string
    valor: number
    moeda: string
    ciclo?: string
    duracao_em_ciclos?: number
  }
}

type Billing = {
  id: string
  student_id: string
  contract_id: string
  plan_code: string
  competencia: string
  valor: number
  moeda: string
  status: 'pendente' | 'pago' | 'cancelado'
  created_at: string
  contract?: {
    plan_code: string
    unit_price: number
    currency: string
    cycle?: string
    start_date: string
    end_date?: string
    status: string
  }
}

type FinancialSummary = {
  activeServices: string[]
  nextBilling?: string
  totalMonthly: number
}

interface FinancialModuleProps {
  studentId: string
  onSummaryChange?: (summary: FinancialSummary) => void
}

export function FinancialModule({ studentId, onSummaryChange }: FinancialModuleProps) {
  const [contracts, setContracts] = useState<Contract[]>([])
  const [billing, setBilling] = useState<Billing[]>([])
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [newContractModal, setNewContractModal] = useState({ open: false })
  const [editContractModal, setEditContractModal] = useState<{ open: boolean; contract: Contract | null }>({ open: false, contract: null })
  const [deleteConfirmModal, setDeleteConfirmModal] = useState<{ open: boolean; contract: Contract | null }>({ open: false, contract: null })
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    plan_code: '',
    start_date: '',
    end_date: '',
    unit_price: '',
    currency: 'BRL',
    cycle: '',
    duration_cycles: '',
    notes: '',
    generate_billing: true
  })

  useEffect(() => {
    loadData()
  }, [studentId])

  async function loadData() {
    setLoading(true)
    try {
      const [contractsRes, billingRes, plansRes] = await Promise.all([
        fetch(`/api/students/${studentId}/contracts`),
        fetch(`/api/students/${studentId}/billing`),
        fetch('/api/plans')
      ])

      if (contractsRes.ok) {
        const contractsData = await contractsRes.json()
        setContracts(contractsData.contracts || [])
      }

      if (billingRes.ok) {
        const billingData = await billingRes.json()
        setBilling(billingData.billing || [])
      }

      if (plansRes.ok) {
        const plansData = await plansRes.json()
        setPlans(plansData.plans?.filter((p: Plan) => p.ativo) || [])
      }

      calculateSummary()
    } catch (error) {
      console.error('Erro ao carregar dados financeiros:', error)
      toast({
        title: "Erro",
        description: "Erro ao carregar dados financeiros",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  function calculateSummary() {
    const activeContracts = contracts.filter(c => c.status === 'ativo')
    const activeServices = activeContracts.map(c => c.plans?.nome || c.plan_code)
    
    const nextBilling = billing
      .filter(b => b.status === 'pendente')
      .sort((a, b) => a.competencia.localeCompare(b.competencia))[0]?.competencia

    // Calcular total mensal estimado considerando todos os ciclos
    const totalMonthly = activeContracts.reduce((sum, contract) => {
      if (!contract.cycle) {
        // Sem ciclo definido, considera como mensal
        return sum + contract.unit_price
      }
      
      // Converte para valor mensal baseado no ciclo
      const monthlyValue = {
        'mensal': contract.unit_price,
        'trimestral': contract.unit_price / 3,
        'semestral': contract.unit_price / 6,
        'anual': contract.unit_price / 12
      }[contract.cycle] || contract.unit_price
      
      return sum + monthlyValue
    }, 0)

    const summary: FinancialSummary = {
      activeServices,
      nextBilling,
      totalMonthly
    }

    onSummaryChange?.(summary)
  }

  function resetForm() {
    setFormData({
      plan_code: '',
      start_date: '',
      end_date: '',
      unit_price: '',
      currency: 'BRL',
      cycle: '',
      duration_cycles: '',
      notes: '',
      generate_billing: true
    })
  }

  function openNewContractModal() {
    resetForm()
    setNewContractModal({ open: true })
  }

  function openEditContractModal(contract: Contract) {
    setFormData({
      plan_code: contract.plan_code,
      start_date: contract.start_date,
      end_date: contract.end_date || '',
      unit_price: contract.unit_price.toString(),
      currency: contract.currency,
      cycle: contract.cycle || '',
      duration_cycles: contract.duration_cycles?.toString() || '',
      notes: contract.notes || '',
      generate_billing: false
    })
    setEditContractModal({ open: true, contract })
  }

  async function createContract() {
    try {
      const response = await fetch(`/api/students/${studentId}/contracts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          unit_price: formData.unit_price ? parseFloat(formData.unit_price) : undefined,
          duration_cycles: formData.duration_cycles ? parseInt(formData.duration_cycles) : undefined,
          cycle: formData.cycle || undefined,
          end_date: formData.end_date || undefined
        })
      })

      if (response.ok) {
        toast({
          title: "Sucesso",
          description: "Contrato criado com sucesso!"
        })
        setNewContractModal({ open: false })
        resetForm()
        loadData()
      } else {
        const error = await response.json()
        toast({
          title: "Erro",
          description: error.error === 'active_contract_exists' 
            ? 'Já existe um contrato ativo para este plano' 
            : error.error === 'plan_not_found_or_inactive'
            ? 'Plano não encontrado ou inativo'
            : 'Erro ao criar contrato',
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Erro ao criar contrato:', error)
      toast({
        title: "Erro",
        description: "Erro ao criar contrato",
        variant: "destructive"
      })
    }
  }

  async function updateContract() {
    if (!editContractModal.contract) return

    try {
      const response = await fetch(`/api/students/${studentId}/contracts/${editContractModal.contract.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          unit_price: formData.unit_price ? parseFloat(formData.unit_price) : undefined,
          currency: formData.currency,
          cycle: formData.cycle || undefined,
          duration_cycles: formData.duration_cycles ? parseInt(formData.duration_cycles) : undefined,
          start_date: formData.start_date,
          end_date: formData.end_date || undefined,
          notes: formData.notes
        })
      })

      if (response.ok) {
        toast({
          title: "Sucesso",
          description: "Contrato atualizado com sucesso!"
        })
        setEditContractModal({ open: false, contract: null })
        resetForm()
        loadData()
      } else {
        toast({
          title: "Erro",
          description: "Erro ao atualizar contrato",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Erro ao atualizar contrato:', error)
      toast({
        title: "Erro",
        description: "Erro ao atualizar contrato",
        variant: "destructive"
      })
    }
  }

  async function deleteContract() {
    if (!deleteConfirmModal.contract) return

    try {
      const response = await fetch(`/api/students/${studentId}/contracts/${deleteConfirmModal.contract.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast({
          title: "Sucesso",
          description: "Contrato deletado com sucesso!"
        })
        setDeleteConfirmModal({ open: false, contract: null })
        loadData()
      } else {
        const error = await response.json()
        toast({
          title: "Erro",
          description: error.error === 'cannot_delete_contract_with_pending_billing'
            ? 'Não é possível deletar contrato com cobranças pendentes'
            : 'Erro ao deletar contrato',
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Erro ao deletar contrato:', error)
      toast({
        title: "Erro",
        description: "Erro ao deletar contrato",
        variant: "destructive"
      })
    }
  }

  async function updateContractStatus(contract: Contract, status: 'ativo' | 'encerrado' | 'cancelado') {
    try {
      const response = await fetch(`/api/students/${studentId}/contracts/${contract.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      })

      if (response.ok) {
        toast({
          title: "Sucesso",
          description: `Contrato ${status === 'ativo' ? 'ativado' : status === 'encerrado' ? 'encerrado' : 'cancelado'} com sucesso!`
        })
        loadData()
      } else {
        toast({
          title: "Erro",
          description: "Erro ao atualizar status do contrato",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Erro ao atualizar status:', error)
      toast({
        title: "Erro",
        description: "Erro ao atualizar status do contrato",
        variant: "destructive"
      })
    }
  }

  function formatCurrency(value: number, currency: string) {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: currency
    }).format(value)
  }

  function formatCycle(ciclo?: string) {
    if (!ciclo) return 'Sem ciclo'
    const cycles = {
      'mensal': 'Mensal',
      'trimestral': 'Trimestral',
      'semestral': 'Semestral',
      'anual': 'Anual'
    }
    return cycles[ciclo as keyof typeof cycles] || ciclo
  }

  function formatCompetencia(competencia: string) {
    if (competencia.length === 6) {
      const year = competencia.slice(0, 4)
      const month = competencia.slice(4, 6)
      return `${month}/${year}`
    }
    return competencia
  }

  function getStatusBadgeVariant(status: string) {
    switch (status) {
      case 'ativo': return 'default'
      case 'encerrado': return 'secondary'
      case 'cancelado': return 'destructive'
      case 'pendente': return 'outline'
      case 'pago': return 'default'
      default: return 'secondary'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando dados financeiros...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header com resumo e botão Nova venda */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Contratos e Cobranças</h3>
            <p className="text-sm text-muted-foreground">Gerencie os contratos e cobranças do aluno</p>
          </div>
          <Button onClick={openNewContractModal}>
            <Plus className="h-4 w-4 mr-2" />
            Nova venda
          </Button>
        </div>
        
        {/* Resumo financeiro detalhado */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-green-100 rounded-lg">
                  <DollarSign className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Mensal</p>
                  <p className="text-lg font-semibold">
                    {formatCurrency(
                      contracts
                        .filter(c => c.status === 'ativo')
                        .reduce((sum, contract) => {
                          if (!contract.cycle) return sum + contract.unit_price
                          const monthlyValue = {
                            'mensal': contract.unit_price,
                            'trimestral': contract.unit_price / 3,
                            'semestral': contract.unit_price / 6,
                            'anual': contract.unit_price / 12
                          }[contract.cycle] || contract.unit_price
                          return sum + monthlyValue
                        }, 0),
                      'BRL'
                    )}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Calendar className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Contratos Ativos</p>
                  <p className="text-lg font-semibold">
                    {contracts.filter(c => c.status === 'ativo').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Clock className="h-4 w-4 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Próxima Cobrança</p>
                  <p className="text-lg font-semibold">
                    {billing
                      .filter(b => b.status === 'pendente')
                      .sort((a, b) => a.competencia.localeCompare(b.competencia))[0] 
                      ? formatCompetencia(billing
                          .filter(b => b.status === 'pendente')
                          .sort((a, b) => a.competencia.localeCompare(b.competencia))[0].competencia)
                      : 'Nenhuma'
                    }
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Tabela de contratos */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Contratos</CardTitle>
        </CardHeader>
        <CardContent>
          {contracts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>Nenhum contrato encontrado</p>
              <Button variant="outline" onClick={openNewContractModal} className="mt-4">
                <Plus className="h-4 w-4 mr-2" />
                Criar primeiro contrato
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Plano</th>
                    <th className="text-left p-2">Valor</th>
                    <th className="text-left p-2">Ciclo</th>
                    <th className="text-left p-2">Início</th>
                    <th className="text-left p-2">Fim</th>
                    <th className="text-left p-2">Status</th>
                    <th className="text-left p-2">Próxima competência</th>
                    <th className="text-left p-2">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {contracts.map((contract) => {
                    const nextBilling = billing
                      .filter(b => b.contract_id === contract.id && b.status === 'pendente')
                      .sort((a, b) => a.competencia.localeCompare(b.competencia))[0]

                    return (
                      <tr key={contract.id} className="border-b">
                        <td className="p-2">
                          <div>
                            <div className="font-medium">{contract.plans?.nome || contract.plan_code}</div>
                            {contract.plans?.descricao && (
                              <div className="text-xs text-muted-foreground">{contract.plans.descricao}</div>
                            )}
                          </div>
                        </td>
                        <td className="p-2">
                          <div className="flex items-center gap-1">
                            <DollarSign className="h-3 w-3 text-green-600" />
                            {formatCurrency(contract.unit_price, contract.currency)}
                          </div>
                        </td>
                        <td className="p-2">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3 text-muted-foreground" />
                            {formatCycle(contract.cycle)}
                          </div>
                        </td>
                        <td className="p-2">{new Date(contract.start_date).toLocaleDateString('pt-BR')}</td>
                        <td className="p-2">
                          {contract.end_date ? new Date(contract.end_date).toLocaleDateString('pt-BR') : '—'}
                        </td>
                        <td className="p-2">
                          <Badge variant={getStatusBadgeVariant(contract.status)}>
                            {contract.status}
                          </Badge>
                        </td>
                        <td className="p-2">
                          {nextBilling ? formatCompetencia(nextBilling.competencia) : '—'}
                        </td>
                        <td className="p-2">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openEditContractModal(contract)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Editar
                              </DropdownMenuItem>
                              {contract.status === 'ativo' && (
                                <>
                                  <DropdownMenuItem onClick={() => updateContractStatus(contract, 'encerrado')}>
                                    Encerrar
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => updateContractStatus(contract, 'cancelado')}>
                                    Cancelar
                                  </DropdownMenuItem>
                                </>
                              )}
                              {contract.status !== 'ativo' && (
                                <DropdownMenuItem onClick={() => updateContractStatus(contract, 'ativo')}>
                                  Reativar
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem 
                                onClick={() => setDeleteConfirmModal({ open: true, contract })}
                                className="text-destructive"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Excluir
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Resumo de cobranças */}
      {billing.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Resumo de Cobranças</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <p className="text-2xl font-bold text-orange-600">
                  {billing.filter(b => b.status === 'pendente').length}
                </p>
                <p className="text-sm text-muted-foreground">Pendentes</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-2xl font-bold text-green-600">
                  {billing.filter(b => b.status === 'pago').length}
                </p>
                <p className="text-sm text-muted-foreground">Pagas</p>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <p className="text-2xl font-bold text-red-600">
                  {billing.filter(b => b.status === 'cancelado').length}
                </p>
                <p className="text-sm text-muted-foreground">Canceladas</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabela de cobranças */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Cobranças</CardTitle>
        </CardHeader>
        <CardContent>
          {billing.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>Nenhuma cobrança encontrada</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Competência</th>
                    <th className="text-left p-2">Plano</th>
                    <th className="text-left p-2">Valor</th>
                    <th className="text-left p-2">Status</th>
                    <th className="text-left p-2">Criado em</th>
                  </tr>
                </thead>
                <tbody>
                  {billing.map((bill) => (
                    <tr key={bill.id} className="border-b">
                      <td className="p-2 font-medium">{formatCompetencia(bill.competencia)}</td>
                      <td className="p-2">{bill.plan_code}</td>
                      <td className="p-2">
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-3 w-3 text-green-600" />
                          {formatCurrency(bill.valor, bill.moeda)}
                        </div>
                      </td>
                      <td className="p-2">
                        <Badge variant={getStatusBadgeVariant(bill.status)}>
                          {bill.status}
                        </Badge>
                      </td>
                      <td className="p-2">{new Date(bill.created_at).toLocaleDateString('pt-BR')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal Nova Venda */}
      <Dialog open={newContractModal.open} onOpenChange={(open) => setNewContractModal({ open })}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Nova Venda</DialogTitle>
            <DialogDescription>
              Crie um novo contrato para o aluno
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="plan_code">Plano</Label>
              <Select value={formData.plan_code} onValueChange={(value) => {
                const selectedPlan = plans.find(p => p.plan_code === value)
                setFormData({ 
                  ...formData, 
                  plan_code: value,
                  unit_price: selectedPlan?.valor.toString() || '',
                  currency: selectedPlan?.moeda || 'BRL',
                  cycle: selectedPlan?.ciclo || ''
                })
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um plano" />
                </SelectTrigger>
                <SelectContent>
                  {plans.map((plan) => (
                    <SelectItem key={plan.id} value={plan.plan_code}>
                      {plan.nome} - {formatCurrency(plan.valor, plan.moeda)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="unit_price">Preço</Label>
                <Input
                  id="unit_price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.unit_price}
                  onChange={(e) => setFormData({ ...formData, unit_price: e.target.value })}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="currency">Moeda</Label>
                <Select value={formData.currency} onValueChange={(value) => setFormData({ ...formData, currency: value })}>
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
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start_date">Início</Label>
                <Input
                  id="start_date"
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end_date">Fim (opcional)</Label>
                <Input
                  id="end_date"
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Observações (opcional)</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Observações sobre o contrato..."
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="generate_billing"
                checked={formData.generate_billing}
                onCheckedChange={(checked) => setFormData({ ...formData, generate_billing: !!checked })}
              />
              <Label htmlFor="generate_billing">Gerar cobrança desta competência</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setNewContractModal({ open: false })}>
              Cancelar
            </Button>
            <Button onClick={createContract}>
              Criar Contrato
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Editar Contrato */}
      <Dialog open={editContractModal.open} onOpenChange={(open) => setEditContractModal({ open, contract: null })}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Contrato</DialogTitle>
            <DialogDescription>
              Edite as informações do contrato
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit_unit_price">Preço</Label>
                <Input
                  id="edit_unit_price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.unit_price}
                  onChange={(e) => setFormData({ ...formData, unit_price: e.target.value })}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_currency">Moeda</Label>
                <Select value={formData.currency} onValueChange={(value) => setFormData({ ...formData, currency: value })}>
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
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit_cycle">Ciclo</Label>
                <Select value={formData.cycle} onValueChange={(value) => setFormData({ ...formData, cycle: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Sem ciclo</SelectItem>
                    <SelectItem value="mensal">Mensal</SelectItem>
                    <SelectItem value="trimestral">Trimestral</SelectItem>
                    <SelectItem value="semestral">Semestral</SelectItem>
                    <SelectItem value="anual">Anual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_duration_cycles">Duração em Ciclos (opcional)</Label>
                <Input
                  id="edit_duration_cycles"
                  type="number"
                  min="1"
                  value={formData.duration_cycles}
                  onChange={(e) => setFormData({ ...formData, duration_cycles: e.target.value })}
                  placeholder="Ex: 12"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit_start_date">Início</Label>
                <Input
                  id="edit_start_date"
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_end_date">Fim (opcional)</Label>
                <Input
                  id="edit_end_date"
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit_notes">Observações (opcional)</Label>
              <Textarea
                id="edit_notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Observações sobre o contrato..."
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditContractModal({ open: false, contract: null })}>
              Cancelar
            </Button>
            <Button onClick={updateContract}>
              Salvar Alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Confirmar Exclusão */}
      <Dialog open={deleteConfirmModal.open} onOpenChange={(open) => setDeleteConfirmModal({ open, contract: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir este contrato? 
              Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmModal({ open: false, contract: null })}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={deleteContract}>
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
