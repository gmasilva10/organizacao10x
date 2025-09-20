import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import { processAnamnese, AnamneseInputSchema } from '@/lib/anamnese/engine'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID()
  console.log(`🔍 [${requestId}] API /api/anamnesis/calculate POST chamada`)
  
  try {
    const cookieStore = cookies()
    const supabase = await createClient(cookieStore)
    
    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      console.warn(`⚠️ [${requestId}] Auth falhou:`, authError)
      return NextResponse.json({ 
        error: 'Unauthorized', 
        code: 'AUTH_FAILED',
        requestId 
      }, { status: 401 })
    }

    // Validar payload
    const body = await request.json()
    const validationResult = AnamneseInputSchema.safeParse(body)
    
    if (!validationResult.success) {
      console.warn(`⚠️ [${requestId}] Validação falhou:`, validationResult.error.issues)
      return NextResponse.json({ 
        error: 'Dados inválidos', 
        code: 'VALIDATION_ERROR',
        details: validationResult.error.issues,
        requestId 
      }, { status: 422 })
    }

    const input = validationResult.data
    console.log(`📝 [${requestId}] Input validado:`, { 
      age: input.age, 
      weight: input.weight, 
      height: input.height,
      gender: input.gender 
    })

    // Processar anamnese
    const result = processAnamnese(input)
    
    console.log(`✅ [${requestId}] Anamnese processada com sucesso:`, {
      bmi: result.bmi,
      protocolsCount: result.protocols.length,
      recommendationsCount: result.recommendations.length
    })

    return NextResponse.json({ 
      success: true, 
      result,
      requestId 
    })

  } catch (error) {
    console.error(`❌ [${requestId}] Erro inesperado:`, error)
    return NextResponse.json({ 
      error: 'Erro interno', 
      code: 'INTERNAL_ERROR',
      requestId 
    }, { status: 500 })
  }
}
