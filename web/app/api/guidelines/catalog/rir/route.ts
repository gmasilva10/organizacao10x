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

    // Buscar matriz RIR (dados públicos de catálogo)
    const { data: rirMatrix, error } = await supabase
      .from('rir_matrix')
      .select('*')
      .order('rir_level')
      .order('reps')

    if (error) {
      console.error('Erro ao buscar matriz RIR:', error)
      console.log('Usando dados mock temporários...')
      
      // Dados mock baseados na planilha (RIR 5-10)
      const mockRirMatrix = [
        // RIR 10 (da planilha)
        { rir_level: 10, reps: 1, percentage_1rm: 100 },
        { rir_level: 10, reps: 2, percentage_1rm: 94 },
        { rir_level: 10, reps: 3, percentage_1rm: 91 },
        { rir_level: 10, reps: 4, percentage_1rm: 88 },
        { rir_level: 10, reps: 5, percentage_1rm: 86 },
        { rir_level: 10, reps: 6, percentage_1rm: 83 },
        { rir_level: 10, reps: 7, percentage_1rm: 81 },
        { rir_level: 10, reps: 8, percentage_1rm: 79 },
        { rir_level: 10, reps: 9, percentage_1rm: 77 },
        { rir_level: 10, reps: 10, percentage_1rm: 75 },
        { rir_level: 10, reps: 11, percentage_1rm: 73 },
        { rir_level: 10, reps: 12, percentage_1rm: 71 },
        { rir_level: 10, reps: 13, percentage_1rm: 70 },
        { rir_level: 10, reps: 14, percentage_1rm: 68 },
        { rir_level: 10, reps: 15, percentage_1rm: 67 },
        { rir_level: 10, reps: 16, percentage_1rm: 65 },
        { rir_level: 10, reps: 17, percentage_1rm: 64 },
        { rir_level: 10, reps: 18, percentage_1rm: 63 },
        { rir_level: 10, reps: 19, percentage_1rm: 61 },
        { rir_level: 10, reps: 20, percentage_1rm: 60 },
        
        // RIR 9 (da planilha)
        { rir_level: 9, reps: 1, percentage_1rm: 94 },
        { rir_level: 9, reps: 2, percentage_1rm: 91 },
        { rir_level: 9, reps: 3, percentage_1rm: 88 },
        { rir_level: 9, reps: 4, percentage_1rm: 86 },
        { rir_level: 9, reps: 5, percentage_1rm: 83 },
        { rir_level: 9, reps: 6, percentage_1rm: 81 },
        { rir_level: 9, reps: 7, percentage_1rm: 79 },
        { rir_level: 9, reps: 8, percentage_1rm: 77 },
        { rir_level: 9, reps: 9, percentage_1rm: 75 },
        { rir_level: 9, reps: 10, percentage_1rm: 73 },
        { rir_level: 9, reps: 11, percentage_1rm: 71 },
        { rir_level: 9, reps: 12, percentage_1rm: 70 },
        { rir_level: 9, reps: 13, percentage_1rm: 68 },
        { rir_level: 9, reps: 14, percentage_1rm: 67 },
        { rir_level: 9, reps: 15, percentage_1rm: 65 },
        { rir_level: 9, reps: 16, percentage_1rm: 64 },
        { rir_level: 9, reps: 17, percentage_1rm: 63 },
        { rir_level: 9, reps: 18, percentage_1rm: 61 },
        { rir_level: 9, reps: 19, percentage_1rm: 60 },
        { rir_level: 9, reps: 20, percentage_1rm: 60 },
        
        // RIR 8 (da planilha)
        { rir_level: 8, reps: 1, percentage_1rm: 91 },
        { rir_level: 8, reps: 2, percentage_1rm: 88 },
        { rir_level: 8, reps: 3, percentage_1rm: 86 },
        { rir_level: 8, reps: 4, percentage_1rm: 83 },
        { rir_level: 8, reps: 5, percentage_1rm: 81 },
        { rir_level: 8, reps: 6, percentage_1rm: 79 },
        { rir_level: 8, reps: 7, percentage_1rm: 77 },
        { rir_level: 8, reps: 8, percentage_1rm: 75 },
        { rir_level: 8, reps: 9, percentage_1rm: 73 },
        { rir_level: 8, reps: 10, percentage_1rm: 71 },
        { rir_level: 8, reps: 11, percentage_1rm: 70 },
        { rir_level: 8, reps: 12, percentage_1rm: 68 },
        { rir_level: 8, reps: 13, percentage_1rm: 67 },
        { rir_level: 8, reps: 14, percentage_1rm: 65 },
        { rir_level: 8, reps: 15, percentage_1rm: 64 },
        { rir_level: 8, reps: 16, percentage_1rm: 63 },
        { rir_level: 8, reps: 17, percentage_1rm: 61 },
        { rir_level: 8, reps: 18, percentage_1rm: 60 },
        { rir_level: 8, reps: 19, percentage_1rm: 60 },
        { rir_level: 8, reps: 20, percentage_1rm: 60 },
        
        // RIR 7 (da planilha)
        { rir_level: 7, reps: 1, percentage_1rm: 88 },
        { rir_level: 7, reps: 2, percentage_1rm: 86 },
        { rir_level: 7, reps: 3, percentage_1rm: 83 },
        { rir_level: 7, reps: 4, percentage_1rm: 81 },
        { rir_level: 7, reps: 5, percentage_1rm: 79 },
        { rir_level: 7, reps: 6, percentage_1rm: 77 },
        { rir_level: 7, reps: 7, percentage_1rm: 75 },
        { rir_level: 7, reps: 8, percentage_1rm: 73 },
        { rir_level: 7, reps: 9, percentage_1rm: 71 },
        { rir_level: 7, reps: 10, percentage_1rm: 70 },
        { rir_level: 7, reps: 11, percentage_1rm: 68 },
        { rir_level: 7, reps: 12, percentage_1rm: 67 },
        { rir_level: 7, reps: 13, percentage_1rm: 65 },
        { rir_level: 7, reps: 14, percentage_1rm: 64 },
        { rir_level: 7, reps: 15, percentage_1rm: 63 },
        { rir_level: 7, reps: 16, percentage_1rm: 61 },
        { rir_level: 7, reps: 17, percentage_1rm: 60 },
        { rir_level: 7, reps: 18, percentage_1rm: 60 },
        { rir_level: 7, reps: 19, percentage_1rm: 60 },
        { rir_level: 7, reps: 20, percentage_1rm: 60 },
        
        // RIR 6 (da planilha)
        { rir_level: 6, reps: 1, percentage_1rm: 86 },
        { rir_level: 6, reps: 2, percentage_1rm: 83 },
        { rir_level: 6, reps: 3, percentage_1rm: 81 },
        { rir_level: 6, reps: 4, percentage_1rm: 79 },
        { rir_level: 6, reps: 5, percentage_1rm: 77 },
        { rir_level: 6, reps: 6, percentage_1rm: 75 },
        { rir_level: 6, reps: 7, percentage_1rm: 73 },
        { rir_level: 6, reps: 8, percentage_1rm: 71 },
        { rir_level: 6, reps: 9, percentage_1rm: 70 },
        { rir_level: 6, reps: 10, percentage_1rm: 68 },
        { rir_level: 6, reps: 11, percentage_1rm: 67 },
        { rir_level: 6, reps: 12, percentage_1rm: 65 },
        { rir_level: 6, reps: 13, percentage_1rm: 64 },
        { rir_level: 6, reps: 14, percentage_1rm: 63 },
        { rir_level: 6, reps: 15, percentage_1rm: 61 },
        { rir_level: 6, reps: 16, percentage_1rm: 60 },
        { rir_level: 6, reps: 17, percentage_1rm: 60 },
        { rir_level: 6, reps: 18, percentage_1rm: 60 },
        { rir_level: 6, reps: 19, percentage_1rm: 60 },
        { rir_level: 6, reps: 20, percentage_1rm: 60 },
        
        // RIR 5 (da planilha)
        { rir_level: 5, reps: 1, percentage_1rm: 83 },
        { rir_level: 5, reps: 2, percentage_1rm: 81 },
        { rir_level: 5, reps: 3, percentage_1rm: 79 },
        { rir_level: 5, reps: 4, percentage_1rm: 77 },
        { rir_level: 5, reps: 5, percentage_1rm: 75 },
        { rir_level: 5, reps: 6, percentage_1rm: 73 },
        { rir_level: 5, reps: 7, percentage_1rm: 71 },
        { rir_level: 5, reps: 8, percentage_1rm: 70 },
        { rir_level: 5, reps: 9, percentage_1rm: 68 },
        { rir_level: 5, reps: 10, percentage_1rm: 67 },
        { rir_level: 5, reps: 11, percentage_1rm: 65 },
        { rir_level: 5, reps: 12, percentage_1rm: 64 },
        { rir_level: 5, reps: 13, percentage_1rm: 63 },
        { rir_level: 5, reps: 14, percentage_1rm: 61 },
        { rir_level: 5, reps: 15, percentage_1rm: 60 },
        { rir_level: 5, reps: 16, percentage_1rm: 60 },
        { rir_level: 5, reps: 17, percentage_1rm: 60 },
        { rir_level: 5, reps: 18, percentage_1rm: 60 },
        { rir_level: 5, reps: 19, percentage_1rm: 60 },
        { rir_level: 5, reps: 20, percentage_1rm: 60 }
      ]
      
      // Organizar em matriz para facilitar consulta
      const matrix: Record<number, Record<number, number>> = {}
      mockRirMatrix.forEach(row => {
        if (!matrix[row.rir_level]) {
          matrix[row.rir_level] = {}
        }
        matrix[row.rir_level][row.reps] = row.percentage_1rm
      })

      const queryTime = Date.now() - startTime

      return NextResponse.json({
        data: {
          matrix,
          raw_data: mockRirMatrix
        },
        meta: {
          total: mockRirMatrix.length,
          query_time_ms: queryTime,
          note: "Dados mock temporários - tabela rir_matrix não encontrada"
        }
      }, {
        headers: {
          'Cache-Control': 'public, max-age=300', // 5 minutos
          'X-Query-Time': queryTime.toString()
        }
      })
    }

    // Organizar em matriz para facilitar consulta
    const matrix: Record<number, Record<number, number>> = {}
    rirMatrix?.forEach(row => {
      if (!matrix[row.rir_level]) {
        matrix[row.rir_level] = {}
      }
      matrix[row.rir_level][row.reps] = row.percentage_1rm
    })

    const queryTime = Date.now() - startTime

    return NextResponse.json({
      data: {
        matrix,
        raw_data: rirMatrix || []
      },
      meta: {
        total: rirMatrix?.length || 0,
        query_time_ms: queryTime
      }
    }, {
      headers: {
        'Cache-Control': 'public, max-age=300', // 5 minutos
        'X-Query-Time': queryTime.toString()
      }
    })

  } catch (error) {
    console.error('Erro na API de RIR:', error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
