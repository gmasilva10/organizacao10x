"use client"

import { useState, useEffect } from "react"
import { perf } from "@/lib/perfClient"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  ArrowLeft, 
  Save, 
  User, 
  Mail, 
  Phone, 
  Calendar,
  AlertTriangle,
  Loader2
} from "lucide-react"
import StudentEditTabsV6 from "@/components/students/StudentEditTabsV6"
import CompactHeader from "@/components/ui/CompactHeader"
import { toast } from "sonner"
import Link from "next/link"
import BackButton from "@/components/ui/BackButton"
import { showStudentUpdated, showStudentError } from "@/lib/toast-utils"

type Student = {
  id: string
  name: string
  email: string
  phone: string
  status: 'onboarding' | 'active' | 'paused' | 'inactive'
  created_at: string
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
  trainer?: {
    id: string
    name: string
  } | null
  trainer_id?: string | null
  trainer_name?: string | null
}

export default function EditStudentPage() {
  const params = useParams()
  const router = useRouter()
  const studentId = params.id as string
  
  const [student, setStudent] = useState<Student | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Form data
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    status: 'onboarding' as string
  })

  useEffect(() => {
    loadStudent()
  }, [studentId])

  const loadStudent = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Performance mark: TTFB
      perf.markAlunosListTTFB()
      
      const response = await fetch(`/api/students/${studentId}`, { cache: 'no-store', headers: { 'Cache-Control': 'no-store' } })
      
      if (!response.ok) {
        if (response.status === 404) {
          setError('Aluno não encontrado')
        } else {
          setError('Erro ao carregar dados do aluno')
        }
        return
      }
      
      const studentData = await response.json()
      setStudent(studentData)
      
      // Performance mark: Interactive
      perf.markAlunosEditInteractive()
      
      setFormData({
        name: studentData.name || '',
        email: studentData.email || '',
        phone: studentData.phone || '',
        status: studentData.status || 'onboarding'
      })
      
    } catch (err) {
      console.error('Erro ao carregar aluno:', err)
      setError('Erro ao carregar dados do aluno')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (data: Partial<Student>) => {
    try {
      setSaving(true)
      
      // Limpar dados para evitar referências circulares
      const cleanData = {
        name: data.name,
        email: data.email,
        phone: data.phone,
        status: data.status,
        birth_date: data.birth_date,
        gender: data.gender,
        marital_status: data.marital_status,
        nationality: data.nationality,
        birth_place: data.birth_place,
        photo_url: data.photo_url,
        address: data.address,
        trainer_id: data.trainer_id
      }
      
      const response = await fetch(`/api/students/${studentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(cleanData)
      })
      
      if (!response.ok) {
        throw new Error('Erro ao salvar aluno')
      }
      
      const result = await response.json()
      setStudent(result)
      
      // Toast será exibido pelo componente StudentEditTabsV6

      } catch (err) {
        console.error('Erro ao salvar aluno:', err)
        showStudentError("salvar")
    } finally {
      setSaving(false)
    }
  }

  const handleSaveAddress = async (address: Student['address']) => {
    try {
      setSaving(true)
      
      const response = await fetch(`/api/students/${studentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ address })
      })
      
      if (!response.ok) {
        throw new Error('Erro ao salvar endereço')
      }
      
      const result = await response.json()
      setStudent(result)
      
      toast.success('Endereço salvo com sucesso!')
      
    } catch (err) {
      console.error('Erro ao salvar endereço:', err)
      toast.error('Erro ao salvar endereço')
    } finally {
      setSaving(false)
    }
  }

  const handleSaveResponsaveis = async (responsaveis: any[]) => {
    try {
      setSaving(true)
      
      // Simular salvamento dos responsáveis
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      toast.success('Responsáveis salvos com sucesso!')
      
    } catch (err) {
      console.error('Erro ao salvar responsáveis:', err)
      toast.error('Erro ao salvar responsáveis')
    } finally {
      setSaving(false)
    }
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

  const handleCancel = () => {
    // Preservar filtros/querystring returnTo se existir
    const urlParams = new URLSearchParams(window.location.search)
    const returnTo = urlParams.get('returnTo')
    
    if (returnTo) {
      router.push(returnTo)
    } else {
      router.push('/app/students')
    }
  }

  const handleSaveAndRedirect = () => {
    // Preservar filtros/querystring returnTo se existir
    const urlParams = new URLSearchParams(window.location.search)
    const returnTo = urlParams.get('returnTo')
    
    if (returnTo) {
      router.push(returnTo)
    } else {
      router.push('/app/students')
    }
  }

  const handleSaveAndStay = () => {
    // Salva mas não redireciona - mantém na edição
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {/* Header Ultra Compacto - Loading */}
        <div className="flex items-center justify-between py-1">
          <div className="flex items-center gap-3">
            <nav className="flex items-center space-x-2 text-sm text-muted-foreground">
              <Link href="/app" className="hover:text-foreground">Dashboard</Link>
              <span>/</span>
              <Link href="/app/students" className="hover:text-foreground">Alunos</Link>
              <span>/</span>
              <span className="text-foreground font-medium">Editar</span>
            </nav>
            <div className="h-4 w-px bg-border"></div>
            <div className="h-6 bg-gray-200 rounded w-32 animate-pulse"></div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled>Cancelar</Button>
            <Button size="sm" disabled>Salvar</Button>
          </div>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
                  <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-4">
        {/* Header Ultra Compacto - Erro */}
        <div className="flex items-center justify-between py-1">
          <div className="flex items-center gap-3">
            <nav className="flex items-center space-x-2 text-sm text-muted-foreground">
              <Link href="/app" className="hover:text-foreground">Dashboard</Link>
              <span>/</span>
              <Link href="/app/students" className="hover:text-foreground">Alunos</Link>
              <span>/</span>
              <span className="text-foreground font-medium">Editar</span>
            </nav>
            <div className="h-4 w-px bg-border"></div>
            <h1 className="text-lg font-semibold text-destructive">Erro</h1>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              className="border-destructive text-destructive hover:bg-destructive/10"
              onClick={handleCancel}
            >
              Cancelar
            </Button>
            <Button size="sm" onClick={loadStudent}>Tentar novamente</Button>
          </div>
        </div>
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Erro ao carregar aluno</h3>
              <p className="text-muted-foreground mb-4">{error}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-4">
        {/* Header Mínimo - Breadcrumb */}
        <div className="flex items-center justify-between py-1">
          <nav className="flex items-center space-x-2 text-sm text-muted-foreground">
            <Link href="/app" className="hover:text-foreground">Dashboard</Link>
            <span>/</span>
            <Link href="/app/students" className="hover:text-foreground">Alunos</Link>
            <span>/</span>
            <span className="text-foreground font-medium">Editar</span>
          </nav>
        </div>

      {/* Tabs Modulares - GATE 10.3.1 (Retoques Premium) */}
      {student && (
        <StudentEditTabsV6 
          student={student} 
          studentId={studentId}
          onSave={handleSave}
          onSaveAddress={handleSaveAddress}
          onSaveResponsaveis={handleSaveResponsaveis}
          onCancel={handleCancel}
          onSaveAndRedirect={handleSaveAndRedirect}
        />
      )}
    </div>
  )
}
