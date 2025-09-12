"use client"

import { lazy, ComponentType } from 'react'

/**
 * Hook otimizado para ícones com tree shaking
 * GATE 10.4.3 - Performance: reduzir bundle size
 */
export function useIcons() {
  // Lazy imports para ícones mais pesados
  const Edit = lazy(() => import('lucide-react').then(module => ({ default: module.Edit })))
  const Paperclip = lazy(() => import('lucide-react').then(module => ({ default: module.Paperclip })))
  const Settings = lazy(() => import('lucide-react').then(module => ({ default: module.Settings })))
  const Search = lazy(() => import('lucide-react').then(module => ({ default: module.Search })))
  const Plus = lazy(() => import('lucide-react').then(module => ({ default: module.Plus })))
  const Grid3X3 = lazy(() => import('lucide-react').then(module => ({ default: module.Grid3X3 })))
  const List = lazy(() => import('lucide-react').then(module => ({ default: module.List })))
  const User = lazy(() => import('lucide-react').then(module => ({ default: module.User })))
  const Mail = lazy(() => import('lucide-react').then(module => ({ default: module.Mail })))
  const Phone = lazy(() => import('lucide-react').then(module => ({ default: module.Phone })))
  const Calendar = lazy(() => import('lucide-react').then(module => ({ default: module.Calendar })))
  const ArrowLeft = lazy(() => import('lucide-react').then(module => ({ default: module.ArrowLeft })))
  const Save = lazy(() => import('lucide-react').then(module => ({ default: module.Save })))
  const AlertTriangle = lazy(() => import('lucide-react').then(module => ({ default: module.AlertTriangle })))
  const Loader2 = lazy(() => import('lucide-react').then(module => ({ default: module.Loader2 })))
  const ChevronDown = lazy(() => import('lucide-react').then(module => ({ default: module.Chevrondown })))
  const FileText = lazy(() => import('lucide-react').then(module => ({ default: module.FileText })))
  const Target = lazy(() => import('lucide-react').then(module => ({ default: module.Target })))
  const Dumbbell = lazy(() => import('lucide-react').then(module => ({ default: module.Dumbbell })))
  const Eye = lazy(() => import('lucide-react').then(module => ({ default: module.Eye })))
  const Home = lazy(() => import('lucide-react').then(module => ({ default: module.Home })))
  const Users = lazy(() => import('lucide-react').then(module => ({ default: module.Users })))
  const Shield = lazy(() => import('lucide-react').then(module => ({ default: module.Shield })))
  const BarChart3 = lazy(() => import('lucide-react').then(module => ({ default: module.BarChart3 })))
  const MessageSquare = lazy(() => import('lucide-react').then(module => ({ default: module.MessageSquare })))
  const ClipboardList = lazy(() => import('lucide-react').then(module => ({ default: module.ClipboardList })))
  const Package = lazy(() => import('lucide-react').then(module => ({ default: module.Package })))
  const Settings2 = lazy(() => import('lucide-react').then(module => ({ default: module.Settings2 })))

  return {
    Edit,
    Paperclip,
    Settings,
    Search,
    Plus,
    Grid3X3,
    List,
    User,
    Mail,
    Phone,
    Calendar,
    ArrowLeft,
    Save,
    AlertTriangle,
    Loader2,
    ChevronDown,
    FileText,
    Target,
    Dumbbell,
    Eye,
    Home,
    Users,
    Shield,
    BarChart3,
    MessageSquare,
    ClipboardList,
    Package,
    Settings2,
  }
}

/**
 * Hook para ícones críticos (carregamento imediato)
 * Usar apenas para ícones essenciais da UI
 */
export function useCriticalIcons() {
  // Import direto para ícones críticos
  const { 
    Edit, 
    Paperclip, 
    Settings, 
    Search, 
    Plus,
    User,
    Mail,
    Phone,
    Calendar
  } = useIcons()

  return {
    Edit,
    Paperclip,
    Settings,
    Search,
    Plus,
    User,
    Mail,
    Phone,
    Calendar,
  }
}
