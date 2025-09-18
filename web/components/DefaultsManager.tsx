"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/toast"
import { 
  Save, 
  RotateCcw,
  Loader2,
  Users,
  UserCheck,
  UserPlus,
  Settings,
  Sparkles,
  CheckCircle
} from "lucide-react"
import ProfessionalSearchModal from "./students/ProfessionalSearchModal"

interface Professional {
  id: number
  full_name: string
  email: string
  whatsapp_work: string
  is_active: boolean
}

interface Defaults {
  principal: Professional | null
  apoio: Professional[]
  especificos: Professional[]
}

export function DefaultsManager() {
  const { success, error } = useToast()
  const [professionals, setProfessionals] = useState<Professional[]>([])
  const [defaults, setDefaults] = useState<Defaults>({
    principal: null,
    apoio: [],
    especificos: []
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [searchModalOpen, setSearchModalOpen] = useState(false)
  const [searchModalType, setSearchModalType] = useState<'principal' | 'apoio' | 'especifico'>('principal')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      
      // Carregar profissionais e defaults em paralelo
      const [professionalsRes, defaultsRes] = await Promise.all([
        fetch('/api/professionals'),
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
        const loadedDefaults = defaultsData.defaults || { principal: null, apoio: [], especificos: [] }
        setDefaults({
          principal: loadedDefaults.principal || null,
          apoio: loadedDefaults.apoio || [],
          especificos: loadedDefaults.especificos || []
        })
      } else {
        console.warn('Erro ao carregar defaults:', defaultsData.error)
        // Garantir estrutura correta mesmo em caso de erro
        setDefaults({
          principal: null,
          apoio: [],
          especificos: []
        })
      }
    } catch (err) {
      console.error('Erro ao carregar dados:', err)
      error('Erro ao carregar dados')
    } finally {
      setLoading(false)
    }
  }

  const handleSelectProfessional = (professional: Professional) => {
    if (searchModalType === 'principal') {
      setDefaults(prev => ({ ...prev, principal: professional }))
    } else if (searchModalType === 'apoio') {
      setDefaults(prev => {
        // Verificar se já não está na lista
        if (!prev.apoio.find(p => p.id === professional.id)) {
          return { 
            ...prev, 
            apoio: [...prev.apoio, professional] 
          }
        }
        return prev
      })
    } else if (searchModalType === 'especifico') {
      setDefaults(prev => {
        // Verificar se já não está na lista
        if (!prev.especificos.find(p => p.id === professional.id)) {
          return { 
            ...prev, 
            especificos: [...prev.especificos, professional] 
          }
        }
        return prev
      })
    }
    setSearchModalOpen(false)
  }

  const removeProfessional = (type: 'principal' | 'apoio' | 'especifico', professionalId: number) => {
    if (type === 'principal') {
      setDefaults(prev => ({ ...prev, principal: null }))
    } else if (type === 'apoio') {
      setDefaults(prev => ({ 
        ...prev, 
        apoio: prev.apoio.filter(p => p.id !== professionalId) 
      }))
    } else if (type === 'especifico') {
      setDefaults(prev => ({ 
        ...prev, 
        especificos: prev.especificos.filter(p => p.id !== professionalId) 
      }))
    }
  }

  const handleSave = async () => {
    if (!defaults.principal) {
      error('Treinador Principal é obrigatório')
      return
    }

    setSaving(true)
    try {
      const response = await fetch('/api/team/defaults', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(defaults)
      })

      const data = await response.json()

      if (response.ok) {
        success('Defaults salvos com sucesso!')
        // Usar os dados retornados pela API (que já vêm organizados)
        if (data.defaults) {
          setDefaults({
            principal: data.defaults.principal || null,
            apoio: data.defaults.apoio || [],
            especificos: data.defaults.especificos || []
          })
        }
      } else {
        error(data.error || 'Erro ao salvar defaults')
      }
    } catch (err) {
      console.error('Erro ao salvar:', err)
      error('Erro ao salvar defaults')
    } finally {
      setSaving(false)
    }
  }

  const handleReset = () => {
    setDefaults({
      principal: null,
      apoio: [],
      especificos: []
    })
  }

  const openSearchModal = (type: 'principal' | 'apoio' | 'especifico') => {
    setSearchModalType(type)
    setSearchModalOpen(true)
  }

  if (loading) {
    return (
      <Card className="border-0 shadow-lg bg-gradient-to-br from-background to-muted/20">
        <CardContent className="p-8">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
              <p className="text-muted-foreground">Carregando defaults...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card className="border-0 shadow-lg bg-gradient-to-br from-background to-muted/20">
        <CardHeader className="pb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Settings className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-xl font-semibold">Responsáveis Padrão</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Configure os responsáveis que serão pré-selecionados ao criar novos alunos
              </p>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-8">
          {professionals.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Nenhum profissional cadastrado</h3>
              <p className="text-muted-foreground mb-6">
                Cadastre profissionais primeiro para configurar os defaults
              </p>
              <Button onClick={() => window.location.href = '/equipe'}>
                <UserPlus className="h-4 w-4 mr-2" />
                Ir para Profissionais
              </Button>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Treinador Principal */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <UserCheck className="h-5 w-5 text-primary" />
                  <Label className="text-base font-medium">Treinador Principal *</Label>
                  <Badge variant="destructive" className="text-xs">Obrigatório</Badge>
                </div>
                
                {defaults.principal ? (
                  <div className="flex items-center justify-between p-4 bg-primary/5 border border-primary/20 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <UserCheck className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{defaults.principal.full_name || 'Nome não disponível'}</p>
                        <p className="text-sm text-muted-foreground">{defaults.principal.email || 'Email não disponível'}</p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeProfessional('principal', defaults.principal!.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      Remover
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    onClick={() => openSearchModal('principal')}
                    className="w-full h-16 border-dashed border-2 hover:border-primary/50 hover:bg-primary/5"
                  >
                    <div className="text-center">
                      <UserCheck className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm">Selecionar Treinador Principal</p>
                    </div>
                  </Button>
                )}
              </div>

              {/* Treinadores de Apoio */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-600" />
                  <Label className="text-base font-medium">Treinadores de Apoio</Label>
                  <Badge variant="secondary" className="text-xs">Opcional</Badge>
                </div>
                
                <div className="space-y-3">
                  {(defaults.apoio || []).map((professional) => (
                    <div key={professional.id} className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <Users className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium">{professional.full_name}</p>
                          <p className="text-sm text-muted-foreground">{professional.email}</p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeProfessional('apoio', professional.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        Remover
                      </Button>
                    </div>
                  ))}
                  
                  <Button
                    variant="outline"
                    onClick={() => openSearchModal('apoio')}
                    className="w-full h-12 border-dashed border-2 hover:border-blue-500/50 hover:bg-blue-50"
                  >
                    <Users className="h-4 w-4 mr-2" />
                    Adicionar Treinador de Apoio
                  </Button>
                </div>
              </div>

              {/* Responsáveis Específicos */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <UserPlus className="h-5 w-5 text-purple-600" />
                  <Label className="text-base font-medium">Responsáveis Específicos</Label>
                  <Badge variant="secondary" className="text-xs">Opcional</Badge>
                </div>
                
                <div className="space-y-3">
                  {(defaults.especificos || []).map((professional) => (
                    <div key={professional.id} className="flex items-center justify-between p-4 bg-purple-50 border border-purple-200 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                          <UserPlus className="h-5 w-5 text-purple-600" />
                        </div>
                        <div>
                          <p className="font-medium">{professional.full_name}</p>
                          <p className="text-sm text-muted-foreground">{professional.email}</p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeProfessional('especifico', professional.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        Remover
                      </Button>
                    </div>
                  ))}
                  
                  <Button
                    variant="outline"
                    onClick={() => openSearchModal('especifico')}
                    className="w-full h-12 border-dashed border-2 hover:border-purple-500/50 hover:bg-purple-50"
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Adicionar Responsável Específico
                  </Button>
                </div>
              </div>

              {/* Resumo */}
              <div className="p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="h-5 w-5 text-primary" />
                  <h4 className="font-medium">Resumo dos Defaults</h4>
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div className="text-center">
                    <div className="font-medium text-primary">
                      {defaults.principal ? '1' : '0'}
                    </div>
                    <div className="text-muted-foreground">Principal</div>
                  </div>
                  <div className="text-center">
                    <div className="font-medium text-blue-600">
                      {defaults.apoio.length}
                    </div>
                    <div className="text-muted-foreground">Apoio</div>
                  </div>
                  <div className="text-center">
                    <div className="font-medium text-purple-600">
                      {defaults.especificos.length}
                    </div>
                    <div className="text-muted-foreground">Específicos</div>
                  </div>
                </div>
              </div>

              {/* Ações */}
              <div className="flex justify-end gap-3 pt-6 border-t">
                <Button
                  variant="outline"
                  onClick={handleReset}
                  disabled={saving}
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Limpar Tudo
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={saving || !defaults.principal}
                  className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <CheckCircle className="h-4 w-4 mr-2" />
                  )}
                  Salvar Defaults
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de Busca */}
      <ProfessionalSearchModal
        open={searchModalOpen}
        onOpenChange={setSearchModalOpen}
        onSelect={handleSelectProfessional}
        title={`Selecionar ${searchModalType === 'principal' ? 'Treinador Principal' : searchModalType === 'apoio' ? 'Treinador de Apoio' : 'Responsável Específico'}`}
        placeholder="Buscar profissional..."
      />
    </>
  )
}