"use client"

import { cn } from "@/lib/utils"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted", className)}
      data-testid="skeleton"
      {...props}
    />
  )
}

// Skeletons específicos para diferentes componentes
export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-lg border bg-card p-6", className)}>
      <div className="space-y-4">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-8 w-1/4" />
      </div>
    </div>
  )
}

export function TableSkeleton({ 
  rows = 5, 
  columns = 4,
  className 
}: { 
  rows?: number
  columns?: number
  className?: string 
}) {
  return (
    <div className={cn("space-y-4", className)} data-testid="table-skeleton">
      {/* Header */}
      <div className="flex space-x-4">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} className="h-4 flex-1" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex space-x-4">
          {Array.from({ length: columns }).map((_, j) => (
            <Skeleton key={j} className="h-4 flex-1" />
          ))}
        </div>
      ))}
    </div>
  )
}

export function ListSkeleton({ 
  items = 5,
  className 
}: { 
  items?: number
  className?: string 
}) {
  return (
    <div className={cn("space-y-3", className)}>
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex items-center space-x-4">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function KanbanSkeleton({ 
  columns = 3,
  cardsPerColumn = 3,
  className 
}: { 
  columns?: number
  cardsPerColumn?: number
  className?: string 
}) {
  return (
    <div className={cn("flex space-x-4 overflow-x-auto", className)}>
      {Array.from({ length: columns }).map((_, colIndex) => (
        <div key={colIndex} className="flex-shrink-0 w-80 space-y-4">
          {/* Column header */}
          <div className="bg-gray-50 rounded-lg p-4">
            <Skeleton className="h-6 w-32" />
          </div>
          {/* Cards */}
          {Array.from({ length: cardsPerColumn }).map((_, cardIndex) => (
            <div key={cardIndex} className="bg-white rounded-lg border p-4 space-y-3">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
              <div className="flex justify-between items-center">
                <Skeleton className="h-6 w-16" />
                <Skeleton className="h-8 w-8 rounded" />
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}

export function DashboardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6", className)}>
      {Array.from({ length: 4 }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  )
}

export function EmptyState({ 
  title = "Nenhum item encontrado",
  description = "Não há dados para exibir no momento.",
  className 
}: { 
  title?: string
  description?: string
  className?: string 
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-12 text-center", className)} data-testid="empty-state">
      <div className="mx-auto h-12 w-12 text-muted-foreground">
        <svg
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      </div>
      <h3 className="mt-4 text-lg font-semibold text-foreground">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
    </div>
  )
}

export function ErrorState({ 
  title = "Erro ao carregar",
  description = "Ocorreu um erro ao carregar os dados. Tente novamente.",
  onRetry,
  className 
}: { 
  title?: string
  description?: string
  onRetry?: () => void
  className?: string 
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-12 text-center", className)} data-testid="error-state">
      <div className="mx-auto h-12 w-12 text-destructive">
        <svg
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
          />
        </svg>
      </div>
      <h3 className="mt-4 text-lg font-semibold text-foreground">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-4 px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary/90"
        >
          Tentar novamente
        </button>
      )}
    </div>
  )
}

export { Skeleton }
