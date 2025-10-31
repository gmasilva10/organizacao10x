"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { 
  GraduationCap, 
  Calendar, 
  DollarSign, 
  CheckCircle,
  Loader2,
  AlertCircle
} from "lucide-react"
import { showSuccessToast, showErrorToast } from "@/lib/toast-utils"

interface MatricularModalProps {
  open: boolean
  onClose: () => void
  studentId: string
  studentName: string
}

interface Plan {
  id: string
  nome: string
  valor: number
  ciclo: string | null
  ativo: boolean
}

export default function MatricularModal({ 
  open, 
  onClose, 
  studentId, 
  studentName 
}: MatricularModalProps) {
  const [loading, setLoading] = useState(false)
  const [loadingPlans, setLoadingPlans] = useState(false)
  const [plans, setPlans] = useState<Plan[]>([])
  const [plansError, setPlansError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    enrollmentType: 'nova' as 'nova' | 'renovacao',
    plan: '',
    startDate: '',
    endDate: '',
    value: '',
    observations: ''
  })

  // Buscar planos do banco quando modal abrir
  useEffect(() => {
    if (open) {
      fetchPlans()
    }
  }, [open])

  const fetchPlans = async () => {
    setLoadingPlans(true)
    setPlansError(null)
    try {
      const response = await fetch('/api/plans')
      if (!response.ok) {
        throw new Error('Erro ao buscar planos')
      }
      const data = await response.json()
      // Filtrar apenas planos ativos
      const activePlans = (data.plans || []).filter((p: Plan) => p.ativo === true)
      setPlans(activePlans)
      
      if (activePlans.length === 0) {
        setPlansError('Nenhum plano ativo encontrado. Cadastre planos em Serviços > Financeiro > Planos de Pagamento.')
      }
    } catch (error) {
      console.error('Erro ao buscar planos:', error)
      setPlansError('Erro ao carregar planos. Tente novamente.')
    } finally {
      setLoadingPlans(false)
    }
  }

  // Mapear ciclo do plano para billing_cycle da API
  const mapCicloToBillingCycle = (ciclo: string | null): string => {
    if (!ciclo) return 'monthly'
    
    const cicloMap: Record<string, string> = {
      'mensal': 'monthly',
      'trimestral': 'quarterly',
      'semestral': 'semiannual',
      'anual': 'annual'
    }
    
    return cicloMap[ciclo.toLowerCase()] || 'monthly'
  }

  // Formatar valor para exibição
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  // Obter duração formatada do ciclo
  const getDurationLabel = (ciclo: string | null): string => {
    if (!ciclo) return '1 mês'
    
    const durationMap: Record<string, string> = {
      'mensal': '1 mês',
      'trimestral': '3 meses',
      'semestral': '6 meses',
      'anual': '12 meses'
    }
    
    return durationMap[ciclo.toLowerCase()] || '1 mês'
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.plan || !formData.startDate || !formData.value) {
      showErrorToast('Preencha todos os campos obrigatórios')
      return
    }

    setLoading(true)
    
    try {
      console.log('📝 [MATRICULA] Iniciando matrícula do aluno:', studentName)
      
      // Buscar informações do plano selecionado
      const selectedPlan = plans.find(p => p.id === formData.plan)
      if (!selectedPlan) {
        throw new Error('Plano não encontrado')
      }

      // Extrair valor numérico (remover "R$ " e converter vírgula para ponto)
      const valueStr = formData.value.replace(/[^\d,]/g, '').replace(',', '.')
      const valueNumber = parseFloat(valueStr)
      
      if (isNaN(valueNumber) || valueNumber <= 0) {
        showErrorToast('Valor inválido. Use o formato: R$ 99,90')
        return
      }

      // Mapear ciclo do plano para billing_cycle
      const billingCycle = mapCicloToBillingCycle(selectedPlan.ciclo)

      // Payload da matrícula
      const payload = {
        student_id: studentId,
        plan_id: selectedPlan.id,
        plan_name: selectedPlan.nome,
        enrollment_type: formData.enrollmentType,
        price_cents: Math.round(valueNumber * 100), // Converter para centavos
        billing_cycle: billingCycle,
        start_date: formData.startDate,
        end_date: formData.endDate || null,
        observations: formData.observations || null,
        payment_method: 'manual' // Matrícula manual
      }

      console.log('📝 [MATRICULA] Payload:', payload)

      // Chamar API de matrícula
      const response = await fetch('/api/students/matricular', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Erro ao matricular aluno')
      }

      const result = await response.json()
      console.log('✅ [MATRICULA] Sucesso:', result)

      // Notificar toda a aplicação para atualizar dashboards/listas em tempo real
      try {
        window.dispatchEvent(new CustomEvent('financial:updated', { detail: { reason: 'student_enrolled', studentId } }))
      } catch {}

      showSuccessToast(`Aluno ${studentName} matriculado com sucesso! Lançamento financeiro criado automaticamente.`)
      onClose()
      
      // Reset form
      setFormData({
        enrollmentType: 'nova',
        plan: '',
        startDate: '',
        endDate: '',
        value: '',
        observations: ''
      })
      
    } catch (error) {
      console.error('❌ [MATRICULA] Erro:', error)
      showErrorToast(error instanceof Error ? error.message : 'Erro ao matricular aluno')
    } finally {
      setLoading(false)
    }
  }

  const handlePlanChange = (planId: string) => {
    const selectedPlan = plans.find(p => p.id === planId)
    if (selectedPlan) {
      setFormData(prev => ({
        ...prev,
        plan: planId,
        value: formatCurrency(selectedPlan.valor)
      }))
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-purple-600" />
            Matricular Aluno
          </DialogTitle>
          <DialogDescription>
            Matricular {studentName} em um plano de treinamento
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Tipo de Matrícula */}
          <div className="space-y-2">
            <Label htmlFor="enrollmentType" className="text-sm font-medium">
              Tipo de Matrícula *
            </Label>
            <Select 
              value={formData.enrollmentType} 
              onValueChange={(value: 'nova' | 'renovacao') => 
                setFormData(prev => ({ ...prev, enrollmentType: value }))
              }
            >
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="nova">Nova Matrícula</SelectItem>
                <SelectItem value="renovacao">Renovação</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Plano */}
          <div className="space-y-2">
            <Label htmlFor="plan" className="text-sm font-medium">
              Plano de Treinamento *
            </Label>
            {loadingPlans ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Carregando planos...
              </div>
            ) : plansError ? (
              <div className="flex items-center gap-2 text-sm text-destructive p-3 border border-destructive rounded-md bg-destructive/10">
                <AlertCircle className="h-4 w-4" />
                {plansError}
              </div>
            ) : (
              <Select value={formData.plan} onValueChange={handlePlanChange} disabled={plans.length === 0}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Selecione um plano" />
                </SelectTrigger>
                <SelectContent>
                  {plans.map((plan) => (
                    <SelectItem key={plan.id} value={plan.id}>
                      <div className="flex items-center justify-between w-full">
                        <span>{plan.nome}</span>
                        <div className="flex items-center gap-2 ml-4">
                          {plan.ciclo && (
                            <Badge variant="secondary" className="text-xs">
                              {getDurationLabel(plan.ciclo)}
                            </Badge>
                          )}
                          <span className="text-sm text-muted-foreground">
                            {formatCurrency(plan.valor)}
                          </span>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Data de Início */}
          <div className="space-y-2">
            <Label htmlFor="startDate" className="text-sm font-medium">
              Data de Início *
            </Label>
            <Input
              id="startDate"
              type="date"
              value={formData.startDate}
              onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
              className="h-9"
            />
          </div>

          {/* Data de Término */}
          <div className="space-y-2">
            <Label htmlFor="endDate" className="text-sm font-medium">
              Data de Término
            </Label>
            <Input
              id="endDate"
              type="date"
              value={formData.endDate}
              onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
              className="h-9"
            />
          </div>

          {/* Valor */}
          <div className="space-y-2">
            <Label htmlFor="value" className="text-sm font-medium">
              Valor da Mensalidade *
            </Label>
            <Input
              id="value"
              value={formData.value}
              onChange={(e) => setFormData(prev => ({ ...prev, value: e.target.value }))}
              placeholder="R$ 0,00"
              className="h-9"
            />
          </div>

          {/* Observações */}
          <div className="space-y-2">
            <Label htmlFor="observations" className="text-sm font-medium">
              Observações
            </Label>
            <Textarea
              id="observations"
              value={formData.observations}
              onChange={(e) => setFormData(prev => ({ ...prev, observations: e.target.value }))}
              placeholder="Observações sobre a matrícula..."
              className="min-h-[80px]"
            />
          </div>

          {/* Botões */}
          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Matriculando...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Confirmar Matrícula
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
