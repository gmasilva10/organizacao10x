import { NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"

// POST /api/auth/signout — encerra a sessão e limpa cookies auxiliares

// Forçar execução dinâmica para evitar problemas de renderização estática
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST() {
  try {
    const supabase = await createClient()
    await supabase.auth.signOut()
  } catch {}
  const res = new NextResponse(null, { status: 204 })
  try { res.cookies.set('pg.active_org', '', { path: '/', maxAge: 0 }) } catch {}
  return res
}
