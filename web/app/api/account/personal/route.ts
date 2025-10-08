import { NextResponse } from "next/server"

// Forçar execução dinâmica para evitar problemas de renderização estática
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;


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
      return NextResponse.json({ ok: false, code: "invalid_payload", message: "json" }, { status: 400 })
    }

    const parsed = (body ?? {}) as { full_name?: unknown }
    const fullName = String(parsed.full_name ?? "").trim()
    if (fullName.length < 2) {
      return NextResponse.json({ ok: false, code: "invalid_payload", message: "full_name min 2" }, { status: 400 })
    }

    const upsertPayload = {
      user_id: user.id,
      full_name: fullName,
      email: user.email ?? null,
      updated_at: new Date().toISOString(),
    }

    const { data, error } = await supabase
      .from("profiles")
      .upsert(upsertPayload, { onConflict: "user_id" })
      .select("user_id, full_name")
      .maybeSingle()

    if (error) {
      console.error("profiles.upsert error", error)
      return NextResponse.json({ ok: false, code: "unexpected_error" }, { status: 500 })
    }

    // Telemetria leve (somente se possível, nunca quebra o fluxo)
    ;(async () => {
      try {
        const url = process.env.SUPABASE_URL
        const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
        if (url && key) {
          await fetch(`${url}/rest/v1/events`, {
            method: "POST",
            headers: {
              apikey: key,
              Authorization: `Bearer ${key}`,
              "Content-Type": "application/json",
              Prefer: "return=minimal",
            },
            body: JSON.stringify({
              org_id: null,
              user_id: user.id,
              event_type: "account.created",
              payload: { type: "personal", source: "app.ui", ts: new Date().toISOString() },
            }),
            cache: "no-store",
          })
        }
      } catch {}
    })()

    return NextResponse.json({ ok: true, profile: { user_id: data?.user_id ?? user.id, full_name: fullName } })
  } catch (err) {
    console.error("/api/account/personal unexpected_error", err)
    return NextResponse.json({ ok: false, code: "unexpected_error" }, { status: 500 })
  }
}



