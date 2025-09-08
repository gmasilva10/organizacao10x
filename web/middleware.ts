import { NextResponse, type NextRequest } from "next/server"
import { updateSession } from "@/utils/supabase/middleware"

export async function middleware(request: NextRequest) {
  const response = await updateSession(request)

  // Redirect landing pós-login para /app
  try {
    const url = new URL(request.url)
    const isRoot = url.pathname === "/"
    const hasAuth = request.cookies.get("sb-access-token") || request.cookies.get("sb:token")
    if (isRoot && hasAuth) {
      return NextResponse.redirect(new URL("/app", request.url))
    }

    // OrgGate básico via cookie para rotas protegidas
    const protectedPaths = [
      "/app/students",
      "/app/services",
      "/app/onboarding",
      "/app/onboarding/history",
      "/app/finance",
      "/app/settings",
      "/app/team",
    ]
    const path = url.pathname
    const needsOrg = protectedPaths.some((p) => path === p || path.startsWith(p + "/"))
    const hasActiveOrg = Boolean(request.cookies.get("pg.active_org")?.value)
    if (needsOrg && !hasActiveOrg) {
      // Server-first: tenta resolver organização atual
      const origin = url.origin
      const resp = await fetch(`${origin}/api/auth/resolve-org`, { headers: { cookie: request.headers.get('cookie') || '' }, cache: 'no-store' })
      const data = await resp.json().catch(() => ({ orgId: null })) as { orgId: string | null }
      if (data?.orgId) {
        const next = NextResponse.next()
        try { next.cookies.set("pg.active_org", data.orgId, { path: "/", sameSite: "lax", httpOnly: true }) } catch {}
        return next
      }
      return NextResponse.redirect(new URL("/onboarding/account/player", request.url))
    }
  } catch {}

  return response
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}


