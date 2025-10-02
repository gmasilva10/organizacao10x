import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"
import { resolveRequestContext } from "@/server/context"

// Forçar execução dinâmica para evitar problemas de renderização estática
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;


export async function GET(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    const supabase = await createClient()

    // Buscar protocolos antropométricos (dados públicos de catálogo)
    const { data: protocols, error } = await supabase
      .from('anthro_protocols')
      .select('*')
      .order('code')

    if (error) {
      console.error('Erro ao buscar protocolos:', error)
      return NextResponse.json({ error: "Erro ao buscar protocolos" }, { status: 500 })
    }

    const queryTime = Date.now() - startTime

    return NextResponse.json({
      data: protocols || [],
      meta: {
        total: protocols?.length || 0,
        query_time_ms: queryTime
      }
    }, {
      headers: {
        'Cache-Control': 'public, max-age=300', // 5 minutos
        'X-Query-Time': queryTime.toString()
      }
    })

  } catch (error) {
    console.error('Erro na API de protocolos:', error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
