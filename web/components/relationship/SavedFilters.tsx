'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { 
  Bookmark, 
  Star, 
  Plus, 
  Trash2, 
  Edit,
  Filter
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface SavedFilter {
  id: string
  name: string
  filters: Record<string, any>
  isFavorite?: boolean
  createdAt: string
}

interface SavedFiltersProps {
  onApplyFilter: (filters: Record<string, any>) => void
  onSaveCurrentFilter: (name: string) => void
  currentFilters: Record<string, any>
  className?: string
}

const STORAGE_KEY = 'kanban-saved-filters'

export function SavedFilters({ 
  onApplyFilter, 
  onSaveCurrentFilter, 
  currentFilters,
  className 
}: SavedFiltersProps) {
  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>([])
  const [isSaving, setIsSaving] = useState(false)

  // Carregar filtros salvos do localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        setSavedFilters(JSON.parse(stored))
      }
    } catch (error) {
      console.error('Erro ao carregar filtros salvos:', error)
    }
  }, [])

  // Salvar filtros no localStorage
  const saveToStorage = (filters: SavedFilter[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filters))
    } catch (error) {
      console.error('Erro ao salvar filtros:', error)
    }
  }

  const handleSaveFilter = async () => {
    const name = prompt('Nome do filtro:')
    if (!name) return

    setIsSaving(true)
    try {
      const newFilter: SavedFilter = {
        id: Date.now().toString(),
        name,
        filters: { ...currentFilters },
        isFavorite: false,
        createdAt: new Date().toISOString()
      }

      const updatedFilters = [...savedFilters, newFilter]
      setSavedFilters(updatedFilters)
      saveToStorage(updatedFilters)
    } finally {
      setIsSaving(false)
    }
  }

  const handleApplyFilter = (filter: SavedFilter) => {
    onApplyFilter(filter.filters)
  }

  const handleToggleFavorite = (filterId: string) => {
    const updatedFilters = savedFilters.map(filter =>
      filter.id === filterId 
        ? { ...filter, isFavorite: !filter.isFavorite }
        : filter
    )
    setSavedFilters(updatedFilters)
    saveToStorage(updatedFilters)
  }

  const handleDeleteFilter = (filterId: string) => {
    if (confirm('Tem certeza que deseja excluir este filtro?')) {
      const updatedFilters = savedFilters.filter(filter => filter.id !== filterId)
      setSavedFilters(updatedFilters)
      saveToStorage(updatedFilters)
    }
  }

  const favorites = savedFilters.filter(f => f.isFavorite)
  const regular = savedFilters.filter(f => !f.isFavorite)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn('flex items-center gap-2 h-8 px-3 text-xs font-medium', className)}
        >
          <Bookmark className="h-3 w-3" />
          Filtros Salvos
          {savedFilters.length > 0 && (
            <Badge variant="secondary" className="ml-1 h-4 px-1 text-xs">
              {savedFilters.length}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        {/* Salvar filtro atual */}
        <DropdownMenuItem onClick={handleSaveFilter} disabled={isSaving}>
          <Plus className="h-4 w-4 mr-2" />
          Salvar filtro atual
        </DropdownMenuItem>
        
        {savedFilters.length > 0 && <DropdownMenuSeparator />}
        
        {/* Favoritos */}
        {favorites.length > 0 && (
          <>
            <div className="px-2 py-1 text-xs font-medium text-muted-foreground">
              Favoritos
            </div>
            {favorites.map((filter) => (
              <DropdownMenuItem
                key={filter.id}
                onClick={() => handleApplyFilter(filter)}
                className="flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <Star className="h-3 w-3 text-yellow-500 fill-current" />
                  <span className="truncate">{filter.name}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleToggleFavorite(filter.id)
                    }}
                    className="h-6 w-6 p-0"
                  >
                    <Star className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDeleteFilter(filter.id)
                    }}
                    className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
          </>
        )}
        
        {/* Filtros regulares */}
        {regular.length > 0 && (
          <>
            <div className="px-2 py-1 text-xs font-medium text-muted-foreground">
              Outros
            </div>
            {regular.map((filter) => (
              <DropdownMenuItem
                key={filter.id}
                onClick={() => handleApplyFilter(filter)}
                className="flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <Filter className="h-3 w-3" />
                  <span className="truncate">{filter.name}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleToggleFavorite(filter.id)
                    }}
                    className="h-6 w-6 p-0"
                  >
                    <Star className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDeleteFilter(filter.id)
                    }}
                    className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </DropdownMenuItem>
            ))}
          </>
        )}
        
        {savedFilters.length === 0 && (
          <div className="px-2 py-4 text-center text-sm text-muted-foreground">
            Nenhum filtro salvo
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
