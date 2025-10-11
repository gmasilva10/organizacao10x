"use client"

import { useState } from "react"
import { useStudents, usePrefetchStudent } from "@/hooks/useStudents"
import { useStudentSearch } from "@/hooks/useDebounce"
import { useQueryClient } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ListPageSkeleton } from "@/components/ui/skeleton"
import { 
  Search, 
  Plus, 
  Grid3X3, 
  List, 
  User,
  Mail,
  Phone,
  Calendar,
  Filter,
  ChevronLeft,
  ChevronRight
} from "lucide-react"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"
import StudentCardActions from "@/components/students/StudentCardActions"
import StudentTableActions from "@/components/students/StudentTableActions"
import Link from "next/link"
import { toast } from "sonner"
import { StudentCreateModal } from "@/components/students/StudentCreateModal"
import StudentsFilterDrawer from "@/components/students/StudentsFilterDrawer"
import EmptyState from "@/components/ui/EmptyState"
import { showNoStudentsFound, showStudentError, showStudentUpdated } from "@/lib/toast-utils"

type Student = {
  id: string
  name: string
  email: string
  phone: string
  status: 'onboarding' | 'active' | 'paused' | 'inactive'
  created_at: string
  trainer?: {
    id: string
    name: string
  } | null
}

type ViewMode = 'cards' | 'table'

export default function StudentsPage() {
  const queryClient = useQueryClient()
  const [viewMode, setViewMode] = useState<ViewMode>('cards')
  const [createOpen, setCreateOpen] = useState(false)
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [filters, setFilters] = useState({
    q: '',
    status: '',
    trainerId: ''
  })
  
  // Busca com debounce
  const { searchTerm, setSearchTerm, debouncedSearchTerm } = useStudentSearch('')
  
  // React Query para listar alunos
  const { 
    data: studentsData, 
    isLoading: loading, 
    error,
    isFetching,
    refetch
  } = useStudents({
    page: currentPage,
    q: debouncedSearchTerm || filters.q,
    status: filters.status,
    trainer_id: filters.trainerId
  })
  
  // Prefetch para detalhe do aluno
  const prefetchStudent = usePrefetchStudent()
  
  const students = (studentsData as any)?.students || []
  const total = (studentsData as any)?.total || students.length
  const pageSize = (studentsData as any)?.pageSize || 50
  const totalPages = Math.ceil(total / pageSize)

  // Função para atualizar a listagem após ações
  const handleStudentActionComplete = () => {
    refetch()
  }

  // Funções de paginação
  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1)
    }
  }

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1)
    }
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  // Funções para filtros
  const handleFiltersChange = (newFilters: { q: string; status: string; trainerId: string }) => {
    setFilters(newFilters)
    setCurrentPage(1) // Resetar para primeira página ao filtrar
  }

  const handleClearFilters = () => {
    setFilters({ q: '', status: '', trainerId: '' })
    setSearchTerm('')
    setCurrentPage(1) // Resetar para primeira página ao limpar filtros
  }

  const handleApplyFilters = () => {
    // Os filtros já são aplicados automaticamente via useStudents
  }

  const getActiveFiltersCount = () => {
    let count = 0
    if (filters.q) count++
    if (filters.status) count++
    if (filters.trainerId) count++
    return count
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'onboarding': return 'bg-blue-100 text-blue-800'
      case 'paused': return 'bg-yellow-100 text-yellow-800'
      case 'inactive': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return 'Ativo'
      case 'onboarding': return 'Onboarding'
      case 'paused': return 'Pausado'
      case 'inactive': return 'Inativo'
      default: return status
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  // A busca agora é feita pela API, não no frontend
  const filteredStudents = students

  async function handleCreate(payload: {
    name: string
    email: string
    phone?: string | null
    status?: 'onboarding' | 'active' | 'paused'
    trainer_id?: string | null
    onboard_opt?: 'nao_enviar' | 'enviar' | 'enviado'
    birth_date?: string
    gender?: 'masculino' | 'feminino' | 'outro'
    marital_status?: 'solteiro' | 'casado' | 'divorciado' | 'viuvo'
    nationality?: string
    birth_place?: string
    photo_url?: string
    address?: {
      street: string
      number: string
      complement: string
      neighborhood: string
      city: string
      state: string
      zip_code: string
    }
  }) {
    try {
      const res = await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err?.error || 'Falha ao criar aluno')
      }
      const data = await res.json()
      console.log('[DEBUG RESYNC] Resposta da API:', data)
      const created = data?.student || data
      
      // ✅ INVALIDAÇÃO MANUAL DO CACHE - CORREÇÃO DO BUG
      // Invalidar todas as queries de lista de alunos para forçar refresh
      queryClient.invalidateQueries({ 
        queryKey: ['students', 'list'],
        exact: false // Invalida todas as variações da query (com filtros diferentes)
      })
      
      // Também invalidar queries específicas se existirem
      queryClient.invalidateQueries({ 
        queryKey: ['students'],
        exact: false 
      })
      
      console.log('[DEBUG CACHE] Cache invalidado após criar aluno')
      showStudentUpdated()
    } catch (e: any) {
      showStudentError("criar")
      throw e
    }
  }

  if (loading) {
    return <ListPageSkeleton />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Alunos</h1>
          <p className="text-muted-foreground" role="status" aria-live="polite">
            {filteredStudents.length} aluno{filteredStudents.length !== 1 ? 's' : ''} cadastrado{filteredStudents.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Button 
          className="gap-2" 
          onClick={() => setCreateOpen(true)}
          aria-label="Abrir modal para criar novo aluno"
        >
          <Plus className="h-4 w-4" />
          Novo Aluno
        </Button>
      </div>

      {/* Filtros e Controles */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Busca */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Buscar por nome, email ou telefone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Botão de Filtros */}
            <Button
              variant="outline"
              onClick={() => setFilterDrawerOpen(true)}
              className="relative"
              aria-label="Abrir filtros avançados"
            >
              <Filter className="h-4 w-4 mr-2" />
              Filtros
              {getActiveFiltersCount() > 0 && (
                <Badge 
                  variant="secondary" 
                  className="ml-2 bg-primary text-primary-foreground"
                >
                  {getActiveFiltersCount()}
                </Badge>
              )}
            </Button>

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
          </div>
        </CardContent>
      </Card>

      {/* Conteúdo Principal */}
      {filteredStudents.length === 0 ? (
        <EmptyState
          icon={User}
          title={searchTerm ? "Nenhum aluno encontrado" : "Nenhum aluno cadastrado"}
          description={searchTerm 
            ? "Tente ajustar os filtros de busca para encontrar o que procura"
            : "Crie seu primeiro aluno para começar a gerenciar sua equipe"
          }
          action={{
            label: "Novo Aluno",
            onClick: () => setCreateOpen(true)
          }}
        />
      ) : viewMode === 'cards' ? (
        /* Visualização em Cards - GATE 10.4.2 Densidade Visual */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3">
          {filteredStudents.map((student: Student) => (
            <Card key={student.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-1.5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <CardTitle 
                        className="text-sm font-medium line-clamp-2 break-words" 
                        title={student.name}
                      >
                        {student.name}
                      </CardTitle>
                      <p 
                        className="text-xs text-muted-foreground truncate" 
                        title={student.trainer?.name || 'Sem treinador'}
                      >
                        {student.trainer?.name || 'Sem treinador'}
                      </p>
                      {process.env.NEXT_PUBLIC_DEBUG === 'true' && (
                        <p className="text-[9px] text-muted-foreground">id={student.id}</p>
                      )}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <Badge className={`${getStatusColor(student.status)} text-xs`}>
                    {getStatusLabel(student.status)}
                  </Badge>
                </div>
                
                <div className="space-y-1 text-xs">
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Mail className="h-3 w-3 flex-shrink-0" />
                    <span 
                      className="truncate text-xs flex-1" 
                      title={student.email}
                    >
                      {student.email}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Phone className="h-3 w-3 flex-shrink-0" />
                    <span 
                      className="truncate text-xs flex-1" 
                      title={student.phone}
                    >
                      {student.phone}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Calendar className="h-3 w-3 flex-shrink-0" />
                    <span 
                      className="truncate text-xs flex-1" 
                      title={formatDate(student.created_at)}
                    >
                      {formatDate(student.created_at)}
                    </span>
                  </div>
                </div>

                {/* Ações Rápidas - GATE 10.4.1 */}
                <StudentCardActions 
                  studentId={student.id} 
                  studentName={student.name}
                  onHover={() => prefetchStudent(student.id)}
                  onActionComplete={handleStudentActionComplete}
                />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        /* Visualização em Tabela - GATE 10.4.2 Densidade Visual */
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full" role="table" aria-label="Tabela de alunos cadastrados">
                <thead className="border-b">
                  <tr>
                    <th className="text-left p-3 font-medium text-sm" scope="col">Nome</th>
                    <th className="text-left p-3 font-medium text-sm" scope="col">Email</th>
                    <th className="text-left p-3 font-medium text-sm" scope="col">Telefone</th>
                    <th className="text-left p-3 font-medium text-sm" scope="col">Status</th>
                    <th className="text-left p-3 font-medium text-sm" scope="col">Treinador</th>
                    <th className="text-left p-3 font-medium text-sm" scope="col">Criado em</th>
                    <th className="text-right p-3 font-medium text-sm" scope="col">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((student: Student) => (
                    <tr key={student.id} className="border-b hover:bg-muted/50">
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center">
                            <User className="h-3.5 w-3.5 text-primary" />
                          </div>
                          <span className="font-medium text-sm">{student.name}</span>
                        </div>
                      </td>
                      <td className="p-3 text-muted-foreground text-xs">{student.email}</td>
                      <td className="p-3 text-muted-foreground text-xs">{student.phone}</td>
                      <td className="p-3">
                        <Badge className={`${getStatusColor(student.status)} text-xs`}>
                          {getStatusLabel(student.status)}
                        </Badge>
                      </td>
                      <td className="p-3 text-muted-foreground text-xs">
                        {student.trainer?.name || 'Sem treinador'}
                      </td>
                      <td className="p-3 text-muted-foreground text-xs">
                        {formatDate(student.created_at)}
                      </td>
                      <td className="p-3">
                        {/* Ações Rápidas - GATE 10.4.1 */}
                        <StudentTableActions 
                          studentId={student.id} 
                          studentName={student.name}
                          onHover={() => prefetchStudent(student.id)}
                          onActionComplete={handleStudentActionComplete}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Controles de Paginação */}
      {totalPages > 1 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Página {currentPage} de {totalPages} ({total} {total === 1 ? 'aluno' : 'alunos'})
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrevPage}
                  disabled={currentPage === 1 || isFetching}
                  aria-label="Página anterior"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Anterior
                </Button>
                
                {/* Números de página */}
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    let pageNum: number
                    if (totalPages <= 5) {
                      pageNum = i + 1
                    } else if (currentPage <= 3) {
                      pageNum = i + 1
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i
                    } else {
                      pageNum = currentPage - 2 + i
                    }
                    
                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handlePageChange(pageNum)}
                        disabled={isFetching}
                        className="w-8 h-8 p-0"
                        aria-label={`Ir para página ${pageNum}`}
                        aria-current={currentPage === pageNum ? 'page' : undefined}
                      >
                        {pageNum}
                      </Button>
                    )
                  })}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages || isFetching}
                  aria-label="Próxima página"
                >
                  Próxima
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <StudentCreateModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreate={handleCreate}
        trainers={[]}
      />

      <StudentsFilterDrawer
        open={filterDrawerOpen}
        onOpenChange={setFilterDrawerOpen}
        filters={filters}
        trainers={[]} // TODO: Implementar carregamento de treinadores
        onFiltersChange={handleFiltersChange}
        onClear={handleClearFilters}
        onApply={handleApplyFilters}
      />
    </div>
  )
}