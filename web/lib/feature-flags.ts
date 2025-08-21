"use client"

import { useEffect, useState } from "react"

export type RoleName = "admin" | "manager" | "trainer" | "seller" | "support"
export type PlanName = "basic" | "enterprise"

export type Capabilities = {
  tenantId: string
  plan: PlanName
  role: RoleName
  limits: { students: number; trainers: number }
  features: {
    onboarding: { kanban: boolean }
    payments: { manual: boolean }
    reports: { advanced: boolean }
  }
}

async function fetchCaps(signal?: AbortSignal): Promise<Capabilities | null> {
  try {
    const res = await fetch("/api/capabilities", { cache: "no-store", signal })
    if (!res.ok) return null
    return (await res.json()) as Capabilities
  } catch {
    return null
  }
}

export function useCapabilities() {
  const [caps, setCaps] = useState<Capabilities | null>(null)
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    const ctrl = new AbortController()
    fetchCaps(ctrl.signal).then((data) => {
      setCaps(data)
      setLoading(false)
    })
    return () => ctrl.abort()
  }, [])
  return { caps, loading }
}

export type FeatureKey = "features.onboarding.kanban" | "features.payments.manual" | "features.reports.advanced"
export type LimitKey = "limits.students" | "limits.trainers"

export function useFeature(key: FeatureKey) {
  const { caps, loading } = useCapabilities()
  if (loading || !caps) return { enabled: false, loading: true }
  switch (key) {
    case "features.onboarding.kanban":
      return { enabled: Boolean(caps.features.onboarding.kanban), loading: false }
    case "features.payments.manual":
      return { enabled: Boolean(caps.features.payments.manual), loading: false }
    case "features.reports.advanced":
      return { enabled: Boolean(caps.features.reports.advanced), loading: false }
    default:
      return { enabled: false, loading: false }
  }
}

export function useLimit(key: LimitKey) {
  const { caps, loading } = useCapabilities()
  if (loading || !caps) return { limit: undefined as number | undefined, loading: true }
  return {
    limit: key === "limits.students" ? caps.limits.students : caps.limits.trainers,
    loading: false,
  }
}


