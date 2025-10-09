import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { resolveRequestContext } from '@/server/context'
import { z } from 'zod'
import { v4 as uuidv4 } from 'uuid'

const WRITERS = new Set(['admin', 'manager'])

// Schema de validação para criação de serviços
const CreateServiceSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').max(100, 'Nome muito longo'),
  type: z.enum(['plan', 'consultation', 'training', 'other']).default('plan'),
  status: z.enum(['active', 'paused', 'ended']).default('active'),
  price_cents: z.number().int().min(0, 'Preço deve ser positivo'),
  currency: z.string().length(3, 'Moeda deve ter 3 caracteres').default('BRL'),
  discount_amount_cents: z.number().int().min(0).optional(),
  discount_pct: z.number().min(0).max(100).optional(),
  purchase_status: z.enum(['pending', 'paid', 'overdue', 'canceled']).default('paid'),
  payment_method: z.enum(['card', 'pix', 'boleto', 'cash', 'other']).optional(),
  installments: z.number().int().min(1).max(60).optional(),
  billing_cycle: z.enum(['one_off', 'daily', 'weekly', 'monthly', 'quarterly', 'yearly']).default('one_off'),
  start_date: z.string().datetime('Data de início inválida'),
  end_date: z.string().datetime('Data de fim inválida').optional(),
  notes: z.string().max(500, 'Notas muito longas').optional(),
  is_active: z.boolean().default(true),
  idempotency_key: z.string().uuid('Chave de idempotência inválida').optional()
})

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const correlationId = uuidv4()
  const startTime = Date.now()
  
  const ctx = await resolveRequestContext(request)
  if (!ctx) {
    console.log(`[${correlationId}] GET /api/students/${params.id}/services - Unauthorized`)
    return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  }

  console.log(`[${correlationId}] GET /api/students/${params.id}/services - Start`, {
    studentId: params.id,
    orgId: ctx.org_id,
    role: ctx.role
  })

  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
  if (!url || !key) {
    console.error(`[${correlationId}] Missing Supabase credentials`)
    return NextResponse.json({ error: "service_unavailable" }, { status: 503 })
  }

  const supabase = createClient(url, key)

  try {
    const { data: services, error } = await supabase
      .from('student_services')
      .select(`
        *,
        plans:name (
          nome,
          descricao,
          valor,
          moeda,
          ciclo,
          duracao_em_ciclos
        )
      `)
      .eq('student_id', params.id)
      .eq('org_id', ctx.org_id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error(`[${correlationId}] Database error:`, error)
      return NextResponse.json({ 
        error: "database_error",
        correlationId,
        details: error.message 
      }, { status: 500 })
    }

    const duration = Date.now() - startTime
    console.log(`[${correlationId}] GET /api/students/${params.id}/services - Success`, {
      servicesCount: services?.length || 0,
      duration: `${duration}ms`
    })

    return NextResponse.json({ 
      services,
      correlationId,
      meta: {
        count: services?.length || 0,
        duration: `${duration}ms`
      }
    })
  } catch (error) {
    const duration = Date.now() - startTime
    console.error(`[${correlationId}] Unexpected error:`, error, { duration: `${duration}ms` })
    return NextResponse.json({ 
      error: "internal_error",
      correlationId,
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const correlationId = uuidv4()
  const startTime = Date.now()
  
  const ctx = await resolveRequestContext(request)
  if (!ctx) {
    console.log(`[${correlationId}] POST /api/students/${params.id}/services - Unauthorized`)
    return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  }
  
  if (!WRITERS.has(ctx.role)) {
    console.log(`[${correlationId}] POST /api/students/${params.id}/services - Forbidden`, {
      role: ctx.role,
      requiredRoles: Array.from(WRITERS)
    })
    return NextResponse.json({ error: "forbidden" }, { status: 403 })
  }

  console.log(`[${correlationId}] POST /api/students/${params.id}/services - Start`, {
    studentId: params.id,
    orgId: ctx.org_id,
    role: ctx.role
  })

  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
  if (!url || !key) {
    console.error(`[${correlationId}] Missing Supabase credentials`)
    return NextResponse.json({ error: "service_unavailable" }, { status: 503 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch (error) {
    console.error(`[${correlationId}] Invalid JSON payload:`, error)
    return NextResponse.json({ 
      error: "invalid_payload",
      correlationId,
      details: "Invalid JSON in request body"
    }, { status: 400 })
  }

  // Validação com Zod
  const validationResult = CreateServiceSchema.safeParse(body)
  if (!validationResult.success) {
    console.error(`[${correlationId}] Validation error:`, validationResult.error.issues)
    return NextResponse.json({
      error: "validation_error",
      correlationId,
      details: validationResult.error.issues
    }, { status: 400 })
  }

  const validatedData = validationResult.data
  const supabase = createClient(url, key)

  try {
    // Verificar se o aluno existe
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('id, name')
      .eq('id', params.id)
      .eq('org_id', ctx.org_id)
      .single()

    if (studentError || !student) {
      console.error(`[${correlationId}] Student not found:`, studentError)
      return NextResponse.json({ 
        error: "student_not_found",
        correlationId,
        details: "Student not found or access denied"
      }, { status: 404 })
    }

    // Verificar idempotência se fornecida
    if (validatedData.idempotency_key) {
      const { data: existingService } = await supabase
        .from('student_services')
        .select('id, name, created_at')
        .eq('org_id', ctx.org_id)
        .eq('student_id', params.id)
        .eq('idempotency_key', validatedData.idempotency_key)
        .single()

      if (existingService) {
        console.log(`[${correlationId}] Idempotent request - returning existing service`, {
          serviceId: existingService.id,
          serviceName: existingService.name
        })
        return NextResponse.json({
          success: true,
          message: 'Serviço já existe (idempotência)',
          service: existingService,
          correlationId,
          idempotent: true
        })
      }
    }

    // Criar serviço
    const serviceData = {
      org_id: ctx.org_id,
      student_id: params.id,
      name: validatedData.name,
      type: validatedData.type,
      status: validatedData.status,
      price_cents: validatedData.price_cents,
      currency: validatedData.currency,
      discount_amount_cents: validatedData.discount_amount_cents || null,
      discount_pct: validatedData.discount_pct || null,
      purchase_status: validatedData.purchase_status,
      payment_method: validatedData.payment_method || null,
      installments: validatedData.installments || null,
      billing_cycle: validatedData.billing_cycle,
      start_date: validatedData.start_date,
      end_date: validatedData.end_date || null,
      notes: validatedData.notes || null,
      is_active: validatedData.is_active,
      idempotency_key: validatedData.idempotency_key || uuidv4(),
      created_by: ctx.userId
    }

    const { data: service, error: createError } = await supabase
      .from('student_services')
      .insert(serviceData)
      .select()
      .single()

    if (createError) {
      console.error(`[${correlationId}] Database error creating service:`, createError)
      return NextResponse.json({ 
        error: "database_error",
        correlationId,
        details: createError.message
      }, { status: 500 })
    }

    const duration = Date.now() - startTime
    console.log(`[${correlationId}] POST /api/students/${params.id}/services - Success`, {
      serviceId: service.id,
      serviceName: service.name,
      duration: `${duration}ms`
    })

    return NextResponse.json({ 
      success: true, 
      message: 'Serviço criado com sucesso',
      service,
      correlationId,
      meta: {
        duration: `${duration}ms`
      }
    })
  } catch (error) {
    const duration = Date.now() - startTime
    console.error(`[${correlationId}] Unexpected error:`, error, { duration: `${duration}ms` })
    return NextResponse.json({ 
      error: "internal_error",
      correlationId,
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}