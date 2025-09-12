"use client"

import { Suspense, lazy, ComponentType } from 'react'
import { Loader2 } from 'lucide-react'

interface OptimizedIconProps {
  name: string
  className?: string
  size?: number
  fallback?: ComponentType
}

/**
 * Componente otimizado para ícones com lazy loading
 * GATE 10.4.3 - Performance: reduzir bundle size
 */
export default function OptimizedIcon({ 
  name, 
  className = "h-4 w-4", 
  size,
  fallback: Fallback = Loader2 
}: OptimizedIconProps) {
  // Lazy import do ícone específico
  const IconComponent = lazy(() => 
    import('lucide-react').then(module => ({
      default: module[name as keyof typeof module] as ComponentType<any>
    }))
  )

  return (
    <Suspense fallback={<Fallback className={className} size={size} />}>
      <IconComponent className={className} size={size} />
    </Suspense>
  )
}

/**
 * Hook para ícones otimizados
 * Usar quando precisar de múltiplos ícones
 */
export function useOptimizedIcons() {
  const createIcon = (iconName: string) => 
    lazy(() => 
      import('lucide-react').then(module => ({
        default: module[iconName as keyof typeof module] as ComponentType<any>
      }))
    )

  return {
    createIcon,
    // Ícones mais usados
    Edit: createIcon('Edit'),
    Paperclip: createIcon('Paperclip'),
    Settings: createIcon('Settings'),
    Search: createIcon('Search'),
    Plus: createIcon('Plus'),
    User: createIcon('User'),
    Mail: createIcon('Mail'),
    Phone: createIcon('Phone'),
    Calendar: createIcon('Calendar'),
    ArrowLeft: createIcon('ArrowLeft'),
    Save: createIcon('Save'),
    AlertTriangle: createIcon('AlertTriangle'),
    Loader2: createIcon('Loader2'),
    ChevronDown: createIcon('ChevronDown'),
    FileText: createIcon('FileText'),
    Target: createIcon('Target'),
    Dumbbell: createIcon('Dumbbell'),
    Eye: createIcon('Eye'),
    Home: createIcon('Home'),
    Users: createIcon('Users'),
    Shield: createIcon('Shield'),
    BarChart3: createIcon('BarChart3'),
    MessageSquare: createIcon('MessageSquare'),
    ClipboardList: createIcon('ClipboardList'),
    Package: createIcon('Package'),
    Settings2: createIcon('Settings2'),
  }
}
