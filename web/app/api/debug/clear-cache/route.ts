import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    // Forçar limpeza de cache do navegador
    const response = NextResponse.json({
      success: true,
      message: "Cache limpo com sucesso",
      timestamp: new Date().toISOString()
    })

    // Definir headers para forçar limpeza de cache
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')
    response.headers.set('Surrogate-Control', 'no-store')

    // Limpar cookie de organização ativa para forçar re-resolução
    response.cookies.delete('pg.active_org')
    
    return response
  } catch (error) {
    console.error('Erro ao limpar cache:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}
