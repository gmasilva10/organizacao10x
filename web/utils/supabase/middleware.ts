import { NextResponse, type NextRequest } from "next/server"

export async function updateSession(request: NextRequest) {
  // Middleware simplificado para Edge Runtime
  // Apenas verifica se há cookies de autenticação e os repassa
  const response = NextResponse.next({ request })
  
  // Verificar se há cookies de sessão do Supabase
  const accessToken = request.cookies.get('sb-access-token')?.value
  const refreshToken = request.cookies.get('sb-refresh-token')?.value
  
  // Se não há tokens, permitir acesso (redirecionamento será feito nas páginas)
  if (!accessToken && !refreshToken) {
    return response
  }
  
  // Repassar cookies existentes
  return response
}


