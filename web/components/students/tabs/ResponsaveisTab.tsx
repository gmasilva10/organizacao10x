"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  Users, 
  UserCheck, 
  UserPlus, 
  Edit, 
  History, 
  Trash2,
  Save,
  Search
} from "lucide-react"
import { toast } from "sonner"

type Responsavel = {
  id: string
  user_id: string
  name: string
  role: 'trainer_principal' | 'trainer_support' | 'responsavel_comercial' | 'responsavel_anamnese' | 'responsavel_tecnico'
  is_active: boolean
  start_date: string
  end_date?: string
}

type Student = {
  id: string
  name: string
  email: string
  phone: string
  status: 'onboarding' | 'active' | 'paused' | 'inactive'
  created_at: string
}

type ResponsaveisTabProps = {
  student: Student
  onSave: (responsaveis: Responsavel[]) => Promise<void>
}

const roleLabels = {
  trainer_principal: 'Treinador Principal',
  trainer_support: 'Treinador de Apoio',
  responsavel_comercial: 'Responsável Comercial',
  responsavel_anamnese: 'Responsável Anamnese',
  responsavel_tecnico: 'Responsável Técnico'
}

const roleColors = {
  trainer_principal: 'bg-blue-100 text-blue-800',
  trainer_support: 'bg-green-100 text-green-800',
  responsavel_comercial: 'bg-purple-100 text-purple-800',
  responsavel_anamnese: 'bg-orange-100 text-orange-800',
  responsavel_tecnico: 'bg-gray-100 text-gray-800'
}

export default function ResponsaveisTab({ student, onSave }: ResponsaveisTabProps) {
  const [responsaveis, setResponsaveis] = useState<Responsavel[]>([])
  const [teamMembers, setTeamMembers] = useState<Array<{id: string, name: string, role: string}>>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  // Form para adicionar responsável
  const [newResponsavel, setNewResponsavel] = useState({
    user_id: '',
    role: 'trainer_support' as Responsavel['role'],
    start_date: new Date().toISOString().split('T')[0]
  })

  useEffect(() => {
    loadResponsaveis()
    loadTeamMembers()
  }, [student.id])

  const loadResponsaveis = async () => {
    try {
      setLoading(true)
      // Simular carregamento dos responsáveis
      const mockResponsaveis: Responsavel[] = [
        {
          id: '1',
          user_id: 'user1',
          name: 'João Silva',
          role: 'trainer_principal',
          is_active: true,
          start_date: '2025-01-01'
        },
        {
          id: '2',
          user_id: 'user2',
          name: 'Maria Santos',
          role: 'trainer_support',
          is_active: true,
          start_date: '2025-01-15'
        }
      ]
      setResponsaveis(mockResponsaveis)
    } catch (error) {
      toast.error('Erro ao carregar responsáveis')
    } finally {
      setLoading(false)
    }
  }

  const loadTeamMembers = async () => {
    try {
      // Simular carregamento da equipe
      const mockTeam = [
        { id: 'user1', name: 'João Silva', role: 'trainer' },
        { id: 'user2', name: 'Maria Santos', role: 'trainer' },
        { id: 'user3', name: 'Pedro Costa', role: 'admin' },
        { id: 'user4', name: 'Ana Lima', role: 'manager' }
      ]
      setTeamMembers(mockTeam)
    } catch (error) {
      toast.error('Erro ao carregar equipe')
    }
  }

  const handleAddResponsavel = async () => {
    if (!newResponsavel.user_id) {
      toast.error('Selecione um colaborador')
      return
    }

    const selectedMember = teamMembers.find(m => m.id === newResponsavel.user_id)
    if (!selectedMember) {
      toast.error('Colaborador não encontrado')
      return
    }

    const responsavel: Responsavel = {
      id: Date.now().toString(),
      user_id: newResponsavel.user_id,
      name: selectedMember.name,
      role: newResponsavel.role,
      is_active: true,
      start_date: newResponsavel.start_date
    }

    setResponsaveis(prev => [...prev, responsavel])
    setNewResponsavel({
      user_id: '',
      role: 'trainer_support',
      start_date: new Date().toISOString().split('T')[0]
    })
    setShowAddForm(false)
    toast.success('Responsável adicionado com sucesso!')
  }

  const handleRemoveResponsavel = (id: string) => {
    setResponsaveis(prev => prev.filter(r => r.id !== id))
    toast.success('Responsável removido com sucesso!')
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      await onSave(responsaveis)
      toast.success('Responsáveis salvos com sucesso!')
    } catch (error) {
      toast.error('Erro ao salvar responsáveis')
    } finally {
      setSaving(false)
    }
  }

  const filteredTeamMembers = teamMembers.filter(member => 
    member.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
    !responsaveis.some(r => r.user_id === member.id)
  )

  const getPrincipalTrainer = () => {
    return responsaveis.find(r => r.role === 'trainer_principal' && r.is_active)
  }

  const getSupportTrainers = () => {
    return responsaveis.filter(r => r.role === 'trainer_support' && r.is_active)
  }

  const getSpecificResponsaveis = () => {
    return responsaveis.filter(r => 
      ['responsavel_comercial', 'responsavel_anamnese', 'responsavel_tecnico'].includes(r.role) && 
      r.is_active
    )
  }

  return (
    <div className="space-y-6">
      {/* Treinador Principal */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5" />
            Treinador Principal
            <Badge variant="default">Obrigatório</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {getPrincipalTrainer() ? (
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-3">
                <UserCheck className="h-4 w-4 text-green-600" />
                <div>
                  <p className="font-medium">{getPrincipalTrainer()?.name}</p>
                  <p className="text-sm text-muted-foreground">
                    Desde {new Date(getPrincipalTrainer()?.start_date || '').toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Edit className="h-4 w-4 mr-1" />
                  Alterar
                </Button>
                <Button variant="outline" size="sm">
                  <History className="h-4 w-4 mr-1" />
                  Histórico
                </Button>
              </div>
            </div>
          ) : (
            <div className="p-4 border-2 border-dashed border-muted-foreground/25 rounded-lg text-center">
              <UserPlus className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground mb-3">
                Nenhum treinador principal atribuído
              </p>
              <Button size="sm" onClick={() => setShowAddForm(true)}>
                <UserPlus className="h-4 w-4 mr-2" />
                Atribuir Treinador
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Treinadores de Apoio */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Treinadores de Apoio
            <Badge variant="secondary">Opcional</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {getSupportTrainers().length > 0 ? (
            <div className="space-y-2">
              {getSupportTrainers().map((responsavel) => (
                <div key={responsavel.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Users className="h-4 w-4 text-blue-600" />
                    <div>
                      <p className="font-medium">{responsavel.name}</p>
                      <p className="text-sm text-muted-foreground">
                        Desde {new Date(responsavel.start_date).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleRemoveResponsavel(responsavel.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 border-2 border-dashed border-muted-foreground/25 rounded-lg text-center">
              <Users className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground mb-3">
                Nenhum treinador de apoio atribuído
              </p>
              <Button variant="outline" size="sm" onClick={() => setShowAddForm(true)}>
                <UserPlus className="h-4 w-4 mr-2" />
                Adicionar Apoio
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Responsáveis Específicos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Responsáveis Específicos
            <Badge variant="secondary">Opcional</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {getSpecificResponsaveis().length > 0 ? (
            <div className="space-y-2">
              {getSpecificResponsaveis().map((responsavel) => (
                <div key={responsavel.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Users className="h-4 w-4 text-purple-600" />
                    <div>
                      <p className="font-medium">{responsavel.name}</p>
                      <Badge className={roleColors[responsavel.role]}>
                        {roleLabels[responsavel.role]}
                      </Badge>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleRemoveResponsavel(responsavel.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 border-2 border-dashed border-muted-foreground/25 rounded-lg text-center">
              <Users className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground mb-3">
                Nenhum responsável específico atribuído
              </p>
              <Button variant="outline" size="sm" onClick={() => setShowAddForm(true)}>
                <UserPlus className="h-4 w-4 mr-2" />
                Adicionar Responsável
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal para Adicionar Responsável */}
      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle>Adicionar Responsável</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Buscar Colaborador</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Digite o nome do colaborador"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <Button variant="outline" size="sm">
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Colaborador</Label>
              <Select
                value={newResponsavel.user_id}
                onValueChange={(value) => setNewResponsavel(prev => ({ ...prev, user_id: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um colaborador" />
                </SelectTrigger>
                <SelectContent>
                  {filteredTeamMembers.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.name} ({member.role})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Função</Label>
              <Select
                value={newResponsavel.role}
                onValueChange={(value) => setNewResponsavel(prev => ({ ...prev, role: value as Responsavel['role'] }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a função" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="trainer_principal">Treinador Principal</SelectItem>
                  <SelectItem value="trainer_support">Treinador de Apoio</SelectItem>
                  <SelectItem value="responsavel_comercial">Responsável Comercial</SelectItem>
                  <SelectItem value="responsavel_anamnese">Responsável Anamnese</SelectItem>
                  <SelectItem value="responsavel_tecnico">Responsável Técnico</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Data de Início</Label>
              <Input
                type="date"
                value={newResponsavel.start_date}
                onChange={(e) => setNewResponsavel(prev => ({ ...prev, start_date: e.target.value }))}
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={handleAddResponsavel}>
                <UserPlus className="h-4 w-4 mr-2" />
                Adicionar
              </Button>
              <Button variant="outline" onClick={() => setShowAddForm(false)}>
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Botões de Ação */}
      <div className="flex gap-2 pt-4">
        <Button onClick={handleSave} disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Salvando...' : 'Salvar Responsáveis'}
        </Button>
      </div>
    </div>
  )
}
