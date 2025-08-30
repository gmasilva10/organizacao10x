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
  if (loading) return null
  if (!enabled) return <>{fallback ?? null}</>
  return <>{children}</>
}


