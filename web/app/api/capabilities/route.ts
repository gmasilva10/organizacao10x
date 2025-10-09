import { NextResponse } from "next/server"

export type PlanName = "basic" | "enterprise"
export type RoleName = "admin" | "manager" | "trainer" | "seller" | "support"

export type Capabilities = {
  orgId: string
  plan: PlanName
  role: RoleName
  limits: { students: number; trainers: number }
  features: {
    onboarding: { kanban: boolean }
    payments: { manual: boolean }
    reports: { advanced: boolean }
    services: { onboarding: boolean }
    kanban: { card_minimal: boolean }
    occurrences: boolean
  }
}

// API de capabilities com cache
export async function GET(request: Request) {
  console.log('🚀 API Capabilities chamada!')
  
  // DEBUG: Sempre retornar capabilities hardcoded
  const caps: Capabilities = {
    orgId: "test-org-id",
    plan: "enterprise",
    role: "admin",
    limits: {
      students: 10000,
      trainers: 100,
    },
    features: {
      onboarding: { kanban: true },
      payments: { manual: true },
      reports: { advanced: true },
      // v0.3.1-dev: Novas features SEMPRE habilitadas - HARDCODE
      services: { onboarding: true }, // SEMPRE TRUE
      kanban: { card_minimal: true }, // SEMPRE TRUE
      occurrences: true, // SEMPRE TRUE - MÓDULO OCORRÊNCIAS
    },
  }
  
  console.log('✅ Retornando capabilities:', caps)
  
  // Adicionar cache para melhorar performance
  return NextResponse.json(caps, {
    headers: {
      'Cache-Control': 'public, max-age=300, stale-while-revalidate=600', // 5min cache, 10min stale
      'X-Cache-Hit': 'false'
    }
  })
}



