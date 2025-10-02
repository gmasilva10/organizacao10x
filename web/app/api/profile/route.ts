import { NextResponse } from "next/server"
import { resolveRequestContext } from "@/server/context"

// Forçar execução dinâmica para evitar problemas de renderização estática
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;


type Membership = { organization_id: string; organization_name: string; role: string }

export async function GET(request: Request) {
  try {
    const { createClient } = await import("@/utils/supabase/server")
    const supabase = await createClient()

    const { data: userData } = await supabase.auth.getUser()
    const user = userData?.user
    if (!user) {
      return NextResponse.json({ ok: false, code: "unauthorized" }, { status: 401 })
    }

    // Perfil básico (incluindo avatar_url)
    const { data: profile } = await supabase
      .from("profiles")
      .select("user_id, full_name, email, phone, avatar_url, updated_at")
      .eq("user_id", user.id)
      .maybeSingle()

    // Memberships com nome da organização (via service-role para confiabilidade)
    const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
    let memberships: Membership[] = []
    if (url && key) {
      const memResp = await fetch(`${url}/rest/v1/memberships?user_id=eq.${user.id}&select=tenant_id,role`, {
        headers: { apikey: key, Authorization: `Bearer ${key}` },
        cache: "no-store",
      })
      const memRows: Array<{ tenant_id: string; role: string }> = await memResp.json().catch(() => [])
      if (Array.isArray(memRows) && memRows.length > 0) {
        const ids = memRows.map((m) => m.tenant_id).filter(Boolean)
        let idPart = ""
        if (ids.length > 0) {
          const list = ids.map((v) => `"${v}"`).join(",")
          idPart = `&id=in.(${list})`
        }
        let idToName: Record<string, string> = {}
        if (idPart) {
          const tenResp = await fetch(`${url}/rest/v1/tenants?select=id,name${idPart}`, {
            headers: { apikey: key, Authorization: `Bearer ${key}` },
            cache: "no-store",
          })
          const tenRows: Array<{ id: string; name: string }> = await tenResp.json().catch(() => [])
          idToName = Object.fromEntries(tenRows.map((t) => [t.id, t.name]))
        }
        memberships = memRows.map((m) => ({
          organization_id: m.tenant_id,
          organization_name: idToName[m.tenant_id] || m.tenant_id,
          role: m.role,
        }))
      }
    }

    // Telemetria best-effort (não bloqueia)
    ;(async () => {
      try {
        const eurl = process.env.SUPABASE_URL
        const ekey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
        if (eurl && ekey) {
          await fetch(`${eurl}/rest/v1/events`, {
            method: "POST",
            headers: { apikey: ekey, Authorization: `Bearer ${ekey}`, "Content-Type": "application/json", Prefer: "return=minimal" },
            body: JSON.stringify({ tenant_id: null, user_id: user.id, event_type: "profile.view", payload: { source: "app.ui", ts: new Date().toISOString() } }),
            cache: "no-store",
          })
        }
      } catch {}
    })()

    // Extrair org/role principal (primeira membership)
    const ctx = await resolveRequestContext(request).catch(() => null)
    const primaryOrgId = memberships[0]?.organization_id || ctx?.tenantId || null
    const primaryRole = memberships[0]?.role || ctx?.role || null

    return NextResponse.json({
      ok: true,
      profile: {
        user_id: user.id,
        full_name: profile?.full_name ?? null,
        email: user.email ?? profile?.email ?? null,
        phone: profile?.phone ?? null,
        avatar_url: profile?.avatar_url ?? null,
        org_id: primaryOrgId,
        role: primaryRole,
        memberships,
      },
    })
  } catch (err) {
    console.error("/api/profile GET unexpected_error", err)
    return NextResponse.json({ ok: false, code: "unexpected_error" }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
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
    const parsed = (body ?? {}) as { full_name?: unknown; phone?: unknown }
    const fullName = String(parsed.full_name ?? "").trim()
    if (fullName.length < 2) {
      // Telemetria de erro (não bloqueante)
      ;(async () => {
        try {
          const eurl = process.env.SUPABASE_URL
          const ekey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
          if (eurl && ekey) {
            await fetch(`${eurl}/rest/v1/events`, {
              method: "POST",
              headers: { apikey: ekey, Authorization: `Bearer ${ekey}`, "Content-Type": "application/json", Prefer: "return=minimal" },
              body: JSON.stringify({ tenant_id: null, user_id: user.id, event_type: "profile.edit_error", payload: { reason: "invalid_full_name", ts: new Date().toISOString() } }),
              cache: "no-store",
            })
          }
        } catch {}
      })()
      return NextResponse.json({ ok: false, code: "invalid_payload" }, { status: 400 })
    }

    // phone opcional (E.164)
    const rawPhone = parsed.phone == null ? null : String(parsed.phone).trim()
    const phone = rawPhone ? (rawPhone.match(/^\+?[1-9]\d{1,14}$/) ? rawPhone : null) : null
    if (rawPhone && !phone) {
      ;(async () => {
        try {
          const eurl = process.env.SUPABASE_URL
          const ekey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
          if (eurl && ekey) {
            await fetch(`${eurl}/rest/v1/events`, {
              method: "POST",
              headers: { apikey: ekey, Authorization: `Bearer ${ekey}`, "Content-Type": "application/json", Prefer: "return=minimal" },
              body: JSON.stringify({ tenant_id: null, user_id: user.id, event_type: "profile.edit_error", payload: { reason: "invalid_phone", ts: new Date().toISOString() } }),
              cache: "no-store",
            })
          }
        } catch {}
      })()
      return NextResponse.json({ ok: false, code: "invalid_phone" }, { status: 400 })
    }

    const upsertPayload = { user_id: user.id, full_name: fullName, email: user.email ?? null, phone, updated_at: new Date().toISOString() }
    const { data, error } = await supabase
      .from("profiles")
      .upsert(upsertPayload, { onConflict: "user_id" })
      .select("user_id, full_name, email, phone")
      .maybeSingle()

    if (error) {
      console.error("/api/profile PATCH upsert error", error)
      return NextResponse.json({ ok: false, code: "unexpected_error" }, { status: 500 })
    }

    // Telemetria (somente em sucesso) + Audit
    ;(async () => {
      try {
        const { writeAudit, logEvent } = await import("@/server/events")
        await logEvent({ tenantId: "", userId: user.id, eventType: "feature.used", payload: { type: "profile.edit_success", source: "app.ui" } })
        await writeAudit({ orgId: "", actorId: user.id, entityType: "profile", entityId: user.id, action: "updated", payload: { full_name: fullName, has_phone: !!phone } })
      } catch {}
    })()

    return NextResponse.json({ ok: true, profile: { user_id: data?.user_id ?? user.id, full_name: fullName, email: data?.email ?? user.email ?? null, phone: data?.phone ?? phone ?? null } })
  } catch (err) {
    console.error("/api/profile PATCH unexpected_error", err)
    return NextResponse.json({ ok: false, code: "unexpected_error" }, { status: 500 })
  }
}



