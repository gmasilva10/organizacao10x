import { NextResponse, type NextRequest } from "next/server"
import { updateSession } from "@/utils/supabase/middleware"
import { logger } from "@/lib/logger"

export async function middleware(request: NextRequest) {
  logger.debug('🔍 [MIDDLEWARE] Processando requisição:', request.url)
  
  // Middleware simplificado para debug da tela branca
  const response = await updateSession(request)
  
  // Apenas redirecionamentos essenciais
  try {
    const url = new URL(request.url)
    
    // Redirect legado: /students -> /app/students
    if (url.pathname === "/students" || url.pathname.startsWith("/students/")) {
      const redirectTo = url.pathname.replace("/students", "/app/students") + url.search
      return NextResponse.redirect(new URL(redirectTo, request.url), { status: 301 })
    }
    
    // Desabilitar redirecionamento automático para debug
    // const isRoot = url.pathname === "/"
    // const hasAuth = request.cookies.get("sb-access-token") || request.cookies.get("sb:token")
    // if (isRoot && hasAuth) {
    //   return NextResponse.redirect(new URL("/app", request.url))
    // }
    
  } catch (error) {
    logger.error('❌ [MIDDLEWARE] Erro:', error)
  }

  return response
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$|api/whatsapp|api/wa/webhook).*)",
  ],
}


