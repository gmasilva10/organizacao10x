import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function createClient() {
  const cookieStore = await cookies()
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnon = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  // Log opcional via flag
  if (process.env.DEBUG_LOGS === '1') {
    console.log('ðŸ” [SUPABASE SERVER] VariÃ¡veis de ambiente:', {
      SUPABASE_URL: supabaseUrl ? 'âœ… Presente' : 'âŒ Ausente',
      SUPABASE_ANON_KEY: supabaseAnon ? 'âœ… Presente' : 'âŒ Ausente',
      NODE_ENV: process.env.NODE_ENV
    })
  }
  
  if (!supabaseUrl || !supabaseAnon) {
    console.error('âŒ [SUPABASE SERVER] VariÃ¡veis de ambiente faltando:', {
      SUPABASE_URL: !!supabaseUrl,
      SUPABASE_ANON_KEY: !!supabaseAnon
    })
    throw new Error('Supabase envs ausentes: SUPABASE_URL / SUPABASE_ANON_KEY')
  }
  return createServerClient(
    supabaseUrl,
    supabaseAnon,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options?: any) {
          try {
            // cookies() em App Router retorna um store mutÃ¡vel sÃ­ncrono
            cookieStore.set(name, value, options)
          } catch {
            // Cookies são read-only em alguns contextos (layouts, etc)
          }
        },
        remove(name: string, options?: any) {
          try {
            cookieStore.set(name, "", { ...options, maxAge: 0 })
          } catch {
            // Cookies são read-only em alguns contextos
          }
        },
      },
      cookieOptions: {
        // Em dev (http), cookies "Secure" nÃ£o sÃ£o aceitos; em prod (https) ativamos
        secure: process.env.NODE_ENV === "production",
      },
    }
  )
}

// Cliente para desenvolvimento que bypassa RLS
export async function createClientAdmin() {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!supabaseUrl || !supabaseServiceKey) {
    // Fallback para cliente normal se nÃ£o tiver service key
    console.warn('âš ï¸ SUPABASE_SERVICE_ROLE_KEY nÃ£o encontrada, usando cliente normal')
    return createClient()
  }
  
  const { createClient: createSupabaseClient } = await import('@supabase/supabase-js')
  
  return createSupabaseClient(
    supabaseUrl,
    supabaseServiceKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )
}



