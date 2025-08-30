import { resolveRequestContext } from "./context"
import { NextRequest } from "next/server"
import { can } from "./rbac"

export async function withRBAC(requiredPerms: Array<Parameters<typeof can>[1]>, request: NextRequest) {
  const ctx = await resolveRequestContext(request as unknown as Request)
  if (!ctx) return { allowed: false, reason: 'unauthenticated' as const }
  const role = ctx.role
  const hasAll = requiredPerms.every((p) => can(role, p))
  return { allowed: hasAll, reason: hasAll ? 'ok' as const : 'forbidden' as const, role, tenantId: ctx.tenantId }
}


