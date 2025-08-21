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
    ]
    const path = url.pathname
    const needsOrg = protectedPaths.some((p) => path === p || path.startsWith(p + "/"))
    const hasActiveOrg = Boolean(request.cookies.get("pg.active_org")?.value)
    if (needsOrg && !hasActiveOrg) {
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


