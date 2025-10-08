import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { resolveRequestContext } from '@/server/context'

// GET /api/team/defaults - Buscar defaults de responsáveis
export async function GET(request: NextRequest) {
  const ctx = await resolveRequestContext(request)
  if (!ctx) return NextResponse.json({ error: "unauthorized" }, { status: 401 })

  try {
    const url = process.env.SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
    if (!url || !key) return NextResponse.json({ error: "service_unavailable" }, { status: 503 })

    const supabase = createClient(url, key)

    // Buscar defaults de responsáveis
    const { data: defaults, error: defaultsError } = await supabase
      .from('student_defaults')
      .select(`
        id,
        principal_professional_id,
        apoio_professional_ids,
        especificos_professional_ids
      `)
      .eq('org_id', ctx.tenantId)
      .single()

    if (defaultsError && defaultsError.code !== 'PGRST116') {
      console.error('Erro ao buscar defaults:', defaultsError)
      return NextResponse.json({ error: 'Erro ao buscar defaults' }, { status: 500 })
    }

    // Se não há defaults, retornar estrutura vazia
    if (!defaults) {
      return NextResponse.json({
        defaults: {
          principal: null,
          apoio: [],
          especificos: []
        }
      })
    }

    // Buscar todos os profissionais dos defaults
    const allProfessionalIds = [
      ...(defaults.principal_professional_id ? [defaults.principal_professional_id] : []),
      ...(defaults.apoio_professional_ids || []),
      ...(defaults.especificos_professional_ids || [])
    ]

    let principalProfessional: any = null
    let apoioProfessionals: any[] = []
    let especificosProfessionals: any[] = []

    if (allProfessionalIds.length > 0) {
      const { data: professionals, error: professionalsError } = await supabase
        .from('professionals')
        .select('id, full_name, email, whatsapp_work, is_active')
        .in('id', allProfessionalIds)
        .eq('org_id', ctx.tenantId)
        .eq('is_active', true)

      if (!professionalsError && professionals) {
        principalProfessional = professionals.find(p => 
          p.id === defaults.principal_professional_id
        ) || null
        apoioProfessionals = professionals.filter(p => 
          defaults.apoio_professional_ids?.includes(p.id)
        )
        especificosProfessionals = professionals.filter(p => 
          defaults.especificos_professional_ids?.includes(p.id)
        )
      }
    }

    const organized = {
      principal: principalProfessional,
      apoio: apoioProfessionals,
      especificos: especificosProfessionals
    }

    return NextResponse.json({
      defaults: organized,
      total: (principalProfessional ? 1 : 0) + apoioProfessionals.length + especificosProfessionals.length
    })

  } catch (error: any) {
    console.error('Erro na API /team/defaults:', error)
    return NextResponse.json({ 
      error: 'Erro interno do servidor',
      details: error.message 
    }, { status: 500 })
  }
}

// POST /api/team/defaults - Salvar defaults de responsáveis
export async function POST(request: NextRequest) {
  const ctx = await resolveRequestContext(request)
  if (!ctx) return NextResponse.json({ error: "unauthorized" }, { status: 401 })

  try {
    const body = await request.json()
    const { principal, apoio, especificos } = body

    const url = process.env.SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
    if (!url || !key) return NextResponse.json({ error: "service_unavailable" }, { status: 503 })

    const supabase = createClient(url, key)

    // Validar dados
    const principalId = principal?.id ? parseInt(principal.id) : null
    const apoioIds = Array.isArray(apoio) ? apoio.map(p => parseInt(p.id)).filter(id => !isNaN(id)) : []
    const especificosIds = Array.isArray(especificos) ? especificos.map(p => parseInt(p.id)).filter(id => !isNaN(id)) : []

    // Verificar se os profissionais existem e estão ativos
    const allIds = [principalId, ...apoioIds, ...especificosIds].filter(id => id !== null)
    
    if (allIds.length > 0) {
      const { data: professionals, error: professionalsError } = await supabase
        .from('professionals')
        .select('id, full_name, is_active')
        .in('id', allIds)
        .eq('org_id', ctx.tenantId)

      if (professionalsError) {
        console.error('Erro ao verificar profissionais:', professionalsError)
        return NextResponse.json({ error: 'Erro ao verificar profissionais' }, { status: 500 })
      }

      const foundIds = professionals?.map(p => p.id) || []
      const missingIds = allIds.filter(id => !foundIds.includes(id))
      
      if (missingIds.length > 0) {
        return NextResponse.json({ error: 'Alguns profissionais não foram encontrados' }, { status: 400 })
      }

      const inactiveProfessionals = professionals?.filter(p => !p.is_active) || []
      if (inactiveProfessionals.length > 0) {
        return NextResponse.json({ error: 'Alguns profissionais estão inativos' }, { status: 400 })
      }
    }

    // Upsert (atualizar ou criar) os defaults
    const { data: defaults, error: upsertError } = await supabase
      .from('student_defaults')
      .upsert({
        org_id: ctx.tenantId,
        principal_professional_id: principalId,
        apoio_professional_ids: apoioIds,
        especificos_professional_ids: especificosIds,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'org_id'
      })
      .select(`
        id,
        principal_professional_id,
        apoio_professional_ids,
        especificos_professional_ids
      `)
      .single()

    if (upsertError) {
      console.error('Erro ao salvar defaults:', upsertError)
      return NextResponse.json({ error: 'Erro ao salvar defaults' }, { status: 500 })
    }

    // Buscar os profissionais completos para retornar
    const allProfessionalIds = [
      ...(defaults.principal_professional_id ? [defaults.principal_professional_id] : []),
      ...(defaults.apoio_professional_ids || []),
      ...(defaults.especificos_professional_ids || [])
    ]

    let principalProfessionals: any[] = []
    let apoioProfessionals: any[] = []
    let especificosProfessionals: any[] = []

    if (allProfessionalIds.length > 0) {
      const { data: professionals, error: professionalsError } = await supabase
        .from('professionals')
        .select('id, full_name, email, whatsapp_work, is_active')
        .in('id', allProfessionalIds)
        .eq('org_id', ctx.tenantId)
        .eq('is_active', true)

      if (!professionalsError && professionals) {
        principalProfessionals = professionals.filter(p => 
          p.id === defaults.principal_professional_id
        )
        apoioProfessionals = professionals.filter(p => 
          defaults.apoio_professional_ids?.includes(p.id)
        )
        especificosProfessionals = professionals.filter(p => 
          defaults.especificos_professional_ids?.includes(p.id)
        )
      }
    }

    const organizedDefaults = {
      principal: principalProfessionals[0] || null,
      apoio: apoioProfessionals,
      especificos: especificosProfessionals
    }

    return NextResponse.json({
      defaults: organizedDefaults,
      message: 'Defaults salvos com sucesso'
    })

  } catch (error: any) {
    console.error('Erro na API POST /team/defaults:', error)
    return NextResponse.json({ 
      error: 'Erro interno do servidor',
      details: error.message 
    }, { status: 500 })
  }
}

