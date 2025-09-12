"use client"

import { ReactNode } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2 } from "lucide-react"

interface CompactHeaderProps {
  // Breadcrumb
  breadcrumbItems: Array<{
    label: string
    href?: string
  }>
  
  // Título principal
  title: string
  subtitle?: string
  status?: {
    label: string
    variant: 'default' | 'secondary' | 'destructive' | 'outline'
    className?: string
  }
  
  // Ações
  actions: {
    cancel: {
      label: string
      onClick: () => void
      disabled?: boolean
    }
    primary: {
      label: string
      onClick: () => void
      disabled?: boolean
      loading?: boolean
      icon?: ReactNode
    }
  }
  
  // Debug info (opcional)
  debugInfo?: string
}

export default function CompactHeader({
  breadcrumbItems,
  title,
  subtitle,
  status,
  actions,
  debugInfo
}: CompactHeaderProps) {
  return (
    <div className="flex items-center justify-between py-2 md:py-1">
      {/* Esquerda: Breadcrumb + Título + Status */}
      <div className="flex-1 min-w-0">
        {/* Breadcrumb */}
        <nav className="flex items-center space-x-2 text-sm text-muted-foreground mb-1">
          {breadcrumbItems.map((item, index) => (
            <div key={index} className="flex items-center space-x-2">
              {index > 0 && <span>/</span>}
              {item.href ? (
                <Link href={item.href} className="hover:text-foreground transition-colors">
                  {item.label}
                </Link>
              ) : (
                <span className="text-foreground font-medium">{item.label}</span>
              )}
            </div>
          ))}
        </nav>
        
        {/* Título + Status */}
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-semibold truncate">{title}</h1>
          {subtitle && (
            <span className="text-sm text-muted-foreground truncate">{subtitle}</span>
          )}
          {status && (
            <Badge variant={status.variant} className={status.className}>
              {status.label}
            </Badge>
          )}
          {debugInfo && (
            <span className="text-[10px] text-muted-foreground">{debugInfo}</span>
          )}
        </div>
      </div>

      {/* Direita: Ações */}
      <div className="flex gap-2">
        <Button 
          variant="outline" 
          className="border-destructive text-destructive hover:bg-destructive/10"
          onClick={actions.cancel.onClick}
          disabled={actions.cancel.disabled}
        >
          {actions.cancel.label}
        </Button>
        <Button 
          disabled={actions.primary.disabled || actions.primary.loading}
          onClick={actions.primary.onClick}
        >
          {actions.primary.loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              {actions.primary.icon}
              {actions.primary.label}
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
