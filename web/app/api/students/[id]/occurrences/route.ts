import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { z } from 'zod'
import { auditLogger } from '@/lib/audit-logger'

// Forçar execução dinâmica para evitar problemas de renderização estática
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;


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
    const startTime = Date.now()
    
    // Proxy para a rota canônica /api/occurrences
    const body = await request.json()
    
    // Adicionar student_id ao payload
    const payloadWithStudentId = {
      ...body,
      student_id: studentId
    }
    
    // Fazer proxy para /api/occurrences
    const response = await fetch(`${request.nextUrl.origin}/api/occurrences`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': request.headers.get('Authorization') || '',
        'Cookie': request.headers.get('Cookie') || ''
      },
      body: JSON.stringify(payloadWithStudentId)
    })
    
    const responseData = await response.json()
    const endTime = Date.now()
    const queryTime = endTime - startTime
    
    const nextResponse = NextResponse.json(responseData, { status: response.status })
    nextResponse.headers.set('X-Query-Time', `${queryTime}ms`)
    
    return nextResponse
  } catch (error) {
    console.error('Erro no proxy de ocorrências:', error)
    return NextResponse.json({ 
      error: 'Erro interno do servidor', 
      details: 'Ocorreu um erro inesperado. Tente novamente em alguns instantes.' 
    }, { status: 500 })
  }
}
