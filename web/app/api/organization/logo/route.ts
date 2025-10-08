import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"
import type { OrganizationLogoUploadResponse } from "@/types/organization"

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(request: NextRequest) {
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
        { success: false, error: "insufficient_permissions", message: "Apenas administradores podem alterar a logomarca" },
        { status: 403 }
      )
    }

    // Parse FormData
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json(
        { success: false, error: "no_file", message: "Arquivo não fornecido" },
        { status: 400 }
      )
    }

    // Validar tipo de arquivo
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: "invalid_file_type", message: "Apenas arquivos JPG, PNG e WEBP são permitidos" },
        { status: 400 }
      )
    }

    // Validar tamanho (2MB)
    const maxSize = 2 * 1024 * 1024 // 2MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { success: false, error: "file_too_large", message: "Arquivo deve ter no máximo 2MB" },
        { status: 400 }
      )
    }

    // Gerar nome único para o arquivo
    const fileExtension = file.name.split('.').pop() || 'jpg'
    const fileName = `logo_${Date.now()}.${fileExtension}`
    const filePath = `${membership.org_id}/${fileName}`

    // Upload para Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('organization-logos')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (uploadError) {
      console.error('Erro no upload da logomarca:', uploadError)
      return NextResponse.json(
        { success: false, error: "upload_failed", message: `Erro no upload: ${uploadError.message}` },
        { status: 500 }
      )
    }

    // Obter URL pública
    const { data: urlData } = supabase.storage
      .from('organization-logos')
      .getPublicUrl(uploadData.path)

    const logoUrl = urlData.publicUrl

    // Atualizar campo logo_url na tabela tenants
    const { error: updateError } = await supabase
      .from('tenants')
      .update({ logo_url: logoUrl })
      .eq('id', membership.org_id)

    if (updateError) {
      console.error('Erro ao atualizar logo_url:', updateError)
      // Tentar remover arquivo do storage em caso de erro
      await supabase.storage.from('organization-logos').remove([uploadData.path])
      
      return NextResponse.json(
        { success: false, error: "update_failed", message: "Erro ao salvar logomarca no banco de dados" },
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
          action: 'organization_logo_uploaded',
          entity_type: 'tenant',
          entity_id: membership.org_id,
          payload: {
            logo_url: logoUrl,
            file_size: file.size,
            file_type: file.type
          }
        })
    } catch (logError) {
      console.warn('Erro ao criar log de auditoria:', logError)
      // Não falha a operação se o log falhar
    }

    return NextResponse.json({
      success: true,
      logo_url: logoUrl,
      message: "Logomarca atualizada com sucesso"
    })

  } catch (error) {
    console.error("Erro inesperado no upload da logomarca:", error)
    return NextResponse.json(
      { success: false, error: "internal_error", message: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}
