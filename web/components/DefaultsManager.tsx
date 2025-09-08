"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import { useToast } from "@/components/ui/toast"
import { 
  Save, 
  RotateCcw,
  Loader2
} from "lucide-react"

interface Professional {
  id: number
  full_name: string
}

interface Defaults {
  id: number
  owner_professional_id: number
  trainer_primary_professional_id: number
  trainer_support_professional_id?: number
  owner_professional: Professional
  trainer_primary_professional: Professional
  trainer_support_professional?: Professional
}

export function DefaultsManager() {
  const { success, error } = useToast()
  const [professionals, setProfessionals] = useState<Professional[]>([])
  const [defaults, setDefaults] = useState<Defaults | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    owner_professional_id: '',
    trainer_primary_professional_id: '',
    trainer_support_professional_id: 'none'
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      
      // Carregar profissionais e defaults em paralelo
      const [professionalsRes, defaultsRes] = await Promise.all([
        fetch('/api/professionals/list'),
        fetch('/api/team/defaults')
      ])

      const professionalsData = await professionalsRes.json()
      const defaultsData = await defaultsRes.json()

      if (professionalsRes.ok) {
        setProfessionals(professionalsData.professionals || [])
      } else {
        error('Erro ao carregar profissionais')
      }

      if (defaultsRes.ok) {
        setDefaults(defaultsData.defaults)
                 if (defaultsData.defaults) {
           setFormData({
             owner_professional_id: defaultsData.defaults.owner_professional_id.toString(),
             trainer_primary_professional_id: defaultsData.defaults.trainer_primary_professional_id.toString(),
             trainer_support_professional_id: defaultsData.defaults.trainer_support_professional_id?.toString() || 'none'
           })
         }
      } else {
        error('Erro ao carregar defaults')
      }
    } catch (err) {
      error('Erro ao carregar dados')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!formData.owner_professional_id || !formData.trainer_primary_professional_id) {
      error('Proprietário e Treinador Principal são obrigatórios')
      return
    }

    setSaving(true)
    try {
      const response = await fetch('/api/team/defaults', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
                 body: JSON.stringify({
           owner_professional_id: parseInt(formData.owner_professional_id),
           trainer_primary_professional_id: parseInt(formData.trainer_primary_professional_id),
           trainer_support_professional_id: formData.trainer_support_professional_id && formData.trainer_support_professional_id !== 'none'
             ? parseInt(formData.trainer_support_professional_id) 
             : null
         })
      })

      const data = await response.json()

      if (response.ok) {
        success('Defaults salvos com sucesso!')
        setDefaults(data.defaults)
      } else {
        error(data.error || 'Erro ao salvar defaults')
      }
    } catch (err) {
      error('Erro ao salvar defaults')
    } finally {
      setSaving(false)
    }
  }

     const handleReset = () => {
     if (defaults) {
       setFormData({
         owner_professional_id: defaults.owner_professional_id.toString(),
         trainer_primary_professional_id: defaults.trainer_primary_professional_id.toString(),
         trainer_support_professional_id: defaults.trainer_support_professional_id?.toString() || 'none'
       })
     } else {
       setFormData({
         owner_professional_id: '',
         trainer_primary_professional_id: '',
         trainer_support_professional_id: 'none'
       })
     }
   }

  if (loading) {
    return (
      <div className="rounded-2xl border bg-card shadow-sm">
        <div className="p-6">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border bg-card shadow-sm">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Responsáveis padrão para novos alunos</h3>
        </div>
        
        <p className="text-sm text-muted-foreground mb-6">
          Estes valores são usados para pré-preencher o formulário de novo aluno. Você poderá alterar antes de salvar.
        </p>

        {professionals.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">
              Nenhum profissional cadastrado. Cadastre profissionais primeiro.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="owner_professional">Proprietário *</Label>
                <Select
                  value={formData.owner_professional_id}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, owner_professional_id: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o proprietário" />
                  </SelectTrigger>
                  <SelectContent>
                    {professionals.map(professional => (
                      <SelectItem key={professional.id} value={professional.id.toString()}>
                        {professional.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="trainer_primary_professional">Treinador Principal *</Label>
                <Select
                  value={formData.trainer_primary_professional_id}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, trainer_primary_professional_id: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o treinador principal" />
                  </SelectTrigger>
                  <SelectContent>
                    {professionals.map(professional => (
                      <SelectItem key={professional.id} value={professional.id.toString()}>
                        {professional.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="trainer_support_professional">Treinador de Apoio</Label>
                <Select
                  value={formData.trainer_support_professional_id}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, trainer_support_professional_id: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o treinador de apoio (opcional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhum</SelectItem>
                    {professionals.map(professional => (
                      <SelectItem key={professional.id} value={professional.id.toString()}>
                        {professional.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={handleReset}
                disabled={saving}
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Repor padrão
              </Button>
              <Button
                type="button"
                onClick={handleSave}
                disabled={saving || !formData.owner_professional_id || !formData.trainer_primary_professional_id}
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Salvar
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
