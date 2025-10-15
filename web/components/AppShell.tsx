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
  LogOut,
  User,
  Badge as BadgeIcon,
  MessageCircle,
  ChevronDown,
  ClipboardList,
  DollarSign
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"
import { useOrganization } from "@/hooks/useOrganization"
import type { Organization } from "@/types/organization"
import { OrganizationLogo } from "@/components/OrganizationLogo"
// import { useTheme } from "@/lib/use-theme"

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
        icon: PackageIcon
      },
    ]
  },
  {
    id: "workflow",
    title: "Fluxo de Trabalho", 
    items: [
      {
        id: "onboarding",
        title: "Onboarding",
        href: "/app/onboarding",
        icon: KanbanSquare
      },
      // Removido: Histórico
      {
        id: "relationship",
        title: "Relacionamento",
        href: "/app/relationship",
        icon: MessageCircle
      },
      {
        id: "financial",
        title: "Financeiro",
        href: "/app/financial",
        icon: DollarSign
      },
      {
        id: "occurrences-management",
        title: "Gestão de Ocorrências",
        href: "/app/workflow/occurrences",
        icon: ClipboardList
      }
    ]
  },
  {
    id: "admin",
    title: "Administração",
    items: [
      {
        id: "team",
        title: "Equipe", 
        href: "/app/team",
        icon: Shield
      },
      {
        id: "settings",
        title: "Configurações",
        href: "/app/settings", 
        icon: Settings
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
    avatar_url?: string | null
  }
  activeOrgId?: string | null
}

export function AppShell({ children, user, activeOrgId }: AppShellProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const { organization } = useOrganization()
  // tema não utilizado diretamente
  
  useEffect(() => {
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
      await fetch('/api/auth/signout', { method: 'POST', credentials: 'include', cache: 'no-store' })
    } catch {}
    router.push('/')
  }

  // logoSrc removido (não utilizado)

  // Guards por role e org
  const role = (user?.role || "support").toLowerCase()
  const hasOrg = !!activeOrgId

  // Verificar se usuário tem acesso às configurações
  const hasSettingsAccess = ["admin", "manager"].includes(role)

  function isItemEnabled(itemId: string): { enabled: boolean; reason?: string } {
    // Política atual: nenhum item do menu deve ser bloqueado por ausência de organização ativa.
    // O acesso a funcionalidades premium é controlado por limites de uso, não por ocultar menus.
    if (!hasOrg) {
      return { enabled: true }
    }
    
    // P1-01: Menu Equipe sempre visível para todos os planos
    if (itemId === 'team-management') {
      return { enabled: true, reason: undefined }
    }
    
    // P1-02: Menu Configurações sempre visível para todos os planos
    if (itemId === 'settings') {
      return { enabled: true, reason: undefined }
    }
    
    // Política atual: menu sempre visível para todos os perfis.
    return { enabled: true }
  }

  // Calcular o item mais específico que corresponde à rota para evitar múltiplos "ativos"
  const allItemsForActive = getAllMenuItems()
  const longestActiveHrefLen = allItemsForActive.reduce((best, it) => {
    if (pathname === it.href) return Math.max(best, it.href.length)
    if (pathname.startsWith(`${it.href}/`)) return Math.max(best, it.href.length)
    return best
  }, 0)

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
          <OrganizationLogo 
            organization={organization}
            showText={true}
            size="md"
            href="/app"
            ariaLabel="Página inicial - Organização10x"
          />

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
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    className="flex items-center gap-2 px-3 py-2 h-auto hover:bg-accent focus:ring-2 focus:ring-primary focus:ring-offset-2"
                    aria-label="Menu do usuário"
                  >
                    <div className="flex items-center gap-2 text-sm">
                      <div className="flex flex-col items-end">
                        <span className="font-medium text-foreground">{user.name || user.email}</span>
                        {user.role && (
                          <span className="text-xs text-muted-foreground capitalize bg-muted px-1.5 py-0.5 rounded">
                            {user.role}
                          </span>
                        )}
                      </div>
                      <div className="h-8 w-8 rounded-full overflow-hidden bg-gradient-to-br from-blue-500/20 to-blue-700/20 border border-blue-200 dark:border-blue-800 flex items-center justify-center">
                        {user.avatar_url ? (
                          <img 
                            src={user.avatar_url} 
                            alt="Avatar" 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <User className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        )}
                      </div>
                    </div>
                    <ChevronDown className="h-3 w-3 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user.name || "Usuário"}</p>
                      <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link 
                      href="/app/profile" 
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <User className="h-4 w-4" />
                      Meu Perfil
                    </Link>
                  </DropdownMenuItem>
                  {hasSettingsAccess && (
                    <DropdownMenuItem asChild>
                      <Link 
                        href="/app/settings" 
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <Settings className="h-4 w-4" />
                        Configurações
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={handleLogout}
                    className="flex items-center gap-2 cursor-pointer text-red-600 dark:text-red-400 focus:bg-red-50 dark:focus:bg-red-900/20"
                  >
                    <LogOut className="h-4 w-4" />
                    Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </header>

      {/* Layout Principal */}
      <div className="flex">
        {/* Sidebar */}
        <aside 
          id="sidebar-navigation"
          className={`sticky top-16 h-[calc(100vh-4rem)] border-r bg-background/50 backdrop-blur-sm transition-all duration-300 ease-in-out overflow-hidden flex flex-col ${
            sidebarCollapsed ? 'w-16' : 'w-64'
          }`}
          aria-label="Menu de navegação principal"
          // aria-expanded não é suportado em role=navigation
          role="navigation"
          style={{ 
            willChange: sidebarCollapsed ? 'width' : 'auto',
            transform: 'translateZ(0)' // Force GPU acceleration
          }}
        >
          {/* Navigation Menu */}
          <nav className="flex-1 overflow-y-auto p-3" aria-label="Menu de navegação">
            {menuGroups.map((group) => (
              <div key={group.id} className="flex flex-col gap-1">
                {/* Group Title */}
                {!sidebarCollapsed && (
                  <div className="px-3 pt-3 opacity-0 animate-fadeIn" style={{ animationDelay: '150ms', animationFillMode: 'forwards' }}>
                    <div className="rounded-md bg-muted/50 px-2 py-1 ring-1 ring-border">
                      <h3 className="text-[11px] font-semibold uppercase tracking-wide text-foreground/70">
                        {group.title}
                      </h3>
                    </div>
                  </div>
                )}
                
                {/* Group Items */}
                <div className="flex flex-col gap-1">
                  {group.items.map((item) => {
                    const guard = isItemEnabled(item.id)
                    const isActive = (pathname === item.href) ||
                      (pathname.startsWith(`${item.href}/`) && item.href.length === longestActiveHrefLen)
                    
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

          {/* Footer com Logo do Cliente */}
          <div className="border-t bg-background/30 backdrop-blur-sm p-3">
            <div className={`flex justify-center ${sidebarCollapsed ? '' : 'px-2'}`}>
              <OrganizationLogo 
                organization={organization}
                showText={false}
                size="xxl"
                href="/app"
                className="transition-all duration-300"
                ariaLabel="Logo do cliente no rodapé"
              />
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-hidden">
          {/* Page Content */}
          <div id="main-content" className="p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
