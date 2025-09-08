import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const { createClient } = await import("@/utils/supabase/server")
    const supabase = await createClient()

    const { data: userData } = await supabase.auth.getUser()
    const user = userData?.user
    if (!user) return NextResponse.json({ orgId: null, source: "none" }, { status: 200 })

    const cookie = (request.headers as Headers).get("cookie") || ""
    const activeOrgCookie = (() => {
      const m = /(?:^|; )pg\.active_org=([^;]+)/.exec(cookie)
      return m ? decodeURIComponent(m[1]) : null
    })()

    if (activeOrgCookie) {
      // Opcional: validar que existe membership para este org
      const { data: mem } = await supabase
        .from("memberships")
        .select("tenant_id")
        .eq("user_id", user.id)
        .eq("tenant_id", activeOrgCookie)
        .limit(1)
        .maybeSingle()
      if (mem?.tenant_id) {
        return NextResponse.json({ orgId: mem.tenant_id as string, source: "cookie" })
      }
    }

    // Fallback: primeira membership ativa do usuário
    const { data: membership } = await supabase
      .from("memberships")
      .select("tenant_id")
      .eq("user_id", user.id)
      .limit(1)
      .maybeSingle()

    if (membership?.tenant_id) {
      // Telemetria best-effort
      try {
        const { logEvent } = await import("@/server/events")
        await logEvent({ tenantId: membership.tenant_id as string, userId: user.id, eventType: "auth.org_resolved", payload: { source: "membership" } })
      } catch {}
      return NextResponse.json({ orgId: membership.tenant_id as string, source: "membership" })
    }

    // Nenhuma org
    try {
      const { logEvent } = await import("@/server/events")
      await logEvent({ tenantId: "", userId: user.id, eventType: "auth.redirect_onboarding", payload: { reason: "no_membership" } })
    } catch {}
    return NextResponse.json({ orgId: null, source: "none" })
  } catch (err) {
    return NextResponse.json({ orgId: null, source: "error" }, { status: 200 })
  }
}


