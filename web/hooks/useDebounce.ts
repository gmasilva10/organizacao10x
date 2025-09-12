"use client"

import { useState, useEffect } from 'react'

/**
 * Hook de debounce para otimizar buscas
 * GATE 10.4.3 - Performance: busca com debounce ≥ 250ms
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

/**
 * Hook específico para busca de alunos
 * Debounce de 250ms para preservar último resultado
 */
export function useStudentSearch(initialValue: string = '') {
  const [searchTerm, setSearchTerm] = useState(initialValue)
  const debouncedSearchTerm = useDebounce(searchTerm, 250)

  return {
    searchTerm,
    setSearchTerm,
    debouncedSearchTerm,
  }
}
