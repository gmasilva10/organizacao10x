import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { resolveRequestContext } from '@/server/context'
import { z } from 'zod'
import { normalizeToE164DigitsBR } from '@/lib/phone-normalize'

const WRITERS = new Set(['admin', 'manager'])

// Schema de validaÃ§Ã£o para atualizaÃ§Ã£o completa
const updateProfessionalSchema = z.object({
  full_name: z.string().min(1, 'Nome completo Ã© obrigatÃ³rio'),
  cpf: z.string().min(1, 'CPF Ã© obrigatÃ³rio'),
  sex: z.enum(['M', 'F', 'Outro']),
  birth_date: z.string().min(1, 'Data de nascimento Ã© obrigatÃ³ria'),
  whatsapp_personal: z.string().optional(),
  whatsapp_work: z.string().min(1, 'WhatsApp profissional Ã© obrigatÃ³rio'),
  email: z.string().email('E-mail invÃ¡lido'),
  profile_id: z.number().int().positive('Perfil Ã© obrigatÃ³rio'),
  notes: z.string().optional()
})

// Schema de validaÃ§Ã£o para toggle de status (apenas is_active)
const toggleStatusSchema = z.object({
  is_active: z.boolean()
})

// FunÃ§Ã£o para validar CPF
function validateCPF(cpf: string): boolean {
  const cleanCPF = cpf.replace(/\D/g, '')
  if (cleanCPF.length !== 11) return false
  if (/^(\d)\1{10}$/.test(cleanCPF)) return false
  
  let sum = 0
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (10 - i)
  }
  let remainder = (sum * 10) % 11
  if (remainder === 10 || remainder === 11) remainder = 0
  if (remainder !== parseInt(cleanCPF.charAt(9))) return false
  
  sum = 0
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (11 - i)
  }
  remainder = (sum * 10) % 11
  if (remainder === 10 || remainder === 11) remainder = 0
  if (remainder !== parseInt(cleanCPF.charAt(10))) return false
  
  return true
}

// FunÃ§Ã£o para validar WhatsApp
function validateWhatsApp(whatsapp: string): boolean {
  const cleanWhatsApp = whatsapp.replace(/\D/g, '')
  // Aceita nÃºmeros brasileiros com ou sem cÃ³digo do paÃ­s (55)
  // Formato: (XX) XXXXX-XXXX (11 dÃ­gitos) ou 55XXXXXXXXXXX (13 dÃ­gitos)
  return (cleanWhatsApp.length === 11 && cleanWhatsApp.startsWith('1')) || 
         (cleanWhatsApp.length === 13 && cleanWhatsApp.startsWith('55'))
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await resolveRequestContext(request)
  if (!ctx) return NextResponse.json({ error: "unauthorized" }, { status: 401 })

  if (!WRITERS.has(ctx.role)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 })
  }

  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
  if (!url || !key) return NextResponse.json({ error: "service_unavailable" }, { status: 503 })

  const supabase = createClient(url, key)
  const { id } = await params
  const professionalId = parseInt(id)

  if (isNaN(professionalId)) {
    return NextResponse.json({ error: "invalid_id" }, { status: 400 })
  }

  try {
    const body = await request.json()
    
    // Detectar se Ã© uma atualizaÃ§Ã£o de status (apenas is_active)
    const isStatusUpdate = body.hasOwnProperty('is_active') && Object.keys(body).length === 1
    
    if (isStatusUpdate) {
      // AtualizaÃ§Ã£o apenas de status
      const statusData = toggleStatusSchema.parse(body)
      
      // Verificar se o profissional existe e pertence ao tenant
      const { data: existingProfessional, error: fetchError } = await supabase
        .from('professionals')
        .select('id, tenant_id, full_name')
        .eq('id', professionalId)
        .eq('tenant_id', ctx.tenantId)
        .single()

      if (fetchError || !existingProfessional) {
        return NextResponse.json({ error: "professional_not_found" }, { status: 404 })
      }

      // Atualizar apenas is_active
      const { data: updatedProfessional, error: updateError } = await supabase
        .from('professionals')
        .update({
          is_active: statusData.is_active,
          updated_at: new Date().toISOString()
        })
        .eq('id', professionalId)
        .eq('tenant_id', ctx.tenantId)
        .select(`
          id,
          full_name,
          is_active,
          professional_profiles!inner(name)
        `)
        .single()

      if (updateError) {
        console.error('Erro ao atualizar status do profissional:', updateError)
        return NextResponse.json({ error: "database_error" }, { status: 500 })
      }

      return NextResponse.json({ 
        professional: updatedProfessional,
        message: `Profissional ${statusData.is_active ? 'ativado' : 'inativado'} com sucesso`
      })
    }
    
    // AtualizaÃ§Ã£o completa (validaÃ§Ã£o existente)
    const validatedData = updateProfessionalSchema.parse(body)
    
    // Validar CPF
    if (!validateCPF(validatedData.cpf)) {
      return NextResponse.json({ error: "invalid_cpf" }, { status: 400 })
    }
    
    // Normalizar WhatsApp profissional (aceita 10/11 dÃ­gitos BR)
    const workNorm = normalizeToE164DigitsBR(validatedData.whatsapp_work)
    if (!workNorm.ok || !workNorm.value) {
      return NextResponse.json({ error: "invalid_whatsapp_work" }, { status: 400 })
    }
    // Normalizar WhatsApp pessoal se fornecido
    let personalNorm: string | null = null
    if (validatedData.whatsapp_personal) {
      const p = normalizeToE164DigitsBR(validatedData.whatsapp_personal)
      if (p.ok && p.value) personalNorm = p.value
    }

    // Verificar se o profissional existe e pertence ao tenant
    const { data: existingProfessional, error: fetchError } = await supabase
      .from('professionals')
      .select('id, tenant_id, email, cpf')
      .eq('id', professionalId)
      .eq('tenant_id', ctx.tenantId)
      .single()

    if (fetchError || !existingProfessional) {
      return NextResponse.json({ error: "professional_not_found" }, { status: 404 })
    }

    // Verificar se o email jÃ¡ existe em outro profissional
    if (validatedData.email !== existingProfessional.email) {
      const { data: emailExists } = await supabase
        .from('professionals')
        .select('id')
        .eq('tenant_id', ctx.tenantId)
        .eq('email', validatedData.email)
        .neq('id', professionalId)
        .single()

      if (emailExists) {
        return NextResponse.json({ error: "email_already_exists" }, { status: 400 })
      }
    }

    // Verificar se o CPF jÃ¡ existe em outro profissional
    if (validatedData.cpf !== existingProfessional.cpf) {
      const { data: cpfExists } = await supabase
        .from('professionals')
        .select('id')
        .eq('tenant_id', ctx.tenantId)
        .eq('cpf', validatedData.cpf)
        .neq('id', professionalId)
        .single()

      if (cpfExists) {
        return NextResponse.json({ error: "cpf_already_exists" }, { status: 400 })
      }
    }

    // Atualizar profissional
    const { data: updatedProfessional, error: updateError } = await supabase
      .from('professionals')
      .update({
        full_name: validatedData.full_name,
        cpf: validatedData.cpf,
        sex: validatedData.sex,
        birth_date: validatedData.birth_date,
        whatsapp_personal: personalNorm,
        whatsapp_work: workNorm.value,
        email: validatedData.email,
        profile_id: validatedData.profile_id,
        notes: validatedData.notes || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', professionalId)
      .eq('tenant_id', ctx.tenantId)
      .select(`
        *,
        professional_profiles!inner(name)
      `)
      .single()

    if (updateError) {
      console.error('Erro ao atualizar profissional:', updateError)
      return NextResponse.json({ error: "database_error" }, { status: 500 })
    }

    return NextResponse.json({ 
      professional: updatedProfessional,
      message: "Profissional atualizado com sucesso"
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: "validation_error", 
        details: error.issues 
      }, { status: 400 })
    }
    
    console.error('Erro inesperado:', error)
    return NextResponse.json({ error: "internal_error" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await resolveRequestContext(request)
  if (!ctx) return NextResponse.json({ error: "unauthorized" }, { status: 401 })

  if (!WRITERS.has(ctx.role)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 })
  }

  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
  if (!url || !key) return NextResponse.json({ error: "service_unavailable" }, { status: 503 })

  const supabase = createClient(url, key)
  const { id } = await params
  const professionalId = parseInt(id)

  if (isNaN(professionalId)) {
    return NextResponse.json({ error: "invalid_id" }, { status: 400 })
  }

  try {
    // Verificar se o profissional existe e pertence ao tenant
    const { data: existingProfessional, error: fetchError } = await supabase
      .from('professionals')
      .select('id, tenant_id, full_name')
      .eq('id', professionalId)
      .eq('tenant_id', ctx.tenantId)
      .single()

    if (fetchError || !existingProfessional) {
      return NextResponse.json({ error: "professional_not_found" }, { status: 404 })
    }

    // Deletar profissional
    const { error: deleteError } = await supabase
      .from('professionals')
      .delete()
      .eq('id', professionalId)
      .eq('tenant_id', ctx.tenantId)

    if (deleteError) {
      console.error('Erro ao deletar profissional:', deleteError)
      return NextResponse.json({ error: "database_error" }, { status: 500 })
    }

    return NextResponse.json({ 
      message: "Profissional deletado com sucesso"
    })

  } catch (error) {
    console.error('Erro inesperado:', error)
    return NextResponse.json({ error: "internal_error" }, { status: 500 })
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await resolveRequestContext(request)
  if (!ctx) return NextResponse.json({ error: "unauthorized" }, { status: 401 })

  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
  if (!url || !key) return NextResponse.json({ error: "service_unavailable" }, { status: 503 })

  const supabase = createClient(url, key)
  const { id } = await params
  const professionalId = parseInt(id)

  if (isNaN(professionalId)) {
    return NextResponse.json({ error: "invalid_id" }, { status: 400 })
  }

  try {
    const { data: professional, error } = await supabase
      .from('professionals')
      .select(`
        *,
        professional_profiles!inner(name)
      `)
      .eq('id', professionalId)
      .eq('tenant_id', ctx.tenantId)
      .single()

    if (error || !professional) {
      return NextResponse.json({ error: "professional_not_found" }, { status: 404 })
    }

    return NextResponse.json({ professional })

  } catch (error) {
    console.error('Erro inesperado:', error)
    return NextResponse.json({ error: "internal_error" }, { status: 500 })
  }
}
