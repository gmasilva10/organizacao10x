import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  const { token } = params
  const correlationId = `${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}-by-token`
  try {
    const { createAdminClient } = await import('@/utils/supabase/admin')
    const admin = createAdminClient()

    // Resolve versão pela tabela de versões (token gerado na geração)
    const { data: version } = await admin
      .from('anamnese_versions')
      .select('id, student_id, tenant_id, code, status')
      .eq('token', token)
      .maybeSingle()

    if (!version) {
      return NextResponse.json({ error: 'Versão não encontrada' }, { status: 404 })
    }

    // Perguntas materializadas
    const { data: questions } = await admin
      .from('anamnese_questions_snapshot')
      .select('key, label, type, options, ord')
      .eq('anamnese_version_id', version.id)
      .order('ord')

    // Respostas existentes
    const { data: answersRows } = await admin
      .from('anamnese_answers')
      .select('key, value')
      .eq('anamnese_version_id', version.id)

    const answers: Record<string, any> = {}
    for (const r of answersRows || []) answers[r.key] = r.value

    // Dados do aluno para pré-preencher
    const { data: student } = await admin
      .from('students')
      .select('name, birth_date, gender')
      .eq('id', version.student_id)
      .maybeSingle()

    return NextResponse.json({
      success: true,
      correlationId,
      version: {
        id: version.id,
        code: version.code,
        status: version.status,
      },
      student: student || null,
      questions: questions || [],
      answers,
    })
  } catch (e) {
    return NextResponse.json({ error: 'Erro interno', correlationId }, { status: 500 })
  }
}


