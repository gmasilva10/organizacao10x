"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  Search, 
  Filter, 
  Plus,
  Calendar,
  Receipt,
  AlertCircle,
  DollarSign,
  Edit,
  Trash2,
  MoreHorizontal
} from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { TransactionModal } from "./TransactionModal"

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
  created_at: string
  student_id: string | null
  students?: {
    id: string
    name: string
    email: string
  }
}

export function TransactionsList() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null)
  const [deletingTransaction, setDeletingTransaction] = useState<Transaction | null>(null)
  const [filters, setFilters] = useState({
    type: '',
    status: '',
    search: ''
  })

  async function fetchTransactions() {
    try {
      setLoading(true)

      // Construir query params
      const params = new URLSearchParams()
      if (filters.type) params.append('type', filters.type)
      if (filters.status) params.append('status', filters.status)

      const response = await fetch(`/api/financial/transactions?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setTransactions(data.transactions || [])
      }
    } catch (error) {
      console.error('Erro ao buscar transações:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleDeleteTransaction(transactionId: string) {
    try {
      const response = await fetch(`/api/financial/transactions/${transactionId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        // Atualizar lista local
        setTransactions(prev => prev.filter(t => t.id !== transactionId))
        setDeletingTransaction(null)
        
        // Disparar evento para atualizar outras partes do sistema
        window.dispatchEvent(new CustomEvent('financial:updated', { 
          detail: { reason: 'transaction_deleted', transactionId } 
        }))
      } else {
        const errorData = await response.json()
        console.error('Erro ao excluir transação:', errorData.message)
        alert('Erro ao excluir transação: ' + errorData.message)
      }
    } catch (error) {
      console.error('Erro ao excluir transação:', error)
      alert('Erro ao excluir transação')
    }
  }

  function handleEditTransaction(transaction: Transaction) {
    setEditingTransaction(transaction)
    setModalOpen(true)
  }

  function handleModalClose() {
    setModalOpen(false)
    setEditingTransaction(null)
  }

  function handleModalSuccess() {
    fetchTransactions()
    handleModalClose()
    
    // Disparar evento para atualizar outras partes do sistema
    window.dispatchEvent(new CustomEvent('financial:updated', { 
      detail: { reason: 'transaction_updated' } 
    }))
  }

  useEffect(() => {
    fetchTransactions()
  }, [filters.type, filters.status])

  // Atualiza lista quando houver eventos financeiros globais
  useEffect(() => {
    function handleFinancialUpdated() {
      fetchTransactions()
    }
    if (typeof window !== 'undefined') {
      window.addEventListener('financial:updated', handleFinancialUpdated)
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('financial:updated', handleFinancialUpdated)
      }
    }
  }, [])

  const filteredTransactions = transactions.filter(t => {
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      return (
        t.description?.toLowerCase().includes(searchLower) ||
        t.students?.name?.toLowerCase().includes(searchLower) ||
        t.category.toLowerCase().includes(searchLower)
      )
    }
    return true
  })

  const totalReceitas = transactions
    .filter(t => t.type === 'receita' && t.status === 'pago')
    .reduce((sum, t) => sum + t.amount, 0)

  const totalDespesas = transactions
    .filter(t => t.type === 'despesa' && t.status === 'pago')
    .reduce((sum, t) => sum + t.amount, 0)

  return (
    <div className="space-y-4">
      {/* Header com Resumo */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Receitas</CardTitle>
            <ArrowUpRight className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              R$ {totalReceitas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Despesas</CardTitle>
            <ArrowDownRight className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              R$ {totalDespesas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${(totalReceitas - totalDespesas) >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
              R$ {(totalReceitas - totalDespesas).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros e Ações */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Lançamentos Financeiros</CardTitle>
              <CardDescription>
                {filteredTransactions.length} {filteredTransactions.length === 1 ? 'lançamento' : 'lançamentos'}
              </CardDescription>
            </div>
            <Button onClick={() => setModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Lançamento
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filtros */}
          <div className="flex flex-wrap gap-3">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por descrição, aluno ou categoria..."
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  className="pl-10"
                />
              </div>
            </div>

            <Select 
              value={filters.type} 
              onValueChange={(value: string) => setFilters({ ...filters, type: value })}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value=" ">Todos os tipos</SelectItem>
                <SelectItem value="receita">Receita</SelectItem>
                <SelectItem value="despesa">Despesa</SelectItem>
              </SelectContent>
            </Select>

            <Select 
              value={filters.status} 
              onValueChange={(value: string) => setFilters({ ...filters, status: value })}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value=" ">Todos os status</SelectItem>
                <SelectItem value="pago">Pago</SelectItem>
                <SelectItem value="pendente">Pendente</SelectItem>
                <SelectItem value="cancelado">Cancelado</SelectItem>
                <SelectItem value="reembolsado">Reembolsado</SelectItem>
              </SelectContent>
            </Select>

            {(filters.type || filters.status || filters.search) && (
              <Button
                variant="outline"
                onClick={() => setFilters({ type: '', status: '', search: '' })}
              >
                Limpar Filtros
              </Button>
            )}
          </div>

          {/* Lista de Transações */}
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          ) : filteredTransactions.length > 0 ? (
            <div className="space-y-2">
              {filteredTransactions.map((transaction) => (
                <div 
                  key={transaction.id} 
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      {transaction.type === 'receita' ? (
                        <ArrowUpRight className="h-4 w-4 text-green-600" />
                      ) : (
                        <ArrowDownRight className="h-4 w-4 text-red-600" />
                      )}
                      <span className={`font-semibold ${transaction.type === 'receita' ? 'text-green-600' : 'text-red-600'}`}>
                        {transaction.type === 'receita' ? 'Receita' : 'Despesa'}
                      </span>
                      <Badge variant="outline">{transaction.category}</Badge>
                      {transaction.students?.name && (
                        <span className="text-sm text-muted-foreground">
                          • {transaction.students.name}
                        </span>
                      )}
                    </div>
                    
                    {transaction.description && (
                      <p className="text-sm text-muted-foreground">
                        {transaction.description}
                      </p>
                    )}
                    
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {transaction.paid_at 
                          ? format(new Date(transaction.paid_at), "dd/MM/yyyy", { locale: ptBR })
                          : 'Data não informada'}
                      </span>
                      <span>
                        {transaction.payment_method || 'Não informado'}
                      </span>
                    </div>
                  </div>

                  <div className="text-right flex flex-col items-end gap-2">
                    <div className={`text-xl font-bold ${transaction.type === 'receita' ? 'text-green-600' : 'text-red-600'}`}>
                      {transaction.type === 'receita' ? '+' : '-'} R$ {transaction.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={
                        transaction.status === 'pago' ? 'default' : 
                        transaction.status === 'pendente' ? 'secondary' : 
                        'destructive'
                      }>
                        {transaction.status === 'pago' ? 'Pago' : 
                         transaction.status === 'pendente' ? 'Pendente' : 
                         transaction.status === 'cancelado' ? 'Cancelado' : 'Reembolsado'}
                      </Badge>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEditTransaction(transaction)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => setDeletingTransaction(transaction)}
                            className="text-red-600 focus:text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
              <Receipt className="h-12 w-12 mb-4 opacity-50" />
              <p className="text-sm font-medium">Nenhuma transação encontrada</p>
              <p className="text-xs">Crie um novo lançamento para começar</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de Novo/Editar Lançamento */}
      <TransactionModal
        open={modalOpen}
        onOpenChange={handleModalClose}
        onSuccess={handleModalSuccess}
        transaction={editingTransaction}
      />

      {/* Dialog de Confirmação de Exclusão */}
      <AlertDialog open={!!deletingTransaction} onOpenChange={() => setDeletingTransaction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta transação? Esta ação não pode ser desfeita.
              {deletingTransaction && (
                <div className="mt-2 p-3 bg-muted rounded-md">
                  <p className="font-medium">{deletingTransaction.description}</p>
                  <p className="text-sm text-muted-foreground">
                    {deletingTransaction.type === 'receita' ? '+' : '-'} R$ {deletingTransaction.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingTransaction && handleDeleteTransaction(deletingTransaction.id)}
              className="bg-red-600 hover:bg-red-700"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
