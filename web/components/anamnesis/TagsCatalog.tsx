'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Search, Tag, Heart, Bone, Zap, Target, Dumbbell, Filter, Info, Lightbulb, AlertCircle } from 'lucide-react'
import { GUIDELINE_TAGS } from '@/lib/guidelines-constants'

interface TagItem {
  value: string
  label: string
  category: string
}

export function TagsCatalog() {
  const [tags, setTags] = useState<TagItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [queryTime, setQueryTime] = useState<number>(0)

  useEffect(() => {
    fetchTags()
  }, [])

  const fetchTags = async () => {
    try {
      setLoading(true)
      const startTime = Date.now()
      
      // Simular delay de API
      await new Promise(resolve => setTimeout(resolve, 100))
      
      setTags(GUIDELINE_TAGS)
      setQueryTime(Date.now() - startTime)
    } catch (error) {
      console.error('Erro ao buscar tags:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredTags = tags.filter(tag => {
    const matchesSearch = tag.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         tag.value.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = categoryFilter === 'all' || tag.category === categoryFilter
    return matchesSearch && matchesCategory
  })

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'cardiovascular': return <Heart className="h-5 w-5" />
      case 'musculoesqueletica': return <Bone className="h-5 w-5" />
      case 'metabolica': return <Zap className="h-5 w-5" />
      case 'objetivo': return <Target className="h-5 w-5" />
      case 'capacidade': return <Dumbbell className="h-5 w-5" />
      default: return <Tag className="h-5 w-5" />
    }
  }

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'cardiovascular': return 'Cardiovascular'
      case 'musculoesqueletica': return 'Musculoesquelética'
      case 'metabolica': return 'Metabólica'
      case 'objetivo': return 'Objetivo'
      case 'capacidade': return 'Capacidade'
      default: return category
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'cardiovascular': return 'bg-red-50 border-red-200'
      case 'musculoesqueletica': return 'bg-orange-50 border-orange-200'
      case 'metabolica': return 'bg-yellow-50 border-yellow-200'
      case 'objetivo': return 'bg-green-50 border-green-200'
      case 'capacidade': return 'bg-blue-50 border-blue-200'
      default: return 'bg-gray-50 border-gray-200'
    }
  }

  const getCategoryBadgeColor = (category: string) => {
    switch (category) {
      case 'cardiovascular': return 'bg-red-100 text-red-800 border-red-200'
      case 'musculoesqueletica': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'metabolica': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'objetivo': return 'bg-green-100 text-green-800 border-green-200'
      case 'capacidade': return 'bg-blue-100 text-blue-800 border-blue-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getCategoryDescription = (category: string) => {
    switch (category) {
      case 'cardiovascular': return 'Condições relacionadas ao sistema cardiovascular'
      case 'musculoesqueletica': return 'Lesões e problemas musculoesqueléticos'
      case 'metabolica': return 'Condições metabólicas e endócrinas'
      case 'objetivo': return 'Objetivos específicos de treino'
      case 'capacidade': return 'Habilidades e capacidades físicas'
      default: return 'Categoria geral'
    }
  }

  const categories = Array.from(new Set(tags.map(tag => tag.category)))
  const groupedTags = categories.map(category => ({
    category,
    tags: filteredTags.filter(tag => tag.category === category)
  })).filter(group => group.tags.length > 0)

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5" />
            Catálogo de Tags Canônicas
          </CardTitle>
          <div className="flex gap-4">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-10 w-32" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Tag className="h-5 w-5" />
          Catálogo de Tags Canônicas
          <Badge variant="secondary">
            {filteredTags.length} tags
          </Badge>
          {queryTime > 0 && (
            <Badge variant="outline" className="text-xs">
              {queryTime}ms
            </Badge>
          )}
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Tags padronizadas para criação de regras de diretrizes de treino
        </p>
        <div className="flex gap-4 mt-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou valor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-10"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-48 h-10">
              <SelectValue placeholder="Filtrar por categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as categorias</SelectItem>
              {categories.map(category => (
                <SelectItem key={category} value={category}>
                  <div className="flex items-center gap-2">
                    {getCategoryIcon(category)}
                    {getCategoryLabel(category)}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {groupedTags.map((group) => (
            <div key={group.category} className={`border rounded-lg p-6 ${getCategoryColor(group.category)}`}>
              <div className="flex items-center gap-3 mb-4">
                {getCategoryIcon(group.category)}
                <div className="flex-1">
                  <h3 className="font-bold text-lg text-gray-900">{getCategoryLabel(group.category)}</h3>
                  <p className="text-sm text-gray-600">{getCategoryDescription(group.category)}</p>
                </div>
                <Badge className={`text-xs ${getCategoryBadgeColor(group.category)}`}>
                  {group.tags.length} tags
                </Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {group.tags.map((tag) => (
                  <div
                    key={tag.value}
                    className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-all duration-200 hover:border-gray-300"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h4 className="font-semibold text-sm text-gray-900 mb-1">{tag.label}</h4>
                        <Badge variant="outline" className="text-xs font-mono">
                          {tag.value}
                        </Badge>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500">
                      Use nas condições das regras
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {groupedTags.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <Tag className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">Nenhuma tag encontrada</h3>
              <p className="text-sm">Tente ajustar os filtros de busca ou categoria.</p>
            </div>
          )}
        </div>

        {/* Sistema de Tags */}
        <div className="mt-8 space-y-6">
          <div className="p-6 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2 mb-4">
              <Info className="h-5 w-5 text-blue-600" />
              <h4 className="font-bold text-lg text-blue-900">🏷️ Sistema de Tags Canônicas</h4>
            </div>
            <p className="text-sm text-blue-800 mb-4">
              As tags canônicas são identificadores padronizados usados nas regras de diretrizes de treino. 
              Cada tag pertence a uma categoria específica e é usada para criar condições nas regras.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h5 className="font-semibold text-sm text-blue-900">Categorias Disponíveis:</h5>
                <div className="space-y-2 text-sm text-blue-700">
                  {categories.map(category => (
                    <div key={category} className="flex items-center gap-2">
                      {getCategoryIcon(category)}
                      <span><strong>{getCategoryLabel(category)}:</strong> {tags.filter(t => t.category === category).length} tags</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-3">
                <h5 className="font-semibold text-sm text-blue-900">Como Usar:</h5>
                <div className="space-y-2 text-sm text-blue-700">
                  <p>• <strong>Seleção:</strong> Use o valor da tag nas condições das regras</p>
                  <p>• <strong>Validação:</strong> Apenas tags canônicas são aceitas</p>
                  <p>• <strong>Busca:</strong> Use o campo de busca para encontrar tags</p>
                  <p>• <strong>Filtro:</strong> Filtre por categoria para organizar</p>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2 mb-4">
              <Lightbulb className="h-5 w-5 text-green-600" />
              <h4 className="font-bold text-lg text-green-900">💡 Dicas de Uso por Categoria</h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-green-800">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Heart className="h-4 w-4 text-red-500" />
                  <span><strong>Cardiovascular:</strong> Use para condições relacionadas ao sistema cardiovascular</span>
                </div>
                <div className="flex items-center gap-2">
                  <Bone className="h-4 w-4 text-orange-500" />
                  <span><strong>Musculoesquelética:</strong> Use para lesões e problemas musculoesqueléticos</span>
                </div>
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-yellow-500" />
                  <span><strong>Metabólica:</strong> Use para condições metabólicas como diabetes e obesidade</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-green-500" />
                  <span><strong>Objetivo:</strong> Use para definir objetivos de treino</span>
                </div>
                <div className="flex items-center gap-2">
                  <Dumbbell className="h-4 w-4 text-blue-500" />
                  <span><strong>Capacidade:</strong> Use para habilidades físicas específicas</span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-center gap-2 mb-4">
              <AlertCircle className="h-5 w-5 text-amber-600" />
              <h4 className="font-bold text-lg text-amber-900">⚠️ Importante</h4>
            </div>
            <div className="space-y-2 text-sm text-amber-800">
              <p>• <strong>Padronização:</strong> Use sempre as tags canônicas para manter consistência</p>
              <p>• <strong>Validação:</strong> O sistema valida automaticamente se a tag existe</p>
              <p>• <strong>Atualização:</strong> Novas tags são adicionadas pelo sistema, não pelo usuário</p>
              <p>• <strong>Compatibilidade:</strong> Tags canônicas garantem compatibilidade entre versões</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}