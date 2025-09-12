"use client"

import { useState } from "react"
import { useStudents, usePrefetchStudent } from "@/hooks/useStudents"
import { useStudentSearch } from "@/hooks/useDebounce"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Search, 
  Plus, 
  Grid3X3, 
  List, 
  User,
  Mail,
  Phone,
  Calendar
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
  const [viewMode, setViewMode] = useState<ViewMode>('cards')
  const [createOpen, setCreateOpen] = useState(false)
  const [statusFilter, setStatusFilter] = useState<string>('')
  
  // Busca com debounce
  const { searchTerm, setSearchTerm, debouncedSearchTerm } = useStudentSearch('')
  
  // React Query para listar alunos
  const { 
    data: studentsData, 
    isLoading: loading, 
    error,
    isFetching 
  } = useStudents({
    page: 1,
    q: debouncedSearchTerm,
    status: statusFilter
  })
  
  // Prefetch para detalhe do aluno
  const prefetchStudent = usePrefetchStudent()
  
  const students = studentsData?.students || []

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

  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.phone.includes(searchTerm)
  )

  async function handleCreate(payload: {
    name: string
    email: string
    phone?: string | null
    status?: 'onboarding' | 'active' | 'paused'
    trainer_id?: string | null
    onboard_opt?: 'nao_enviar' | 'enviar' | 'enviado'
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
      const created = data?.student || data
      // Atualiza listagem local (mantendo compatibilidade com mock)
      setStudents(prev => [
        {
          id: created.id || String(Date.now()),
          name: created.name,
          email: created.email,
          phone: created.phone || '',
          status: created.status || 'onboarding',
          created_at: created.created_at || new Date().toISOString(),
          trainer: created.trainer_id ? { id: created.trainer_id, name: created.trainer_name || '' } : null
        },
        ...prev,
      ])
      showStudentUpdated()
    } catch (e: any) {
      showStudentError("criar")
      throw e
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Alunos</h1>
            <p className="text-muted-foreground">Carregando...</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 rounded"></div>
                  <div className="h-3 bg-gray-200 rounded"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Alunos</h1>
          <p className="text-muted-foreground">
            {filteredStudents.length} aluno{filteredStudents.length !== 1 ? 's' : ''} cadastrado{filteredStudents.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Button className="gap-2" onClick={() => setCreateOpen(true)}>
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

            {/* Toggle de Visualização */}
            <div className="flex border rounded-lg">
              <Button
                variant={viewMode === 'cards' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('cards')}
                className="rounded-r-none"
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'table' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('table')}
                className="rounded-l-none"
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
          {filteredStudents.map((student) => (
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
              <table className="w-full">
                <thead className="border-b">
                  <tr>
                    <th className="text-left p-3 font-medium text-sm">Nome</th>
                    <th className="text-left p-3 font-medium text-sm">Email</th>
                    <th className="text-left p-3 font-medium text-sm">Telefone</th>
                    <th className="text-left p-3 font-medium text-sm">Status</th>
                    <th className="text-left p-3 font-medium text-sm">Treinador</th>
                    <th className="text-left p-3 font-medium text-sm">Criado em</th>
                    <th className="text-right p-3 font-medium text-sm">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((student) => (
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
      <StudentCreateModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreate={handleCreate}
        trainers={[]}
      />
    </div>
  )
}