"use client"

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
// Progress component será implementado inline
import { Badge } from '@/components/ui/badge'
import { Loader2, Save, CheckCircle, AlertCircle, User, Phone, Calendar } from 'lucide-react'

interface AnamneseData {
  // Dados pessoais
  name: string
  age: number
  gender: 'male' | 'female' | 'other'
  phone: string
  
  // Antropometria
  weight: number
  height: number
  skinfolds: {
    tricipital: number
    peitoral: number
    subescapular: number
    suprailíaca: number
    axilar_media: number
    abdominal: number
    coxa: number
  }
  
  // Aeróbio
  fcr: number
  pse: number
  vvo2: number
  mfel: number
  
  // RIR
  rir: number
  
  // Contraindicações e observações
  contraindications: string[]
  observations: string[]
  goals: string[]
}

interface InviteData {
  id: string
  student_id: string
  service_id: string | null
  status: string
  expires_at: string
  student_name: string
}

export default function AnamneseFormPage() {
  const params = useParams()
  const token = params.token as string
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [invite, setInvite] = useState<InviteData | null>(null)
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState<AnamneseData>({
    name: '',
    age: 0,
    gender: 'male',
    phone: '',
    weight: 0,
    height: 0,
    skinfolds: {
      tricipital: 0,
      peitoral: 0,
      subescapular: 0,
      suprailíaca: 0,
      axilar_media: 0,
      abdominal: 0,
      coxa: 0
    },
    fcr: 0,
    pse: 0,
    vvo2: 0,
    mfel: 0,
    rir: 0,
    contraindications: [],
    observations: [],
    goals: []
  })

  const totalSteps = 1

  useEffect(() => {
    loadInvite()
    loadFromLocalStorage()
    // carregar snapshot/answers reais por token
    ;(async () => {
      try {
        const res = await fetch(`/api/anamnese/version/by-token/${token}`)
        const data = await res.json()
        if (res.ok) {
          // montar passos dinamicamente a partir das perguntas
          const dynamic: any = {}
          for (const q of data.questions || []) {
            dynamic[q.key] = (data.answers || {})[q.key] ?? ''
          }
          setDynamicQuestions(data.questions || [])
          setDynamicAnswers(dynamic)

          // pré-preencher campos básicos (nome/idade/sexo)
          const s = data.student
          if (s) {
            const age = (() => {
              if (!s.birth_date) return 0
              const birth = new Date(s.birth_date)
              const now = new Date()
              let a = now.getFullYear() - birth.getFullYear()
              const m = now.getMonth() - birth.getMonth()
              if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) a--
              return a
            })()
            setDynamicAnswers(prev => ({
              ...prev,
              nome: prev.nome || s.name || '',
              idade: prev.idade || age,
              sexo: prev.sexo || s.gender || ''
            }))
          }
        }
      } catch {}
    })()
  }, [token])

  const [dynamicQuestions, setDynamicQuestions] = useState<any[]>([])
  const [dynamicAnswers, setDynamicAnswers] = useState<Record<string, any>>({})

  const loadInvite = async () => {
    try {
      const response = await fetch(`/api/anamnese/invite/${token}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Convite não encontrado')
      }

      setInvite(data)
      setFormData(prev => ({
        ...prev,
        name: data.student_name || '',
        phone: data.phone || ''
      }))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar convite')
    } finally {
      setLoading(false)
    }
  }

  const loadFromLocalStorage = () => {
    try {
      const saved = localStorage.getItem(`anamnese_${token}`)
      if (saved) {
        const parsed = JSON.parse(saved)
        setFormData(prev => ({ ...prev, ...parsed }))
      }
    } catch (err) {
      console.warn('Erro ao carregar dados salvos:', err)
    }
  }

  const saveToLocalStorage = (data: Partial<AnamneseData>) => {
    try {
      const updated = { ...formData, ...data }
      localStorage.setItem(`anamnese_${token}`, JSON.stringify(updated))
      setFormData(updated)
    } catch (err) {
      console.warn('Erro ao salvar dados:', err)
    }
  }

  const handleInputChange = (field: string, value: any) => {
    const updated = { ...formData, [field]: value }
    setFormData(updated)
    saveToLocalStorage(updated)
  }

  const handleSkinfoldChange = (field: string, value: number) => {
    const updated = {
      ...formData,
      skinfolds: { ...formData.skinfolds, [field]: value }
    }
    setFormData(updated)
    saveToLocalStorage(updated)
  }

  const handleSubmit = async () => {
    try {
      setSaving(true)
      setError(null)

      const response = await fetch(`/api/anamnese/submit/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dynamicAnswers)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao enviar anamnese')
      }

      // Limpar dados salvos
      localStorage.removeItem(`anamnese_${token}`)
      
      // Mostrar sucesso
      setCurrentStep(totalSteps + 1) // Página de sucesso

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao enviar anamnese')
    } finally {
      setSaving(false)
    }
  }

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Carregando formulário...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Erro</h2>
              <p className="text-gray-600 mb-4">{error}</p>
              <Button onClick={() => window.location.reload()}>
                Tentar novamente
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (currentStep > totalSteps) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Anamnese Enviada!</h2>
              <p className="text-gray-600 mb-4">
                Sua anamnese foi enviada com sucesso. O PDF será gerado e enviado para você em breve.
              </p>
              <p className="text-sm text-gray-500">
                Obrigado por responder nossa anamnese!
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Anamnese Personal Global
          </h1>
          <p className="text-gray-600">
            Preencha os dados abaixo para personalizarmos seu treino
          </p>
        </div>

        {/* Progress */}
        <div className="mb-8">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Etapa {currentStep} de {totalSteps}</span>
            <span>{Math.round((currentStep / totalSteps) * 100)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        {/* Form Steps */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {currentStep === 1 && <User className="h-5 w-5" />}
              {currentStep === 2 && <Phone className="h-5 w-5" />}
              {currentStep === 3 && <Calendar className="h-5 w-5" />}
              {currentStep === 4 && <Calendar className="h-5 w-5" />}
              {currentStep === 5 && <Calendar className="h-5 w-5" />}
              {currentStep === 1 && 'Dados Pessoais'}
              {currentStep === 2 && 'Antropometria'}
              {currentStep === 3 && 'Avaliação Aeróbia'}
              {currentStep === 4 && 'Força e RIR'}
              {currentStep === 5 && 'Objetivos e Observações'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Render dinâmico do snapshot */}
            <div className="space-y-4">
              {dynamicQuestions.length === 0 ? (
                <p>Carregando perguntas...</p>
              ) : (
                dynamicQuestions.map((q: any) => {
                  // Normalização de opções vindas do snapshot em formatos diversos
                  const raw = q.options
                  const candidateArrays: any[] = []
                  if (Array.isArray(raw)) candidateArrays.push(raw)
                  const shallowArrays = (obj: any) => {
                    try {
                      return Object.values(obj || {}).filter((v: any) => Array.isArray(v))
                    } catch { return [] }
                  }
                  candidateArrays.push(...shallowArrays(raw))
                  // Se options veio como objeto numerado (0,1,2,...), converte para array de labels
                  const objectAsArray = (obj: any) => {
                    if (!obj || Array.isArray(obj) || typeof obj !== 'object') return []
                    const keys = Object.keys(obj).filter(k => /^\d+$/.test(k))
                    if (keys.length === 0) return []
                    return keys.sort((a,b)=> Number(a)-Number(b)).map(k => obj[k])
                  }
                  candidateArrays.push(objectAsArray(raw))

                  const opts = (candidateArrays
                    .filter((arr: any) => Array.isArray(arr) && arr.length > 0)
                    .sort((a: any, b: any) => b.length - a.length)[0]) || []
                  const meta = (raw && raw._meta) ? raw._meta : {}
                  const labelText = (q.label || '').toString().toLowerCase()
                  const heuristicsMultiple = labelText.includes('múltipla') || labelText.includes('multipla') || labelText.includes('quantos') || labelText.includes('quantas')
                  const isMultiple = Boolean(meta.multiple || q.type === 'multi' || raw?.multiple || heuristicsMultiple)
                  const isRequired = Boolean(meta.required || raw?.required || q.required)
                  const hasOptions = Array.isArray(opts) && opts.length > 0
                  return (
                    <div key={q.key} className="space-y-1">
                      <Label>
                        {q.label}
                        {isRequired ? <span className="ml-1 text-red-500">*</span> : null}
                        {isMultiple ? <span className="ml-2 text-xs text-gray-500">(múltipla escolha)</span> : null}
                      </Label>
                      {hasOptions && !isMultiple ? (
                        <Select value={(dynamicAnswers[q.key] ?? '').toString()} onValueChange={(value) => setDynamicAnswers(prev => ({ ...prev, [q.key]: value }))}>
                          <SelectTrigger className="bg-white border border-gray-300 focus:ring-2 focus:ring-blue-500">
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                          <SelectContent className="bg-white border border-gray-200 shadow-md">
                            {opts.map((o: any, idx: number) => (
                              <SelectItem key={`${q.key}-${idx}`} className="text-gray-900" value={String(o?.value ?? o)}>{String(o?.label ?? o)}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : hasOptions && isMultiple ? (
                        <div className="space-y-2">
                          {opts.map((o: any, idx: number) => {
                            const val = String(o?.value ?? o)
                            const arr = Array.isArray(dynamicAnswers[q.key]) ? dynamicAnswers[q.key] as any[] : []
                            const checked = arr.includes(val)
                            return (
                              <label key={`${q.key}-${idx}`} className="flex items-center gap-2 text-sm">
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={(e) => {
                                    setDynamicAnswers(prev => {
                                      const prevArr = Array.isArray(prev[q.key]) ? [...prev[q.key]] : []
                                      if (e.target.checked) {
                                        if (!prevArr.includes(val)) prevArr.push(val)
                                      } else {
                                        const i = prevArr.indexOf(val)
                                        if (i >= 0) prevArr.splice(i, 1)
                                      }
                                      return { ...prev, [q.key]: prevArr }
                                    })
                                  }}
                                />
                                {String(o?.label ?? o)}
                              </label>
                            )
                          })}
                        </div>
                      ) : q.type === 'multi' ? (
                        <Textarea value={dynamicAnswers[q.key] ?? ''} onChange={(e) => setDynamicAnswers(prev => ({ ...prev, [q.key]: e.target.value }))} />
                      ) : (
                        <Input value={dynamicAnswers[q.key] ?? ''} onChange={(e) => setDynamicAnswers(prev => ({ ...prev, [q.key]: e.target.value }))} />
                      )}
                    </div>
                  )
                })
              )}
            </div>

            {/* Navigation */}
            <div className="flex justify-end pt-6">
              <Button onClick={handleSubmit} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Enviar Anamnese
                  </>
                )}
              </Button>
            </div>

            {/* Auto-save indicator */}
            <div className="mt-4 text-center">
              <Badge variant="outline" className="text-xs">
                <Save className="h-3 w-3 mr-1" />
                Salvamento automático ativo
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
