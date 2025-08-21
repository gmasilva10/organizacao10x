import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { access_token, refresh_token } = await request.json()

    if (!access_token || !refresh_token) {
      return NextResponse.json({ error: "missing_tokens" }, { status: 400 })
    }

    const { createClient } = await import("@/utils/supabase/server")
    const supabase = await createClient()

    const { error } = await supabase.auth.setSession({ access_token, refresh_token })
    if (error) {
      return NextResponse.json({ error: "set_session_failed" }, { status: 500 })
    }

    // Força reconciliação e escrita dos cookies no response
    await supabase.auth.getUser()

    return new NextResponse(null, { status: 204 })
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 })
  }
}


