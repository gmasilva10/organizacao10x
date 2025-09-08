import { createClient } from "@supabase/supabase-js"

export function createAdminClient() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceRole) {
    throw new Error("Supabase admin envs ausentes: SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY")
  }
  return createClient(url, serviceRole, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}


