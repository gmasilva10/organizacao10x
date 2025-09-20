"use client"

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
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

  const totalSteps = 5

  useEffect(() => {
    loadInvite()
    loadFromLocalStorage()
  }, [token])

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
        body: JSON.stringify(formData)
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
          <Progress value={(currentStep / totalSteps) * 100} className="h-2" />
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
            {/* Step 1: Dados Pessoais */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Nome completo *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder="Seu nome completo"
                    />
                  </div>
                  <div>
                    <Label htmlFor="age">Idade *</Label>
                    <Input
                      id="age"
                      type="number"
                      value={formData.age || ''}
                      onChange={(e) => handleInputChange('age', parseInt(e.target.value) || 0)}
                      placeholder="Sua idade"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="gender">Sexo *</Label>
                    <Select value={formData.gender} onValueChange={(value) => handleInputChange('gender', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione seu sexo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Masculino</SelectItem>
                        <SelectItem value="female">Feminino</SelectItem>
                        <SelectItem value="other">Outro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="phone">Telefone</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      placeholder="11999999999"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Antropometria */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="weight">Peso (kg) *</Label>
                    <Input
                      id="weight"
                      type="number"
                      step="0.1"
                      value={formData.weight || ''}
                      onChange={(e) => handleInputChange('weight', parseFloat(e.target.value) || 0)}
                      placeholder="70.5"
                    />
                  </div>
                  <div>
                    <Label htmlFor="height">Altura (cm) *</Label>
                    <Input
                      id="height"
                      type="number"
                      value={formData.height || ''}
                      onChange={(e) => handleInputChange('height', parseInt(e.target.value) || 0)}
                      placeholder="175"
                    />
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3">Dobras Cutâneas (mm)</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {Object.entries(formData.skinfolds).map(([key, value]) => (
                      <div key={key}>
                        <Label htmlFor={key}>{key.charAt(0).toUpperCase() + key.slice(1)}</Label>
                        <Input
                          id={key}
                          type="number"
                          step="0.1"
                          value={value || ''}
                          onChange={(e) => handleSkinfoldChange(key, parseFloat(e.target.value) || 0)}
                          placeholder="0.0"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Aeróbio */}
            {currentStep === 3 && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="fcr">FCR (bpm)</Label>
                    <Input
                      id="fcr"
                      type="number"
                      value={formData.fcr || ''}
                      onChange={(e) => handleInputChange('fcr', parseInt(e.target.value) || 0)}
                      placeholder="60"
                    />
                  </div>
                  <div>
                    <Label htmlFor="pse">PSE (1-10)</Label>
                    <Input
                      id="pse"
                      type="number"
                      min="1"
                      max="10"
                      value={formData.pse || ''}
                      onChange={(e) => handleInputChange('pse', parseInt(e.target.value) || 0)}
                      placeholder="5"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="vvo2">vVO2 (km/h)</Label>
                    <Input
                      id="vvo2"
                      type="number"
                      step="0.1"
                      value={formData.vvo2 || ''}
                      onChange={(e) => handleInputChange('vvo2', parseFloat(e.target.value) || 0)}
                      placeholder="12.5"
                    />
                  </div>
                  <div>
                    <Label htmlFor="mfel">MFEL (Limiar)</Label>
                    <Input
                      id="mfel"
                      type="number"
                      step="0.1"
                      value={formData.mfel || ''}
                      onChange={(e) => handleInputChange('mfel', parseFloat(e.target.value) || 0)}
                      placeholder="8.5"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: RIR */}
            {currentStep === 4 && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="rir">RIR (Repetições na Reserva)</Label>
                  <Select value={formData.rir.toString()} onValueChange={(value) => handleInputChange('rir', parseInt(value))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione seu RIR" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 20 }, (_, i) => i + 1).map(num => (
                        <SelectItem key={num} value={num.toString()}>{num}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-gray-500 mt-1">
                    Quantas repetições você conseguiria fazer a mais na última série?
                  </p>
                </div>
              </div>
            )}

            {/* Step 5: Objetivos */}
            {currentStep === 5 && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="goals">Objetivos</Label>
                  <Textarea
                    id="goals"
                    value={formData.goals.join('\n')}
                    onChange={(e) => handleInputChange('goals', e.target.value.split('\n').filter(Boolean))}
                    placeholder="Descreva seus objetivos com o treino..."
                    rows={3}
                  />
                </div>
                
                <div>
                  <Label htmlFor="contraindications">Contraindicações</Label>
                  <Textarea
                    id="contraindications"
                    value={formData.contraindications.join('\n')}
                    onChange={(e) => handleInputChange('contraindications', e.target.value.split('\n').filter(Boolean))}
                    placeholder="Lesões, limitações, medicamentos..."
                    rows={3}
                  />
                </div>
                
                <div>
                  <Label htmlFor="observations">Observações</Label>
                  <Textarea
                    id="observations"
                    value={formData.observations.join('\n')}
                    onChange={(e) => handleInputChange('observations', e.target.value.split('\n').filter(Boolean))}
                    placeholder="Outras informações relevantes..."
                    rows={3}
                  />
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="flex justify-between pt-6">
              <Button
                variant="outline"
                onClick={prevStep}
                disabled={currentStep === 1}
              >
                Anterior
              </Button>
              
              {currentStep < totalSteps ? (
                <Button onClick={nextStep}>
                  Próximo
                </Button>
              ) : (
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
              )}
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
