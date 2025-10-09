"use client"

import Image from "next/image"
import Link from "next/link"
import type { Organization } from "@/types/organization"

interface OrganizationLogoProps {
  organization?: Organization | null
  showText?: boolean
  size?: "sm" | "md" | "lg" | "xl"
  href?: string
  className?: string
  ariaLabel?: string
}

export function OrganizationLogo({ 
  organization, 
  showText = true, 
  size = "md",
  href = "/app",
  className = "",
  ariaLabel = "Logo da organização"
}: OrganizationLogoProps) {
  // Tamanhos configuráveis
  const sizeConfig = {
    sm: { container: "w-6 h-6", text: "text-sm", icon: 24 },
    md: { container: "w-7 h-7", text: "text-lg", icon: 28 },
    lg: { container: "w-8 h-8", text: "text-xl", icon: 32 },
    xl: { container: "w-12 h-12", text: "text-xl", icon: 48 }
  }

  const config = sizeConfig[size]

  // Conteúdo da logo
  const logoContent = (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Logo da organização ou fallback */}
      <div className={`${config.container} rounded-md flex items-center justify-center shadow-sm overflow-hidden`}>
        {organization && (organization as unknown as Organization).logo_url ? (
          <Image
            src={(organization as unknown as Organization).logo_url!}
            alt="Logo da organização"
            width={config.icon}
            height={config.icon}
            className="object-contain w-full h-full"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-blue-500 to-blue-700 dark:from-blue-400 dark:to-blue-600 rounded-md flex items-center justify-center text-white font-bold text-sm">
            10x
          </div>
        )}
      </div>
      {showText && (
        <span className={`font-bold ${config.text}`}>
          Organização10x
        </span>
      )}
    </div>
  )

  // Se tem href, envolve com Link
  if (href) {
    return (
      <Link 
        href={href}
        className="focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-md px-1 py-1" 
        aria-label={ariaLabel}
        title="Ir para a página inicial"
      >
        {logoContent}
      </Link>
    )
  }

  // Caso contrário, retorna apenas o conteúdo
  return logoContent
}
