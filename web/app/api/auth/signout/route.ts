import { NextResponse } from "next/server"

export async function POST() {
  try {
    const { createClient } = await import("@/utils/supabase/server")
    const supabase = await createClient()
    await supabase.auth.signOut()
    // Garantir que cookies sejam atualizados no response
    await supabase.auth.getUser()
    return new NextResponse(null, { status: 204 })
  } catch {
    return NextResponse.json({ error: "signout_failed" }, { status: 500 })
  }
}


