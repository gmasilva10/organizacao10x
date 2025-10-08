import { NextResponse } from "next/server"

// Forçar execução dinâmica para evitar problemas de renderização estática
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;


export async function GET() {
  // Guard: somente disponível em dev ou quando explicitamente habilitado
  if (
    process.env.NODE_ENV !== 'development' &&
    process.env.ENABLE_DEBUG_ROUTES !== '1'
  ) {
    return NextResponse.json({ error: 'Debug endpoint disabled' }, { status: 403 })
  }
  try {
    const { createClient } = await import("@/utils/supabase/server")
    const supabase = await createClient()
    const { data: userData, error: userErr } = await supabase.auth.getUser()
    if (userErr || !userData?.user) {
      return NextResponse.json({ auth: "no_user", error: userErr?.message }, { status: 200 })
    }
    const user = userData.user
    const { data: membership, error: memErr } = await supabase
      .from("memberships")
      .select("org_id, role")
      .eq("user_id", user.id)
      .limit(1)
      .maybeSingle()

    return NextResponse.json({
      auth: "ok",
      user: { id: user.id, email: user.email },
      membership: membership || null,
      membershipError: memErr?.message || null,
    })
  } catch (e) {
    const message = e instanceof Error ? e.message : "unknown"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}




