import { NextResponse } from "next/server"
import { resolveRequestContext } from "@/utils/context/request-context"

export async function POST(
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

    // RBAC: verificar permissões (admin/manager)
    const hasPermission = ["admin", "manager"].includes(ctx.role || "")
    if (!hasPermission) {
      return NextResponse.json({ ok: false, code: "forbidden" }, { status: 403 })
    }

    const userId = params.id
    if (!userId) {
      return NextResponse.json({ ok: false, code: "missing_user_id" }, { status: 400 })
    }

    // Parse payload
    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ ok: false, code: "invalid_payload" }, { status: 400 })
    }

    const payload = (body || {}) as { collaborator_id?: unknown }
    const collaboratorId = String(payload.collaborator_id || "").trim()
    
    if (!collaboratorId) {
      return NextResponse.json({ 
        ok: false, 
        code: "validation_error",
        details: { field: "collaborator_id", message: "ID do colaborador é obrigatório" }
      }, { status: 400 })
    }

    // Verificar se o usuário existe e está na organização
    const { data: existingMembership } = await supabase
      .from("memberships")
      .select("user_id, tenant_id")
      .eq("user_id", userId)
      .eq("tenant_id", ctx.tenantId)
      .single()

    if (!existingMembership) {
      return NextResponse.json({ 
        ok: false, 
        code: "user_not_found",
        details: { message: "Usuário não encontrado nesta organização" }
      }, { status: 404 })
    }

    // Verificar se o colaborador existe e está na organização
    const { data: existingCollaborator, error: collaboratorError } = await supabase
      .from("collaborators")
      .select("*")
      .eq("id", collaboratorId)
      .eq("org_id", ctx.tenantId)
      .single()

    if (collaboratorError || !existingCollaborator) {
      return NextResponse.json({ 
        ok: false, 
        code: "collaborator_not_found",
        details: { message: "Colaborador não encontrado nesta organização" }
      }, { status: 404 })
    }

    // Verificar se o colaborador já está vinculado a outro usuário
    if (existingCollaborator.user_id && existingCollaborator.user_id !== userId) {
      return NextResponse.json({
        ok: false,
        code: "collaborator_already_linked",
        details: { 
          message: "Colaborador já está vinculado a outro usuário",
          current_user_id: existingCollaborator.user_id
        }
      }, { status: 409 })
    }

    // Verificar se o usuário já está vinculado a outro colaborador nesta org
    const { data: existingUserLink } = await supabase
      .from("collaborators")
      .select("id, full_name")
      .eq("user_id", userId)
      .eq("org_id", ctx.tenantId)
      .single()

    if (existingUserLink && existingUserLink.id !== collaboratorId) {
      return NextResponse.json({
        ok: false,
        code: "user_already_linked",
        details: { 
          message: "Usuário já está vinculado a outro colaborador",
          current_collaborator: existingUserLink.full_name
        }
      }, { status: 409 })
    }

    // Se já está vinculado corretamente, retornar sucesso
    if (existingCollaborator.user_id === userId) {
      return NextResponse.json({
        ok: true,
        message: "Vínculo já existe",
        collaborator: existingCollaborator
      })
    }

    // Criar vínculo
    const { data: updatedCollaborator, error: linkError } = await supabase
      .from("collaborators")
      .update({ 
        user_id: userId,
        updated_at: new Date().toISOString()
      })
      .eq("id", collaboratorId)
      .eq("org_id", ctx.tenantId)
      .select()
      .single()

    if (linkError) {
      console.error("Link user-collaborator error:", linkError)
      return NextResponse.json({ ok: false, code: "link_failed" }, { status: 500 })
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
              event_type: "settings.users.linked_to_collaborator", 
              payload: { 
                target_user_id: userId,
                collaborator_id: collaboratorId,
                collaborator_name: existingCollaborator.full_name,
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
      message: "Vínculo criado com sucesso",
      collaborator: updatedCollaborator
    })

  } catch (err) {
    console.error("/api/settings/users/[id]/link-collaborator POST unexpected_error", err)
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

    // RBAC: verificar permissões (admin/manager)
    const hasPermission = ["admin", "manager"].includes(ctx.role || "")
    if (!hasPermission) {
      return NextResponse.json({ ok: false, code: "forbidden" }, { status: 403 })
    }

    const userId = params.id
    if (!userId) {
      return NextResponse.json({ ok: false, code: "missing_user_id" }, { status: 400 })
    }

    // Verificar se o usuário existe e está na organização
    const { data: existingMembership } = await supabase
      .from("memberships")
      .select("user_id, tenant_id")
      .eq("user_id", userId)
      .eq("tenant_id", ctx.tenantId)
      .single()

    if (!existingMembership) {
      return NextResponse.json({ 
        ok: false, 
        code: "user_not_found",
        details: { message: "Usuário não encontrado nesta organização" }
      }, { status: 404 })
    }

    // Buscar colaborador vinculado
    const { data: linkedCollaborator } = await supabase
      .from("collaborators")
      .select("*")
      .eq("user_id", userId)
      .eq("org_id", ctx.tenantId)
      .single()

    if (!linkedCollaborator) {
      return NextResponse.json({
        ok: true,
        message: "Usuário não estava vinculado a nenhum colaborador"
      })
    }

    // Remover vínculo
    const { error: unlinkError } = await supabase
      .from("collaborators")
      .update({ 
        user_id: null,
        updated_at: new Date().toISOString()
      })
      .eq("id", linkedCollaborator.id)
      .eq("org_id", ctx.tenantId)

    if (unlinkError) {
      console.error("Unlink user-collaborator error:", unlinkError)
      return NextResponse.json({ ok: false, code: "unlink_failed" }, { status: 500 })
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
              event_type: "settings.users.unlinked_from_collaborator", 
              payload: { 
                target_user_id: userId,
                collaborator_id: linkedCollaborator.id,
                collaborator_name: linkedCollaborator.full_name,
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
      message: "Vínculo removido com sucesso",
      unlinked_collaborator: {
        id: linkedCollaborator.id,
        full_name: linkedCollaborator.full_name
      }
    })

  } catch (err) {
    console.error("/api/settings/users/[id]/link-collaborator DELETE unexpected_error", err)
    return NextResponse.json({ ok: false, code: "unexpected_error" }, { status: 500 })
  }
}
