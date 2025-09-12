"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import { 
  Users, 
  Search, 
  Plus, 
  Edit, 
  FileText,
  MoreHorizontal,
  User,
  Mail,
  Calendar
} from "lucide-react"
import Link from "next/link"

interface Student {
  id: string
  name: string
  email: string
  phone?: string
  status: 'onboarding' | 'active' | 'paused' | 'inactive'
  created_at: string
  trainer_id?: string
  trainer_name?: string
  trainer?: {
    id: string
    name: string
  }
}

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    console.log('🔥 COMPONENTE CARREGADO - INICIANDO LOAD')
    loadStudents()
  }, [])

  const loadStudents = async () => {
    try {
      setLoading(true)
      console.log('=== INICIANDO CARREGAMENTO ===')
      
      const response = await fetch(`/api/students?page=1&page_size=20&t=${Date.now()}`)
      console.log('Resposta da API:', response.status, response.ok)
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('Erro na resposta:', errorText)
        throw new Error(`Erro ao carregar alunos: ${response.status}`)
      }
      
      const data = await response.json()
      console.log('🔍 DADOS COMPLETOS DA API:', JSON.stringify(data, null, 2))
      console.log('Tipo dos dados:', typeof data)
      console.log('É array?', Array.isArray(data))
      console.log('Propriedades:', Object.keys(data))
      
      if (data.students && Array.isArray(data.students)) {
        console.log('✅ Array de alunos encontrado, length:', data.students.length)
        console.log('✅ PRIMEIROS 3 ALUNOS:', data.students.slice(0, 3))
        setStudents(data.students)
        console.log('✅ Estado students atualizado com:', data.students.length, 'alunos')
      } else if (Array.isArray(data)) {
        console.log('✅ Dados são array direto, length:', data.length)
        setStudents(data)
        console.log('✅ Estado students atualizado com array direto')
      } else {
        console.log('❌ Dados não são um array válido:', data)
        setStudents([])
      }
    } catch (error) {
      console.error('Erro ao carregar alunos:', error)
      toast.error('Erro ao carregar lista de alunos')
      setStudents([]) // Garantir que o estado seja limpo em caso de erro
    } finally {
      setLoading(false)
      console.log('=== CARREGAMENTO FINALIZADO ===')
    }
  }

  // Filtro corrigido
  const filteredStudents = students.filter(student => {
    if (!searchTerm) return true
    
    const searchLower = searchTerm.toLowerCase()
    return (
      student.name?.toLowerCase().includes(searchLower) ||
      student.email?.toLowerCase().includes(searchLower) ||
      student.phone?.includes(searchTerm)
    )
  })

  // Debug DETALHADO
  console.log('🔍 DEBUG RENDERIZAÇÃO COMPLETO:', {
    loading,
    studentsCount: students.length,
    filteredCount: filteredStudents.length,
    searchTerm,
    searchTermLength: searchTerm.length,
    hasStudents: students.length > 0,
    firstStudent: students[0],
    allStudents: students,
    allFilteredStudents: filteredStudents,
    renderCondition: !loading && filteredStudents.length === 0,
    notLoading: !loading,
    filteredStudentsIsEmpty: filteredStudents.length === 0
  })

  const getStatusBadge = (status: string) => {
    const variants = {
      onboarding: 'secondary',
      active: 'default',
      paused: 'destructive',
      inactive: 'outline'
    } as const
    
    const labels = {
      onboarding: 'Onboarding',
      active: 'Ativo',
      paused: 'Pausado',
      inactive: 'Inativo'
    }

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'outline'}>
        {labels[status as keyof typeof labels] || status}
      </Badge>
    )
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* INDICADOR DE COMPONENTE ATIVO */}
      <div className="fixed top-4 right-4 bg-red-500 text-white p-2 rounded z-50 text-xs">
        🔥 COMPONENTE ATIVO: {new Date().toLocaleTimeString()}
      </div>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">🔥 ALUNOS MODIFICADO 🔥</h1>
          <p className="text-gray-500">
            {students.length} aluno{students.length !== 1 ? 's' : ''} cadastrado{students.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Button className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Novo Aluno
        </Button>
      </div>


      {/* Filtros */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Buscar por nome ou email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Lista de Alunos */}
      {loading ? (
        <div className="space-y-4">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-500">Carregando alunos...</p>
            </div>
          </div>
        </div>
      ) : filteredStudents.length === 0 ? (
        <div className="text-center py-12">
          <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchTerm ? 'Nenhum aluno encontrado' : 'Nenhum aluno cadastrado'}
          </h3>
          <p className="text-gray-500 mb-4">
            {searchTerm 
              ? 'Tente ajustar os termos de busca'
              : 'Comece adicionando seu primeiro aluno'
            }
          </p>
          {!searchTerm && (
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Novo Aluno
            </Button>
          )}
          {/* DEBUG INFO */}
          <div className="mt-8 p-4 bg-yellow-100 rounded-lg text-left text-sm">
            <h4 className="font-bold mb-2">🔍 Debug Info:</h4>
            <p>Loading: {loading.toString()}</p>
            <p>Students Count: {students.length}</p>
            <p>Filtered Count: {filteredStudents.length}</p>
            <p>Search Term: "{searchTerm}"</p>
            <p>Has Students: {(students.length > 0).toString()}</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStudents.map((student) => {
            console.log('Renderizando aluno:', student)
            return (
            <Card key={student.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                      <User className="h-5 w-5 text-gray-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{student.name}</CardTitle>
                      <p className="text-sm text-gray-500 flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {student.email}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(student.status)}
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-3">
                  {(student.trainer_name || student.trainer?.name) && (
                    <div className="text-sm text-gray-600">
                      <strong>Treinador:</strong> {student.trainer_name || student.trainer?.name}
                    </div>
                  )}
                  
                  <div className="text-sm text-gray-500 flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Cadastrado em {new Date(student.created_at).toLocaleDateString('pt-BR')}
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button variant="outline" size="sm" asChild className="flex-1">
                      <Link href={`/students/${student.id}/anamnesis`}>
                        <FileText className="h-4 w-4 mr-1" />
                        Anamnese
                      </Link>
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/students/${student.id}/edit`}>
                        <Edit className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
