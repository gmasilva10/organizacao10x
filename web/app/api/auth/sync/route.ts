import { NextResponse } from "next/server"

// Forçar execução no Node.js para evitar problemas de edge runtime
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(request: Request) {
  try {
    console.log('🔄 [AUTH SYNC] Iniciando sync de autenticação')
    
    const { access_token, refresh_token } = await request.json()
    console.log('🔄 [AUTH SYNC] Tokens recebidos:', { 
      access_token: access_token ? '✅ Presente' : '❌ Ausente',
      refresh_token: refresh_token ? '✅ Presente' : '❌ Ausente'
    })

    if (!access_token || !refresh_token) {
      console.error('❌ [AUTH SYNC] Tokens faltando')
      return NextResponse.json({ error: "missing_tokens" }, { status: 400 })
    }

    console.log('🔄 [AUTH SYNC] Criando cliente Supabase...')
    const { createClient } = await import("@/utils/supabase/server")
    const supabase = await createClient()
    console.log('🔄 [AUTH SYNC] Cliente Supabase criado')

    console.log('🔄 [AUTH SYNC] Definindo sessão...')
    const { error } = await supabase.auth.setSession({ access_token, refresh_token })
    if (error) {
      console.error('❌ [AUTH SYNC] Erro ao definir sessão:', error)
      return NextResponse.json({ error: "set_session_failed", details: error.message }, { status: 500 })
    }
    console.log('✅ [AUTH SYNC] Sessão definida com sucesso')

    console.log('🔄 [AUTH SYNC] Forçando reconciliação...')
    const { data: user, error: userError } = await supabase.auth.getUser()
    if (userError) {
      console.error('❌ [AUTH SYNC] Erro ao obter usuário:', userError)
      return NextResponse.json({ error: "get_user_failed", details: userError.message }, { status: 500 })
    }
    console.log('✅ [AUTH SYNC] Usuário obtido:', user?.id)

    console.log('✅ [AUTH SYNC] Sync concluído com sucesso')
    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error('❌ [AUTH SYNC] Erro inesperado:', error)
    return NextResponse.json({ error: "bad_request", details: error.message }, { status: 400 })
  }
}


