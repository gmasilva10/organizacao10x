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

    // Buscar tipos de prontidão (dados públicos de catálogo)
    const { data: readinessTypes, error: typesError } = await supabase
      .from('readiness_types')
      .select('*')
      .order('code')

    if (typesError) {
      console.error('Erro ao buscar tipos de prontidão:', typesError)
      return NextResponse.json({ error: "Erro ao buscar tipos de prontidão" }, { status: 500 })
    }

    // Buscar estágios de prontidão (dados públicos de catálogo)
    const { data: readinessStages, error: stagesError } = await supabase
      .from('readiness_stages')
      .select('*')
      .order('stage')

    if (stagesError) {
      console.error('Erro ao buscar estágios de prontidão:', stagesError)
      return NextResponse.json({ error: "Erro ao buscar estágios de prontidão" }, { status: 500 })
    }

    // Organizar dados por tipo
    const organizedData = readinessTypes?.map(type => ({
      ...type,
      stages: readinessStages?.filter(stage => stage.readiness_type_id === type.id) || []
    })) || []

    const queryTime = Date.now() - startTime

    return NextResponse.json({
      data: {
        types: readinessTypes || [],
        stages: readinessStages || [],
        organized: organizedData
      },
      meta: {
        total_types: readinessTypes?.length || 0,
        total_stages: readinessStages?.length || 0,
        query_time_ms: queryTime
      }
    }, {
      headers: {
        'Cache-Control': 'public, max-age=300', // 5 minutos
        'X-Query-Time': queryTime.toString()
      }
    })

  } catch (error) {
    console.error('Erro na API de prontidão:', error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}