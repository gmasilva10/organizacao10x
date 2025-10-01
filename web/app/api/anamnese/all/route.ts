import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const correlationId = `${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}-anamnese-all`

  try {
    const supabase = await createClient()

    // Buscar todas as versões de anamnese
    const { data: versions, error: versionsError } = await supabase
      .from('anamnese_versions')
      .select(`
        id,
        code,
        status,
        service_id,
        token,
        token_expires_at,
        created_at,
        updated_at,
        student_id,
        services!anamnese_versions_service_id_fkey (
          name
        ),
        students!anamnese_versions_student_id_fkey (
          name
        )
      `)
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
      updated_at: version.updated_at,
      student_id: version.student_id,
      service_name: Array.isArray((version as any).services)
        ? ((version as any).services[0]?.name ?? null)
        : ((version as any).services?.name ?? null),
      student_name: Array.isArray((version as any).students)
        ? ((version as any).students[0]?.name ?? null)
        : ((version as any).students?.name ?? null)
    })) || []

    console.log(`✅ [ANAMNESE ALL] ${formattedVersions.length} versões encontradas`)

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
