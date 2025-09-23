"use client"

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Loader2, Save, CheckCircle, AlertCircle, User, Phone, Calendar, FileText, Check, ArrowRight } from 'lucide-react'

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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header Premium */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-100 rounded-full mb-6">
            <FileText className="h-10 w-10 text-blue-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Anamnese Personal Global
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Preencha os dados abaixo para personalizarmos seu treino e alcançarmos seus objetivos
          </p>
        </div>

        {/* Progress Premium */}
        <div className="mb-12">
          <div className="flex justify-between items-center text-sm text-gray-600 mb-4">
            <span className="font-medium">Etapa {currentStep} de {totalSteps}</span>
            <span className="font-semibold text-blue-600">{Math.round((currentStep / totalSteps) * 100)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-500 ease-out" 
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        {/* Form Container Premium */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          {/* Form Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20">
                <User className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Formulário de Anamnese</h2>
                <p className="text-blue-100">Complete todas as informações para personalizar seu treino</p>
              </div>
            </div>
          </div>

          {/* Form Content */}
          <div className="p-8">
            {/* Render dinâmico do snapshot */}
            <div className="space-y-8">
              {dynamicQuestions.length === 0 ? (
                <div className="text-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
                  <p className="text-gray-600">Carregando perguntas...</p>
                </div>
              ) : (
                dynamicQuestions.map((q: any, index: number) => {
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
                    <div key={q.key} className="bg-gray-50 rounded-xl p-6 border border-gray-100">
                      <div className="space-y-4">
                        <div className="flex items-start gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-600 font-semibold text-sm flex-shrink-0 mt-1">
                            {index + 1}
                          </div>
                          <div className="flex-1">
                            <Label className="text-lg font-semibold text-gray-900">
                              {q.label}
                              {isRequired ? <span className="ml-1 text-red-500">*</span> : null}
                            </Label>
                            {isMultiple && (
                              <p className="text-sm text-gray-500 mt-1">(múltipla escolha)</p>
                            )}
                          </div>
                        </div>

                        <div className="ml-11">
                          {hasOptions && !isMultiple ? (
                            <Select value={(dynamicAnswers[q.key] ?? '').toString()} onValueChange={(value) => setDynamicAnswers(prev => ({ ...prev, [q.key]: value }))}>
                              <SelectTrigger className="h-12 bg-white border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-lg">
                                <SelectValue placeholder="Selecione uma opção" />
                              </SelectTrigger>
                              <SelectContent className="bg-white border-2 border-gray-200 shadow-xl rounded-lg">
                                {opts.map((o: any, idx: number) => (
                                  <SelectItem key={`${q.key}-${idx}`} className="text-gray-900 py-3" value={String(o?.value ?? o)}>
                                    {String(o?.label ?? o)}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : hasOptions && isMultiple ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {opts.map((o: any, idx: number) => {
                                const val = String(o?.value ?? o)
                                const arr = Array.isArray(dynamicAnswers[q.key]) ? dynamicAnswers[q.key] as any[] : []
                                const checked = arr.includes(val)
                                return (
                                  <div key={`${q.key}-${idx}`} className="flex items-center space-x-3 p-3 bg-white rounded-lg border border-gray-200 hover:border-blue-300 transition-colors">
                                    <Checkbox
                                      id={`${q.key}-${idx}`}
                                      checked={checked}
                                      onCheckedChange={(checked) => {
                                        setDynamicAnswers(prev => {
                                          const prevArr = Array.isArray(prev[q.key]) ? [...prev[q.key]] : []
                                          if (checked) {
                                            if (!prevArr.includes(val)) prevArr.push(val)
                                          } else {
                                            const i = prevArr.indexOf(val)
                                            if (i >= 0) prevArr.splice(i, 1)
                                          }
                                          return { ...prev, [q.key]: prevArr }
                                        })
                                      }}
                                    />
                                    <label htmlFor={`${q.key}-${idx}`} className="text-sm font-medium text-gray-900 cursor-pointer flex-1">
                                      {String(o?.label ?? o)}
                                    </label>
                                  </div>
                                )
                              })}
                            </div>
                          ) : q.type === 'multi' ? (
                            <Textarea 
                              value={dynamicAnswers[q.key] ?? ''} 
                              onChange={(e) => setDynamicAnswers(prev => ({ ...prev, [q.key]: e.target.value }))}
                              className="min-h-[120px] bg-white border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-lg"
                              placeholder="Digite sua resposta aqui..."
                            />
                          ) : (
                            <Input 
                              value={dynamicAnswers[q.key] ?? ''} 
                              onChange={(e) => setDynamicAnswers(prev => ({ ...prev, [q.key]: e.target.value }))}
                              className="h-12 bg-white border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-lg"
                              placeholder="Digite sua resposta aqui..."
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            {/* Action Buttons Premium */}
            <div className="mt-12 pt-8 border-t border-gray-200">
              <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Save className="h-4 w-4" />
                  <span>Salvamento automático ativo</span>
                </div>
                
                <Button 
                  onClick={handleSubmit} 
                  disabled={saving}
                  size="lg"
                  className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-8 py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin mr-2" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Check className="h-5 w-5 mr-2" />
                      Enviar Anamnese
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
