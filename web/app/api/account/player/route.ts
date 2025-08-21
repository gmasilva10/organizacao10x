import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { createClient } = await import("@/utils/supabase/server")
    const supabase = await createClient()

    const { data: userData } = await supabase.auth.getUser()
    const user = userData?.user
    if (!user) {
      return NextResponse.json({ ok: false, code: "unauthorized" }, { status: 401 })
    }

    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ ok: false, code: "invalid_payload" }, { status: 400 })
    }

    const parsed = (body ?? {}) as { organization_name?: unknown; doc_id?: unknown; plan?: unknown }
    const orgName = String(parsed.organization_name ?? "").trim()
    const rawDoc = parsed.doc_id
    const docId = rawDoc == null || rawDoc === "" ? null : String(rawDoc)
    const plan = String(parsed.plan ?? "basic")

    if (orgName.length < 2) {
      return NextResponse.json({ ok: false, code: "invalid_payload" }, { status: 400 })
    }

    // Preferir service-role para operações de sistema (RLS pode bloquear inserts)
    const serviceUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
    if (!serviceUrl || !serviceKey) {
      console.error("/api/account/player", { step: "env_missing" })
      return NextResponse.json({ ok: false, code: "unexpected_error" }, { status: 500 })
    }

    // Tentar criar tenant via PostgREST (service-role) para evitar conflitos de RLS
    const orgResp = await fetch(`${serviceUrl}/rest/v1/tenants`, {
      method: "POST",
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify({ name: orgName, doc_id: docId, plan }),
      cache: "no-store",
    })
    let org: { id: string; name: string; plan: string } | null = null
    if (!orgResp.ok) {
      const errText = await orgResp.text().catch(() => "")
      const isConflict = orgResp.status === 409 || /duplicate/i.test(errText)
      if (!isConflict) {
        console.error("/api/account/player", { step: "create_tenant", status: orgResp.status, err: errText })
        return NextResponse.json({ ok: false, code: "unexpected_error" }, { status: 500 })
      }
      // Idempotência: se nome já existe, buscar e reutilizar
      const getResp = await fetch(`${serviceUrl}/rest/v1/tenants?name=eq.${encodeURIComponent(orgName)}&select=id,name,plan&limit=1`, {
        headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
        cache: "no-store",
      })
      const rows = await getResp.json().catch(() => [])
      if (!Array.isArray(rows) || rows.length === 0) {
        return NextResponse.json({ ok: false, code: "org_name_conflict" }, { status: 409 })
      }
      org = rows[0] as { id: string; name: string; plan: string }
    } else {
      const rows = await orgResp.json().catch(() => [])
      org = Array.isArray(rows) && rows.length > 0 ? rows[0] : null
    }

    if (!org) {
      console.error("/api/account/player", { step: "tenant_representation_missing" })
      return NextResponse.json({ ok: false, code: "unexpected_error" }, { status: 500 })
    }

    if (orgErr) {
      const msg = String(orgErr?.message || "")
      const code = String((orgErr as { code?: string } | null)?.code || "")
      if (code === "23505" || msg.toLowerCase().includes("duplicate")) {
        return NextResponse.json({ ok: false, code: "org_name_conflict" }, { status: 409 })
      }
      return NextResponse.json({ ok: false, code: "unexpected_error" }, { status: 500 })
    }

    const tenantId = org!.id as string

    // Criar membership admin para o usuário atual
    // membership via service-role para garantir permissão
    const memResp = await fetch(`${serviceUrl}/rest/v1/memberships`, {
      method: "POST",
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        "Content-Type": "application/json",
        Prefer: "resolution=merge-duplicates,return=representation",
      },
      body: JSON.stringify({ tenant_id: tenantId, user_id: user.id, role: "admin" }),
      cache: "no-store",
    })
    if (!memResp.ok) {
      const errText = await memResp.text().catch(() => "")
      console.error("/api/account/player", { step: "create_membership", status: memResp.status, err: errText })
      return NextResponse.json({ ok: false, code: "unexpected_error" }, { status: 500 })
    }
    const memRows = await memResp.json().catch(() => [])
    const membership = Array.isArray(memRows) && memRows.length > 0 ? memRows[0] : { user_id: user.id, role: "admin" }

    // Telemetria (best-effort; não quebra fluxo)
    ;(async () => {
      try {
        const url = process.env.SUPABASE_URL
        const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
        if (url && key) {
          const commonHeaders = {
            apikey: key,
            Authorization: `Bearer ${key}`,
            "Content-Type": "application/json",
            Prefer: "return=minimal",
          } as const
          await fetch(`${url}/rest/v1/events`, {
            method: "POST",
            headers: commonHeaders,
            body: JSON.stringify({
              tenant_id: tenantId,
              user_id: user.id,
              event_type: "account.created",
              payload: { type: "player", source: "app.ui", ts: new Date().toISOString() },
            }),
            cache: "no-store",
          })
          await fetch(`${url}/rest/v1/events`, {
            method: "POST",
            headers: commonHeaders,
            body: JSON.stringify({
              tenant_id: tenantId,
              user_id: user.id,
              event_type: "membership.created",
              payload: { org_id: tenantId, role: "admin", source: "app.ui", ts: new Date().toISOString() },
            }),
            cache: "no-store",
          })
        }
      } catch {}
    })()

    const res = NextResponse.json({
      ok: true,
      organization: { id: tenantId, name: org!.name, plan: org!.plan },
      membership: { user_id: membership!.user_id as string, organization_id: tenantId, role: membership!.role as string },
      active_org_id: tenantId,
    })
    // Define organização ativa (cookie leve; ACC04 usará)
    try {
      res.cookies.set("pg.active_org", tenantId, { path: "/", sameSite: "lax", httpOnly: true })
    } catch {}
    return res
  } catch (err) {
    console.error("/api/account/player unexpected_error", err)
    return NextResponse.json({ ok: false, code: "unexpected_error" }, { status: 500 })
  }
}


