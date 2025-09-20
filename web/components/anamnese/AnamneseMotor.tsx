"use client"

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { AnamneseInput, AnamneseResult } from '@/lib/anamnese/engine'
import { AnamnesePreview } from './AnamnesePreview'
import { Calculator, User, Heart, Dumbbell, AlertTriangle } from 'lucide-react'

export function AnamneseMotor() {
  const [input, setInput] = useState<AnamneseInput>({
    age: 30,
    weight: 70,
    height: 170,
    gender: 'male',
    fcr: undefined,
    pse: undefined,
    vvo2: undefined,
    mfel: undefined,
    rir: undefined,
    contraindications: [],
    observations: [],
    goals: []
  })
  
  const [showPreview, setShowPreview] = useState(false)
  const [newContraindication, setNewContraindication] = useState('')
  const [newObservation, setNewObservation] = useState('')
  const [newGoal, setNewGoal] = useState('')

  const addContraindication = () => {
    if (newContraindication.trim()) {
      setInput(prev => ({
        ...prev,
        contraindications: [...prev.contraindications, newContraindication.trim()]
      }))
      setNewContraindication('')
    }
  }

  const removeContraindication = (index: number) => {
    setInput(prev => ({
      ...prev,
      contraindications: prev.contraindications.filter((_, i) => i !== index)
    }))
  }

  const addObservation = () => {
    if (newObservation.trim()) {
      setInput(prev => ({
        ...prev,
        observations: [...prev.observations, newObservation.trim()]
      }))
      setNewObservation('')
    }
  }

  const removeObservation = (index: number) => {
    setInput(prev => ({
      ...prev,
      observations: prev.observations.filter((_, i) => i !== index)
    }))
  }

  const addGoal = () => {
    if (newGoal.trim()) {
      setInput(prev => ({
        ...prev,
        goals: [...prev.goals, newGoal.trim()]
      }))
      setNewGoal('')
    }
  }

  const removeGoal = (index: number) => {
    setInput(prev => ({
      ...prev,
      goals: prev.goals.filter((_, i) => i !== index)
    }))
  }

  const resetForm = () => {
    setInput({
      age: 30,
      weight: 70,
      height: 170,
      gender: 'male',
      fcr: undefined,
      pse: undefined,
      vvo2: undefined,
      mfel: undefined,
      rir: undefined,
      contraindications: [],
      observations: [],
      goals: []
    })
  }

  if (showPreview) {
    return (
      <AnamnesePreview 
        input={input} 
        onClose={() => setShowPreview(false)} 
      />
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Motor da Anamnese</h2>
          <p className="text-muted-foreground">
            Calcule protocolos de treino e zonas de frequência cardíaca baseados nos dados do aluno.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={resetForm}>
            Limpar
          </Button>
          <Button onClick={() => setShowPreview(true)}>
            <Calculator className="mr-2 h-4 w-4" />
            Calcular
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Informações Básicas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Informações Básicas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="age">Idade</Label>
                <Input
                  id="age"
                  type="number"
                  value={input.age}
                  onChange={(e) => setInput(prev => ({ ...prev, age: parseInt(e.target.value) || 0 }))}
                  min="0"
                  max="120"
                />
              </div>
              <div>
                <Label htmlFor="gender">Gênero</Label>
                <Select value={input.gender} onValueChange={(value: 'male' | 'female') => setInput(prev => ({ ...prev, gender: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Masculino</SelectItem>
                    <SelectItem value="female">Feminino</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="weight">Peso (kg)</Label>
                <Input
                  id="weight"
                  type="number"
                  value={input.weight}
                  onChange={(e) => setInput(prev => ({ ...prev, weight: parseFloat(e.target.value) || 0 }))}
                  min="20"
                  max="300"
                  step="0.1"
                />
              </div>
              <div>
                <Label htmlFor="height">Altura (cm)</Label>
                <Input
                  id="height"
                  type="number"
                  value={input.height}
                  onChange={(e) => setInput(prev => ({ ...prev, height: parseFloat(e.target.value) || 0 }))}
                  min="100"
                  max="250"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Dados Cardíacos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5" />
              Dados Cardíacos (Opcional)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="fcr">FCR - Frequência Cardíaca de Repouso (bpm)</Label>
              <Input
                id="fcr"
                type="number"
                value={input.fcr || ''}
                onChange={(e) => setInput(prev => ({ ...prev, fcr: e.target.value ? parseInt(e.target.value) : undefined }))}
                min="40"
                max="220"
                placeholder="Ex: 60"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="pse">PSE - Percepção Subjetiva de Esforço (1-10)</Label>
                <Input
                  id="pse"
                  type="number"
                  value={input.pse || ''}
                  onChange={(e) => setInput(prev => ({ ...prev, pse: e.target.value ? parseInt(e.target.value) : undefined }))}
                  min="1"
                  max="10"
                  placeholder="Ex: 5"
                />
              </div>
              <div>
                <Label htmlFor="vvo2">vVO2 - Velocidade VO2 (km/h)</Label>
                <Input
                  id="vvo2"
                  type="number"
                  value={input.vvo2 || ''}
                  onChange={(e) => setInput(prev => ({ ...prev, vvo2: e.target.value ? parseFloat(e.target.value) : undefined }))}
                  min="10"
                  max="50"
                  step="0.1"
                  placeholder="Ex: 15.5"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="mfel">MFEL - Limiar (1-10)</Label>
                <Input
                  id="mfel"
                  type="number"
                  value={input.mfel || ''}
                  onChange={(e) => setInput(prev => ({ ...prev, mfel: e.target.value ? parseInt(e.target.value) : undefined }))}
                  min="1"
                  max="10"
                  placeholder="Ex: 7"
                />
              </div>
              <div>
                <Label htmlFor="rir">RIR - Reps in Reserve (0-10)</Label>
                <Input
                  id="rir"
                  type="number"
                  value={input.rir || ''}
                  onChange={(e) => setInput(prev => ({ ...prev, rir: e.target.value ? parseInt(e.target.value) : undefined }))}
                  min="0"
                  max="10"
                  placeholder="Ex: 3"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Contraindicações */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Contraindicações e Observações
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label>Contraindicações</Label>
              <div className="flex gap-2 mt-2">
                <Input
                  value={newContraindication}
                  onChange={(e) => setNewContraindication(e.target.value)}
                  placeholder="Ex: Lesão no joelho"
                  onKeyPress={(e) => e.key === 'Enter' && addContraindication()}
                />
                <Button onClick={addContraindication} size="sm">
                  Adicionar
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {input.contraindications.map((item, index) => (
                  <Badge key={index} variant="destructive" className="cursor-pointer" onClick={() => removeContraindication(index)}>
                    {item} ×
                  </Badge>
                ))}
              </div>
            </div>
            
            <div>
              <Label>Observações</Label>
              <div className="flex gap-2 mt-2">
                <Input
                  value={newObservation}
                  onChange={(e) => setNewObservation(e.target.value)}
                  placeholder="Ex: Precisa de supervisão"
                  onKeyPress={(e) => e.key === 'Enter' && addObservation()}
                />
                <Button onClick={addObservation} size="sm">
                  Adicionar
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {input.observations.map((item, index) => (
                  <Badge key={index} variant="secondary" className="cursor-pointer" onClick={() => removeObservation(index)}>
                    {item} ×
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Objetivos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Dumbbell className="h-5 w-5" />
            Objetivos do Treino
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              value={newGoal}
              onChange={(e) => setNewGoal(e.target.value)}
              placeholder="Ex: Ganho de massa muscular"
              onKeyPress={(e) => e.key === 'Enter' && addGoal()}
            />
            <Button onClick={addGoal} size="sm">
              Adicionar
            </Button>
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            {input.goals.map((item, index) => (
              <Badge key={index} variant="outline" className="cursor-pointer" onClick={() => removeGoal(index)}>
                {item} ×
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Resumo */}
      <Card>
        <CardHeader>
          <CardTitle>Resumo dos Dados</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h4 className="font-medium mb-2">Informações Básicas</h4>
              <p className="text-sm text-muted-foreground">
                {input.age} anos, {input.gender === 'male' ? 'Masculino' : 'Feminino'}, {input.weight}kg, {input.height}cm
              </p>
              <p className="text-sm text-muted-foreground">
                IMC: {(input.weight / Math.pow(input.height / 100, 2)).toFixed(1)}
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2">Dados Adicionais</h4>
              <p className="text-sm text-muted-foreground">
                {input.fcr ? `FCR: ${input.fcr} bpm` : 'FCR: Não informado'}
              </p>
              <p className="text-sm text-muted-foreground">
                {input.rir !== undefined ? `RIR: ${input.rir}` : 'RIR: Não informado'}
              </p>
              <p className="text-sm text-muted-foreground">
                Contraindicações: {input.contraindications.length}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
