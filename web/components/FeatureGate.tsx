"use client"

import { ReactNode } from "react"
import { useFeature } from "@/lib/feature-flags"

type Props = {
  feature: "features.onboarding.kanban" | "features.payments.manual" | "features.reports.advanced"
  children: ReactNode
  fallback?: ReactNode
}

export function FeatureGate({ feature, children, fallback }: Props) {
  const { enabled, loading } = useFeature(feature)
  if (process.env.NODE_ENV === 'production' && feature === 'features.onboarding.kanban') {
    // Bloquear alias/feature em produção se necessário (desabilita render)
    return <>{fallback ?? null}</>
  }
  if (loading) return null
  if (!enabled) return <>{fallback ?? null}</>
  return <>{children}</>
}


