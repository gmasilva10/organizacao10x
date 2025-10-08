import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"

// Forçar execução dinâmica para evitar problemas de renderização estática
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;


export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; attachmentId: string }> }
) {
  try {
    const { id, attachmentId } = await params
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

    // Buscar anexo
    const { data: attachment, error: fetchError } = await supabase
      .from('student_occurrence_attachments')
      .select('id, file_path, occurrence_id, org_id')
      .eq('id', attachmentId)
      .eq('occurrence_id', id)
      .eq('org_id', membership.org_id)
      .single()

    if (fetchError || !attachment) {
      return NextResponse.json({ error: 'Attachment not found' }, { status: 404 })
    }

    // Verificar permissões (admin/manager ou owner da ocorrência)
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

    // Remover arquivo do storage
    const { error: storageError } = await supabase.storage
      .from('occurrence-attachments')
      .remove([attachment.file_path])

    if (storageError) {
      console.error('Error removing file from storage:', storageError)
      // Continuar mesmo se falhar no storage
    }

    // Remover registro do banco
    const { error: dbError } = await supabase
      .from('student_occurrence_attachments')
      .delete()
      .eq('id', attachmentId)
      .eq('org_id', membership.org_id)

    if (dbError) {
      console.error('Error deleting attachment from database:', dbError)
      return NextResponse.json({ error: 'Failed to delete attachment' }, { status: 500 })
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error deleting attachment:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
