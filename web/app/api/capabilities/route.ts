import { NextResponse } from "next/server"
import { resolveRequestContext } from "@/server/context"
import { fetchPlanPolicyByTenant } from "@/server/plan-policy"

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
  }
}

// buscar policy via módulo compartilhado

export async function GET(request: Request) {
  const ctx = await resolveRequestContext(request)

  const configured = Boolean(process.env.SUPABASE_URL) && Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY)
  if (!configured) {
    return NextResponse.json({ error: "Supabase não configurado" }, { status: 503 })
  }
  if (!ctx) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
  }

  const policy = await fetchPlanPolicyByTenant(ctx.tenantId)
  if (!policy) return NextResponse.json({ error: "Policy não encontrada" }, { status: 404 })

  const caps: Capabilities = {
    tenantId: ctx.tenantId,
    plan: policy.name as PlanName,
    role: ctx.role,
    limits: {
      students: Number(policy.limits?.students ?? 0),
      trainers: Number(policy.limits?.trainers ?? 0),
    },
    features: {
      onboarding: { kanban: Boolean(policy.features?.onboarding?.kanban) },
      payments: { manual: Boolean(policy.features?.payments?.manual) },
      reports: { advanced: Boolean(policy.features?.reports?.advanced) },
    },
  }
  return NextResponse.json(caps)
}


