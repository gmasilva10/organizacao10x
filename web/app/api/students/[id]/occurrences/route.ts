import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { z } from 'zod'
import { auditLogger } from '@/lib/audit-logger'

const createOccurrenceSchema = z.object({
  group_id: z.number().int().positive('ID do grupo deve ser um número positivo'),
  type_id: z.number().int().positive('ID do tipo deve ser um número positivo'),
  occurred_at: z.string().refine((date) => {
    const occurrenceDate = new Date(date)
    const today = new Date()
    today.setHours(23, 59, 59, 999) // Fim do dia de hoje
    return occurrenceDate <= today
  }, {
    message: "Data da ocorrência não pode ser futura"
  }),
  notes: z.string().min(5, 'Notas devem ter pelo menos 5 caracteres').max(500, 'Notas devem ter no máximo 500 caracteres'),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  is_sensitive: z.boolean().default(false),
  owner_user_id: z.string().uuid('ID do responsável deve ser um UUID válido'),
  reminder_at: z.string().datetime().optional(),
  reminder_status: z.enum(['PENDING', 'DONE', 'CANCELLED']).default('PENDING')
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: studentId } = await params
    const supabase = await createClient()
    
    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Verificar membership
    const { data: membership } = await supabase
      .from('memberships')
      .select('tenant_id, role')
      .eq('user_id', user.id)
      .single()

    if (!membership) {
      return NextResponse.json({ error: 'Membro não encontrado' }, { status: 404 })
    }

    // Buscar parâmetros de filtro
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const groupId = searchParams.get('group_id')
    const typeId = searchParams.get('type_id')
    // const priority = searchParams.get('priority') // coluna indisponível no schema atual

    // Construir query
    let query = supabase
      .from('student_occurrences')
      .select(`
        id,
        occurred_at,
        notes,
        status,
        group_id,
        type_id,
        owner_user_id,
        created_at,
        updated_at
      `)
      .eq('tenant_id', membership.tenant_id)
      .eq('student_id', studentId)
      .order('occurred_at', { ascending: false })

    // Aplicar filtros
    if (status) {
      query = query.eq('status', status)
    }
    if (groupId) {
      query = query.eq('group_id', groupId)
    }
    if (typeId) {
      query = query.eq('type_id', typeId)
    }
    // if (priority) { query = query.eq('priority', priority) }

    const { data: occurrences, error } = await query

    if (error) {
      console.error('Erro ao buscar ocorrências:', error)
      return NextResponse.json({ error: 'Erro ao buscar ocorrências' }, { status: 500 })
    }

    return NextResponse.json({ occurrences })
  } catch (error) {
    console.error('Erro na API:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: studentId } = await params
    const supabase = await createClient()
    
    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Verificar membership
    const { data: membership } = await supabase
      .from('memberships')
      .select('tenant_id, role')
      .eq('user_id', user.id)
      .single()

    if (!membership) {
      return NextResponse.json({ error: 'Membro não encontrado' }, { status: 404 })
    }

    // Verificar se o aluno existe e pertence ao tenant
    const { data: student } = await supabase
      .from('students')
      .select('id')
      .eq('id', studentId)
      .eq('tenant_id', membership.tenant_id)
      .single()

    if (!student) {
      return NextResponse.json({ error: 'Aluno não encontrado' }, { status: 404 })
    }

    // Validar dados
    const body = await request.json()
    const validatedData = createOccurrenceSchema.parse(body)

    // Verificar se o grupo e tipo pertencem ao tenant
    const { data: group } = await supabase
      .from('occurrence_groups')
      .select('id')
      .eq('id', validatedData.group_id)
      .eq('tenant_id', membership.tenant_id)
      .single()

    if (!group) {
      return NextResponse.json({ 
        error: 'Grupo de ocorrência inválido', 
        details: 'O grupo selecionado não existe ou não pertence à sua organização' 
      }, { status: 400 })
    }

    const { data: type } = await supabase
      .from('occurrence_types')
      .select('id')
      .eq('id', validatedData.type_id)
      .eq('tenant_id', membership.tenant_id)
      .eq('group_id', validatedData.group_id)
      .single()

    if (!type) {
      return NextResponse.json({ 
        error: 'Tipo de ocorrência inválido', 
        details: 'O tipo selecionado não existe, não pertence ao grupo escolhido ou não está disponível em sua organização' 
      }, { status: 400 })
    }

    // Verificar se o responsável é um profissional válido
    const { data: professional } = await supabase
      .from('professionals')
      .select('user_id')
      .eq('user_id', validatedData.owner_user_id)
      .eq('tenant_id', membership.tenant_id)
      .single()

    if (!professional) {
      return NextResponse.json({ 
        error: 'Responsável inválido', 
        details: 'O responsável selecionado não existe ou não pertence à equipe da sua organização' 
      }, { status: 400 })
    }

    // Verificar se o profissional tem acesso ao aluno (se aplicável)
    // Para trainers, verificar se o aluno está atribuído a eles
    if (membership.role === 'trainer') {
      const { data: studentWithTrainer } = await supabase
        .from('students')
        .select('trainer_id')
        .eq('id', studentId)
        .eq('tenant_id', membership.tenant_id)
        .single()

      if (studentWithTrainer?.trainer_id !== validatedData.owner_user_id) {
        return NextResponse.json({ 
          error: 'Você só pode atribuir ocorrências a alunos que estão sob sua responsabilidade' 
        }, { status: 403 })
      }
    }

    // Preparar dados de lembrete
    const reminderData = validatedData.reminder_at ? {
      reminder_at: validatedData.reminder_at,
      reminder_status: validatedData.reminder_status,
      reminder_created_by: user.id
    } : {
      reminder_at: null,
      reminder_status: null,
      reminder_created_by: null
    }

    // Criar ocorrência
    const { data: newOccurrence, error } = await supabase
      .from('student_occurrences')
      .insert({
        tenant_id: membership.tenant_id,
        student_id: studentId,
        group_id: validatedData.group_id,
        type_id: validatedData.type_id,
        occurred_at: validatedData.occurred_at,
        notes: validatedData.notes,
        owner_user_id: validatedData.owner_user_id,
        priority: validatedData.priority,
        is_sensitive: validatedData.is_sensitive,
        status: 'OPEN',
        ...reminderData
      })
      .select(`
        id,
        occurred_at,
        notes,
        status,
        group_id,
        type_id,
        owner_user_id,
        reminder_at,
        reminder_status,
        reminder_created_by,
        created_at,
        updated_at
      `)
      .single()

    if (error) {
      console.error('Erro ao criar ocorrência:', error)
      return NextResponse.json({ error: 'Erro ao criar ocorrência' }, { status: 500 })
    }

    // Log de auditoria
    try {
      await auditLogger.logOccurrenceCreated(
        newOccurrence.id.toString(),
        user.id,
        membership.tenant_id,
        {
          studentId: studentId,
          groupId: validatedData.group_id,
          typeId: validatedData.type_id,
          occurredAt: validatedData.occurred_at,
          priority: validatedData.priority,
          isSensitive: validatedData.is_sensitive,
          ownerUserId: validatedData.owner_user_id
        }
      )
    } catch (auditError) {
      console.error('Erro ao registrar log de auditoria:', auditError)
      // Não falha a operação por erro de auditoria
    }

    return NextResponse.json({ 
      message: 'Ocorrência criada com sucesso',
      occurrence: newOccurrence
    }, { status: 201 })
  } catch (error) {
    console.error('Erro na API:', error)
    if (error instanceof z.ZodError) {
      const fieldMessages = error.errors.map(e => {
        const field = e.path.join('.')
        return `${field}: ${e.message}`
      }).join('; ')
      
      return NextResponse.json({ 
        error: 'Dados inválidos',
        details: fieldMessages
      }, { status: 400 })
    }
    return NextResponse.json({ 
      error: 'Erro interno do servidor', 
      details: 'Ocorreu um erro inesperado. Tente novamente em alguns instantes.' 
    }, { status: 500 })
  }
}
