import { NextResponse } from "next/server"
import { resolveRequestContext } from "@/utils/context/request-context"

type CollaboratorRow = {
  id: string
  org_id: string
  full_name: string
  email?: string | null
  phone?: string | null
  role: string
  status: string
  user_id?: string | null
  created_at: string
  updated_at: string
}

export async function GET(request: Request) {
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

    // RBAC: verificar permissões de leitura
    const hasReadAccess = ["admin", "manager", "trainer"].includes(ctx.role || "")
    if (!hasReadAccess) {
      return NextResponse.json({ ok: false, code: "forbidden" }, { status: 403 })
    }

    // Parse query parameters
    const url = new URL(request.url)
    const query = url.searchParams.get("query") || ""
    const status = url.searchParams.get("status") || ""
    const role = url.searchParams.get("role") || ""
    const page = Math.max(1, parseInt(url.searchParams.get("page") || "1"))
    const pageSize = Math.min(100, Math.max(10, parseInt(url.searchParams.get("pageSize") || "20")))

    // Query builder
    let queryBuilder = supabase
      .from("collaborators")
      .select("*", { count: "exact" })
      .eq("org_id", ctx.tenantId)
      .order("created_at", { ascending: false })

    // Filtros
    if (query.trim()) {
      queryBuilder = queryBuilder.or(`full_name.ilike.%${query}%,email.ilike.%${query}%`)
    }

    if (status && ["active", "inactive"].includes(status)) {
      queryBuilder = queryBuilder.eq("status", status)
    }

    if (role && ["admin", "manager", "trainer", "viewer"].includes(role)) {
      queryBuilder = queryBuilder.eq("role", role)
    }

    // Paginação
    const offset = (page - 1) * pageSize
    queryBuilder = queryBuilder.range(offset, offset + pageSize - 1)

    const { data: collaborators, error, count } = await queryBuilder

    if (error) {
      console.error("Collaborators query error:", error)
      return NextResponse.json({ ok: false, code: "query_failed" }, { status: 500 })
    }

    // Telemetria (best-effort)
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
              event_type: "collaborators.list", 
              payload: { 
                query, status, role, page, pageSize,
                total: count || 0,
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
      items: collaborators || [],
      page,
      pageSize,
      total: count || 0,
      filters: { query, status, role }
    })

  } catch (err) {
    console.error("/api/collaborators GET unexpected_error", err)
    return NextResponse.json({ ok: false, code: "unexpected_error" }, { status: 500 })
  }
}

export async function POST(request: Request) {
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

    // Validações
    const fullName = String(payload.full_name || "").trim()
    if (fullName.length < 2) {
      return NextResponse.json({ 
        ok: false, 
        code: "validation_error",
        details: { field: "full_name", message: "Nome deve ter pelo menos 2 caracteres" }
      }, { status: 400 })
    }

    const email = payload.email ? String(payload.email).trim() : null
    if (email && !/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(email)) {
      return NextResponse.json({
        ok: false,
        code: "validation_error", 
        details: { field: "email", message: "Email inválido" }
      }, { status: 400 })
    }

    const phone = payload.phone ? String(payload.phone).trim() : null
    if (phone && !/^\+?[1-9]\d{1,14}$/.test(phone)) {
      return NextResponse.json({
        ok: false,
        code: "validation_error",
        details: { field: "phone", message: "Telefone inválido (formato E.164)" }
      }, { status: 400 })
    }

    const role = String(payload.role || "trainer").toLowerCase()
    if (!["admin", "manager", "trainer", "viewer"].includes(role)) {
      return NextResponse.json({
        ok: false,
        code: "validation_error",
        details: { field: "role", message: "Papel inválido" }
      }, { status: 400 })
    }

    const status = String(payload.status || "active").toLowerCase()
    if (!["active", "inactive"].includes(status)) {
      return NextResponse.json({
        ok: false,
        code: "validation_error",
        details: { field: "status", message: "Status inválido" }
      }, { status: 400 })
    }

    // Verificar limites por plano antes de criar
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

    if (status === "active" && activeCount >= maxCollaborators) {
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

    // Criar colaborador
    const { data: collaborator, error } = await supabase
      .from("collaborators")
      .insert({
        org_id: ctx.tenantId,
        full_name: fullName,
        email,
        phone,
        role,
        status
      })
      .select()
      .single()

    if (error) {
      console.error("Collaborator creation error:", error)
      return NextResponse.json({ ok: false, code: "creation_failed" }, { status: 500 })
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
              event_type: "collaborator.created", 
              payload: { 
                collaborator_id: collaborator.id,
                role,
                status,
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
      collaborator: collaborator
    })

  } catch (err) {
    console.error("/api/collaborators POST unexpected_error", err)
    return NextResponse.json({ ok: false, code: "unexpected_error" }, { status: 500 })
  }
}
