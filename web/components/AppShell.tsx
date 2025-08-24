"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter, usePathname } from "next/navigation"
import { 
  LayoutDashboard,
  Users, 
  Package as PackageIcon, 
  KanbanSquare, 
  History, 
  Settings, 
  Shield, 
  Menu, 
  ChevronLeft, 
  ChevronDown,
  LogOut,
  User,
  Badge as BadgeIcon,
  MessageCircle
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { useTheme } from "@/lib/use-theme"

interface MenuItem {
  id: string
  title: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  disabled?: boolean
}

interface MenuGroup {
  id: string
  title: string
  items: MenuItem[]
}

const menuGroups: MenuGroup[] = [
  {
    id: "management",
    title: "Gestão",
    items: [
      {
        id: "dashboard",
        title: "Dashboard",
        href: "/app",
        icon: LayoutDashboard,
      },
      {
        id: "students",
        title: "Alunos",
        href: "/app/students",
        icon: Users
      },
      {
        id: "services", 
        title: "Serviços",
        href: "/app/services",
        icon: PackageIcon,
        disabled: true
      },
      {
        id: "relationship",
        title: "Relacionamento",
        href: "/app/relationship",
        icon: MessageCircle
      }
    ]
  },
  {
    id: "workflow",
    title: "Fluxo de Trabalho", 
    items: [
      {
        id: "onboarding",
        title: "Onboarding/Kanban",
        href: "/app/onboarding",
        icon: KanbanSquare
      },
      {
        id: "history",
        title: "Histórico",
        href: "/app/onboarding/history",
        icon: History
      }
    ]
  },
  {
    id: "admin",
    title: "Administração",
    items: [
      {
        id: "team-admin",
        title: "Team Admin", 
        href: "/app/team-admin",
        icon: Shield
      },
      {
        id: "settings",
        title: "Configurações",
        href: "/app/settings", 
        icon: Settings,
        disabled: true
      }
    ]
  }
]

// Função helper para obter todos os items
const getAllMenuItems = (): MenuItem[] => {
  return menuGroups.flatMap(group => group.items)
}

interface AppShellProps {
  children: React.ReactNode
  user?: {
    name?: string
    email?: string
    role?: string
  }
  activeOrgId?: string | null
}

export function AppShell({ children, user, activeOrgId }: AppShellProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mounted, setMounted] = useState(false)
  const { theme } = useTheme()
  const router = useRouter()
  const pathname = usePathname()
  const isDark = theme === "dark"
  
  useEffect(() => {
    setMounted(true)
    // Restaurar estado do sidebar do localStorage
    const saved = localStorage.getItem("pg.nav.collapsed")
    if (saved !== null) {
      setSidebarCollapsed(saved === '1')
    }
  }, [])

  const toggleSidebar = () => {
    const newState = !sidebarCollapsed
    setSidebarCollapsed(newState)
    
    // Persist state with proper error handling
    try {
      localStorage.setItem("pg.nav.collapsed", newState ? '1' : '0')
    } catch (error) {
      console.warn('Could not save sidebar state to localStorage:', error)
    }
    
    // Add haptic feedback if available
    if ('vibrate' in navigator) {
      navigator.vibrate(50)
    }
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/signout', { method: 'POST', credentials: 'include' })
      router.push('/')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  const logoSrc = mounted ? (isDark ? "/logo_branca.png" : "/logo_preta.png") : "/logo_preta.png"

  // Breadcrumb simples baseado na rota atual
  const getBreadcrumb = () => {
    const segments = pathname.split('/').filter(Boolean)
    if (segments.length === 0 || (segments.length === 1 && segments[0] === 'app')) {
      return "Dashboard"
    }
    
    const allItems = getAllMenuItems()
    const currentItem = allItems.find(item => 
      item.href === `/${segments.slice(-2).join('/')}` || 
      item.href === `/${segments.slice(-1)[0]}`
    )
    return currentItem?.title || "Página"
  }

  // Guards por role e org
  const role = (user?.role || "support").toLowerCase()
  const hasOrg = !!activeOrgId

  function isItemEnabled(itemId: string): { enabled: boolean; reason?: string } {
    if (!hasOrg) {
      // Sem organização: só Dashboard, Team Admin, Configurações habilitados
      const enabledNoOrg = new Set(["dashboard", "team-admin", "settings"])
      return { enabled: enabledNoOrg.has(itemId), reason: "Requer organização ativa" }
    }
    // Com org, aplicar matriz
    const matrix: Record<string, Record<string, boolean>> = {
      "admin": {
        "dashboard": true, "students": true, "services": true, "onboarding": true, "history": true, "team-admin": true, "settings": true,
      },
      "manager": {
        "dashboard": true, "students": true, "services": true, "onboarding": true, "history": true, "team-admin": false, "settings": true,
      },
      "trainer": {
        "dashboard": true, "students": false, "services": false, "onboarding": true, "history": true, "team-admin": false, "settings": false,
      },
      "support": {
        "dashboard": true, "students": false, "services": false, "onboarding": false, "history": true, "team-admin": false, "settings": false,
      },
    }
    const allowed = matrix[role as keyof typeof matrix] || matrix["support"]
    const enabled = !!allowed[itemId as keyof typeof allowed]
    return { enabled, reason: enabled ? undefined : "Sem permissão para acessar" }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Skip to content para a11y */}
      <a 
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 z-50 bg-primary text-primary-foreground px-4 py-2 rounded-md"
      >
        Pular para o conteúdo
      </a>

      {/* Header */}
      <header 
        className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
        role="banner"
        aria-label="Cabeçalho principal"
      >
        <div className="flex h-16 items-center gap-4 px-4 max-w-full overflow-hidden">
          {/* Toggle Sidebar */}
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleSidebar}
            aria-pressed={sidebarCollapsed}
            aria-label={sidebarCollapsed ? "Expandir menu de navegação" : "Recolher menu de navegação"}
            aria-expanded={!sidebarCollapsed}
            aria-controls="sidebar-navigation"
            title={sidebarCollapsed ? "Expandir menu" : "Recolher menu"}
            className="hover:bg-accent focus:ring-2 focus:ring-primary focus:ring-offset-2"
          >
            <Menu className="h-4 w-4" />
          </Button>

          {/* Logo/Branding */}
          <Link 
            href="/app" 
            className="flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-md px-1 py-1" 
            aria-label="Página inicial - Organização10x"
            title="Ir para a página inicial"
          >
            <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-blue-700 dark:from-blue-400 dark:to-blue-600 rounded-md flex items-center justify-center text-white font-bold text-sm shadow-sm">
              10x
            </div>
            <span className="font-bold text-lg">Organização10x</span>
          </Link>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Badge Ambiente (desenvolvimento) */}
          <div className="flex items-center gap-2 px-2.5 py-1 bg-gradient-to-r from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30 text-amber-800 dark:text-amber-200 rounded-full text-xs font-medium border border-amber-200 dark:border-amber-800">
            <BadgeIcon className="h-3 w-3" />
            <span>DEV</span>
          </div>

          {/* User Menu */}
          <div className="flex items-center gap-2">
            <ThemeToggle />
            
            {/* User Menu */}
            {user && (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 text-sm">
                  <div className="flex flex-col items-end">
                    <span className="font-medium">{user.name || user.email}</span>
                    {user.role && (
                      <span className="text-xs text-muted-foreground capitalize bg-muted px-1.5 py-0.5 rounded">
                        {user.role}
                      </span>
                    )}
                  </div>
                  <div className="h-8 w-8 bg-gradient-to-br from-blue-500/20 to-blue-700/20 border border-blue-200 dark:border-blue-800 rounded-full flex items-center justify-center">
                    <User className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
              </div>
            )}

            {/* Logout */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              aria-label="Sair da conta"
              className="hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 transition-colors focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
              title="Sair da conta"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Layout Principal */}
      <div className="flex">
        {/* Sidebar */}
        <aside 
          id="sidebar-navigation"
          className={`sticky top-16 h-[calc(100vh-4rem)] border-r bg-background/50 backdrop-blur-sm transition-all duration-300 ease-in-out overflow-hidden ${
            sidebarCollapsed ? 'w-16' : 'w-64'
          }`}
          aria-label="Menu de navegação principal"
          aria-expanded={!sidebarCollapsed}
          role="navigation"
          style={{ 
            willChange: sidebarCollapsed ? 'width' : 'auto',
            transform: 'translateZ(0)' // Force GPU acceleration
          }}
        >
          <nav className="flex flex-col gap-4 p-3" aria-label="Menu de navegação">
            {menuGroups.map((group) => (
              <div key={group.id} className="flex flex-col gap-1">
                {/* Group Title */}
                {!sidebarCollapsed && (
                  <div className="px-3 py-1 opacity-0 animate-fadeIn" style={{ animationDelay: '150ms', animationFillMode: 'forwards' }}>
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      {group.title}
                    </h3>
                  </div>
                )}
                
                {/* Group Items */}
                <div className="flex flex-col gap-1">
                  {group.items.map((item) => {
                    const guard = isItemEnabled(item.id)
                    const isActive = pathname === item.href || 
                                  (pathname.startsWith(item.href) && item.href !== '/app')
                    
                    const linkContent = (
                      <>
                        <div className="relative">
                          {/* Barra accent 3px à esquerda no ativo */}
                          {isActive && !sidebarCollapsed && (
                            <span className="absolute left-[-12px] top-0 h-full w-[3px] rounded-full bg-primary transition-all duration-150" aria-hidden="true" />
                          )}
                          <item.icon className={`h-5 w-5 shrink-0 transition-all duration-200 ${
                            isActive 
                              ? 'text-primary transform scale-110' 
                              : 'text-muted-foreground group-hover:text-foreground group-hover:scale-105'
                          }`} />
                          {isActive && (
                            <div className="absolute -inset-1 bg-primary/20 rounded-full animate-pulse" />
                          )}
                        </div>
                        {!sidebarCollapsed && (
                          <span className={`truncate text-sm font-medium transition-all duration-200 opacity-0 animate-slideInLeft ${
                            isActive 
                              ? 'text-primary' 
                              : 'text-muted-foreground group-hover:text-foreground'
                          }`} style={{ animationDelay: '100ms', animationFillMode: 'forwards' }}>
                            {item.title}
                          </span>
                        )}
                      </>
                    )

                    if (item.disabled || !guard.enabled) {
                      return (
                        <div
                          key={item.id}
                          className={`group flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 opacity-50 cursor-not-allowed ${
                            sidebarCollapsed ? 'justify-center' : ''
                          }`}
                          aria-disabled="true"
                          title={sidebarCollapsed ? (guard.enabled ? `${item.title} (Em breve)` : "Criar organização") : (guard.enabled ? "Em breve" : (guard.reason || "Criar organização"))}
                        >
                          {linkContent}
                        </div>
                      )
                    }

                    const linkNode = (
                      <Link
                        key={item.id}
                        href={item.href}
                        aria-current={isActive ? "page" : undefined}
                        className={`relative group flex items-center gap-3 px-[14px] py-[12px] h-[44px] rounded-[10px] transition-all duration-300 ease-out hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 active:scale-95 ${
                          sidebarCollapsed ? 'justify-center' : ''
                        } ${
                          isActive 
                            ? 'bg-primary/10 border border-primary/20 shadow-sm transform scale-[1.01]' 
                            : 'hover:bg-accent/10 border border-transparent'
                        }`}
                        title={sidebarCollapsed ? item.title : undefined}
                        style={{ willChange: 'transform, opacity' }}
                      >
                        {linkContent}
                      </Link>
                    )

                    // Tooltips somente quando colapsado
                    return sidebarCollapsed ? (
                      <Tooltip key={item.id} delayDuration={150}>
                        <TooltipTrigger asChild>
                          {linkNode}
                        </TooltipTrigger>
                        <TooltipContent sideOffset={8}>{item.title}</TooltipContent>
                      </Tooltip>
                    ) : (
                      linkNode
                    )
                  })}
                </div>
              </div>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-hidden">
          {/* Breadcrumb */}
          <div className="border-b bg-background/50 px-6 py-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Link 
                href="/app" 
                className="hover:text-foreground focus:text-foreground focus:outline-none"
              >
                Dashboard
              </Link>
              {pathname !== '/app' && (
                <>
                  <ChevronRight className="h-3 w-3" />
                  <span className="text-foreground font-medium">{getBreadcrumb()}</span>
                </>
              )}
            </div>
          </div>

          {/* Page Content */}
          <div id="main-content" className="p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}

// Helper component para ícone ChevronRight usado no breadcrumb
function ChevronRight({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m9 18 6-6-6-6" />
    </svg>
  )
}
