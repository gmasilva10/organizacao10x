import { NextResponse } from "next/server"

// ForÃ§ar execuÃ§Ã£o no Node.js para evitar problemas de edge runtime
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(request: Request) {
  try {
    console.log('ðŸ”„ [AUTH SYNC] Iniciando sync de autenticaÃ§Ã£o')
    
    const { access_token, refresh_token } = await request.json()
    console.log('ðŸ”„ [AUTH SYNC] Tokens recebidos:', { 
      access_token: access_token ? 'âœ… Presente' : 'âŒ Ausente',
      refresh_token: refresh_token ? 'âœ… Presente' : 'âŒ Ausente'
    })

    if (!access_token || !refresh_token) {
      console.error('âŒ [AUTH SYNC] Tokens faltando')
      return NextResponse.json({ error: "missing_tokens" }, { status: 400 })
    }

    console.log('ðŸ”„ [AUTH SYNC] Criando cliente Supabase...')
    const { createClient } = await import("@/utils/supabase/server")
    const supabase = await createClient()
    console.log('ðŸ”„ [AUTH SYNC] Cliente Supabase criado')

    console.log('ðŸ”„ [AUTH SYNC] Definindo sessÃ£o...')
    const { error } = await supabase.auth.setSession({ access_token, refresh_token })
    if (error) {
      console.error('âŒ [AUTH SYNC] Erro ao definir sessÃ£o:', error)
      return NextResponse.json({ error: "set_session_failed", details: (error as any)?.message }, { status: 500 })
    }
    console.log('âœ… [AUTH SYNC] SessÃ£o definida com sucesso')

    console.log('ðŸ”„ [AUTH SYNC] ForÃ§ando reconciliaÃ§Ã£o...')
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError) {
      console.error('âŒ [AUTH SYNC] Erro ao obter usuÃ¡rio:', userError)
      return NextResponse.json({ error: "get_user_failed", details: userError.message }, { status: 500 })
    }
    console.log('âœ… [AUTH SYNC] UsuÃ¡rio obtido:', user?.id)

    console.log('âœ… [AUTH SYNC] Sync concluÃ­do com sucesso')
    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error('âŒ [AUTH SYNC] Erro inesperado:', error)
    return NextResponse.json({ error: "bad_request", details: (error as any)?.message }, { status: 400 })
  }
}


