'use client'

import { useState, useEffect, useRef } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Check, ChevronDown, X, Tag, Search, Heart, Bone, Zap, Target, Dumbbell } from 'lucide-react'
import { cn } from '@/lib/utils'
import { GUIDELINE_TAGS } from '@/lib/guidelines-constants'

interface TagSelectProps {
  value: string
  onValueChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  className?: string
}

interface TagItem {
  value: string
  label: string
  category: string
}

export function TagSelect({ value, onValueChange, placeholder = "Selecionar tag...", disabled, className }: TagSelectProps) {
  const [open, setOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedTag, setSelectedTag] = useState<TagItem | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const tags = GUIDELINE_TAGS

  useEffect(() => {
    if (value) {
      const tag = tags.find(t => t.value === value)
      setSelectedTag(tag || null)
    } else {
      setSelectedTag(null)
    }
  }, [value, tags])

  const filteredTags = tags.filter(tag => 
    tag.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tag.value.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tag.category.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'cardiovascular': return <Heart className="h-4 w-4 text-red-500" />
      case 'musculoesqueletica': return <Bone className="h-4 w-4 text-orange-500" />
      case 'metabolica': return <Zap className="h-4 w-4 text-yellow-500" />
      case 'objetivo': return <Target className="h-4 w-4 text-green-500" />
      case 'capacidade': return <Dumbbell className="h-4 w-4 text-blue-500" />
      default: return <Tag className="h-4 w-4 text-gray-500" />
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
      case 'cardiovascular': return 'bg-red-50 border-red-200 text-red-900'
      case 'musculoesqueletica': return 'bg-orange-50 border-orange-200 text-orange-900'
      case 'metabolica': return 'bg-yellow-50 border-yellow-200 text-yellow-900'
      case 'objetivo': return 'bg-green-50 border-green-200 text-green-900'
      case 'capacidade': return 'bg-blue-50 border-blue-200 text-blue-900'
      default: return 'bg-gray-50 border-gray-200 text-gray-900'
    }
  }

  const handleSelect = (tag: TagItem) => {
    console.log('Tag selecionada:', tag) // Debug
    setSelectedTag(tag)
    onValueChange(tag.value)
    setOpen(false)
    setSearchTerm('')
  }

  const handleClear = () => {
    setSelectedTag(null)
    onValueChange('')
  }

  const groupedTags = filteredTags.reduce((acc, tag) => {
    if (!acc[tag.category]) {
      acc[tag.category] = []
    }
    acc[tag.category].push(tag)
    return acc
  }, {} as Record<string, TagItem[]>)

  return (
    <div className={cn("space-y-2", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between h-10 bg-white hover:bg-gray-50 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            disabled={disabled}
            data-testid="tag-select-trigger"
          >
            {selectedTag ? (
              <div className="flex items-center gap-2">
                {getCategoryIcon(selectedTag.category)}
                <span className="truncate font-medium">{selectedTag.label}</span>
                <Badge variant="outline" className="text-xs bg-gray-100">
                  {selectedTag.value}
                </Badge>
              </div>
            ) : (
              <span className="text-gray-500">{placeholder}</span>
            )}
            <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="max-h-72 p-0" align="start" style={{ width: 'var(--radix-popover-trigger-width)' }}>
          <Command role="listbox" data-testid="tag-select-list">
            <div className="flex items-center border-b px-3 py-2 bg-gray-50">
              <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
              <CommandInput
                placeholder="Buscar tag..."
                value={searchTerm}
                onValueChange={setSearchTerm}
                ref={inputRef}
                className="border-0 bg-transparent focus:ring-0"
              />
            </div>
            <CommandList className="max-h-64">
              <CommandEmpty className="py-6 text-center text-sm text-gray-500">
                Nenhuma tag encontrada.
              </CommandEmpty>
              {Object.entries(groupedTags).map(([category, categoryTags]) => (
                <CommandGroup key={category} heading={getCategoryLabel(category)}>
                  {categoryTags.map((tag) => (
                    <div
                      onClick={() => handleSelect(tag)}
                      className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 cursor-pointer w-full"
                      data-testid={`tag-option-${tag.value}`}
                    >
                      <CommandItem
                        key={tag.value}
                        value={tag.value}
                        onSelect={() => handleSelect(tag)}
                        className="flex items-center gap-3 px-0 py-0 w-full"
                        role="option"
                        style={{ pointerEvents: 'auto' }}
                      >
                      <Check
                        className={cn(
                          "h-4 w-4",
                          selectedTag?.value === tag.value ? "opacity-100" : "opacity-0"
                        )}
                      />
                      {getCategoryIcon(tag.category)}
                      <div className="flex-1">
                        <div className="font-medium text-sm">{tag.label}</div>
                        <div className="text-xs text-gray-500">{tag.value}</div>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {tag.value}
                      </Badge>
                    </CommandItem>
                    </div>
                  ))}
                </CommandGroup>
              ))}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {selectedTag && (
        <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg border">
          <div className="flex items-center gap-2 flex-1">
            {getCategoryIcon(selectedTag.category)}
            <div className="flex-1">
              <div className="font-medium text-sm">{selectedTag.label}</div>
              <div className="text-xs text-gray-500">{selectedTag.value}</div>
            </div>
            <Badge className={cn("text-xs", getCategoryColor(selectedTag.category))}>
              {getCategoryLabel(selectedTag.category)}
            </Badge>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="h-6 w-6 p-0 hover:bg-red-100 hover:text-red-600"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}
    </div>
  )
}