import { NextResponse } from "next/server"
import { resolveRequestContext } from "@/utils/context/request-context"

// Forçar execução dinâmica para evitar problemas de renderização estática
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;


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
      .eq("org_id", ctx.org_id)
      .single()

    if (fetchError || !existingCollaborator) {
      return NextResponse.json({ ok: false, code: "not_found" }, { status: 404 })
    }

    // Determinar novo status (toggle)
    const newStatus = existingCollaborator.status === "active" ? "inactive" : "active"

    // Se está ativando, verificar limites por plano
    if (newStatus === "active") {
      const { count: currentCount } = await supabase
        .from("collaborators")
        .select("id", { count: "exact", head: true })
        .eq("org_id", ctx.org_id)
        .eq("status", "active")

      const activeCount = currentCount || 0

      // Buscar plano da organização
      const { data: tenant } = await supabase
        .from("tenants")
        .select("plan")
        .eq("id", ctx.org_id)
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
            plan,
            action: "activate"
          }
        }, { status: 422 })
      }
    }

    // Aplicar toggle
    const { data: updatedCollaborator, error: updateError } = await supabase
      .from("collaborators")
      .update({ 
        status: newStatus,
        updated_at: new Date().toISOString()
      })
      .eq("id", collaboratorId)
      .eq("org_id", ctx.org_id)
      .select()
      .single()

    if (updateError) {
      console.error("Collaborator toggle error:", updateError)
      return NextResponse.json({ ok: false, code: "toggle_failed" }, { status: 500 })
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
              org_id: ctx.org_id, 
              user_id: user.id, 
              event_type: "collaborator.status_changed", 
              payload: { 
                collaborator_id: collaboratorId,
                from_status: existingCollaborator.status,
                to_status: newStatus,
                action: "toggle",
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
      collaborator: updatedCollaborator,
      action: newStatus === "active" ? "activated" : "deactivated"
    })

  } catch (err) {
    console.error("/api/collaborators/[id]/toggle PATCH unexpected_error", err)
    return NextResponse.json({ ok: false, code: "unexpected_error" }, { status: 500 })
  }
}
