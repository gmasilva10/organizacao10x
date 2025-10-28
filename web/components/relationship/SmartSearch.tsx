'use client'

import React, { useState, useMemo } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Search, 
  X, 
  User, 
  MessageSquare, 
  Calendar,
  Filter
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface SearchSuggestion {
  id: string
  label: string
  type: 'student' | 'message' | 'date' | 'template'
  icon: React.ReactNode
}

interface SmartSearchProps {
  value: string
  onChange: (value: string) => void
  onClear: () => void
  suggestions?: SearchSuggestion[]
  placeholder?: string
  className?: string
}

export function SmartSearch({ 
  value, 
  onChange, 
  onClear, 
  suggestions = [],
  placeholder = "Buscar por aluno, mensagem ou data...",
  className 
}: SmartSearchProps) {
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [focusedIndex, setFocusedIndex] = useState(-1)

  const filteredSuggestions = useMemo(() => {
    if (!value || value.length < 2) return []
    
    return suggestions.filter(suggestion =>
      suggestion.label.toLowerCase().includes(value.toLowerCase())
    ).slice(0, 5)
  }, [value, suggestions])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || filteredSuggestions.length === 0) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setFocusedIndex(prev => 
          prev < filteredSuggestions.length - 1 ? prev + 1 : 0
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setFocusedIndex(prev => 
          prev > 0 ? prev - 1 : filteredSuggestions.length - 1
        )
        break
      case 'Enter':
        e.preventDefault()
        if (focusedIndex >= 0 && focusedIndex < filteredSuggestions.length) {
          const suggestion = filteredSuggestions[focusedIndex]
          onChange(suggestion.label)
          setShowSuggestions(false)
          setFocusedIndex(-1)
        }
        break
      case 'Escape':
        setShowSuggestions(false)
        setFocusedIndex(-1)
        break
    }
  }

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    onChange(suggestion.label)
    setShowSuggestions(false)
    setFocusedIndex(-1)
  }

  return (
    <div className={cn('relative', className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={value}
          onChange={(e) => {
            onChange(e.target.value)
            setShowSuggestions(true)
          }}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => {
            // Delay to allow clicking on suggestions
            setTimeout(() => setShowSuggestions(false), 150)
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="pl-10 pr-10 h-9"
        />
        {value && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClear}
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0"
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>

      {/* Sugestões */}
      {showSuggestions && filteredSuggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-border rounded-md shadow-lg z-50 max-h-60 overflow-y-auto">
          {filteredSuggestions.map((suggestion, index) => (
            <button
              key={suggestion.id}
              onClick={() => handleSuggestionClick(suggestion)}
              className={cn(
                'w-full px-3 py-2 text-left hover:bg-muted flex items-center gap-2 text-sm',
                index === focusedIndex && 'bg-muted'
              )}
            >
              {suggestion.icon}
              <span className="flex-1">{suggestion.label}</span>
              <Badge variant="outline" className="text-xs">
                {suggestion.type}
              </Badge>
            </button>
          ))}
        </div>
      )}

      {/* Dicas de busca */}
      {!value && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-muted/50 border border-border rounded-md p-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <User className="h-3 w-3" />
              Nome do aluno
            </span>
            <span className="flex items-center gap-1">
              <MessageSquare className="h-3 w-3" />
              Conteúdo da mensagem
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              Data (DD/MM/AAAA)
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
