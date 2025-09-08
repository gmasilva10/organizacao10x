import { NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"

// Validações helpers
function validateEmail(email: string): boolean {
  const regex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/
  return regex.test(email)
}

function validatePhone(phone: string): boolean {
  // E.164 format: +[country][number]
  const regex = /^\+?[1-9]\d{1,14}$/
  return regex.test(phone)
}

function validatePassword(password: string): boolean {
  // Mínimo 8 caracteres, 1 maiúscula, 1 minúscula, 1 número
  const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d@$!%*?&]{8,}$/
  return regex.test(password)
}

function validatePlan(plan: string): boolean {
  return ["basic", "enterprise"].includes(plan)
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    
    const { org_name, full_name, email, phone, password, plan } = body

    // Validações de entrada
    const errors: string[] = []
    
    if (!org_name || org_name.trim().length < 2) {
      errors.push("Nome da organização deve ter pelo menos 2 caracteres")
    }
    
    if (!full_name || full_name.trim().length < 2) {
      errors.push("Nome completo deve ter pelo menos 2 caracteres")
    }
    
    if (!email || !validateEmail(email)) {
      errors.push("Email deve ter um formato válido")
    }
    
    if (phone && !validatePhone(phone)) {
      errors.push("Telefone deve estar no formato E.164 (+55...)")
    }
    
    if (!password || !validatePassword(password)) {
      errors.push("Senha deve ter pelo menos 8 caracteres, incluindo maiúscula, minúscula e número")
    }
    
    // Se plan vier vazio, deixamos o DEFAULT do banco aplicar 'basic'
    const planNormalized = plan && validatePlan(plan) ? plan : undefined

    if (errors.length > 0) {
      return NextResponse.json({ 
        ok: false, 
        code: "validation_error",
        message: "Dados inválidos",
        errors 
      }, { status: 422 })
    }

    // Verificação de e-mail será tratada pelo Auth; se já existir, createUser retorna 422 e mapeamos para 409

    // === TRANSAÇÃO ATÔMICA ===
    
    // 1. Criar organização
    // Inserção de organização requer bypass de RLS. Usamos client admin (service role) apenas para esta operação.
    const { createAdminClient } = await import("@/utils/supabase/admin")
    const admin = createAdminClient()
    const { data: org, error: orgError } = await admin
      .from("tenants")
      .insert({ name: org_name.trim(), plan_code: planNormalized })
      .select("id,name,plan_code")
      .single()

    if (orgError) {
      console.error("Erro ao criar organização:", orgError)
      return NextResponse.json({ 
        ok: false, 
        code: "org_creation_failed",
        message: "Erro ao criar organização" 
      }, { status: 500 })
    }

    // 2. Criar usuário (Supabase Auth) com service role
    const { data: userData, error: userError } = await admin.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true,
      user_metadata: {
        full_name: full_name.trim(),
        phone: phone || null
      }
    })

    if (userError) {
      console.error("Erro ao criar usuário:", userError)
      // Mapear e-mail existente para 409
      const msg = (userError as any)?.message || ""
      if (msg.toLowerCase().includes("already")) {
        return NextResponse.json({ ok:false, code:"email_already_exists", message:"Este email já está sendo usado" }, { status: 409 })
      }
      // Rollback: remover organização
      await admin.from("tenants").delete().eq("id", org.id)
      return NextResponse.json({ 
        ok: false, 
        code: "user_creation_failed",
        message: "Erro ao criar conta de usuário" 
      }, { status: 500 })
    }

    const user = userData.user

    // 3. Criar perfil do usuário
    const { error: profileError } = await admin
      .from("profiles")
      .upsert({
        user_id: user.id,
        full_name: full_name.trim(),
        phone: phone || null,
        avatar_url: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' })

    if (profileError) {
      console.error("Erro ao criar perfil:", profileError)
      // Rollback
      await admin.auth.admin.deleteUser(user.id)
      await admin.from("tenants").delete().eq("id", org.id)
      return NextResponse.json({ 
        ok: false, 
        code: "profile_creation_failed",
        message: "Erro ao criar perfil" 
      }, { status: 500 })
    }

    // 4. Criar membership (vínculo user <-> org) com role admin
    // Membership: verifica se já existe para (user_id, tenant_id); se não, insere com pequena retentativa
    const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))
    let membershipError: any = null
    {
      const exists = await admin
        .from('memberships')
        .select('user_id')
        .eq('user_id', user.id)
        .eq('tenant_id', org.id)
        .maybeSingle()
      if (!exists.error && exists.data) {
        membershipError = null
      } else {
        for (let attempt = 1; attempt <= 3; attempt++) {
          const { error } = await admin
            .from("memberships")
            .insert({
              user_id: user.id,
              tenant_id: org.id,
              role: "admin",
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
          if (!error || error.code === '23505') { membershipError = null; break }
          membershipError = error
          if (error.code === '23503' && attempt < 3) { await sleep(200 * attempt); continue }
          break
        }
      }
    }

    if (membershipError) {
      console.error("Erro ao criar membership:", membershipError)
      // Rollback
      await admin.from("profiles").delete().eq("user_id", user.id)
      await admin.auth.admin.deleteUser(user.id)
      await admin.from("tenants").delete().eq("id", org.id)
      return NextResponse.json({ 
        ok: false, 
        code: "membership_creation_failed",
        message: "Erro ao vincular usuário à organização",
        details: membershipError 
      }, { status: 500 })
    }

    // 5. Criar colaborador vinculado ao usuário (responsável default)
    // Inserir colaborador; se já existir (23505), considerar ok (idempotente)
    let collaboratorError: any = null
    {
      const { error } = await admin
        .from("collaborators")
        .insert({
          org_id: org.id,
          full_name: full_name.trim(),
          email: email,
          phone: phone || null,
          role: "admin",
          status: "active",
          user_id: user.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
      if (error && error.code !== '23505') {
        collaboratorError = error
      }
    }

    if (collaboratorError) {
      console.error("Erro ao criar colaborador:", collaboratorError)
      // Rollback
      await admin.from("memberships").delete().eq("user_id", user.id)
      await admin.from("profiles").delete().eq("user_id", user.id)
      await admin.auth.admin.deleteUser(user.id)
      await admin.from("tenants").delete().eq("id", org.id)
      return NextResponse.json({ 
        ok: false, 
        code: "collaborator_creation_failed",
        message: "Erro ao criar colaborador responsável",
        details: collaboratorError
      }, { status: 500 })
    }

    // 6. Seeds funcionais da organização

    // 6a. Kanban stages default
    const defaultStages = [
      { name: "Novo", order: 1, color: "gray" },
      { name: "Avaliação", order: 2, color: "blue" },
      { name: "Plano", order: 3, color: "yellow" },
      { name: "Execução", order: 4, color: "orange" },
      { name: "Acompanhamento", order: 5, color: "green" }
    ]

    const stageInserts = defaultStages.map(stage => ({
      tenant_id: org.id,
      name: stage.name,
      order: stage.order,
      color: stage.color,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }))

    const { error: stagesError } = await admin
      .from("kanban_stages")
      .insert(stageInserts)

    if (stagesError) {
      console.warn("Erro ao criar stages default (não crítico):", stagesError)
    }

    // 6b. Serviço exemplo (opcional)
    const { error: serviceError } = await admin
      .from("services")
      .insert({
        tenant_id: org.id,
        name: "Avaliação Inicial",
        description: "Avaliação física e nutricional completa",
        price: 0,
        duration_minutes: 60,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })

    if (serviceError) {
      console.warn("Erro ao criar serviço exemplo (não crítico):", serviceError)
    }

    // 7. Audit logs
    const auditEvents = [
      {
        tenant_id: org.id,
        user_id: user.id,
        event_type: "org.created",
        payload: { org_id: org.id, org_name: org_name, plan: plan }
      },
      {
        tenant_id: org.id,
        user_id: user.id,
        event_type: "user.created",
        payload: { user_id: user.id, email: email, full_name: full_name }
      },
      {
        tenant_id: org.id,
        user_id: user.id,
        event_type: "role.assigned",
        payload: { user_id: user.id, role: "admin", org_id: org.id }
      },
      {
        tenant_id: org.id,
        user_id: user.id,
        event_type: "collaborator.created",
        payload: { collaborator_id: null, user_id: user.id, role: "admin" }
      },
      {
        tenant_id: org.id,
        user_id: user.id,
        event_type: "org.plan_set",
        payload: { org_id: org.id, plan: plan }
      }
    ]

    const { error: auditError } = await admin
      .from("audit_logs")
      .insert(auditEvents)

    if (auditError) {
      console.warn("Erro ao criar audit logs (não crítico):", auditError)
    }

    // 8. Fazer login do usuário criado
    const { data: sessionData, error: loginError } = await supabase.auth.signInWithPassword({
      email: email,
      password: password
    })

    if (loginError) {
      console.warn("Erro no login automático (não crítico):", loginError)
      return NextResponse.json({ 
        ok: true, 
        message: "Conta criada com sucesso! Faça login para continuar.",
        org_id: org.id,
        redirect_url: "/login"
      }, { status: 201 })
    }

    // Sucesso completo!
    return NextResponse.json({ 
      ok: true, 
      message: "Conta criada com sucesso!",
      org_id: org.id,
      user_id: user.id,
      plan: plan,
      redirect_url: "/app"
    }, { status: 201 })

  } catch (error) {
    console.error("Erro inesperado no signup:", error)
    return NextResponse.json({ 
      ok: false, 
      code: "internal_server_error",
      message: "Erro interno do servidor" 
    }, { status: 500 })
  }
}
