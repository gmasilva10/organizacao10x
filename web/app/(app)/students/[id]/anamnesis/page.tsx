"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import { 
  User, 
  FileText, 
  Activity, 
  Save, 
  Clock,
  CheckCircle,
  AlertCircle,
  Tag
} from "lucide-react"

interface Student {
  id: string
  name: string
  email: string
  status: string
}

interface AnamnesisTemplate {
  id: string
  title: string
  sections: Array<{
    id: string
    title: string
    questions: Array<{
      id: string
      text: string
      type: 'single' | 'multiple' | 'text' | 'number'
      required: boolean
      options?: Array<{
        value: string
        label: string
        decision_tag?: string
      }>
    }>
  }>
}

interface AnamnesisVersion {
  id: string
  version_n: number
  answers_json: Record<string, any>
  created_at: string
  created_by: string
}

export default function StudentAnamnesisPage() {
  const params = useParams()
  const studentId = params.id as string
  
  const [student, setStudent] = useState<Student | null>(null)
  const [template, setTemplate] = useState<AnamnesisTemplate | null>(null)
  const [currentVersion, setCurrentVersion] = useState<AnamnesisVersion | null>(null)
  const [answers, setAnswers] = useState<Record<string, any>>({})
  const [activeTags, setActiveTags] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Carregar dados iniciais
  useEffect(() => {
    loadStudentData()
  }, [studentId])

  const loadStudentData = async () => {
    try {
      setLoading(true)
      
      // Carregar dados do aluno
      const studentResponse = await fetch(`/api/students/${studentId}`)
      if (!studentResponse.ok) throw new Error('Erro ao carregar aluno')
      const studentData = await studentResponse.json()
      setStudent(studentData)

      // Carregar template default
      const templateResponse = await fetch('/api/anamnesis/templates/default')
      if (!templateResponse.ok) throw new Error('Erro ao carregar template')
      const templateData = await templateResponse.json()
      setTemplate(templateData)

      // Carregar última versão da anamnese
      const anamnesisResponse = await fetch(`/api/students/${studentId}/anamnesis`)
      if (anamnesisResponse.ok) {
        const anamnesisData = await anamnesisResponse.json()
        setCurrentVersion(anamnesisData.latest_version)
        setAnswers(anamnesisData.answers || {})
        setActiveTags(anamnesisData.active_tags || [])
      }

    } catch (error) {
      console.error('Erro ao carregar dados:', error)
      toast.error('Erro ao carregar dados do aluno')
    } finally {
      setLoading(false)
    }
  }

  const handleAnswerChange = (questionId: string, value: any) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value
    }))
    
    // Atualizar tags ativas
    updateActiveTags(questionId, value)
  }

  const updateActiveTags = (questionId: string, value: any) => {
    if (!template) return

    const question = template.sections
      .flatMap(s => s.questions)
      .find(q => q.id === questionId)

    if (!question || !question.options) return

    const newTags: string[] = []
    
    if (question.type === 'single' && value) {
      const option = question.options.find(opt => opt.value === value)
      if (option?.decision_tag) {
        newTags.push(option.decision_tag)
      }
    } else if (question.type === 'multiple' && Array.isArray(value)) {
      value.forEach(val => {
        const option = question.options?.find(opt => opt.value === val)
        if (option?.decision_tag) {
          newTags.push(option.decision_tag)
        }
      })
    }

    setActiveTags(prev => {
      const filtered = prev.filter(tag => 
        !template.sections.flatMap(s => s.questions)
          .find(q => q.id === questionId)?.options?.some(opt => opt.decision_tag === tag)
      )
      return [...filtered, ...newTags]
    })
  }

  const saveSection = async (sectionId: string) => {
    try {
      setSaving(true)
      
      const response = await fetch(`/api/students/${studentId}/anamnesis/sections/${sectionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          answers: answers,
          active_tags: activeTags
        })
      })

      if (!response.ok) throw new Error('Erro ao salvar seção')

      const result = await response.json()
      setCurrentVersion(result.version)
      toast.success('Seção salva com sucesso!')
      
    } catch (error) {
      console.error('Erro ao salvar:', error)
      toast.error('Erro ao salvar seção')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3">
            <Skeleton className="h-96 w-full" />
          </div>
          <div>
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      </div>
    )
  }

  if (!student || !template) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 mx-auto text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Erro ao carregar dados</h3>
        <p className="text-gray-500">Não foi possível carregar os dados do aluno ou template.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Anamnese - {student.name}
          </h1>
          <p className="text-gray-500">
            {student.email} • {student.status}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {currentVersion && (
            <Badge variant="outline" className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              v{currentVersion.version_n}
            </Badge>
          )}
          <Button
            onClick={() => saveSection('all')}
            disabled={saving}
            className="flex items-center gap-2"
          >
            {saving ? (
              <Clock className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {saving ? 'Salvando...' : 'Salvar'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Conteúdo Principal */}
        <div className="lg:col-span-3">
          <Tabs defaultValue={template.sections[0]?.id} className="space-y-6">
            <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
              {template.sections.map((section) => (
                <TabsTrigger key={section.id} value={section.id}>
                  {section.title}
                </TabsTrigger>
              ))}
            </TabsList>

            {template.sections.map((section) => (
              <TabsContent key={section.id} value={section.id} className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      {section.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {section.questions.map((question) => (
                      <div key={question.id} className="space-y-3">
                        <label className="text-sm font-medium text-gray-900">
                          {question.text}
                          {question.required && (
                            <span className="text-red-500 ml-1">*</span>
                          )}
                        </label>
                        
                        {question.type === 'single' && question.options && (
                          <div className="space-y-2">
                            {question.options.map((option) => (
                              <label key={option.value} className="flex items-center space-x-2">
                                <input
                                  type="radio"
                                  name={question.id}
                                  value={option.value}
                                  checked={answers[question.id] === option.value}
                                  onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                                  className="rounded border-gray-300"
                                />
                                <span className="text-sm">{option.label}</span>
                              </label>
                            ))}
                          </div>
                        )}

                        {question.type === 'multiple' && question.options && (
                          <div className="space-y-2">
                            {question.options.map((option) => (
                              <label key={option.value} className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  checked={answers[question.id]?.includes(option.value) || false}
                                  onChange={(e) => {
                                    const current = answers[question.id] || []
                                    const newValue = e.target.checked
                                      ? [...current, option.value]
                                      : current.filter((v: string) => v !== option.value)
                                    handleAnswerChange(question.id, newValue)
                                  }}
                                  className="rounded border-gray-300"
                                />
                                <span className="text-sm">{option.label}</span>
                              </label>
                            ))}
                          </div>
                        )}

                        {question.type === 'text' && (
                          <textarea
                            value={answers[question.id] || ''}
                            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            rows={3}
                          />
                        )}

                        {question.type === 'number' && (
                          <input
                            type="number"
                            value={answers[question.id] || ''}
                            onChange={(e) => handleAnswerChange(question.id, Number(e.target.value))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                          />
                        )}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </TabsContent>
            ))}
          </Tabs>
        </div>

        {/* Barra Lateral - Tags Ativas */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Tag className="h-5 w-5" />
                Tags Ativas
              </CardTitle>
            </CardHeader>
            <CardContent>
              {activeTags.length > 0 ? (
                <div className="space-y-2">
                  {activeTags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="mr-1 mb-1">
                      {tag}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">
                  Nenhuma tag ativa ainda
                </p>
              )}
            </CardContent>
          </Card>

          {/* Status da Anamnese */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {currentVersion ? (
                <>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Versão {currentVersion.version_n}</span>
                  </div>
                  <p className="text-xs text-gray-500">
                    Salvo em: {new Date(currentVersion.created_at).toLocaleString('pt-BR')}
                  </p>
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-yellow-500" />
                  <span className="text-sm">Nunca salvo</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
