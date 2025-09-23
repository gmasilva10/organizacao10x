"use client"

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  RadioGroup,
  RadioGroupItem,
} from '@/components/ui/radio-group'
import { 
  FileText, 
  ArrowLeft,
  Loader2
} from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

interface Service {
  id: string
  name: string
  description?: string
}

export default function NewAnamnesePage() {
  const params = useParams()
  const router = useRouter()
  const studentId = params.id as string
  
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [formData, setFormData] = useState({
    serviceId: '',
    destination: 'group' as 'group' | 'student',
    groupId: '',
    message: ''
  })

  useEffect(() => {
    loadServices()
  }, [])

  const loadServices = async () => {
    try {
      const response = await fetch('/api/services/list')
      const data = await response.json()
      
      if (response.ok) {
        setServices(data.services || [])
      } else {
        toast.error('Erro ao carregar serviços')
      }
    } catch (error) {
      toast.error('Erro ao carregar serviços')
    } finally {
      setLoading(false)
    }
  }

  const handleGenerate = async () => {
    if (!formData.serviceId) {
      toast.error('Selecione um serviço')
      return
    }

    try {
      setGenerating(true)
      
      const response = await fetch('/api/anamnese/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId,
          serviceId: formData.serviceId,
          destination: formData.destination,
          groupId: formData.groupId || null,
          message: formData.message || null
        })
      })
      
      const data = await response.json()
      
      if (response.ok) {
        toast.success('Anamnese gerada com sucesso!')
        router.push(`/students/${studentId}/anamnese`)
      } else {
        toast.error(data.error || 'Erro ao gerar anamnese')
      }
    } catch (error) {
      toast.error('Erro ao gerar anamnese')
    } finally {
      setGenerating(false)
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/students/${studentId}/anamnese`}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Nova Anamnese</h1>
          <p className="text-gray-600">Configure e gere uma nova anamnese para o aluno</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Configuração da Anamnese
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Serviço */}
          <div className="space-y-2">
            <Label htmlFor="service">Serviço *</Label>
            <Select 
              value={formData.serviceId} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, serviceId: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione um serviço" />
              </SelectTrigger>
              <SelectContent>
                {services.map((service) => (
                  <SelectItem key={service.id} value={service.id}>
                    {service.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm text-gray-600">
              O serviço define o protocolo e personalização da anamnese
            </p>
          </div>

          {/* Destino do envio */}
          <div className="space-y-3">
            <Label>Destino do envio</Label>
            <RadioGroup 
              value={formData.destination} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, destination: value as 'group' | 'student' }))}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="group" id="group" />
                <Label htmlFor="group">Grupo WhatsApp (recomendado)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="student" id="student" />
                <Label htmlFor="student">Telefone do aluno</Label>
              </div>
            </RadioGroup>
            <p className="text-sm text-gray-600">
              Escolha como a anamnese será enviada ao aluno
            </p>
          </div>

          {/* Grupo (se selecionado) */}
          {formData.destination === 'group' && (
            <div className="space-y-2">
              <Label htmlFor="group">Grupo WhatsApp</Label>
              <Select 
                value={formData.groupId} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, groupId: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um grupo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="create-new">Criar novo grupo</SelectItem>
                  {/* TODO: Carregar grupos existentes */}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Mensagem personalizada */}
          <div className="space-y-2">
            <Label htmlFor="message">Mensagem personalizada (opcional)</Label>
            <Input
              id="message"
              placeholder="Digite uma mensagem personalizada para o aluno..."
              value={formData.message}
              onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
            />
            <p className="text-sm text-gray-600">
              Esta mensagem será incluída no convite enviado ao aluno
            </p>
          </div>

          {/* Botões */}
          <div className="flex gap-3 pt-4">
            <Button
              onClick={handleGenerate}
              disabled={generating || !formData.serviceId}
              className="flex-1"
            >
              {generating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Gerando...
                </>
              ) : (
                <>
                  <FileText className="h-4 w-4 mr-2" />
                  Gerar Anamnese
                </>
              )}
            </Button>
            <Button variant="outline" asChild>
              <Link href={`/students/${studentId}/anamnese`}>
                Cancelar
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
