"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { Loader2, DollarSign, Calendar } from "lucide-react"

interface Transaction {
  id: string
  type: string
  category: string
  amount: number
  description: string
  payment_method: string
  status: string
  paid_at: string | null
  due_date: string | null
  student_id: string | null
}

interface TransactionModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
  studentId?: string
  studentName?: string
  transaction?: Transaction | null
}

export function TransactionModal({ 
  open, 
  onOpenChange, 
  onSuccess,
  studentId,
  studentName,
  transaction
}: TransactionModalProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    type: 'receita',
    category: 'plano',
    amount: '',
    description: '',
    payment_method: 'manual',
    status: 'pago',
    paid_at: new Date().toISOString().split('T')[0],
    due_date: '',
    student_id: studentId || ''
  })

  useEffect(() => {
    if (studentId) {
      setFormData(prev => ({ ...prev, student_id: studentId }))
    }
  }, [studentId])

  // Preencher formulário quando estiver editando
  useEffect(() => {
    if (transaction) {
      setFormData({
        type: transaction.type,
        category: transaction.category,
        amount: transaction.amount.toString(),
        description: transaction.description || '',
        payment_method: transaction.payment_method || 'manual',
        status: transaction.status,
        paid_at: transaction.paid_at ? transaction.paid_at.split('T')[0] : new Date().toISOString().split('T')[0],
        due_date: transaction.due_date ? transaction.due_date.split('T')[0] : '',
        student_id: transaction.student_id || studentId || ''
      })
    } else {
      // Resetar formulário para novo lançamento
      setFormData({
        type: 'receita',
        category: 'plano',
        amount: '',
        description: '',
        payment_method: 'manual',
        status: 'pago',
        paid_at: new Date().toISOString().split('T')[0],
        due_date: '',
        student_id: studentId || ''
      })
    }
  }, [transaction, studentId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validações
    if (!formData.type) {
      toast.error('Selecione o tipo de transação')
      return
    }

    if (!formData.category) {
      toast.error('Selecione a categoria')
      return
    }

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      toast.error('Digite um valor válido')
      return
    }

    if (formData.type === 'receita' && !formData.student_id) {
      toast.error('Selecione um aluno para receitas')
      return
    }

    setLoading(true)

    try {
      const isEditing = !!transaction
      const url = isEditing ? `/api/financial/transactions/${transaction.id}` : '/api/financial/transactions'
      const method = isEditing ? 'PATCH' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          amount: parseFloat(formData.amount),
          student_id: formData.type === 'receita' ? formData.student_id : null,
          paid_at: formData.status === 'pago' && formData.paid_at ? formData.paid_at : null,
          due_date: formData.due_date || null
        })
      })

      if (!response.ok) {
        throw new Error(isEditing ? 'Erro ao atualizar lançamento' : 'Erro ao criar lançamento')
      }

      toast.success(isEditing ? 'Lançamento atualizado com sucesso!' : 'Lançamento criado com sucesso!')
      
      // Disparar evento para atualizar o dashboard financeiro
      window.dispatchEvent(new CustomEvent('financial:updated', { 
        detail: { 
          reason: isEditing ? 'transaction_updated' : 'transaction_created',
          transactionId: isEditing ? transaction?.id : undefined
        } 
      }))
      
      // Resetar form
      setFormData({
        type: 'receita',
        category: 'plano',
        amount: '',
        description: '',
        payment_method: 'manual',
        status: 'pago',
        paid_at: new Date().toISOString().split('T')[0],
        due_date: '',
        student_id: studentId || ''
      })

      onOpenChange(false)
      onSuccess?.()

    } catch (error) {
      console.error('Erro ao criar lançamento:', error)
      toast.error('Erro ao criar lançamento. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            {transaction ? 'Editar Lançamento Financeiro' : 'Novo Lançamento Financeiro'}
          </DialogTitle>
          <DialogDescription>
            {transaction ? 'Edite os dados do lançamento financeiro' : 'Crie uma receita ou despesa manual no sistema'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Tipo de Transação */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">Tipo *</Label>
              <Select 
                value={formData.type} 
                onValueChange={(value: string) => setFormData({ ...formData, type: value })}
              >
                <SelectTrigger id="type">
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="receita">Receita</SelectItem>
                  <SelectItem value="despesa">Despesa</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Categoria *</Label>
              <Select 
                value={formData.category} 
                onValueChange={(value: string) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger id="category">
                  <SelectValue placeholder="Selecione a categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="plano">Plano</SelectItem>
                  <SelectItem value="reembolso">Reembolso</SelectItem>
                  <SelectItem value="cancelamento">Cancelamento</SelectItem>
                  <SelectItem value="taxa">Taxa</SelectItem>
                  <SelectItem value="comissao">Comissão</SelectItem>
                  <SelectItem value="outros">Outros</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Aluno (apenas para receitas) */}
          {formData.type === 'receita' && !studentId && (
            <div className="space-y-2">
              <Label htmlFor="student_id">Aluno *</Label>
              <Input
                id="student_id"
                value={formData.student_id}
                onChange={(e) => setFormData({ ...formData, student_id: e.target.value })}
                placeholder="ID do aluno"
              />
              <p className="text-xs text-muted-foreground">
                Para vincular a receita a um aluno específico
              </p>
            </div>
          )}

          {studentName && (
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-900 dark:text-blue-100">
                📋 Lançamento será vinculado a: <span className="font-semibold">{studentName}</span>
              </p>
            </div>
          )}

          {/* Valor */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Valor (R$) *</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="0,00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="payment_method">Forma de Pagamento</Label>
              <Select 
                value={formData.payment_method} 
                onValueChange={(value: string) => setFormData({ ...formData, payment_method: value })}
              >
                <SelectTrigger id="payment_method">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pix">PIX</SelectItem>
                  <SelectItem value="boleto">Boleto</SelectItem>
                  <SelectItem value="cartao">Cartão</SelectItem>
                  <SelectItem value="dinheiro">Dinheiro</SelectItem>
                  <SelectItem value="transferencia">Transferência</SelectItem>
                  <SelectItem value="manual">Manual</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Descrição */}
          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Descreva o lançamento..."
              rows={3}
            />
          </div>

          {/* Status e Datas */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select 
                value={formData.status} 
                onValueChange={(value: string) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger id="status">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pago">Pago</SelectItem>
                  <SelectItem value="pendente">Pendente</SelectItem>
                  <SelectItem value="cancelado">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="paid_at">Data de Pagamento</Label>
              <Input
                id="paid_at"
                type="date"
                value={formData.paid_at}
                onChange={(e) => setFormData({ ...formData, paid_at: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="due_date">Data de Vencimento</Label>
              <Input
                id="due_date"
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {transaction ? 'Atualizar Lançamento' : 'Criar Lançamento'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
