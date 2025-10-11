import { useEffect, useRef, useState } from 'react'

/**
 * Hook de debounce otimizado com cancelamento
 * @param value Valor a ser debounced
 * @param delay Delay em ms (padrão: 300)
 * @returns Valor debounced
 */
export function useOptimizedDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)
  const timerRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    // Limpar timer anterior
    if (timerRef.current) {
      clearTimeout(timerRef.current)
    }

    // Setar novo timer
    timerRef.current = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    // Cleanup
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, [value, delay])

  return debouncedValue
}

