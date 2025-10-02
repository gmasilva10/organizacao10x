import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { generateAnamneseToken } from '@/lib/anamnese/tokens'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function isUuid(v: any): boolean {
  return typeof v === 'string' && /^[0-9a-fA-F-]{36}$/.test(v)
}

export async function POST(req: NextRequest) {
  const correlationId = `${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}-anamnese-generate`
  try {
    const payload = await req.json().catch(() => ({})) as any
    const { alunoId, serviceId, destino } = payload || {}

    if (!isUuid(alunoId)) {
      return NextResponse.json({ error: 'alunoId inválido' }, { status: 422 })
    }

    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    const { createAdminClient } = await import('@/utils/supabase/admin')
    const admin = createAdminClient()

    // Carregar aluno e tenant
    const { data: student, error: stuErr } = await admin
      .from('students')
      .select('id, tenant_id')
      .eq('id', alunoId)
      .single()
    if (stuErr || !student) return NextResponse.json({ error: 'Aluno não encontrado' }, { status: 404 })

    // Descobrir template padrão publicado
    const { data: defaultTemplateJoin } = await admin
      .from('organization_default_templates')
      .select('template_version_id')
      .limit(1)
      .maybeSingle()

    let templateVersionId: string | null = defaultTemplateJoin?.template_version_id ?? null

    if (!templateVersionId) {
      // 1) tentar por nome conhecido (Denis Foschini), publicado mais recente
      const { data: namedTpl } = await admin
        .from('anamnesis_templates')
        .select('id')
        .ilike('name', '%Denis Foschini%')
        .maybeSingle()
      if (namedTpl?.id) {
        const { data: namedTv } = await admin
          .from('anamnesis_template_versions')
          .select('id, published_at')
          .eq('template_id', namedTpl.id)
          .eq('is_published', true)
          .order('published_at', { ascending: false })
          .limit(1)
          .maybeSingle()
        templateVersionId = namedTv?.id ?? null
      }
    }
    if (!templateVersionId) {
      // 2) fallback geral: publicado mais recente
      const { data: fallbackTv } = await admin
        .from('anamnesis_template_versions')
        .select('id, published_at')
        .eq('is_published', true)
        .order('published_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      templateVersionId = fallbackTv?.id ?? null
    }

    // Token/link público
    const token = generateAnamneseToken()
    const baseUrl = process.env.NEXT_PUBLIC_PUBLIC_APP_URL
      || process.env.NEXT_PUBLIC_SITE_URL
      || process.env.NEXT_PUBLIC_APP_URL
      || 'http://localhost:3000'
    const publicLink = `${baseUrl}/p/anamnese/${token}`

    const waShareText = `Olá! Para personalizarmos seu treino, responda sua Anamnese: ${publicLink}\nLeva ~7–10 min. Obrigado!`

    // Criar registro em anamnese_versions (para manter compatibilidade)
    const { data: maxSeq } = await admin
      .from('anamnese_versions')
      .select('seq')
      .eq('org_id', student.tenant_id)
      .eq('student_id', alunoId)
      .order('seq', { ascending: false })
      .limit(1)
      .maybeSingle()
    const nextSeq = (maxSeq?.seq || 0) + 1
    const code = `ANM-${String(nextSeq).padStart(4, '0')}`
    const { data: version, error: verErr } = await admin
      .from('anamnese_versions')
      .insert({
        tenant_id: student.tenant_id,
        student_id: alunoId,
        seq: nextSeq,
        code,
        status: 'RASCUHO',
        service_id: isUuid(serviceId) ? serviceId : null,
        token,
        token_expires_at: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(),
        created_by: user.id
      })
      .select('id')
      .single()
    if (verErr || !version) return NextResponse.json({ error: 'Falha ao criar versão' }, { status: 500 })

    // Se houver template padrão, materializar snapshot das perguntas
    if (templateVersionId) {
      const { data: questions } = await admin
        .from('anamnesis_questions')
        .select('question_id, label, type, options, order_index')
        .eq('template_version_id', templateVersionId)
        .order('order_index', { ascending: true })

      if (questions && questions.length > 0) {
        const snapshotRows = questions.map((q: any) => ({
          tenant_id: student.tenant_id,
          anamnese_version_id: version.id,
          key: q.question_id,
          label: q.label,
          type: q.type,
          options: (() => {
            const base = (q.options ?? {}) as any
            const meta = {
              required: Boolean(q.required),
              multiple: q.type === 'multi'
            }
            return { ...base, _meta: meta }
          })(),
          ord: q.order_index ?? 0
        }))
        if (snapshotRows.length > 0) {
          await admin.from('anamnese_questions_snapshot').insert(snapshotRows)
        }
      }
    }

    // Pré-preencher respostas básicas (nome, idade, sexo) quando existirem no snapshot
    try {
      const { data: studentFull } = await admin
        .from('students')
        .select('name, birth_date, gender')
        .eq('id', alunoId)
        .maybeSingle()

      const answersToUpsert: any[] = []
      if (studentFull?.name) {
        answersToUpsert.push({ anamnese_version_id: version.id, key: 'nome', value: studentFull.name })
      }
      if (studentFull?.birth_date) {
        const birth = new Date(studentFull.birth_date as any)
        const now = new Date()
        let age = now.getFullYear() - birth.getFullYear()
        const m = now.getMonth() - birth.getMonth()
        if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--
        answersToUpsert.push({ anamnese_version_id: version.id, key: 'idade', value: age })
      }
      if (studentFull?.gender) {
        answersToUpsert.push({ anamnese_version_id: version.id, key: 'sexo', value: studentFull.gender })
      }
      if (answersToUpsert.length > 0) {
        await admin.from('anamnese_answers').insert(
          answersToUpsert.map((a) => ({
            tenant_id: student.tenant_id,
            ...a,
            answered_at: new Date().toISOString()
          }))
        )
      }
    } catch {}

    // Criar Anexo ANAMNESE_TNA (usando storage lógico em tabela de invites para link público)
    const { data: invite, error: invErr } = await admin
      .from('anamnese_invites')
      .insert({
        token,
        student_id: alunoId,
        service_id: serviceId,
        phone: 'placeholder',
        status: 'draft',
        expires_at: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(),
        tenant_id: student.tenant_id,
        message_sent: waShareText
      })
      .select('id')
      .single()
    if (invErr || !invite) return NextResponse.json({ error: 'Falha ao criar anexo invite' }, { status: 500 })

    return NextResponse.json({
      ok: true,
      anexoId: invite.id,
      versionId: version.id,
      public_link: publicLink,
      code,
      destino: destino || 'ALUNO',
      correlationId
    })
  } catch (e) {
    return NextResponse.json({ error: 'Erro interno', correlationId }, { status: 500 })
  }
}



