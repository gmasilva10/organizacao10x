import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { resolveRequestContext } from '@/server/context'

const WRITERS = new Set(['admin', 'manager'])

export async function POST(
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
    const { email } = body

    if (!email) {
      return NextResponse.json({ error: "email_required" }, { status: 400 })
    }

    // Verificar se o profissional existe e pertence ao tenant
    const { data: professional, error: fetchError } = await supabase
      .from('professionals')
      .select('id, org_id, email, user_id')
      .eq('id', professionalId)
      .eq('org_id', ctx.org_id)
      .single()

    if (fetchError || !professional) {
      return NextResponse.json({ error: "professional_not_found" }, { status: 404 })
    }

    // Verificar se jÃ¡ estÃ¡ vinculado
    if (professional.user_id) {
      return NextResponse.json({ error: "already_linked" }, { status: 400 })
    }

    // Verificar se usuÃ¡rio jÃ¡ existe
    const { data: existingUser, error: userError } = await (supabase.auth.admin as any).getUserByEmail(email)

    if (userError && userError.code !== 'PGRST116') {
      console.error('Erro ao verificar usuÃ¡rio:', userError)
      return NextResponse.json({ error: "database_error" }, { status: 500 })
    }

    let user_id = null
    let tempPassword = null

    if (existingUser) {
      // Verificar se usuÃ¡rio jÃ¡ estÃ¡ vinculado a outro profissional
      const { data: linkedProfessional, error: linkError } = await supabase
        .from('professionals')
        .select('id, full_name')
        .eq('user_id', existingUser.id)
        .single()

      if (linkError && linkError.code !== 'PGRST116') {
        console.error('Erro ao verificar vÃ­nculo:', linkError)
        return NextResponse.json({ error: "database_error" }, { status: 500 })
      }

      if (linkedProfessional) {
        return NextResponse.json({ 
          error: "email_already_linked", 
          message: `E-mail jÃ¡ vinculado ao profissional: ${linkedProfessional.full_name}` 
        }, { status: 409 })
      }

      user_id = existingUser.id
    } else {
      // Gerar senha temporÃ¡ria
      const randomDigits = Math.floor(1000 + Math.random() * 9000)
      tempPassword = `Temp${randomDigits}!`

      // Criar usuÃ¡rio
      const { data: newUser, error: createUserError } = await supabase.auth.admin.createUser({
        email,
        password: tempPassword,
        email_confirm: true
      })

      if (createUserError) {
        console.error('Erro ao criar usuÃ¡rio:', createUserError)
        return NextResponse.json({ error: "user_creation_failed" }, { status: 500 })
      }

      user_id = newUser.user?.id

      // Criar membership com role trainer
      const { error: membershipError } = await supabase
        .from('memberships')
        .insert({
          user_id,
          org_id: ctx.org_id,
          role: 'trainer',
          status: 'active'
        })

      if (membershipError) {
        console.error('Erro ao criar membership:', membershipError)
        return NextResponse.json({ error: "membership_creation_failed" }, { status: 500 })
      }
    }

    // Atualizar profissional com user_id
    const { data: updatedProfessional, error: updateError } = await supabase
      .from('professionals')
      .update({
        user_id,
        updated_at: new Date().toISOString()
      })
      .eq('id', professionalId)
      .eq('org_id', ctx.org_id)
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
      success: true,
      message: 'Acesso criado com sucesso',
      professional: updatedProfessional,
      tempPassword: tempPassword ? {
        password: tempPassword,
        message: 'UsuÃ¡rio criado com senha temporÃ¡ria'
      } : null
    })

  } catch (error) {
    console.error('Erro inesperado:', error)
    return NextResponse.json({ error: "internal_error" }, { status: 500 })
  }
}
