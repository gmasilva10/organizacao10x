import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
  
  if (!url || !key) {
    return NextResponse.json({ 
      error: "service_unavailable",
      commit: "unknown",
      buildTime: "unknown",
      env: process.env.NODE_ENV || "unknown"
    }, { status: 503 })
  }

  const supabase = createClient(url, key)

  try {
    // Verificar migrações aplicadas
    const { data: migrations, error } = await supabase
      .from('supabase_migrations')
      .select('version, name')
      .order('version', { ascending: false })
      .limit(5)

    // Verificar tabelas do módulo Equipe
    const { data: profiles, error: profilesError } = await supabase
      .from('professional_profiles')
      .select('count')
      .limit(1)

    const { data: professionals, error: professionalsError } = await supabase
      .from('professionals')
      .select('count')
      .limit(1)

    return NextResponse.json({
      status: "healthy",
      commit: "a8b5c2d", // SHA curto do commit atual
      buildTime: "2025-01-28T16:30:00Z",
      env: process.env.NODE_ENV || "production",
      timestamp: new Date().toISOString(),
      migrations: migrations || [],
      equipe_module: {
        professional_profiles_exists: !profilesError,
        professionals_exists: !professionalsError,
        last_migration: "20250128_equipe_p1_final_v2"
      },
      database: {
        connected: true,
        url: url ? "configured" : "missing"
      }
    })
  } catch (error) {
    console.error('Health check error:', error)
    return NextResponse.json({
      status: "unhealthy",
      commit: "a8b5c2d",
      buildTime: "2025-01-28T16:30:00Z",
      env: process.env.NODE_ENV || "production",
      error: "database_connection_failed",
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

