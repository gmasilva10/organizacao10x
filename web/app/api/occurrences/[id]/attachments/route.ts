import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"
import { auditLogger } from "@/lib/audit-logger"

// Forçar execução dinâmica para evitar problemas de renderização estática
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;


export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    
    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verificar membership
    const { data: membership } = await supabase
      .from('memberships')
      .select('org_id, role')
      .eq('user_id', user.id)
      .single()

    if (!membership) {
      return NextResponse.json({ error: 'No membership found' }, { status: 403 })
    }

    // Buscar anexos da ocorrência
    const { data: attachments, error } = await supabase
      .from('student_occurrence_attachments')
      .select('id, filename, file_size, mime_type, created_at')
      .eq('occurrence_id', id)
      .eq('org_id', membership.org_id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching attachments:', error)
      return NextResponse.json({ error: 'Failed to fetch attachments' }, { status: 500 })
    }

    return NextResponse.json({ attachments: attachments || [] })

  } catch (error) {
    console.error('Error fetching attachments:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    
    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verificar membership
    const { data: membership } = await supabase
      .from('memberships')
      .select('org_id, role')
      .eq('user_id', user.id)
      .single()

    if (!membership) {
      return NextResponse.json({ error: 'No membership found' }, { status: 403 })
    }

    // Verificar permissões (admin/manager ou owner)
    const { data: occurrence } = await supabase
      .from('student_occurrences')
      .select('owner_user_id, org_id')
      .eq('id', id)
      .single()

    if (!occurrence || occurrence.org_id !== membership.org_id) {
      return NextResponse.json({ error: 'Occurrence not found' }, { status: 404 })
    }

    const canEdit = membership.role === 'admin' || 
                   membership.role === 'manager' || 
                   occurrence.owner_user_id === user.id

    if (!canEdit) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Processar upload
    const formData = await request.formData()
    const file = formData.get('file') as File
    const type = formData.get('type') as string || 'general'

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validação de tamanho (10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ 
        error: 'Arquivo muito grande', 
        details: 'O arquivo deve ter no máximo 10MB. Tamanho atual: ' + Math.round(file.size / 1024 / 1024) + 'MB'
      }, { status: 400 })
    }

    // Validação de tipo
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ 
        error: 'Tipo de arquivo inválido', 
        details: 'Use apenas arquivos PDF, JPG ou PNG. Tipo atual: ' + file.type
      }, { status: 400 })
    }

    // Upload para Supabase Storage
    const fileExt = file.name.split('.').pop()
    const fileName = `${id}_${Date.now()}.${fileExt}`
    const filePath = `occurrences/${id}/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('occurrence-attachments')
      .upload(filePath, file)

    if (uploadError) {
      console.error('Error uploading file:', uploadError)
      return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 })
    }

    // Salvar metadados no banco
    const { error: dbError } = await supabase
      .from('student_occurrence_attachments')
      .insert({
        occurrence_id: parseInt(id),
        org_id: membership.org_id,
        filename: file.name,
        file_path: filePath,
        file_size: file.size,
        mime_type: file.type,
        attachment_type: type,
        uploaded_by: user.id
      })

    if (dbError) {
      console.error('Error saving attachment metadata:', dbError)
      // Tentar remover arquivo do storage
      await supabase.storage.from('occurrence-attachments').remove([filePath])
      return NextResponse.json({ error: 'Failed to save attachment' }, { status: 500 })
    }

    // Log de auditoria
    try {
      await auditLogger.log({
        organization_id: membership.org_id,
        user_id: user.id,
        action: 'create',
        resource_type: 'occurrence_attachment' as any,
        resource_id: id,
        payload_after: {
          filename: file.name,
          fileSize: file.size,
          mimeType: file.type
        }
      } as any, supabase)
    } catch (auditError) {
      console.error('Erro ao registrar log de auditoria:', auditError)
      // Não falha a operação por erro de auditoria
    }

    return NextResponse.json({ success: true, filename: file.name })

  } catch (error) {
    console.error('Error uploading attachment:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
