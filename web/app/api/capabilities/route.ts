import { NextResponse } from "next/server"

export type PlanName = "basic" | "enterprise"
export type RoleName = "admin" | "manager" | "trainer" | "seller" | "support"

export type Capabilities = {
  tenantId: string
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

// DEBUG: API simplificada para testar
export async function GET(request: Request) {
  console.log('🚀 API Capabilities chamada!')
  
  // DEBUG: Sempre retornar capabilities hardcoded
  const caps: Capabilities = {
    tenantId: "test-tenant-id",
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
  return NextResponse.json(caps)
}


