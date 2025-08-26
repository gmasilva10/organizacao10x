type EventType =
  | "auth.login.success"
  | "auth.login.fail"
  | "rbac.denied"
  | "limit.hit"
  | "feature.used"
  | "account.created"
  | "membership.created"

async function postgrestInsert(table: string, row: Record<string, unknown>) {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
  if (!url || !key) return false
  const resp = await fetch(`${url}/rest/v1/${table}`, {
    method: "POST",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify(row),
    cache: "no-store",
  })
  return resp.ok
}

export async function logEvent(params: {
  tenantId: string
  userId: string
  eventType: EventType
  payload?: Record<string, unknown>
}) {
  const { tenantId, userId, eventType, payload } = params
  await postgrestInsert("events", {
    tenant_id: tenantId,
    user_id: userId,
    event_type: eventType,
    payload: payload ?? null,
  })
}

export async function writeAudit(params: {
  orgId: string
  actorId: string
  entityType: string
  entityId: string
  action: string
  payload?: Record<string, unknown>
}) {
  const { orgId, actorId, entityType, entityId, action, payload } = params
  await postgrestInsert("audit_log", {
    org_id: orgId,
    actor_id: actorId,
    entity_type: entityType,
    entity_id: entityId,
    action,
    payload: payload ?? {},
  })
}


