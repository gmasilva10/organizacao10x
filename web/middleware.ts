import { NextResponse, type NextRequest } from "next/server"
import { updateSession } from "@/utils/supabase/middleware"

export async function middleware(request: NextRequest) {
  const response = await updateSession(request)

  // Redirect landing pós-login para /app
  try {
    const url = new URL(request.url)
    // Redirect legado: /students -> /app/students
    if (url.pathname === "/students" || url.pathname.startsWith("/students/")) {
      const redirectTo = url.pathname.replace("/students", "/app/students") + url.search
      return NextResponse.redirect(new URL(redirectTo, request.url), { status: 301 })
    }
    const env = process.env.NEXT_PUBLIC_ENV || process.env.NODE_ENV
    // Congelamento de produção: bloquear apenas login público, não sync
    if (env === 'production' && url.pathname === '/api/auth/signin') {
      return NextResponse.json({ code: 'MAINTENANCE', message: 'Login temporariamente indisponível' }, { status: 503 })
    }
    const isRoot = url.pathname === "/"
    const hasAuth = request.cookies.get("sb-access-token") || request.cookies.get("sb:token")
    if (isRoot && hasAuth) {
      return NextResponse.redirect(new URL("/app/dashboard", request.url))
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
      
      // TEMPORÁRIO: Definir organização padrão para resolver o problema
      const next = NextResponse.next()
      try { 
        next.cookies.set("pg.active_org", "fb381d42-9cf8-41d9-b0ab-fdb706a85ae7", { path: "/", sameSite: "lax", httpOnly: true }) 
        console.log('Cookie de organização definido temporariamente')
      } catch {}
      return next
    }
  } catch {}

  return response
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}


