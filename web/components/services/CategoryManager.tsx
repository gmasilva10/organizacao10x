/**
 * GATE 10.8 - Category Manager Component
 * Gerenciamento de categorias financeiras
 */

'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { ConfirmDeleteDialog } from '@/components/ui/confirm-delete-dialog'
import { Plus, Edit, Trash2, FolderTree, Save, X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'

interface Category {
  id: string
  name: string
  color: string
  active: boolean
  is_system: boolean
  org_id: string
  created_at: string
  updated_at: string
}

export default function CategoryManager() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    color: '#3B82F6', // blue-500
    active: true
  })
  const [saving, setSaving] = useState(false)

  // Cores predefinidas para o color picker
  const predefinedColors = [
    '#3B82F6', // blue-500
    '#10B981', // emerald-500
    '#8B5CF6', // violet-500
    '#F59E0B', // amber-500
    '#EF4444', // red-500
    '#06B6D4', // cyan-500
    '#84CC16', // lime-500
    '#EC4899', // pink-500
  ]

  const loadCategories = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/financial/categories')
      if (!response.ok) {
        throw new Error('Erro ao carregar categorias')
      }
      const data = await response.json()
      setCategories(data.categories || [])
    } catch (error) {
      console.error('Erro ao carregar categorias:', error)
      toast.error('Erro ao carregar categorias')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCategories()
  }, [])

  const resetForm = () => {
    setFormData({
      name: '',
      color: '#3B82F6',
      active: true
    })
  }

  const handleCreateCategory = () => {
    resetForm()
    setShowCreateModal(true)
  }

  const handleEditCategory = (category: Category) => {
    setSelectedCategory(category)
    setFormData({
      name: category.name,
      color: category.color,
      active: category.active
    })
    setShowEditModal(true)
  }

  const handleDeleteCategory = (category: Category) => {
    setSelectedCategory(category)
    setShowDeleteModal(true)
  }

  const handleSaveCategory = async () => {
    try {
      setSaving(true)
      
      const url = selectedCategory ? `/api/financial/categories/${selectedCategory.id}` : '/api/financial/categories'
      const method = selectedCategory ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro ao salvar categoria')
      }

      const data = await response.json()
      toast.success(data.message || 'Categoria salva com sucesso')
      
      await loadCategories()
      
      setShowCreateModal(false)
      setShowEditModal(false)
      setSelectedCategory(null)
      resetForm()
      
    } catch (error: any) {
      console.error('Erro ao salvar categoria:', error)
      toast.error(error.message || 'Erro ao salvar categoria')
    } finally {
      setSaving(false)
    }
  }

  const handleConfirmDelete = async () => {
    if (!selectedCategory) return

    try {
      setSaving(true)
      
      const response = await fetch(`/api/financial/categories/${selectedCategory.id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro ao excluir categoria')
      }

      const data = await response.json()
      toast.success(data.message || 'Categoria excluída com sucesso')
      
      await loadCategories()
      
      setShowDeleteModal(false)
      setSelectedCategory(null)
      
    } catch (error: any) {
      console.error('Erro ao excluir categoria:', error)
      toast.error(error.message || 'Erro ao excluir categoria')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold tracking-tight">Categorias Financeiras</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-6 bg-gray-200 rounded w-1/3 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-full"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Categorias Financeiras</h2>
          <p className="text-muted-foreground">
            Organize seus serviços em categorias para melhor gestão.
          </p>
        </div>
        <Button onClick={handleCreateCategory} aria-label="Criar nova categoria">
          <Plus className="h-4 w-4 mr-2" />
          Nova Categoria
        </Button>
      </div>

      {categories.length === 0 ? (
        <Card className="p-12">
          <div className="text-center space-y-3">
            <FolderTree className="h-12 w-12 mx-auto text-muted-foreground opacity-50" />
            <div>
              <h3 className="font-semibold">Nenhuma categoria cadastrada</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Comece criando sua primeira categoria financeira.
              </p>
            </div>
            <Button onClick={handleCreateCategory} aria-label="Criar primeira categoria">
              <Plus className="h-4 w-4 mr-2" />
              Criar Primeira Categoria
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => (
            <Card key={category.id} className="relative">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: category.color }}
                    />
                    <CardTitle className="text-base">{category.name}</CardTitle>
                  </div>
                  <div className="flex items-center gap-1">
                    {category.is_system && (
                      <Badge variant="outline" className="text-xs">
                        Sistema
                      </Badge>
                    )}
                    <Badge variant={category.active ? 'default' : 'secondary'}>
                      {category.active ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => handleEditCategory(category)}
                    aria-label="Editar categoria"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  {!category.is_system && (
                    <Button 
                      variant="destructive" 
                      size="sm" 
                      onClick={() => handleDeleteCategory(category)}
                      aria-label="Excluir categoria"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modal de Criação/Edição */}
      <Dialog open={showCreateModal || showEditModal} onOpenChange={(open: boolean) => {
        if (!open) {
          setShowCreateModal(false)
          setShowEditModal(false)
          setSelectedCategory(null)
          resetForm()
        }
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selectedCategory ? '✏️ Editar Categoria' : '➕ Nova Categoria'}
            </DialogTitle>
            <DialogDescription>
              {selectedCategory ? 'Atualize as informações da categoria' : 'Preencha os dados para criar uma nova categoria'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="name" className="mb-2 block">Nome da Categoria *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Ex: Personal Trainer"
                maxLength={50}
              />
            </div>

            <div>
              <Label className="mb-2 block">Cor</Label>
              <div className="grid grid-cols-4 gap-2">
                {predefinedColors.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={`w-8 h-8 rounded-full border-2 transition-all ${
                      formData.color === color 
                        ? 'border-gray-900 scale-110' 
                        : 'border-gray-300 hover:scale-105'
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => setFormData(prev => ({ ...prev, color }))}
                    aria-label={`Selecionar cor ${color}`}
                  />
                ))}
              </div>
              <Input
                className="mt-2"
                value={formData.color}
                onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                placeholder="#RRGGBB"
                pattern="^#[0-9A-Fa-f]{6}$"
              />
            </div>

            {selectedCategory && !selectedCategory.is_system && (
              <div className="flex items-center space-x-2">
                <Switch
                  id="active"
                  checked={formData.active}
                  onCheckedChange={(checked: boolean) => setFormData(prev => ({ ...prev, active: checked }))}
                />
                <Label htmlFor="active">Categoria ativa</Label>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowCreateModal(false)
                setShowEditModal(false)
                setSelectedCategory(null)
                resetForm()
              }}
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button onClick={handleSaveCategory} disabled={saving || !formData.name}>
              {saving ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Confirmação de Exclusão */}
      <ConfirmDeleteDialog
        open={showDeleteModal}
        onOpenChange={setShowDeleteModal}
        onConfirm={handleConfirmDelete}
        title="Excluir Categoria"
        description="Tem certeza que deseja excluir esta categoria?"
        itemName={selectedCategory?.name}
        itemType="categoria"
        loading={saving}
      />
    </div>
  )
}
