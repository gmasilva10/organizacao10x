import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { resolveRequestContext } from '@/server/context'
import { z } from 'zod'

const WRITERS = new Set(['admin', 'manager'])

const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  userProfile: z.string(),
  isActive: z.boolean()
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await resolveRequestContext(request)
  if (!ctx) return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  if (!WRITERS.has(ctx.role)) return NextResponse.json({ error: "forbidden" }, { status: 403 })

  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
  if (!url || !key) return NextResponse.json({ error: "service_unavailable" }, { status: 503 })

  const supabase = createClient(url, key)
  const { id } = await params
  const professionalId = parseInt(id)

  if (isNaN(professionalId)) {
    return NextResponse.json({ error: "invalid_id" }, { status: 400 })
  }

  const body = await request.json()
  const parsedBody = createUserSchema.safeParse(body)

  if (!parsedBody.success) {
    return NextResponse.json({ error: parsedBody.error.flatten() }, { status: 400 })
  }

  const { email, password, userProfile, isActive } = parsedBody.data

  try {
    // 1. Buscar o profissional para garantir que existe e pertence ao tenant
    const { data: professional, error: fetchProfessionalError } = await supabase
      .from('professionals')
      .select('id, email, user_id')
      .eq('id', professionalId)
      .eq('org_id', ctx.tenantId)
      .single()

    if (fetchProfessionalError) {
      if (fetchProfessionalError.code === 'PGRST116') {
        return NextResponse.json({ error: "professional_not_found" }, { status: 404 })
      }
      console.error('Erro ao buscar profissional:', fetchProfessionalError)
      return NextResponse.json({ error: "database_error" }, { status: 500 })
    }

    if (professional.user_id) {
      return NextResponse.json({ error: "professional_already_has_user" }, { status: 409 })
    }

    // 2. Verificar se o email já existe como usuário no auth.users
    const { data: existingUser, error: userError } = await (supabase.auth.admin as any).getUserByEmail(email)

    if (userError && userError.message !== 'User not found') {
      console.error('Erro ao verificar usuário existente:', userError)
      return NextResponse.json({ error: "database_error" }, { status: 500 })
    }

    let user_id = null

    if (existingUser?.user) {
      // Verificar se o usuário já está vinculado a outro profissional
      const { data: linkedProfessional, error: linkCheckError } = await supabase
        .from('professionals')
        .select('id, full_name')
        .eq('user_id', existingUser.user.id)
        .single()

      if (linkCheckError && linkCheckError.code !== 'PGRST116') {
        console.error('Erro ao verificar vínculo existente:', linkCheckError)
        return NextResponse.json({ error: "database_error" }, { status: 500 })
      }

      if (linkedProfessional) {
        return NextResponse.json({
          error: "email_already_linked",
          message: `E-mail já vinculado ao profissional: ${linkedProfessional.full_name}`
        }, { status: 409 })
      }

      user_id = existingUser.user.id

      // CRÍTICO: Garantir que o membership esteja correto para este tenant
      const { data: existingMembership, error: membershipCheckError } = await supabase
        .from('memberships')
        .select('id, role, status')
        .eq('user_id', user_id)
        .eq('org_id', ctx.tenantId)
        .single()

      if (membershipCheckError && membershipCheckError.code !== 'PGRST116') {
        console.error('Erro ao verificar membership existente:', membershipCheckError)
        return NextResponse.json({ error: "database_error" }, { status: 500 })
      }

      if (existingMembership) {
        // Atualizar membership existente com role e status corretos
        const { error: updateMembershipError } = await supabase
          .from('memberships')
          .update({
            role: userProfile,
            status: isActive ? 'active' : 'inactive',
            updated_at: new Date().toISOString()
          })
          .eq('id', existingMembership.id)

        if (updateMembershipError) {
          console.error('Erro ao atualizar membership:', updateMembershipError)
          return NextResponse.json({ error: "membership_update_failed" }, { status: 500 })
        }
      } else {
        // Criar membership se não existir
        const { error: createMembershipError } = await supabase
          .from('memberships')
          .insert({
            user_id,
            tenant_id: ctx.tenantId,
            role: userProfile,
            status: isActive ? 'active' : 'inactive'
          })

        if (createMembershipError) {
          console.error('Erro ao criar membership:', createMembershipError)
          return NextResponse.json({ error: "membership_creation_failed" }, { status: 500 })
        }
      }
    } else {
      // Criar novo usuário
      const { data: newUser, error: createUserError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true
      })

      if (createUserError) {
        console.error('Erro ao criar usuário:', createUserError)
        return NextResponse.json({ error: "user_creation_failed" }, { status: 500 })
      }

      user_id = newUser.user?.id

      // Criar membership com role definido
      const { error: membershipError } = await supabase
        .from('memberships')
        .insert({
          user_id,
          tenant_id: ctx.tenantId,
          role: userProfile,
          status: isActive ? 'active' : 'inactive'
        })

      if (membershipError) {
        console.error('Erro ao criar membership:', membershipError)
        return NextResponse.json({ error: "membership_creation_failed" }, { status: 500 })
      }
    }

    // 3. Vincular user_id ao profissional
    const { data: updatedProfessional, error: updateError } = await supabase
      .from('professionals')
      .update({ user_id, updated_at: new Date().toISOString() })
      .eq('id', professionalId)
      .eq('org_id', ctx.tenantId)
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
      message: 'Usuário criado com sucesso',
      professional: updatedProfessional
    })

  } catch (error) {
    console.error('Erro inesperado:', error)
    return NextResponse.json({ error: "internal_error" }, { status: 500 })
  }
}
