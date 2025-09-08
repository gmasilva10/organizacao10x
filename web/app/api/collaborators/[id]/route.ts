import { NextResponse } from "next/server"
import { resolveRequestContext } from "@/utils/context/request-context"

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { createClient } = await import("@/utils/supabase/server")
    const supabase = await createClient()

    const { data: userData } = await supabase.auth.getUser()
    const user = userData?.user
    if (!user) {
      return NextResponse.json({ ok: false, code: "unauthorized" }, { status: 401 })
    }

    // Resolver contexto da requisição
    const ctx = await resolveRequestContext(request)
    if (!ctx?.tenantId) {
      return NextResponse.json({ ok: false, code: "no_organization" }, { status: 400 })
    }

    // RBAC: verificar permissões de escrita
    const hasWriteAccess = ["admin", "manager"].includes(ctx.role || "")
    if (!hasWriteAccess) {
      return NextResponse.json({ ok: false, code: "forbidden" }, { status: 403 })
    }

    const collaboratorId = params.id
    if (!collaboratorId) {
      return NextResponse.json({ ok: false, code: "missing_id" }, { status: 400 })
    }

    // Verificar se colaborador existe e pertence à organização
    const { data: existingCollaborator, error: fetchError } = await supabase
      .from("collaborators")
      .select("*")
      .eq("id", collaboratorId)
      .eq("org_id", ctx.tenantId)
      .single()

    if (fetchError || !existingCollaborator) {
      return NextResponse.json({ ok: false, code: "not_found" }, { status: 404 })
    }

    // Parse payload
    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ ok: false, code: "invalid_payload" }, { status: 400 })
    }

    const payload = (body || {}) as {
      full_name?: unknown
      email?: unknown
      phone?: unknown
      role?: unknown
      status?: unknown
    }

    // Validações condicionais (apenas campos fornecidos)
    const updates: Record<string, any> = {}

    if (payload.full_name !== undefined) {
      const fullName = String(payload.full_name || "").trim()
      if (fullName.length < 2) {
        return NextResponse.json({ 
          ok: false, 
          code: "validation_error",
          details: { field: "full_name", message: "Nome deve ter pelo menos 2 caracteres" }
        }, { status: 400 })
      }
      updates.full_name = fullName
    }

    if (payload.email !== undefined) {
      const email = payload.email ? String(payload.email).trim() : null
      if (email && !/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(email)) {
        return NextResponse.json({
          ok: false,
          code: "validation_error", 
          details: { field: "email", message: "Email inválido" }
        }, { status: 400 })
      }
      updates.email = email
    }

    if (payload.phone !== undefined) {
      const phone = payload.phone ? String(payload.phone).trim() : null
      if (phone && !/^\+?[1-9]\d{1,14}$/.test(phone)) {
        return NextResponse.json({
          ok: false,
          code: "validation_error",
          details: { field: "phone", message: "Telefone inválido (formato E.164)" }
        }, { status: 400 })
      }
      updates.phone = phone
    }

    if (payload.role !== undefined) {
      const role = String(payload.role || "").toLowerCase()
      if (!["admin", "manager", "trainer", "viewer"].includes(role)) {
        return NextResponse.json({
          ok: false,
          code: "validation_error",
          details: { field: "role", message: "Papel inválido" }
        }, { status: 400 })
      }
      updates.role = role
    }

    if (payload.status !== undefined) {
      const status = String(payload.status || "").toLowerCase()
      if (!["active", "inactive"].includes(status)) {
        return NextResponse.json({
          ok: false,
          code: "validation_error",
          details: { field: "status", message: "Status inválido" }
        }, { status: 400 })
      }

      // Verificar limites se está ativando
      if (status === "active" && existingCollaborator.status === "inactive") {
        const { data: currentCount } = await supabase
          .from("collaborators")
          .select("id", { count: "exact", head: true })
          .eq("org_id", ctx.tenantId)
          .eq("status", "active")

        const activeCount = currentCount || 0

        // Buscar plano da organização
        const { data: tenant } = await supabase
          .from("tenants")
          .select("plan")
          .eq("id", ctx.tenantId)
          .single()

        const plan = tenant?.plan || "basic"
        const limits = {
          basic: { collaborators: 3 },
          enterprise: { collaborators: 100 }
        }

        const maxCollaborators = limits[plan as keyof typeof limits]?.collaborators || 3

        if (activeCount >= maxCollaborators) {
          return NextResponse.json({
            ok: false,
            code: "limit_reached",
            details: { 
              limit: "collaborators", 
              current: activeCount, 
              max: maxCollaborators,
              plan
            }
          }, { status: 422 })
        }
      }

      updates.status = status
    }

    // Se não há atualizações, retornar sucesso
    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ ok: true, collaborator: existingCollaborator })
    }

    // Aplicar atualizações
    const { data: updatedCollaborator, error: updateError } = await supabase
      .from("collaborators")
      .update(updates)
      .eq("id", collaboratorId)
      .eq("org_id", ctx.tenantId)
      .select()
      .single()

    if (updateError) {
      console.error("Collaborator update error:", updateError)
      return NextResponse.json({ ok: false, code: "update_failed" }, { status: 500 })
    }

    // Telemetria de sucesso
    ;(async () => {
      try {
        const eurl = process.env.SUPABASE_URL
        const ekey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
        if (eurl && ekey) {
          await fetch(`${eurl}/rest/v1/events`, {
            method: "POST",
            headers: { 
              apikey: ekey, 
              Authorization: `Bearer ${ekey}`, 
              "Content-Type": "application/json", 
              Prefer: "return=minimal" 
            },
            body: JSON.stringify({ 
              tenant_id: ctx.tenantId, 
              user_id: user.id, 
              event_type: "collaborator.updated", 
              payload: { 
                collaborator_id: collaboratorId,
                updated_fields: Object.keys(updates),
                ts: new Date().toISOString() 
              } 
            }),
            cache: "no-store",
          })
        }
      } catch {}
    })()

    return NextResponse.json({
      ok: true,
      collaborator: updatedCollaborator
    })

  } catch (err) {
    console.error("/api/collaborators/[id] PATCH unexpected_error", err)
    return NextResponse.json({ ok: false, code: "unexpected_error" }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { createClient } = await import("@/utils/supabase/server")
    const supabase = await createClient()

    const { data: userData } = await supabase.auth.getUser()
    const user = userData?.user
    if (!user) {
      return NextResponse.json({ ok: false, code: "unauthorized" }, { status: 401 })
    }

    // Resolver contexto da requisição
    const ctx = await resolveRequestContext(request)
    if (!ctx?.tenantId) {
      return NextResponse.json({ ok: false, code: "no_organization" }, { status: 400 })
    }

    // RBAC: verificar permissões de delete (apenas admin)
    const hasDeleteAccess = ["admin"].includes(ctx.role || "")
    if (!hasDeleteAccess) {
      return NextResponse.json({ ok: false, code: "forbidden" }, { status: 403 })
    }

    const collaboratorId = params.id
    if (!collaboratorId) {
      return NextResponse.json({ ok: false, code: "missing_id" }, { status: 400 })
    }

    // Verificar se colaborador existe e pertence à organização
    const { data: existingCollaborator, error: fetchError } = await supabase
      .from("collaborators")
      .select("*")
      .eq("id", collaboratorId)
      .eq("org_id", ctx.tenantId)
      .single()

    if (fetchError || !existingCollaborator) {
      return NextResponse.json({ ok: false, code: "not_found" }, { status: 404 })
    }

    // Soft delete: marcar como inativo em vez de deletar
    const { error: deleteError } = await supabase
      .from("collaborators")
      .update({ 
        status: "inactive",
        updated_at: new Date().toISOString()
      })
      .eq("id", collaboratorId)
      .eq("org_id", ctx.tenantId)

    if (deleteError) {
      console.error("Collaborator soft delete error:", deleteError)
      return NextResponse.json({ ok: false, code: "delete_failed" }, { status: 500 })
    }

    // Telemetria de sucesso
    ;(async () => {
      try {
        const eurl = process.env.SUPABASE_URL
        const ekey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
        if (eurl && ekey) {
          await fetch(`${eurl}/rest/v1/events`, {
            method: "POST",
            headers: { 
              apikey: ekey, 
              Authorization: `Bearer ${ekey}`, 
              "Content-Type": "application/json", 
              Prefer: "return=minimal" 
            },
            body: JSON.stringify({ 
              tenant_id: ctx.tenantId, 
              user_id: user.id, 
              event_type: "collaborator.deleted", 
              payload: { 
                collaborator_id: collaboratorId,
                method: "soft_delete",
                ts: new Date().toISOString() 
              } 
            }),
            cache: "no-store",
          })
        }
      } catch {}
    })()

    return NextResponse.json({ ok: true })

  } catch (err) {
    console.error("/api/collaborators/[id] DELETE unexpected_error", err)
    return NextResponse.json({ ok: false, code: "unexpected_error" }, { status: 500 })
  }
}
