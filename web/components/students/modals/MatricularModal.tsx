"use client"

import { useState } from "react"
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
  Loader2
} from "lucide-react"
import { showSuccessToast, showErrorToast } from "@/lib/toast-utils"

interface MatricularModalProps {
  open: boolean
  onClose: () => void
  studentId: string
  studentName: string
}

export default function MatricularModal({ 
  open, 
  onClose, 
  studentId, 
  studentName 
}: MatricularModalProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    plan: '',
    startDate: '',
    endDate: '',
    value: '',
    observations: ''
  })

  const plans = [
    { id: '1', name: 'Plano Básico', value: 'R$ 99,90', duration: '1 mês' },
    { id: '2', name: 'Plano Premium', value: 'R$ 199,90', duration: '3 meses' },
    { id: '3', name: 'Plano Enterprise', value: 'R$ 399,90', duration: '6 meses' },
    { id: '4', name: 'Plano Anual', value: 'R$ 799,90', duration: '12 meses' }
  ]

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

      // Determinar billing_cycle baseado na duração do plano
      let billingCycle = 'monthly'
      if (selectedPlan.duration.includes('3 meses')) {
        billingCycle = 'quarterly'
      } else if (selectedPlan.duration.includes('6 meses')) {
        billingCycle = 'semiannual'
      } else if (selectedPlan.duration.includes('12 meses')) {
        billingCycle = 'annual'
      }

      // Payload da matrícula
      const payload = {
        student_id: studentId,
        plan_name: selectedPlan.name,
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
        value: selectedPlan.value
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
          {/* Plano */}
          <div className="space-y-2">
            <Label htmlFor="plan" className="text-sm font-medium">
              Plano de Treinamento *
            </Label>
            <Select value={formData.plan} onValueChange={handlePlanChange}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Selecione um plano" />
              </SelectTrigger>
              <SelectContent>
                {plans.map((plan) => (
                  <SelectItem key={plan.id} value={plan.id}>
                    <div className="flex items-center justify-between w-full">
                      <span>{plan.name}</span>
                      <div className="flex items-center gap-2 ml-4">
                        <Badge variant="secondary" className="text-xs">
                          {plan.duration}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {plan.value}
                        </span>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
