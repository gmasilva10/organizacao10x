import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { studentId: string } }
) {
  const { studentId } = params
  const correlationId = `${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}-anamnese-versions`

  try {
    const supabase = await createClient()
    const { createAdminClient } = await import('@/utils/supabase/admin')
    const admin = createAdminClient()

    // Buscar versões da anamnese do aluno
    const { data: versions, error: versionsError } = await admin
      .from('anamnese_versions')
      .select(`
        id,
        code,
        status,
        service_id,
        token,
        token_expires_at,
        created_at
      `)
      .eq('student_id', studentId)
      .order('created_at', { ascending: false })

    if (versionsError) {
      console.error('Erro ao buscar versões:', versionsError)
      return NextResponse.json(
        { error: 'Erro ao buscar versões da anamnese' },
        { status: 500 }
      )
    }

    // Formatar dados
    const formattedVersions = versions?.map(version => ({
      id: version.id,
      code: version.code,
      status: version.status,
      service_id: version.service_id,
      token: version.token,
      token_expires_at: version.token_expires_at,
      created_at: version.created_at,
      updated_at: null,
      service_name: null
    })) || []

    console.log(`✅ [ANAMNESE VERSIONS] ${formattedVersions.length} versões encontradas`)

    return NextResponse.json({
      success: true,
      versions: formattedVersions,
      correlationId
    })
  } catch (error) {
    console.error('Erro interno ao buscar versões:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor', correlationId },
      { status: 500 }
    )
  }
}