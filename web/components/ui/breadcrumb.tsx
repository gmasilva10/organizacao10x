import * as React from "react"
import Link from "next/link"
import { ChevronRight, Home } from "lucide-react"
import { cn } from "@/lib/utils"

export interface BreadcrumbItem {
  label: string
  href?: string
  current?: boolean
}

export interface BreadcrumbProps {
  items: BreadcrumbItem[]
  className?: string
  showHome?: boolean
}

export function Breadcrumb({ items, className, showHome = true }: BreadcrumbProps) {
  const allItems = showHome
    ? [{ label: "Dashboard", href: "/app" }, ...items]
    : items

  return (
    <nav
      aria-label="Breadcrumb"
      className={cn("flex items-center space-x-1 text-sm text-muted-foreground", className)}
    >
      {allItems.map((item, index) => (
        <React.Fragment key={index}>
          {index > 0 && (
            <ChevronRight
              className="h-4 w-4 text-muted-foreground/50"
              aria-hidden="true"
            />
          )}
          {item.current || !item.href ? (
            <span
              className={cn(
                "font-medium",
                item.current ? "text-foreground" : "text-muted-foreground"
              )}
              aria-current={item.current ? "page" : undefined}
            >
              {index === 0 && showHome ? (
                <div className="flex items-center gap-1">
                  <Home className="h-3 w-3" />
                  <span className="sr-only">{item.label}</span>
                </div>
              ) : (
                item.label
              )}
            </span>
          ) : (
            <Link
              href={item.href}
              className="hover:text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-sm px-1"
            >
              {index === 0 && showHome ? (
                <div className="flex items-center gap-1">
                  <Home className="h-3 w-3" />
                  <span className="sr-only">{item.label}</span>
                </div>
              ) : (
                item.label
              )}
            </Link>
          )}
        </React.Fragment>
      ))}
    </nav>
  )
}
