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

    let body: any
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ ok: false, code: "invalid_payload" }, { status: 400 })
    }

    const orgName = (body?.organization_name ?? "").toString().trim()
    const docId = body?.doc_id == null || body?.doc_id === "" ? null : String(body.doc_id)
    const plan = (body?.plan ?? "basic").toString()

    if (orgName.length < 2) {
      return NextResponse.json({ ok: false, code: "invalid_payload" }, { status: 400 })
    }

    // Criar organização (tenants)
    const { data: org, error: orgErr } = await supabase
      .from("tenants")
      .insert({ name: orgName, doc_id: docId, plan })
      .select("id, name, plan")
      .single()

    if (orgErr) {
      const msg = String(orgErr?.message || "")
      const code = String((orgErr as any)?.code || "")
      if (code === "23505" || msg.toLowerCase().includes("duplicate")) {
        return NextResponse.json({ ok: false, code: "org_name_conflict" }, { status: 409 })
      }
      return NextResponse.json({ ok: false, code: "unexpected_error" }, { status: 500 })
    }

    const tenantId = org!.id as string

    // Criar membership admin para o usuário atual
    const { data: membership, error: memErr } = await supabase
      .from("memberships")
      .upsert({ tenant_id: tenantId, user_id: user.id, role: "admin" }, { onConflict: "tenant_id,user_id" })
      .select("user_id, tenant_id, role")
      .single()

    if (memErr) {
      return NextResponse.json({ ok: false, code: "unexpected_error" }, { status: 500 })
    }

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
      res.cookies.set("pg.active_org", tenantId, { path: "/", sameSite: "lax" })
    } catch {}
    return res
  } catch (err) {
    console.error("/api/account/player unexpected_error", err)
    return NextResponse.json({ ok: false, code: "unexpected_error" }, { status: 500 })
  }
}


