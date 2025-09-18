import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function createClient() {
  const cookieStore = await cookies()
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnon = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!supabaseUrl || !supabaseAnon) {
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
          // cookies() em App Router retorna um store mutável síncrono
          cookieStore.set(name, value, options)
        },
        remove(name: string, options?: any) {
          cookieStore.set(name, "", { ...options, maxAge: 0 })
        },
      },
      cookieOptions: {
        // Em dev (http), cookies "Secure" não são aceitos; em prod (https) ativamos
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
    // Fallback para cliente normal se não tiver service key
    console.warn('⚠️ SUPABASE_SERVICE_ROLE_KEY não encontrada, usando cliente normal')
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


