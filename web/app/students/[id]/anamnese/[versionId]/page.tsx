"use client"

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  FileText, 
  ArrowLeft,
  Save,
  Download,
  Send,
  Loader2
} from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

interface AnamneseQuestion {
  id: string
  key: string
  label: string
  type: string
  options?: any[]
  order: number
}

interface AnamneseVersion {
  id: string
  code: string
  status: string
  service_id: string | null
  token: string
  token_expires_at: string
  created_at: string
  updated_at: string
  service_name?: string
  questions: AnamneseQuestion[]
  answers: Record<string, any>
}

export default function AnamneseEditorPage() {
  const params = useParams()
  const studentId = params.id as string
  const versionId = params.versionId as string
  
  const [version, setVersion] = useState<AnamneseVersion | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [answers, setAnswers] = useState<Record<string, any>>({})

  useEffect(() => {
    loadVersion()
  }, [versionId])

  const loadVersion = async () => {
    try {
      const response = await fetch(`/api/anamnese/version/${versionId}`)
      const data = await response.json()
      
      if (response.ok) {
        setVersion(data.version)
        setAnswers(data.version.answers || {})
      } else {
        toast.error('Erro ao carregar anamnese')
      }
    } catch (error) {
      toast.error('Erro ao carregar anamnese')
    } finally {
      setLoading(false)
    }
  }

  const handleAnswerChange = (key: string, value: any) => {
    setAnswers(prev => ({ ...prev, [key]: value }))
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      
      const response = await fetch(`/api/anamnese/version/${versionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers })
      })
      
      if (response.ok) {
        toast.success('Respostas salvas com sucesso!')
      } else {
        const data = await response.json()
        toast.error(data.error || 'Erro ao salvar respostas')
      }
    } catch (error) {
      toast.error('Erro ao salvar respostas')
    } finally {
      setSaving(false)
    }
  }

  const handleSend = async () => {
    try {
      const response = await fetch(`/api/anamnese/version/${versionId}/send`, {
        method: 'POST'
      })
      
      if (response.ok) {
        toast.success('Anamnese enviada com sucesso!')
        loadVersion()
      } else {
        const data = await response.json()
        toast.error(data.error || 'Erro ao enviar anamnese')
      }
    } catch (error) {
      toast.error('Erro ao enviar anamnese')
    }
  }

  const handleGeneratePDF = async () => {
    try {
      const response = await fetch(`/api/anamnese/version/${versionId}/pdf`, {
        method: 'POST'
      })
      
      if (response.ok) {
        toast.success('PDF gerado com sucesso!')
      } else {
        const data = await response.json()
        toast.error(data.error || 'Erro ao gerar PDF')
      }
    } catch (error) {
      toast.error('Erro ao gerar PDF')
    }
  }

  const renderQuestion = (question: AnamneseQuestion) => {
    const value = answers[question.key] || ''

    switch (question.type) {
      case 'text':
        return (
          <Input
            value={value}
            onChange={(e) => handleAnswerChange(question.key, e.target.value)}
            placeholder={`Digite ${question.label.toLowerCase()}...`}
          />
        )
      
      case 'textarea':
        return (
          <Textarea
            value={value}
            onChange={(e) => handleAnswerChange(question.key, e.target.value)}
            placeholder={`Digite ${question.label.toLowerCase()}...`}
            rows={3}
          />
        )
      
      case 'select':
        return (
          <Select value={value} onValueChange={(val) => handleAnswerChange(question.key, val)}>
            <SelectTrigger>
              <SelectValue placeholder={`Selecione ${question.label.toLowerCase()}...`} />
            </SelectTrigger>
            <SelectContent>
              {question.options?.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )
      
      case 'number':
        return (
          <Input
            type="number"
            value={value}
            onChange={(e) => handleAnswerChange(question.key, parseFloat(e.target.value) || '')}
            placeholder={`Digite ${question.label.toLowerCase()}...`}
          />
        )
      
      case 'checkbox':
        return (
          <div className="space-y-2">
            {question.options?.map((option) => (
              <label key={option.value} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={Array.isArray(value) ? value.includes(option.value) : false}
                  onChange={(e) => {
                    const currentValues = Array.isArray(value) ? value : []
                    if (e.target.checked) {
                      handleAnswerChange(question.key, [...currentValues, option.value])
                    } else {
                      handleAnswerChange(question.key, currentValues.filter(v => v !== option.value))
                    }
                  }}
                />
                <span>{option.label}</span>
              </label>
            ))}
          </div>
        )
      
      default:
        return (
          <Input
            value={value}
            onChange={(e) => handleAnswerChange(question.key, e.target.value)}
            placeholder={`Digite ${question.label.toLowerCase()}...`}
          />
        )
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-gray-200 rounded animate-pulse" />
        <div className="h-64 bg-gray-200 rounded animate-pulse" />
      </div>
    )
  }

  if (!version) {
    return (
      <div className="text-center py-12">
        <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Anamnese não encontrada</h3>
        <p className="text-gray-600 mb-4">A anamnese solicitada não foi encontrada.</p>
        <Button asChild>
          <Link href={`/students/${studentId}/anamnese`}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/students/${studentId}/anamnese`}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{version.code}</h1>
            <p className="text-gray-600">
              {version.service_name || 'Serviço não especificado'} • 
              Status: {version.status}
            </p>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Salvar
          </Button>
          
          {version.status === 'RASCUHO' && (
            <Button onClick={handleSend}>
              <Send className="h-4 w-4 mr-2" />
              Enviar
            </Button>
          )}
          
          {version.status === 'CONCLUIDO' && (
            <Button variant="outline" onClick={handleGeneratePDF}>
              <Download className="h-4 w-4 mr-2" />
              Gerar PDF
            </Button>
          )}
        </div>
      </div>

      {/* Formulário */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Formulário de Anamnese
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {version.questions
            .sort((a, b) => a.order - b.order)
            .map((question) => (
              <div key={question.id} className="space-y-2">
                <Label htmlFor={question.key} className="text-base font-medium">
                  {question.label}
                </Label>
                {renderQuestion(question)}
              </div>
            ))}
        </CardContent>
      </Card>
    </div>
  )
}