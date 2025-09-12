"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  MapPin, 
  Save,
  Search
} from "lucide-react"
import { toast } from "sonner"

type Address = {
  street: string
  number: string
  complement: string
  neighborhood: string
  city: string
  state: string
  zip_code: string
}

type Student = {
  id: string
  name: string
  email: string
  phone: string
  status: 'onboarding' | 'active' | 'paused' | 'inactive'
  created_at: string
  address?: Address
}

type EnderecoTabProps = {
  student: Student
  onSave: (address: Address) => Promise<void>
}

const estados = [
  { value: 'AC', label: 'Acre' },
  { value: 'AL', label: 'Alagoas' },
  { value: 'AP', label: 'Amapá' },
  { value: 'AM', label: 'Amazonas' },
  { value: 'BA', label: 'Bahia' },
  { value: 'CE', label: 'Ceará' },
  { value: 'DF', label: 'Distrito Federal' },
  { value: 'ES', label: 'Espírito Santo' },
  { value: 'GO', label: 'Goiás' },
  { value: 'MA', label: 'Maranhão' },
  { value: 'MT', label: 'Mato Grosso' },
  { value: 'MS', label: 'Mato Grosso do Sul' },
  { value: 'MG', label: 'Minas Gerais' },
  { value: 'PA', label: 'Pará' },
  { value: 'PB', label: 'Paraíba' },
  { value: 'PR', label: 'Paraná' },
  { value: 'PE', label: 'Pernambuco' },
  { value: 'PI', label: 'Piauí' },
  { value: 'RJ', label: 'Rio de Janeiro' },
  { value: 'RN', label: 'Rio Grande do Norte' },
  { value: 'RS', label: 'Rio Grande do Sul' },
  { value: 'RO', label: 'Rondônia' },
  { value: 'RR', label: 'Roraima' },
  { value: 'SC', label: 'Santa Catarina' },
  { value: 'SP', label: 'São Paulo' },
  { value: 'SE', label: 'Sergipe' },
  { value: 'TO', label: 'Tocantins' }
]

export default function EnderecoTab({ student, onSave }: EnderecoTabProps) {
  const [formData, setFormData] = useState<Address>({
    street: student.address?.street || '',
    number: student.address?.number || '',
    complement: student.address?.complement || '',
    neighborhood: student.address?.neighborhood || '',
    city: student.address?.city || '',
    state: student.address?.state || '',
    zip_code: student.address?.zip_code || ''
  })
  
  const [saving, setSaving] = useState(false)
  const [searchingCep, setSearchingCep] = useState(false)

  const handleSave = async () => {
    try {
      setSaving(true)
      await onSave(formData)
      toast.success('Endereço salvo com sucesso!')
    } catch (error) {
      toast.error('Erro ao salvar endereço')
    } finally {
      setSaving(false)
    }
  }

  const handleCepSearch = async () => {
    if (!formData.zip_code || formData.zip_code.length < 8) {
      toast.error('Digite um CEP válido')
      return
    }

    try {
      setSearchingCep(true)
      const cep = formData.zip_code.replace(/\D/g, '')
      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`)
      const data = await response.json()

      if (data.erro) {
        toast.error('CEP não encontrado')
        return
      }

      setFormData(prev => ({
        ...prev,
        street: data.logradouro || '',
        neighborhood: data.bairro || '',
        city: data.localidade || '',
        state: data.uf || ''
      }))

      toast.success('Endereço encontrado!')
    } catch (error) {
      toast.error('Erro ao buscar CEP')
    } finally {
      setSearchingCep(false)
    }
  }

  const formatCep = (value: string) => {
    const numbers = value.replace(/\D/g, '')
    return numbers.replace(/(\d{5})(\d{3})/, '$1-$2')
  }

  const handleCepChange = (value: string) => {
    const formatted = formatCep(value)
    setFormData(prev => ({ ...prev, zip_code: formatted }))
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Endereço Completo
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* CEP */}
          <div className="space-y-2">
            <Label htmlFor="zip_code">CEP *</Label>
            <div className="flex gap-2">
              <Input
                id="zip_code"
                value={formData.zip_code}
                onChange={(e) => handleCepChange(e.target.value)}
                placeholder="00000-000"
                maxLength={9}
                className="flex-1"
              />
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleCepSearch}
                disabled={searchingCep || !formData.zip_code}
              >
                <Search className="h-4 w-4 mr-2" />
                {searchingCep ? 'Buscando...' : 'Buscar'}
              </Button>
            </div>
          </div>

          {/* Rua e Número */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="street">Rua *</Label>
              <Input
                id="street"
                value={formData.street}
                onChange={(e) => setFormData(prev => ({ ...prev, street: e.target.value }))}
                placeholder="Digite o nome da rua"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="number">Número *</Label>
              <Input
                id="number"
                value={formData.number}
                onChange={(e) => setFormData(prev => ({ ...prev, number: e.target.value }))}
                placeholder="123"
              />
            </div>
          </div>

          {/* Complemento */}
          <div className="space-y-2">
            <Label htmlFor="complement">Complemento</Label>
            <Input
              id="complement"
              value={formData.complement}
              onChange={(e) => setFormData(prev => ({ ...prev, complement: e.target.value }))}
              placeholder="Apartamento, bloco, etc."
            />
          </div>

          {/* Bairro */}
          <div className="space-y-2">
            <Label htmlFor="neighborhood">Bairro *</Label>
            <Input
              id="neighborhood"
              value={formData.neighborhood}
              onChange={(e) => setFormData(prev => ({ ...prev, neighborhood: e.target.value }))}
              placeholder="Digite o bairro"
            />
          </div>

          {/* Cidade e Estado */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">Cidade *</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                placeholder="Digite a cidade"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="state">Estado *</Label>
              <Select
                value={formData.state}
                onValueChange={(value) => setFormData(prev => ({ ...prev, state: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o estado" />
                </SelectTrigger>
                <SelectContent>
                  {estados.map((estado) => (
                    <SelectItem key={estado.value} value={estado.value}>
                      {estado.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resumo do Endereço */}
      {formData.street && formData.number && formData.city && formData.state && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Resumo do Endereço</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm">
                {formData.street}, {formData.number}
                {formData.complement && `, ${formData.complement}`}
              </p>
              <p className="text-sm">
                {formData.neighborhood} - {formData.city}/{formData.state}
              </p>
              <p className="text-sm text-muted-foreground">
                CEP: {formData.zip_code}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Botões de Ação */}
      <div className="flex gap-2 pt-4">
        <Button onClick={handleSave} disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Salvando...' : 'Salvar Endereço'}
        </Button>
      </div>
    </div>
  )
}
