import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"
import type { Organization, OrganizationUpdate, OrganizationApiResponse } from "@/types/organization"

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// GET - Buscar dados da organização atual
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: "unauthorized", message: "Usuário não autenticado" },
        { status: 401 }
      )
    }

    // Buscar membership e organização do usuário
    const { data: membership, error: membershipError } = await supabase
      .from('memberships')
      .select('org_id')
      .eq('user_id', user.id)
      .single()

    if (membershipError || !membership) {
      return NextResponse.json(
        { success: false, error: "no_membership", message: "Usuário não pertence a uma organização" },
        { status: 403 }
      )
    }

    // Buscar dados da organização
    const { data: organization, error: orgError } = await supabase
      .from('tenants')
      .select('*')
      .eq('id', membership.org_id)
      .single()

    if (orgError || !organization) {
      return NextResponse.json(
        { success: false, error: "org_not_found", message: "Organização não encontrada" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      organization: organization as Organization
    })

  } catch (error) {
    console.error("Erro inesperado ao buscar organização:", error)
    return NextResponse.json(
      { success: false, error: "internal_error", message: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}

// PATCH - Atualizar dados da organização
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: "unauthorized", message: "Usuário não autenticado" },
        { status: 401 }
      )
    }

    // Buscar membership e organização do usuário
    const { data: membership, error: membershipError } = await supabase
      .from('memberships')
      .select('org_id, role')
      .eq('user_id', user.id)
      .single()

    if (membershipError || !membership) {
      return NextResponse.json(
        { success: false, error: "no_membership", message: "Usuário não pertence a uma organização" },
        { status: 403 }
      )
    }

    // Verificar se usuário é admin ou manager
    if (!['admin', 'manager'].includes(membership.role)) {
      return NextResponse.json(
        { success: false, error: "insufficient_permissions", message: "Apenas administradores podem alterar os dados da organização" },
        { status: 403 }
      )
    }

    // Parse dos dados de atualização
    const updateData: OrganizationUpdate = await request.json()

    // Validar dados obrigatórios
    if (updateData.name && updateData.name.trim().length < 2) {
      return NextResponse.json(
        { success: false, error: "invalid_data", message: "Nome da organização deve ter pelo menos 2 caracteres" },
        { status: 400 }
      )
    }

    // Atualizar organização
    const { data: updatedOrg, error: updateError } = await supabase
      .from('tenants')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', membership.org_id)
      .select()
      .single()

    if (updateError) {
      console.error('Erro ao atualizar organização:', updateError)
      return NextResponse.json(
        { success: false, error: "update_failed", message: "Erro ao atualizar dados da organização" },
        { status: 500 }
      )
    }

    // Log de auditoria (opcional)
    try {
      await supabase
        .from('kanban_logs')
        .insert({
          org_id: membership.org_id,
          user_id: user.id,
          action: 'organization_updated',
          entity_type: 'tenant',
          entity_id: membership.org_id,
          payload: {
            updated_fields: Object.keys(updateData),
            update_data: updateData
          }
        })
    } catch (logError) {
      console.warn('Erro ao criar log de auditoria:', logError)
      // Não falha a operação se o log falhar
    }

    return NextResponse.json({
      success: true,
      organization: updatedOrg as Organization,
      message: "Dados da organização atualizados com sucesso"
    })

  } catch (error) {
    console.error("Erro inesperado ao atualizar organização:", error)
    return NextResponse.json(
      { success: false, error: "internal_error", message: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}
