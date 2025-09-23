import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(_req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    // Tabela de serviços pode variar no projeto. Tentamos em ordem de probabilidade.
    const candidates = ['services', 'srv_services', 'services_catalog', 'service_catalog', 'public.services']
    let services: any[] = []
    for (const table of candidates) {
      const { data, error } = await supabase
        .from(table as any)
        .select('id, name, is_active')
        .limit(50)
      if (!error && Array.isArray(data)) {
        services = (data as any[]).filter((s: any) => s?.is_active !== false)
        if (services.length > 0) break
      }
    }

    return NextResponse.json({ services })
  } catch (e) {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}


